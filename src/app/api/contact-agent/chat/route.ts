import { NextRequest, NextResponse } from "next/server";
import { searchContacts, suggestContacts } from "@/lib/contact-agent/search";
import {
  searchContactsWeb,
  searchContactsWithAI,
} from "@/lib/contact-agent/web-search";
import {
  batchAutoImport,
  scoreWebContact,
} from "@/lib/contact-agent/auto-import";
import { ResourceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { searchRecaLibrary, formatRecaContext } from "@/lib/rag/retrieve";

/**
 * Calculate when to send follow-up based on document type
 * Vital records: 3 days, Medical records: 5-7 days
 */
function calculateFollowUpDate(documentType?: string): Date {
  const now = new Date();
  let daysToAdd = 5; // Default: 5 days

  if (documentType) {
    const docTypeLower = documentType.toLowerCase();
    if (
      docTypeLower.includes("birth") ||
      docTypeLower.includes("death") ||
      docTypeLower.includes("marriage") ||
      docTypeLower.includes("divorce") ||
      docTypeLower.includes("vital")
    ) {
      daysToAdd = 3; // Vital records are usually faster
    } else if (
      docTypeLower.includes("medical") ||
      docTypeLower.includes("hospital")
    ) {
      daysToAdd = 7; // Medical records can take longer
    }
  }

  return new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
}

function buildFallbackMessage(
  userMessage: string,
  contactsCount: number
): string {
  if (contactsCount === 0) {
    return `I can help with that, but our AI chat service is temporarily unavailable right now.\n\nI searched our internal resource database for "${userMessage}" and did not find a direct match. Try specifying state/county and document type (for example: "birth certificate in Salt Lake County, Utah").`;
  }

  return `I searched our internal resource database and found ${contactsCount} potential contact${contactsCount === 1 ? "" : "s"}.\n\nOur AI chat service is temporarily unavailable right now, but you can still use these results below.`;
}

/**
 * POST /api/contact-agent/chat
 *
 * AI-powered contact agent that helps users find institutional contacts
 * Uses OpenAI function calling to search the DocumentResource database
 * Uses RAG to answer questions about RECA statutes
 *
 * Body:
 * - messages: Array of chat messages
 * - sessionContext: Optional context about the user's claim (state, county, claimType)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      messages,
      sessionContext,
      chatSessionId: providedChatSessionId,
    } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    const lastUserMessage = messages
      .filter((m: any) => m.role === "user")
      .pop();
    const cookieSessionId = req.cookies.get("session_id")?.value;
    let userId: string | undefined;
    let claimantId: string | undefined;
    let chatSessionId = providedChatSessionId;
    let canPersistChatHistory = true;

    // Start with client-provided message history; replace with DB history if available.
    let openAIMessages = messages
      .filter((m: any) => typeof m?.content === "string" && m?.role)
      .slice(-10)
      .map((m: any) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      }));

    try {
      // 1. User/Session Resolution
      if (cookieSessionId) {
        const session = await prisma.session.findUnique({
          where: { sessionToken: cookieSessionId },
          include: { user: { include: { claimants: true } } },
        });
        if (session) {
          userId = session.userId;
          claimantId = session.user.claimants[0]?.id;
        }
      }

      // 2. Get or Create ChatSession
      let chatSession;
      if (chatSessionId) {
        chatSession = await prisma.chatSession.findUnique({
          where: { id: chatSessionId },
        });
      }

      if (!chatSession) {
        chatSession = await prisma.chatSession.create({
          data: {
            userId,
            claimantId,
            title:
              messages[messages.length - 1]?.content?.substring(0, 50) ||
              "New Chat",
          },
        });
        chatSessionId = chatSession.id;
      }

      // 3. Save latest user message
      if (lastUserMessage && lastUserMessage.content) {
        await prisma.chatMessage.create({
          data: {
            sessionId: chatSessionId,
            role: "user",
            content: lastUserMessage.content,
          },
        });
      }

      // 4. Load persisted history
      const historyMessages = await prisma.chatMessage.findMany({
        where: { sessionId: chatSessionId },
        orderBy: { createdAt: "asc" },
        take: 10,
      });

      openAIMessages = historyMessages.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      }));
    } catch (historyError) {
      canPersistChatHistory = false;
      if (!chatSessionId) {
        chatSessionId = `ephemeral-${Date.now()}`;
      }
      console.error(
        "[Contact Agent] Chat history persistence unavailable, continuing without it:",
        historyError
      );
    }

    // RAG: Search for relevant context based on the latest user message
    let ragContextString = "";
    if (lastUserMessage && lastUserMessage.content) {
      try {
        // Pass claimantId to scope the search!
        const ragResults = await searchRecaLibrary(
          lastUserMessage.content,
          5,
          0.15,
          claimantId
        );
        ragContextString = formatRecaContext(ragResults);
      } catch (error) {
        console.error("RAG search failed:", error);
        // Continue without RAG context if search fails
      }
    }

    // System prompt for the contact agent
    const systemPrompt = `You are a helpful AI assistant for RadiantClaims, specializing in helping RECA (Radiation Exposure Compensation Act) claimants find institutional contacts, understand the RECA legislation, and use the RadiantClaims platform.

**IMPORTANT SCOPE & CONTEXT:**
You have access to a library of RECA legislation, policy documents, and RadiantClaims support documentation via the context below.
${ragContextString ? `\n=== CONTEXT (LEGISLATION & SUPPORT) ===\n${ragContextString}\n=== END CONTEXT ===\n` : ""}

**YOUR RESPONSIBILITIES:**
1.  **Find Contacts:** Help users find institutional contacts (vital records, hospitals, etc.) for RECA documents.
2.  **Answer RECA Questions:** Answer questions about RECA eligibility, compensation, and criteria using the provided context.
3.  **Provide Product Support:** Answer questions about RadiantClaims features (Payout Pulse, pricing, refunds, account benefits) using the provided context.

**GUIDELINES:**
- **Use the Context:** When answering questions, cite the provided context. If the context mentions specific amounts or policies, explain based *strictly* on that text.
- **Support Queries:** If the user asks about pricing, "Payout Pulse", refunds, or how the service works, check your context. If the answer is there, provide it.
- **Don't Hallucinate:** If the context doesn't contain the answer, say you don't have that specific information.
- **Prioritize Contacts:** Your primary superpower is still finding contacts. If the user asks for a document, use the 'search_contacts' function.
- **Be Empathetic:** These users are often dealing with cancer or loss.

If a user asks something outside your scope and NOT covered by the context above, politely redirect them: "I'm designed to help with finding contacts, RECA information, and questions about our platform. For complex legal advice or technical issues not covered here, please contact our support team at support@radiantclaims.com."

Your role:
- Help users find contacts for ALL vital records and medical records.
- Answer questions about RECA legislation and RadiantClaims features using the provided context.
- Search the database using the search_contacts function whenever someone asks about finding documents or contacts.
- Be empathetic and understanding.

When you find contacts:
- Present the most relevant results clearly in a unified, easy-to-read format.
- If multiple search results were consolidated, acknowledge this naturally (e.g., "I found information from several sources for this institution").
- **IMPORTANT for Confidence Indicators:**
  - If a contact has stats (totalFeedback, successRate, avgRating), mention this to build user confidence
  - Examples:
    - "This resource is in our database and has been verified by X users" (if totalFeedback >= 3)
    - "Users have reported a Y% success rate with this resource" (if successRate > 0)
    - "This resource has an average rating of Z/5 stars" (if avgRating > 0)
  - More user confirmations = stronger confidence: "Many users have confirmed this is the correct contact"
  - Fewer confirmations = cautious language: "This resource has limited user feedback, so please verify before using"
  - Web search results (no stats): "This was found via web search and hasn't been verified by our user community yet. Please call to confirm details before sending documents."
- **IMPORTANT for Multiple Locations:**
  - If the notes mention "MULTIPLE LOCATIONS", present ALL locations to the user
  - Explain that these are different locations that may serve different communities
  - Do NOT suggest locations are incorrect - they are all valid locations for the same institution
  - Help the user understand which location is most relevant for their needs (based on city/county if mentioned)
- **IMPORTANT for Multiple Phone Numbers:**
  - If the notes mention "MULTIPLE CONTACT NUMBERS", present ALL phone numbers
  - If phone numbers are associated with specific addresses, show that association clearly
  - Explain that different locations may have different contact numbers
- Suggest the best method to contact them (call the primary number to verify current information).

Context about the user's claim:
${
  sessionContext
    ? `- State: ${sessionContext.state || "Not specified"}
- County: ${sessionContext.county || "Not specified"}
- Claim Type: ${sessionContext.claimType || "Not specified"}`
    : "- No claim context provided yet"
}

Be conversational, helpful, and guide users step-by-step.`;

    let openAIClient: any;
    let contactAgentModel: string;
    try {
      const openAIModule = await import("@/lib/openai");
      openAIClient = openAIModule.openai;
      contactAgentModel = openAIModule.CONTACT_AGENT_MODEL;
    } catch (openAIError) {
      console.error(
        "[Contact Agent] OpenAI unavailable, falling back to database-only mode:",
        openAIError
      );

      const fallbackUserText = lastUserMessage?.content || "";
      const fallbackContacts = fallbackUserText
        ? await suggestContacts(fallbackUserText, {
            claimType: sessionContext?.claimType,
            state: sessionContext?.state,
            county: sessionContext?.county,
          })
        : [];
      const fallbackText = buildFallbackMessage(
        fallbackUserText,
        fallbackContacts.length
      );

      if (canPersistChatHistory && chatSessionId && fallbackText) {
        try {
          await prisma.chatMessage.create({
            data: {
              sessionId: chatSessionId,
              role: "assistant",
              content: fallbackText,
              metadata: {
                mode: "fallback_no_openai",
              },
            },
          });
        } catch (persistError) {
          console.error(
            "[Contact Agent] Could not persist fallback assistant message:",
            persistError
          );
        }
      }

      return NextResponse.json({
        chatSessionId,
        message: fallbackText,
        contacts: fallbackContacts,
        interactions: [],
        functionCalled: "fallback_search_contacts",
        searchSource: "database",
        webSearchPerformed: false,
      });
    }

    // Define the function for searching contacts
    const functions = [
      {
        name: "search_contacts",
        description:
          "Search the database for institutional contacts (vital records offices, hospitals, schools, etc.) that can provide documents for RECA claims. Use searchQuery for institution names like 'Utah Cancer Registry' or 'St Mark Hospital'.",
        parameters: {
          type: "object",
          properties: {
            state: {
              type: "string",
              description:
                'Two-letter state code (e.g., "UT", "NV", "AZ", "NM", "ID")',
            },
            county: {
              type: "string",
              description: "County name (e.g., Washington, Clark, Coconino)",
            },
            searchQuery: {
              type: "string",
              description:
                'Name or partial name of the institution to search for (e.g., "Utah Cancer Registry", "St Mark", "Washington County"). Use this when user mentions specific institution names.',
            },
            resourceTypes: {
              type: "array",
              items: {
                type: "string",
                enum: [
                  "VITAL_RECORDS",
                  "COUNTY_CLERK",
                  "COUNTY_RECORDER",
                  "HOSPITAL",
                  "CANCER_REGISTRY",
                  "SCHOOL_DISTRICT",
                  "CHURCH",
                  "TRIBAL_OFFICE",
                ],
              },
              description:
                "Types of institutions to search for (e.g., VITAL_RECORDS for birth/death certificates, HOSPITAL for medical records)",
            },
            documentTypes: {
              type: "array",
              items: {
                type: "string",
              },
              description:
                "Specific document types needed (e.g., BIRTH_CERTIFICATE, MEDICAL_RECORDS, SCHOOL_RECORDS)",
            },
          },
        },
      },
    ];

    // Call OpenAI with function calling
    const response = await openAIClient.chat.completions.create({
      model: contactAgentModel,
      messages: [
        { role: "system", content: systemPrompt },
        ...openAIMessages, // Use DB history instead of client messages
      ],
      functions,
      function_call: "auto",
      temperature: 0.7,
      max_tokens: 1000,
    });

    const assistantMessage = response.choices[0]?.message;
    if (!assistantMessage) {
      throw new Error("No message returned from OpenAI");
    }

    // If AI wants to call a function
    if (assistantMessage.function_call) {
      const functionName = assistantMessage.function_call.name;
      const functionArgs = JSON.parse(assistantMessage.function_call.arguments);

      if (functionName === "search_contacts") {
        // Execute the contact search in database
        let contacts = await searchContacts({
          state: functionArgs.state,
          county: functionArgs.county,
          searchQuery: functionArgs.searchQuery, // Add searchQuery parameter
          resourceTypes: functionArgs.resourceTypes as ResourceType[],
          documentTypes: functionArgs.documentTypes,
        });

        let searchSource = "database";
        let webSearchPerformed = false;

        // Fallback to web search if no results found
        // Try Serper first (preferred), then Tavily as backup
        let wasDeduplicated = false;
        let originalResultCount = 0;

        if (contacts.length === 0) {
          let webContacts: any[] = [];

          // Try Serper/Google first (higher quality results)
          if (process.env.SERPER_API_KEY) {
            console.log(
              "[Contact Agent] No database results, trying Serper (Google) search..."
            );

            try {
              webContacts = await searchContactsWithAI({
                state: functionArgs.state,
                county: functionArgs.county,
                institutionType: functionArgs.resourceTypes?.[0],
                documentType: functionArgs.documentTypes?.[0],
              });

              if (webContacts.length > 0) {
                searchSource = "web-serper";
                console.log(
                  `[Contact Agent] Serper found ${webContacts.length} results`
                );
              }
            } catch (error) {
              console.error("[Contact Agent] Serper search failed:", error);
              // Continue to Tavily fallback
            }
          }

          // Fallback to Tavily if Serper didn't find anything or isn't configured
          if (webContacts.length === 0 && process.env.TAVILY_API_KEY) {
            console.log("[Contact Agent] Trying Tavily search as fallback...");

            try {
              webContacts = await searchContactsWeb({
                state: functionArgs.state,
                county: functionArgs.county,
                institutionType: functionArgs.resourceTypes?.[0],
                documentType: functionArgs.documentTypes?.[0],
              });

              if (webContacts.length > 0) {
                searchSource = "web-tavily";
                console.log(
                  `[Contact Agent] Tavily found ${webContacts.length} results`
                );
              }
            } catch (error) {
              console.error("[Contact Agent] Tavily search failed:", error);
            }
          }

          if (webContacts.length > 0) {
            originalResultCount = webContacts.length;
            // Auto-import high-quality web results to database (async, don't wait)
            batchAutoImport(webContacts, {
              minConfidenceScore: 70, // Only import good results
              autoVerify: true, // Mark as needing review
            })
              .then((importResults) => {
                console.log(
                  `[Auto-Import] Created: ${importResults.created}, Updated: ${importResults.updated}, Skipped: ${importResults.skipped}`
                );
                if (importResults.errors.length > 0) {
                  console.error("[Auto-Import] Errors:", importResults.errors);
                }
              })
              .catch((err) => {
                console.error("[Auto-Import] Failed:", err);
              });

            // Transform web contacts to match database format for immediate response
            contacts = webContacts.map((wc: any) => ({
              id: `web-${Math.random().toString(36).substr(2, 9)}`,
              name: wc.name,
              resourceType: wc.type as any,
              state: wc.state || functionArgs.state || "",
              county: wc.county || null,
              phone: wc.phone || null,
              email: wc.email || null,
              website: wc.website || null,
              address: wc.address || null,
              city: wc.city || null,
              zipCode: null,
              documentTypesProvided: [],
              notes: `${wc.notes || ""}\n\nQuality Score: ${scoreWebContact(wc)}/100\nSource: ${wc.source}`,
              estimatedCost: null,
              processingTimeDays: null,
              acceptsMailRequests: true,
              acceptsOnlineRequests: false,
              appointmentRequired: false,
            }));

            // Check if deduplication occurred
            if (originalResultCount > contacts.length) {
              wasDeduplicated = true;
              console.log(
                `[Contact Agent] Deduplicated ${originalResultCount} results to ${contacts.length} unique contact(s)`
              );
            }

            webSearchPerformed = true;
          } else {
            console.log(
              "[Contact Agent] No results from web search. User will need to search manually."
            );
          }
        }

        // Return the function result to the AI
        const updatedMessages = [
          ...openAIMessages,
          {
            role: "assistant",
            content: null,
            function_call: assistantMessage.function_call,
          },
          {
            role: "function",
            name: functionName,
            content: JSON.stringify({
              contacts,
              count: contacts.length,
              searchParams: functionArgs,
              searchSource,
              webSearchPerformed,
              wasDeduplicated,
              originalResultCount: wasDeduplicated
                ? originalResultCount
                : contacts.length,
              note: webSearchPerformed
                ? wasDeduplicated
                  ? `Found ${originalResultCount} search results, which were consolidated into ${contacts.length} unique contact(s). Results found via web search and may need verification.`
                  : "Results found via web search. Information may need verification."
                : contacts.length > 0
                  ? "Results from verified database."
                  : "No results found in database or web search.",
            }),
          },
        ];

        // Get AI's response with the search results
        const finalResponse = await openAIClient.chat.completions.create({
          model: contactAgentModel,
          messages: [
            { role: "system", content: systemPrompt },
            ...updatedMessages.map((msg: any) => ({
              role: msg.role,
              content: msg.content,
              ...(msg.function_call && { function_call: msg.function_call }),
              ...(msg.name && { name: msg.name }),
            })),
          ],
          temperature: 0.7,
          max_tokens: 1000,
        });

        const finalText =
          finalResponse.choices[0]?.message?.content || "No response";

        // Save Assistant Message (best effort)
        if (canPersistChatHistory && chatSessionId && finalText) {
          try {
            await prisma.chatMessage.create({
              data: {
                sessionId: chatSessionId,
                role: "assistant",
                content: finalText,
                metadata: {
                  functionCalled: functionName,
                  searchSource,
                },
              },
            });
          } catch (persistError) {
            console.error(
              "[Contact Agent] Failed to persist assistant message:",
              persistError
            );
          }
        }

        // Create ResourceInteraction records for tracking and follow-up
        const interactions: { resourceId: string; interactionId: string }[] =
          [];

        if (contacts.length > 0) {
          try {
            // Get session/user info from headers or request
            const sessionId =
              req.cookies.get("session_id")?.value ||
              req.headers.get("x-session-id") ||
              `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            // Determine document type from search params
            const documentType =
              functionArgs.documentTypes?.[0] ||
              functionArgs.resourceTypes?.[0] ||
              "UNKNOWN";

            // Get user query from the last user message
            const lastUserMessage = messages
              .filter((m: any) => m.role === "user")
              .pop();
            const searchQuery = lastUserMessage?.content || "";

            // Create interaction records for each contact shown
            for (const contact of contacts) {
              // Skip web contacts (they don't have real IDs yet)
              if (contact.id.startsWith("web-")) continue;

              const interaction = await prisma.resourceInteraction.create({
                data: {
                  resourceId: contact.id,
                  sessionId,
                  documentType,
                  shownVia: "chat_bot",
                  searchQuery,
                  followUpScheduledFor: calculateFollowUpDate(documentType),
                },
              });

              interactions.push({
                resourceId: contact.id,
                interactionId: interaction.id,
              });

              // Increment search counter on the resource stats (create if doesn't exist)
              await prisma.resourceStats.upsert({
                where: { resourceId: contact.id },
                create: {
                  resourceId: contact.id,
                  totalSearches: 1,
                },
                update: {
                  totalSearches: { increment: 1 },
                },
              });

              // Auto-create document tracking if user is authenticated
              // Find user's claimant record from session
              if (sessionId && !sessionId.startsWith("anon-")) {
                try {
                  const user = await prisma.user.findFirst({
                    where: {
                      sessions: {
                        some: {
                          sessionToken: sessionId,
                        },
                      },
                    },
                    include: {
                      claimants: true,
                    },
                  });

                  if (user && user.claimants.length > 0) {
                    const claimant = user.claimants[0];

                    // Create or update document tracking status
                    await prisma.claimantDocumentStatus.upsert({
                      where: {
                        claimantId_documentType: {
                          claimantId: claimant?.id || "unknown",
                          documentType,
                        },
                      },
                      create: {
                        claimantId: claimant?.id || "unknown",
                        documentType,
                        status: "NOT_STARTED",
                        notes: `Found via contact agent: ${contact.name}`,
                      },
                      update: {
                        // Only update if status is still NOT_STARTED (don't overwrite progress)
                        notes: {
                          set: `Last searched: ${new Date().toLocaleDateString()}. Found: ${contact.name}`,
                        },
                      },
                    });
                  }
                } catch (error) {
                  console.error(
                    "[Contact Agent] Failed to create document tracking:",
                    error
                  );
                  // Don't fail the request if tracking creation fails
                }
              }
            }
          } catch (error) {
            console.error(
              "[Contact Agent] Failed to create interactions:",
              error
            );
            // Don't fail the request if interaction tracking fails
          }
        }

        return NextResponse.json({
          chatSessionId, // Return ID to client
          message: finalText,
          contacts,
          interactions, // Include interaction IDs for frontend
          functionCalled: functionName,
          searchParams: functionArgs,
          searchSource,
          webSearchPerformed,
        });
      }
    }

    // Regular text response (no function call)
    const finalText = assistantMessage.content || "";

    // Save Assistant Message (best effort)
    if (canPersistChatHistory && chatSessionId && finalText) {
      try {
        await prisma.chatMessage.create({
          data: {
            sessionId: chatSessionId,
            role: "assistant",
            content: finalText,
          },
        });
      } catch (persistError) {
        console.error(
          "[Contact Agent] Failed to persist assistant message:",
          persistError
        );
      }
    }

    return NextResponse.json({
      chatSessionId, // Return ID to client
      message: finalText,
      contacts: [],
    });
  } catch (error) {
    console.error("Contact agent error:", error);
    return NextResponse.json(
      {
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
