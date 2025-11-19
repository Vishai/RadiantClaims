import { db } from "../src/lib/db";

async function checkEmbeddings() {
  try {
    // Check if we can select the embedding column (might need casting to text to view)
    const results = await db.$queryRaw`
      SELECT id, substring(embedding::text, 1, 50) as embedding_preview
      FROM "RecaLibrary"
      LIMIT 1
    `;
    console.log("Embedding Preview:", results);
  } catch (error) {
    console.error("Error checking embeddings:", error);
  }
}

checkEmbeddings();
