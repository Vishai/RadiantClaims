import { NextRequest, NextResponse } from "next/server";
import { openai, CONTACT_AGENT_MODEL } from "@/lib/openai";

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
    const body = await req.json();
    const { messages } = body;

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
    const response = await openai.chat.completions.create({
      model: CONTACT_AGENT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        })),
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const assistantMessage = response.choices[0].message;

    // Regular text response (no function calling for free tier)
    return NextResponse.json({
      message: assistantMessage.content,
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
