import { generateEmbedding } from "./embeddings";
import { db } from "@/lib/db";
import { createRequire } from "module";

// pdf-parse is a CommonJS module
const require = createRequire(import.meta.url);
const pdfModule = require("pdf-parse");
const PDFParse = pdfModule.PDFParse || pdfModule.default?.PDFParse || pdfModule;

// Simple CUID-like generator
function generateCuid(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `c${timestamp}${randomStr}`.substring(0, 25);
}

interface IngestOptions {
  filename: string;
  fileBuffer: Buffer;
  isPublic?: boolean;
  claimantId?: string;
  uploadedBy?: string;
}

/**
 * Ingests a PDF document into the RECA Library for RAG.
 */
export async function ingestDocument({
  filename,
  fileBuffer,
  isPublic = true,
  claimantId,
  uploadedBy,
}: IngestOptions) {
  console.log(`Processing ${filename}...`);

  // Instantiate the parser
  const parser = new PDFParse({
    data: fileBuffer,
    verbosity: 0, // ERRORS
    stopAtErrors: false,
    disableFontFace: true,
  });

  const textResult = await parser.getText();
  const text = textResult.text;

  // Naive chunking: Split by approx 1000 characters, respecting sentence boundaries
  const chunks = chunkText(text, 1000);

  console.log(`Generated ${chunks.length} chunks. Generating embeddings...`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i] || "";
    if (!chunk) continue;

    const embedding = await generateEmbedding(chunk);

    // Format vector for Prisma unsupported type
    const vectorString = `[${embedding.join(",")}]`;

    // Insert into DB
    const id = generateCuid();

    // Use executeRaw because Prisma doesn't support vector types natively yet in create()
    await db.$executeRaw`
      INSERT INTO "RecaLibrary" (
        id, 
        content, 
        "sourceDocument", 
        "pageNumber", 
        embedding, 
        "updatedAt",
        "isPublic",
        "claimantId",
        "uploadedBy"
      )
      VALUES (
        ${id}, 
        ${chunk}, 
        ${filename}, 
        ${null}, 
        ${vectorString}::vector, 
        NOW(),
        ${isPublic},
        ${claimantId || null},
        ${uploadedBy || null}
      );
    `;
  }

  console.log("Ingestion complete!");
  return { chunks: chunks.length };
}

function chunkText(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  let currentChunk = "";

  // Normalize whitespace
  const normalized = text.replace(/\s+/g, " ").trim();

  const sentences = normalized.match(/[^.!?]+[.!?]+/g) || [normalized];

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxLength) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
