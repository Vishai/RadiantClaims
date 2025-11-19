import { searchRecaLibrary, formatRecaContext } from "../src/lib/rag/retrieve";

async function testRagRetrieval() {
  const query =
    "can you tell me about the difference in the law between those who are awarded 100K and 50k?";
  console.log(`Testing RAG retrieval for query: "${query}"\n`);

  try {
    const results = await searchRecaLibrary(query, 5, 0.0);
    console.log(`Found ${results.length} results.`);

    if (results.length > 0) {
      console.log("\n--- Top Result ---");
      console.log(`Score: ${results[0].similarity}`);
      console.log(`Content: ${results[0].content.substring(0, 200)}...`);
    }

    const formatted = formatRecaContext(results);
    console.log("\n--- Formatted Context String ---");
    console.log(formatted);
  } catch (error) {
    console.error("RAG retrieval failed:", error);
  }
}

testRagRetrieval();
