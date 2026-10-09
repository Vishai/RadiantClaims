/**
 * Run documents through the per-page OCR cascade and print which tier each page
 * landed on.
 *
 *   npx tsx scripts/ocr-cascade-demo.ts <file.pdf|file.png> [...]
 *   npx tsx scripts/ocr-cascade-demo.ts --scan <file.pdf> <out.pdf>
 *
 * --scan writes an image-only copy of a PDF (rendered, slightly degraded, no
 * text layer), which forces its pages past tier 1, to show escalation.
 */
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import {
  cascadeImage,
  cascadePdf,
} from "../src/lib/document-intelligence/ocr-cascade";

async function scanCopy(input: string, output: string) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const { createCanvas } = await import("@napi-rs/canvas");
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(readFileSync(input)),
    verbosity: 0,
  }).promise;
  const out = await PDFDocument.create();
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const viewport = page.getViewport({ scale: 1.4 });
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
    const jpg = await sharp(canvas.toBuffer("image/png"))
      .rotate(0.8, { background: "#f4f1ea" })
      .blur(0.6)
      .modulate({ brightness: 0.96 })
      .jpeg({ quality: 55 })
      .toBuffer();
    const img = await out.embedJpg(jpg);
    out
      .addPage([img.width, img.height])
      .drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }
  writeFileSync(output, await out.save());
  console.log(`Wrote image-only copy: ${output}`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === "--scan") return scanCopy(args[1], args[2]);
  for (const file of args) {
    const buf = readFileSync(file);
    const r = /\.pdf$/i.test(file)
      ? await cascadePdf(buf)
      : await cascadeImage(buf);
    console.log(
      `\n${file}\n  ${r.pageCount} page(s) · kept up to: ${r.method} · confidence ${Math.round(r.confidence * 100)}% · ${r.processingTimeMs} ms`
    );
    for (const p of r.pages) {
      console.log(
        `  page ${p.page}: ${p.attempts.map((a) => `${a.tier} ${Math.round(a.confidence * 100)}%${a.error ? " (error)" : ""}`).join(" → ")}  ⇒ ${p.tier}`
      );
    }
  }
}

void main();
