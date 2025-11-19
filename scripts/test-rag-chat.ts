import { searchRecaLibrary, formatRecaContext } from "../src/lib/rag/retrieve";
import { openai, CONTACT_AGENT_MODEL } from "../src/lib/openai";

async function testChatResponse() {
  const query =
    "can you tell me about the difference in the law between those who are awarded 100K and 50k?";
  console.log(`Testing Chatbot RAG response for query: "${query}"
`);

  try {
    // 1. Retrieve Context
    const results = await searchRecaLibrary(query);
    const ragContextString = formatRecaContext(results);

    console.log("--- Retrieved Context ---");
    // console.log(ragContextString);
    console.log(`(Context length: ${ragContextString.length} chars)
`);

    // 2. Simulate Chatbot Logic
    const systemPrompt = `You are a helpful AI assistant for RadiantClaims, specializing in helping RECA (Radiation Exposure Compensation Act) claimants find institutional contacts and understand the RECA legislation.

**IMPORTANT SCOPE & CONTEXT:**
You have access to a library of RECA legislation and policy documents via the context below.
${
  ragContextString
    ? `
=== RECA LEGISLATION CONTEXT ===
${ragContextString}
=== END CONTEXT ===
`
    : ""
}

**YOUR RESPONSIBILITIES:**
1.  **Find Contacts:** Help users find institutional contacts (vital records, hospitals, etc.) for RECA documents.
2.  **Answer RECA Questions:** Answer general questions about RECA eligibility, compensation amounts, deadlines, and criteria **IF AND ONLY IF** the answer is found in the provided context above.
3.  **Redirect Others:** If a user asks a question unrelated to RECA or finding contacts, politely redirect them to support.

**GUIDELINES:**
- **Use the Context:** When answering questions about the law (e.g., "How much is the payout?", "Who is eligible?"), cite the provided context. If the context mentions specific amounts (e.g., $50,000 vs $100,000), explain the difference based *strictly* on that text.
`;

    const response = await openai.chat.completions.create({
      model: CONTACT_AGENT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    console.log("--- Chatbot Response ---");
    console.log(response.choices[0].message.content);
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testChatResponse();
