import fs from "fs";
import path from "path";
import { generateEmbedding } from "../src/lib/rag/embeddings";
import { db } from "../src/lib/db";
import { createRequire } from "module";

// pdf-parse is a CommonJS module

const require = createRequire(import.meta.url);

const pdfModule = require("pdf-parse");

const PDFParse = pdfModule.PDFParse || pdfModule.default?.PDFParse || pdfModule;

// Simple CUID-like generator for ingestion script

function generateCuid(): string {
  const timestamp = Date.now().toString(36);

  const randomStr = Math.random().toString(36).substring(2, 15);

  return `c${timestamp}${randomStr}`.substring(0, 25);
}

/**

 * Ingests a PDF document into the RECA Library for RAG.

 *

 * Usage: npx tsx scripts/ingest-reca-docs.ts <path-to-pdf> [page-offset]

 */

async function ingestDocument(filePath: string, pageOffset = 0) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);

    process.exit(1);
  }

  const filename = path.basename(filePath);

  console.log(`Processing ${filename}...`);

  const dataBuffer = fs.readFileSync(filePath);

  // Instantiate the parser with more complete options to avoid potential initialization errors

  const parser = new PDFParse({
    data: dataBuffer,

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
    const chunk = chunks[i];
    const embedding = await generateEmbedding(chunk);

    // Format vector for Prisma unsupported type
    const vectorString = `[${embedding.join(",")}]`;

    // Insert into DB
    const id = generateCuid();
    await db.$executeRaw`
      INSERT INTO "RecaLibrary" (id, content, "sourceDocument", "pageNumber", embedding, "updatedAt")
      VALUES (${id}, ${chunk}, ${filename}, ${null}, ${vectorString}::vector, NOW());
    `;

    process.stdout.write(".");
  }

  console.log("\nIngestion complete!");
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

// Main execution
const args = process.argv.slice(2);
if (args.length < 1) {
  console.log("Please provide a PDF file path.");
  process.exit(1);
}

ingestDocument(args[0], parseInt(args[1] || "0"));
