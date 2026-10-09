/**
 * Seed a LOCAL database with synthetic claimants from mock-docs/ and run their
 * documents through the real pipeline (storage → OCR cascade → agents →
 * confidence routing), so the admin Document Pipeline and AI Review pages have
 * data. Some documents are turned into scan-quality copies first, so the
 * cascade has pages to escalate and the review queue has low-confidence work.
 *
 *   npx tsx --env-file=.env.local --env-file=.env.development.local \
 *     scripts/seed-pipeline-demo.ts [personaCount=6]
 *
 * Refuses to run against anything but a local database.
 */
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { db } from "../src/lib/db";
import { uploadToR2 } from "../src/lib/r2";
import { processDocument } from "../src/lib/document-intelligence/ocr";
import { validateDocument } from "../src/lib/ai-agents/orchestration-service";

type Style = "clean" | "scan" | "rough";

interface ManifestEntry {
  personaId: string;
  personaName: string;
  file: string;
  expectedCategory: string;
}

/** Render a PDF to an image-only copy, degraded like a phone photo or fax. */
async function degrade(
  pdf: Buffer,
  style: Exclude<Style, "clean">
): Promise<Buffer> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const napi = await import("@napi-rs/canvas");
  const { createCanvas } = napi;
  const g = globalThis as { pdfjsWorker?: unknown; Path2D?: unknown };
  g.Path2D = napi.Path2D;
  g.pdfjsWorker ??= await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(pdf),
    verbosity: 0,
  }).promise;
  const out = await PDFDocument.create();
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const viewport = page.getViewport({ scale: style === "scan" ? 1.4 : 0.9 });
    const canvas = createCanvas(
      Math.ceil(viewport.width),
      Math.ceil(viewport.height)
    );
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await page.render({
      canvasContext: ctx as any,
      canvas: canvas as any,
      viewport,
    }).promise;
    let img = sharp(canvas.toBuffer("image/png")).rotate(
      style === "scan" ? 0.8 : 2.5,
      { background: "#efeadf" }
    );
    img =
      style === "scan"
        ? img.blur(0.6)
        : img.blur(1.6).modulate({ brightness: 0.85 });
    const jpg = await img
      .jpeg({ quality: style === "scan" ? 55 : 22 })
      .toBuffer();
    const embedded = await out.embedJpg(jpg);
    out.addPage([embedded.width, embedded.height]).drawImage(embedded, {
      x: 0,
      y: 0,
      width: embedded.width,
      height: embedded.height,
    });
  }
  return Buffer.from(await out.save());
}

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  if (!/localhost|127\.0\.0\.1/.test(url)) {
    console.error("Refusing to seed: DATABASE_URL is not a local database.");
    process.exit(1);
  }
  const personaCount = Number(process.argv[2] ?? 6);
  const manifest: ManifestEntry[] = JSON.parse(
    readFileSync("mock-docs/manifest.json", "utf8")
  );
  const personas = [...new Set(manifest.map((m) => m.personaId))].slice(
    0,
    personaCount
  );

  let i = 0;
  for (const personaId of personas) {
    const docs = manifest.filter((m) => m.personaId === personaId);
    const [firstName, ...rest] = docs[0]!.personaName.split(" ");
    const claimant = await db.claimant.create({
      data: {
        firstName: firstName!,
        lastName: rest.join(" "),
        email: `${personaId.toLowerCase()}.demo@example.com`,
        phone: "555-0100",
        dob: new Date("1950-06-01"),
        address1: "100 Demo St",
        city: "St. George",
        county: "Washington",
        state: "UT",
        postalCode: "84770",
      },
    });
    const session = await db.intakeSession.create({
      data: {
        resumeToken: randomUUID(),
        claimantId: claimant.id,
        claimType: "OTHER_CANCER",
        status: "SUBMITTED",
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      },
    });
    console.log(`\n👤 ${docs[0]!.personaName}`);

    for (const doc of docs) {
      // Every third document arrives as a scan; every seventh as a rough photo.
      const style: Style =
        i % 7 === 3 ? "rough" : i % 3 === 1 ? "scan" : "clean";
      i++;
      const original = readFileSync(doc.file);
      const buffer =
        style === "clean" ? original : await degrade(original, style);
      const name = doc.file.split("/").pop()!;
      const key = `demo/${session.id}/${randomUUID()}-${name}`;
      await uploadToR2(key, buffer, "application/pdf");
      const file = await db.uploadedFile.create({
        data: {
          intakeSessionId: session.id,
          fileKey: key,
          originalFilename:
            style === "clean" ? name : name.replace(".pdf", `_${style}.pdf`),
          mimeType: "application/pdf",
          sizeBytes: buffer.length,
          status: "PROCESSING",
        },
      });
      const { ocrResult } = await processDocument(buffer, "application/pdf");
      await db.uploadedFile.update({
        where: { id: file.id },
        data: {
          ocrText: ocrResult.text,
          ocrConfidence: ocrResult.confidence,
          metadata: JSON.stringify({
            ocrConfidence: ocrResult.confidence,
            ocrTier: ocrResult.method,
            ocrPages: ocrResult.pages,
            processingTimeMs: ocrResult.processingTimeMs,
            pageCount: ocrResult.pageCount,
            textLength: ocrResult.text.length,
          }),
          status: "READY",
          processedAt: new Date(),
        },
      });
      const v = await validateDocument(file.id);
      const validation = await db.documentValidation.findUnique({
        where: { uploadedFileId: file.id },
      });
      console.log(
        `  ${name.padEnd(28)} ${style.padEnd(5)} OCR ${ocrResult.method} ${Math.round(ocrResult.confidence * 100)}% → ${v.category ?? "?"} → ${validation?.status}`
      );
    }
  }
  await db.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await db.$disconnect();
  process.exit(1);
});
