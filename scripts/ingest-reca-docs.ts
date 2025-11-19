import fs from "fs";
import path from "path";
import { ingestDocument } from "../src/lib/rag/ingest";

/**
 * Ingests a PDF document into the RECA Library for RAG.
 *
 * Usage: npx tsx scripts/ingest-reca-docs.ts <path-to-pdf> [page-offset]
 */
async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log("Please provide a PDF file path.");
    process.exit(1);
  }

  const filePath = args[0];
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const filename = path.basename(filePath);
  const dataBuffer = fs.readFileSync(filePath);

  try {
    await ingestDocument({
      filename,
      fileBuffer: dataBuffer,
      isPublic: true, // Scripts assume public ingestion by default
    });
  } catch (error) {
    console.error("Ingestion failed:", error);
    process.exit(1);
  }
}

main();
