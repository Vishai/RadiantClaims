import { openai } from "@/lib/openai";

/**
 * Generates an embedding vector for the given text using OpenAI's text-embedding-3-small model.
 *
 * @param text The text to embed
 * @returns A 1536-dimensional vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Sanitize text: replace newlines with spaces to improve embedding quality
  const sanitizedText = text.replace(/\n/g, " ");

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: sanitizedText,
    encoding_format: "float",
  });

  return response.data[0].embedding;
}
