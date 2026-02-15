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
import { chatRateLimiter, createRateLimitResponse } from "@/lib/rate-limit";
import { searchRecaLibrary, formatRecaContext } from "@/lib/rag/retrieve";
import {
  labelForDocumentType,
  normalizeDocumentType,
} from "@/lib/chat/document-type-labels";

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
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateResult = await chatRateLimiter.limit(`contact-agent:${ip}`);
    if (!rateResult.success) {
      return createRateLimitResponse(rateResult);
    }

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

    const buildQuickStatus = () => {
      if (!sessionContext) return "";

      const lines: string[] = [];
      const section = sessionContext.recaWorkflowSection || "";
      const completion =
        typeof sessionContext.recaCompletionPercent === "number"
          ? sessionContext.recaCompletionPercent
          : null;

      // Top-level snapshot
      if (section) lines.push(`• Current step: ${section}`);
      if (completion !== null)
        lines.push(`• Progress: ~${completion}% complete`);

      // Missing documents (top few)
      const missing = Array.isArray(sessionContext.missingDocuments)
        ? sessionContext.missingDocuments
        : [];
      if (missing.length > 0) {
        const sample = missing
          .slice(0, 4)
          .map(
            (m: any) => `${labelForDocumentType(m.documentType)} (${m.status})`
          )
          .join(", ");
        lines.push(`• Documents still in progress: ${sample}`);
      }

      const pickNextActionFromMissingDocs = () => {
        if (!missing.length) return null;

        const dt = missing.map((m: any) =>
          normalizeDocumentType(m.documentType)
        );

        // Prioritize items that commonly block Downwinder packets.
        const priorities = [
          "DEATH_CERTIFICATE",
          "BIRTH_CERTIFICATE",
          "MARRIAGE_CERTIFICATE",
          "DIVORCE_DECREE",
          "PHOTO_ID",
          "PROOF_OF_RESIDENCE",
          "RESIDENCE_PROOF",
          "MEDICAL_RECORDS",
          "PATHOLOGY_REPORT",
          "CANCER_DIAGNOSIS",
          "SOCIAL_SECURITY_CARD",
        ];

        const hit = priorities.find((p) =>
          dt.some((x: string) => x.includes(p))
        );
        if (!hit) return null;

        const pretty = labelForDocumentType(hit);

        return `Focus next on: ${pretty}. It’s commonly required and often delays claims when missing.`;
      };

      // Section-specific nudge (Downwinder-focused)
      const nudges: Record<string, string[]> = {
        part_1: [
          "Confirm your name, DOB, and SSN match your ID exactly (avoid typos).",
          "If you’ve ever used a different last name, add former/maiden names now.",
        ],
        part_2: [
          "Enter the deceased individual’s details exactly as on the death certificate.",
          "If DOB/DOD differ from earlier screening, double-check and confirm.",
        ],
        part_3: [
          "Confirm relationship type (Self/Spouse/Child/Parent/etc.)—it changes required documents.",
        ],
        part_4: [
          "List the exact exposure location(s) and dates; residence proof requirements depend on this.",
        ],
        part_5: [
          "As spouse: be ready to provide marriage certificate and (if applicable) divorce decree(s).",
        ],
        part_6: [
          "As child: confirm parent details and be ready with birth certificate(s) linking you to the deceased.",
        ],
        part_7: [
          "For extended family: line up intermediary relative documents to prove the chain of relationship.",
        ],
        part_8: [
          "Double-check employment/residence timelines—consistency matters for credibility and eligibility.",
        ],
        part_9: [
          "Ensure all addresses/locations are complete (city/county/state) to avoid document mismatches.",
        ],
        part_10: [
          "Review exposure/residence answers carefully; these drive what proofs you must upload/request.",
        ],
        part_11: [
          "Have cancer diagnosis documentation ready (pathology report and/or treating facility records).",
        ],
        part_12: [
          "Verify signatures/authorizations: missing initials/signatures often cause rejection delays.",
        ],
        part_13: [
          "Make sure all survivor/beneficiary details are accurate—names/dates must match vital records.",
        ],
        part_14: [
          "Attorney acknowledgements: confirm you understand representation/DIY path and refund rules.",
        ],
        part_15: [
          "Re-check any optional fields that reduce follow-up requests (aliases, prior addresses, etc.).",
        ],
        part_16: [
          "Final confirmations: ensure consistency of names, DOB/DOD, and SSNs across all parts.",
        ],
        supporting_forms: [
          "Complete releases/authorizations so medical/vital records requests don’t get rejected.",
        ],
        documents: [
          "Upload the highest-impact missing docs first (death cert, birth certs, residence proof, diagnosis proof).",
        ],
        document_checklist: [
          "Use the checklist to request missing records first (vital + medical).",
        ],
        review: [
          "Resolve any flagged inconsistencies before generating the packet.",
        ],
        final_review: [
          "Scan for name/date consistency before generating packets.",
        ],
      };

      const docPriorityNudge = pickNextActionFromMissingDocs();
      const sectionNudge = nudges[section]?.[0];
      const nudge = docPriorityNudge || sectionNudge;
      if (nudge) lines.push(`• Next best action: ${nudge}`);

      if (lines.length === 0) return "";

      return `Quick status (from your claim progress):\n${lines.join("\n")}`;
    };

    const quickStatus = buildQuickStatus();

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
- Claim Type: ${sessionContext.claimType || "Not specified"}
- Intake Session: ${sessionContext.intakeSessionId || "Not specified"}
- Workflow Stage: ${sessionContext.recaWorkflowStage ?? "Not specified"}
- Workflow Section: ${sessionContext.recaWorkflowSection || "Not specified"}
- Completion: ${sessionContext.recaCompletionPercent ?? "Not specified"}%
- Document Status Counts: ${sessionContext.documentStatusCounts ? JSON.stringify(sessionContext.documentStatusCounts) : "Not available"}
- Missing Documents (sample): ${sessionContext.missingDocuments ? JSON.stringify(sessionContext.missingDocuments) : "Not available"}`
    : "- No claim context provided yet"
}

**PROACTIVE HELP (IMPORTANT):**
- If the user is working on a Downwinder claim and you have workflow context (stage/section/completion/missing docs), start your reply with a short **"Quick status"** section (2-4 bullets) tailored to what they should do next.
- Keep it non-annoying: if the user asked a very specific question, answer it first, then add a brief "Quick status" at the end.

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
      let fallbackContacts: any[] = [];
      if (fallbackUserText) {
        try {
          fallbackContacts = await suggestContacts(fallbackUserText, {
            claimType: sessionContext?.claimType,
            state: sessionContext?.state,
            county: sessionContext?.county,
          });
        } catch (fallbackSearchError) {
          console.error(
            "[Contact Agent] Fallback database search failed:",
            fallbackSearchError
          );
        }
      }
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
    let assistantMessage: any;
    try {
      const response = await openAIClient.chat.completions.create({
        model: contactAgentModel,
        messages: [
          { role: "system", content: systemPrompt },
          ...(quickStatus
            ? [{ role: "system" as const, content: quickStatus }]
            : []),
          ...openAIMessages, // Use DB history instead of client messages
        ],
        functions,
        function_call: "auto",
        temperature: 0.7,
        max_tokens: 1000,
      });
      assistantMessage = response.choices[0]?.message;
    } catch (openAIRequestError) {
      console.error(
        "[Contact Agent] OpenAI request failed, returning safe fallback:",
        openAIRequestError
      );

      const fallbackText =
        "I'm having trouble reaching the AI assistant right now. Please try again in a minute.";

      if (canPersistChatHistory && chatSessionId) {
        try {
          await prisma.chatMessage.create({
            data: {
              sessionId: chatSessionId,
              role: "assistant",
              content: fallbackText,
              metadata: {
                mode: "fallback_openai_request_error",
              },
            },
          });
        } catch (persistError) {
          console.error(
            "[Contact Agent] Could not persist OpenAI error fallback message:",
            persistError
          );
        }
      }

      return NextResponse.json({
        chatSessionId,
        message: fallbackText,
        contacts: [],
        interactions: [],
        functionCalled: "fallback_openai_request_error",
        searchSource: "none",
        webSearchPerformed: false,
      });
    }

    if (!assistantMessage) {
      throw new Error("No message returned from OpenAI");
    }

    // If AI wants to call a function
    if (assistantMessage.function_call) {
      const functionName = assistantMessage.function_call.name;
      const functionArgs = JSON.parse(assistantMessage.function_call.arguments);

      if (functionName === "search_contacts") {
        // Execute the contact search in database
        let contacts: any[] = [];
        let dbSearchFailed = false;
        try {
          contacts = await searchContacts({
            state: functionArgs.state,
            county: functionArgs.county,
            searchQuery: functionArgs.searchQuery, // Add searchQuery parameter
            resourceTypes: functionArgs.resourceTypes as ResourceType[],
            documentTypes: functionArgs.documentTypes,
          });
        } catch (dbSearchError) {
          dbSearchFailed = true;
          console.error(
            "[Contact Agent] Database search failed, trying web-only fallback:",
            dbSearchError
          );
        }

        let searchSource = dbSearchFailed ? "database_unavailable" : "database";
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
                : dbSearchFailed
                  ? "Database is temporarily unavailable and no web results were found. Use your general knowledge to suggest the most likely office for this request (e.g. state vital records office) with a disclaimer to verify."
                  : contacts.length > 0
                    ? "Results from verified database."
                    : `No results found in our database for this search. Use your general knowledge to suggest the most likely institution. For vital records in ${functionArgs.state || "the requested state"}, suggest the state's Office of Vital Records or Department of Health with their commonly known contact details, and advise the user to verify by searching online or calling the state office.`,
            }),
          },
        ];

        // Get AI's response with the search results
        let finalText = "No response";
        try {
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
          finalText =
            finalResponse.choices[0]?.message?.content || "No response";
        } catch (openAIFinalError) {
          console.error(
            "[Contact Agent] OpenAI final response failed; returning contacts without narrative:",
            openAIFinalError
          );
          finalText =
            contacts.length > 0
              ? `I found ${contacts.length} potential resource${contacts.length === 1 ? "" : "s"} below.`
              : "I couldn't generate a full response right now. Please try again.";
        }

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

        let assistantMessageId: string | undefined;
        if (canPersistChatHistory && chatSessionId && finalText) {
          try {
            const created = await prisma.chatMessage.create({
              data: {
                sessionId: chatSessionId,
                role: "assistant",
                content: finalText,
              },
            });
            assistantMessageId = created.id;
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
          assistantMessageId,
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
    let assistantMessageId: string | undefined;
    if (canPersistChatHistory && chatSessionId && finalText) {
      try {
        const created = await prisma.chatMessage.create({
          data: {
            sessionId: chatSessionId,
            role: "assistant",
            content: finalText,
          },
        });
        assistantMessageId = created.id;
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
      assistantMessageId,
      contacts: [],
    });
  } catch (error) {
    console.error("Contact agent error:", error);
    return NextResponse.json(
      {
        message:
          "I'm having trouble processing that request right now. Please try again in a moment.",
        contacts: [],
        interactions: [],
        error: "temporarily_unavailable",
      },
      { status: 200 }
    );
  }
}
