import { NextRequest, NextResponse } from "next/server";
import { openai, CONTACT_AGENT_MODEL } from "@/lib/openai";
import { searchContacts } from "@/lib/contact-agent/search";
import {
  searchContactsWeb,
  parseSearchResultsWithAI,
} from "@/lib/contact-agent/web-search";
import {
  batchAutoImport,
  scoreWebContact,
} from "@/lib/contact-agent/auto-import";
import { ResourceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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

/**
 * POST /api/contact-agent/chat
 *
 * AI-powered contact agent that helps users find institutional contacts
 * Uses OpenAI function calling to search the DocumentResource database
 *
 * Body:
 * - messages: Array of chat messages
 * - sessionContext: Optional context about the user's claim (state, county, claimType)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, sessionContext } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // System prompt for the contact agent
    const systemPrompt = `You are a helpful AI assistant for RadiantClaims, specializing in helping RECA (Radiation Exposure Compensation Act) claimants find institutional contacts to obtain documents.

**IMPORTANT SCOPE RESTRICTIONS:**
You ONLY help find institutional contacts for RECA-related documents. You do NOT:
- Answer general questions unrelated to finding contacts
- Provide general web search capabilities
- Discuss topics outside of RECA document procurement
- Help with non-institutional contact searches

If a user asks something outside your scope, politely redirect them: "I'm specifically designed to help you find institutional contacts (vital records offices, hospitals, schools, etc.) for your RECA claim. For other questions, please contact our support team."

Your role:
- Help users find contacts for ALL vital records (birth, death, marriage, divorce certificates), medical records, school records, employment records, church records, and residence proof documents
- ALWAYS treat requests for marriage certificates, divorce records, and other vital records as IN SCOPE for RECA claims
- Search the database using the search_contacts function whenever someone asks about finding documents or contacts
- Only search for OFFICIAL INSTITUTIONS: government offices, hospitals, schools, churches, employers
- Provide clear, actionable information about how to contact these institutions
- Be empathetic and understanding - these users are often dealing with cancer or loss of loved ones

When you find contacts:
- Present the most relevant results clearly
- Include phone, email, address, and website when available
- Mention costs and processing times if known
- Suggest the best method to contact them (mail, phone, online portal)
- Offer to help with next steps (like generating request letters)
- If found via web search, mention it needs verification

Context about the user's claim:
${
  sessionContext
    ? `- State: ${sessionContext.state || "Not specified"}
- County: ${sessionContext.county || "Not specified"}
- Claim Type: ${sessionContext.claimType || "Not specified"}`
    : "- No claim context provided yet"
}

Be conversational, helpful, and guide users step-by-step. Stay focused on finding institutional contacts only.`;

    // Define the function for searching contacts
    const functions = [
      {
        name: "search_contacts",
        description:
          "Search the database for institutional contacts (vital records offices, hospitals, schools, etc.) that can provide documents for RECA claims",
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
    const response = await openai.chat.completions.create({
      model: CONTACT_AGENT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          ...(msg.function_call && { function_call: msg.function_call }),
          ...(msg.name && { name: msg.name }),
        })),
      ],
      functions,
      function_call: "auto",
      temperature: 0.7,
      max_tokens: 1000,
    });

    const assistantMessage = response.choices[0].message;

    // If AI wants to call a function
    if (assistantMessage.function_call) {
      const functionName = assistantMessage.function_call.name;
      const functionArgs = JSON.parse(assistantMessage.function_call.arguments);

      if (functionName === "search_contacts") {
        // Execute the contact search in database
        let contacts = await searchContacts({
          state: functionArgs.state,
          county: functionArgs.county,
          resourceTypes: functionArgs.resourceTypes as ResourceType[],
          documentTypes: functionArgs.documentTypes,
        });

        let searchSource = "database";
        let webSearchPerformed = false;

        // Fallback to web search if no results found
        if (contacts.length === 0 && process.env.TAVILY_API_KEY) {
          console.log(
            "[Contact Agent] No database results, trying web search..."
          );

          const webContacts = await searchContactsWeb({
            state: functionArgs.state,
            county: functionArgs.county,
            institutionType: functionArgs.resourceTypes?.[0],
            documentType: functionArgs.documentTypes?.[0],
          });

          if (webContacts.length > 0) {
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
            contacts = webContacts.map((wc) => ({
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

            searchSource = "web";
            webSearchPerformed = true;
          }
        }

        // Return the function result to the AI
        const updatedMessages = [
          ...messages,
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
              note: webSearchPerformed
                ? "Results found via web search. Information may need verification."
                : contacts.length > 0
                  ? "Results from verified database."
                  : "No results found in database or web search.",
            }),
          },
        ];

        // Get AI's response with the search results
        const finalResponse = await openai.chat.completions.create({
          model: CONTACT_AGENT_MODEL,
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
                          claimantId: claimant.id,
                          documentType,
                        },
                      },
                      create: {
                        claimantId: claimant.id,
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
          message: finalResponse.choices[0].message.content,
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
    return NextResponse.json({
      message: assistantMessage.content,
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
