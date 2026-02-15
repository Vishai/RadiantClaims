import { NextRequest, NextResponse } from "next/server";
import { openai, CONTACT_AGENT_MODEL } from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import { buildChatQuickStatus } from "@/lib/chat/quick-status";
import { apiRateLimiter, createRateLimitResponse } from "@/lib/rate-limit";

/**
 * POST /api/contact-agent/basic-info
 *
 * Free-tier AI assistant that helps users understand RECA eligibility
 * and provides basic information about the program.
 *
 * This bot is LIMITED to:
 * - Eligibility checking
 * - Understanding what RECA is
 * - General info about required documents
 * - Basic questions about the claims process
 *
 * It does NOT:
 * - Search for or provide specific contacts
 * - Access the document database
 * - Perform web searches
 *
 * Body:
 * - messages: Array of chat messages
 */
export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateResult = await apiRateLimiter.limit(`basic-info:${ip}`);
    if (!rateResult.success) {
      return createRateLimitResponse(rateResult);
    }

    const body = await req.json();
    const {
      messages,
      chatSessionId: providedChatSessionId,
      sessionContext,
    } = body;

    const lastUserMessage = messages
      .filter((m: any) => m.role === "user")
      .pop();

    let chatSessionId: string | null = providedChatSessionId || null;

    // Try to persist history (guest sessions allowed)
    try {
      // Get or create ChatSession
      if (chatSessionId) {
        const existing = await prisma.chatSession.findUnique({
          where: { id: chatSessionId },
        });
        if (!existing) chatSessionId = null;
      }

      if (!chatSessionId) {
        const created = await prisma.chatSession.create({
          data: {
            title:
              messages[messages.length - 1]?.content?.substring(0, 50) ||
              "Basic Info Chat",
          },
        });
        chatSessionId = created.id;
      }

      // Save latest user message
      if (lastUserMessage?.content) {
        await prisma.chatMessage.create({
          data: {
            sessionId: chatSessionId,
            role: "user",
            content: lastUserMessage.content,
          },
        });
      }

      // Load last 10 messages from DB for continuity
      const history = await prisma.chatMessage.findMany({
        where: { sessionId: chatSessionId },
        orderBy: { createdAt: "asc" },
        take: 10,
      });

      // Replace client messages with persisted history
      body.messages = history.map((m) => ({
        role: m.role,
        content: m.content,
      }));
    } catch (e) {
      console.warn("[basic-info] chat persistence unavailable", e);
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // System prompt for the basic info assistant
    const systemPrompt = `You are a helpful AI assistant for RadiantClaims, providing FREE basic information about RECA (Radiation Exposure Compensation Act).

**YOUR SCOPE (Free Tier):**
You help users understand:
- What RECA is and who it benefits
- Basic eligibility criteria (downwinder vs onsite participant vs uranium worker)
- General information about required documents (birth certificates, medical records, proof of residence, etc.)
- The general claims process overview
- Where to find official RECA information

**IMPORTANT LIMITATIONS:**
You do NOT:
- Search for or provide specific institutional contacts (hospitals, vital records offices, etc.)
- Access contact databases
- Perform web searches for contacts
- Help with finding specific phone numbers or addresses

**When users ask for specific contacts:**
Politely explain: "I'm the free-tier assistant and can only help with general RECA information and eligibility questions. To get help finding specific contacts for documents, you'll need to upgrade to our paid service tier. Would you like to know more about upgrading?"

**Your Tone:**
- Warm, empathetic, and understanding
- Remember these users often have cancer or lost loved ones to radiation exposure
- Encourage them but be realistic about requirements
- Always suggest upgrading for personalized contact search assistance

**RECA Basics to Know:**
1. Three main categories: Downwinders, Onsite Participants, Uranium Workers
2. Downwinders need to prove: residence in affected area during testing, eligible disease
3. Key documents: birth certificate, medical records, proof of residence
4. Current compensation: $50,000-$100,000 depending on category
5. Claims processed by DOJ Civil Division

Be conversational, helpful, and guide users to understand if RECA might apply to them.`;

    // Call OpenAI for basic info response
    const quickStatus = buildChatQuickStatus(sessionContext, {
      includeMissingDocs: false,
    });

    const openAIMessages = (body.messages || messages)
      .filter((m: any) => typeof m?.content === "string" && m?.role)
      .slice(-10)
      .map((m: any) => ({ role: m.role, content: m.content }));

    const response = await openai.chat.completions.create({
      model: CONTACT_AGENT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...(quickStatus ? [{ role: "system", content: quickStatus }] : []),
        ...openAIMessages,
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const assistantMessage = response.choices[0]?.message;
    if (!assistantMessage) throw new Error("No message returned");

    let assistantMessageId: string | undefined;

    // Persist assistant message
    if (chatSessionId && assistantMessage.content) {
      try {
        const created = await prisma.chatMessage.create({
          data: {
            sessionId: chatSessionId,
            role: "assistant",
            content: assistantMessage.content,
            metadata: {
              tier: "free",
              source: "basic_info",
            },
          },
        });
        assistantMessageId = created.id;
      } catch (e) {
        console.warn("[basic-info] failed to persist assistant message", e);
      }
    }

    return NextResponse.json({
      message: assistantMessage.content,
      chatSessionId,
      assistantMessageId,
    });
  } catch (error) {
    console.error("Basic info bot error:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
