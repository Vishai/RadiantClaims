import path from "path";
import fs from "fs";
import { ingestDocument } from "../src/lib/rag/ingest";

const SUPPORT_DOCS = [
  "PRODUCT_ONE_PAGER.md",
  "docs/ACCOUNT_BENEFITS_MESSAGING.md",
];

async function main() {
  console.log("Starting Support Docs Ingestion...");

  const rootDir = process.cwd();

  for (const relativePath of SUPPORT_DOCS) {
    const fullPath = path.join(rootDir, relativePath);

    if (!fs.existsSync(fullPath)) {
      console.warn(`Skipping missing file: ${fullPath}`);
      continue;
    }

    console.log(`Ingesting ${relativePath}...`);
    const fileBuffer = fs.readFileSync(fullPath);

    await ingestDocument({
      filename: path.basename(relativePath), // e.g., "PRODUCT_ONE_PAGER.md"
      fileBuffer,
      isPublic: true,
      // specific metadata could be added here if schema supported it
      // for now we rely on filename
    });
  }

  console.log("Ingestion Complete!");
}

main();
