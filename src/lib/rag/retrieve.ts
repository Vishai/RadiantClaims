import { db } from "@/lib/db";
import { generateEmbedding } from "./embeddings";
import { RecaContext } from "./types";

/**
 * Searches the RECA Library for content similar to the user's query.
 *
 * @param query User's search query
 * @param limit Number of results to return (default 5)
 * @param threshold Minimum similarity score (0-1, default 0.5)
 * @param claimantId Optional claimant ID to scope private documents
 * @returns Array of relevant context chunks
 */
export async function searchRecaLibrary(
  query: string,
  limit = 5,
  threshold = 0.15, // Lowered threshold to capture more relevant context
  claimantId?: string
): Promise<RecaContext[]> {
  try {
    const embedding = await generateEmbedding(query);
    const vectorString = `[${embedding.join(",")}]`;

    // Execute raw SQL query for vector similarity search
    // We use the <=> operator (cosine distance) and convert it to similarity (1 - distance)
    // AND logic: Must be public OR belong to the specific claimant
    const results = (await db.$queryRaw`
      SELECT 
        id, 
        content, 
        "sourceDocument", 
        "pageNumber", 
        "section",
        "isPublic",
        "claimantId",
        1 - (embedding <=> ${vectorString}::vector) as similarity
      FROM "RecaLibrary"
      WHERE (1 - (embedding <=> ${vectorString}::vector) > ${threshold})
      AND ("isPublic" = true OR "claimantId" = ${claimantId || null})
      ORDER BY similarity DESC
      LIMIT ${limit};
    `) as any[];

    // Map raw results to typed objects
    return results.map((row) => ({
      id: row.id,
      content: row.content,
      sourceDocument: row.sourceDocument,
      pageNumber: row.pageNumber,
      section: row.section,
      similarity: row.similarity,
    }));
  } catch (error) {
    console.error("Error searching RECA library:", error);
    // Fallback to empty array if search fails (e.g., if vector extension is missing)
    return [];
  }
}

/**
 * Formats retrieved context into a string suitable for the LLM system prompt.
 */
export function formatRecaContext(contexts: RecaContext[]): string {
  if (contexts.length === 0) return "";

  const formattedChunks = contexts.map((ctx, index) => {
    const citation = `Source: ${ctx.sourceDocument}${ctx.pageNumber ? `, Page ${ctx.pageNumber}` : ""}${ctx.section ? `, ${ctx.section}` : ""}`;
    return `[${index + 1}] ${citation}\nContent: "${ctx.content}"`;
  });

  return `OFFICIAL SOURCE CONTEXT:\n\n${formattedChunks.join("\n\n")}\n\nINSTRUCTIONS:\n- Use the above context to answer the user's question.\n- Cite the source document and page number when stating facts.\n- If the answer is not found in the context, state that you do not have official information from the RECA statute/amendments regarding that specific detail.`;
}
