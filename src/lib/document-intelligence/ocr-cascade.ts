/**
 * Per-page, confidence-driven OCR cascade.
 *
 * Every page starts on the cheapest tier and escalates only when that tier's
 * confidence (or the amount of text it found) falls below the bar:
 *
 *   Tier 1  pdfjs text layer      free, instant, only for PDFs with real text
 *   Tier 2  Tesseract             free, local, on a 2x render of the page
 *   Tier 3  Google Cloud Vision   paid, photos and handwriting
 *   Tier 4  AWS Textract          paid, last resort for hard scans
 *
 * The tier each page lands on and its confidence are returned per page, so the
 * upload route can store them and the pipeline metrics can report the tier mix
 * (which is the OCR cost) and the confidence distribution.
 */

import { createWorker, type Worker } from "tesseract.js";
import sharp from "sharp";
import { ocrConfig } from "../config/ocr-config";
import { ensurePdfjsPolyfills } from "./polyfills/pdfjs-polyfills";

export type OcrTier = "pdfjs" | "tesseract" | "google-vision" | "aws-textract";

export const OCR_TIERS: OcrTier[] = [
  "pdfjs",
  "tesseract",
  "google-vision",
  "aws-textract",
];

export interface TierAttempt {
  tier: OcrTier;
  confidence: number;
  chars: number;
  ms: number;
  error?: string;
}

export interface PageOcr {
  page: number;
  /** The tier whose text was kept, or "none" if every tier failed. */
  tier: OcrTier | "none";
  confidence: number;
  chars: number;
  /** Every tier tried for this page, in order. */
  attempts: TierAttempt[];
}

export interface CascadeResult {
  text: string;
  /** Character-weighted mean of the kept pages' confidence. */
  confidence: number;
  pageCount: number;
  pages: PageOcr[];
  /** The most expensive tier any page needed. */
  method: OcrTier | "none";
  processingTimeMs: number;
}

interface TierOutput {
  text: string;
  confidence: number;
}

/** What a tier must reach for its text to be kept. */
function accepted(out: TierOutput): boolean {
  return (
    out.text.trim().length >= ocrConfig.minPageChars &&
    out.confidence >= ocrConfig.minConfidence
  );
}

// ---------------------------------------------------------------- pdfjs

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfjsLib: any = null;

async function loadPdfjs() {
  if (!pdfjsLib) {
    ensurePdfjsPolyfills();
    // Run pdfjs's worker on the main thread: in Node there is no worker URL to
    // load, so hand it the worker module directly.
    const g = globalThis as { pdfjsWorker?: unknown };
    g.pdfjsWorker ??= await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
    pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  }
  return pdfjsLib;
}

/**
 * Confidence for a PDF text layer. The text itself is exact when it exists, but
 * a broken font encoding produces garbage that looks like text. Score it by the
 * share of printable characters and of tokens that look like words.
 */
export function textLayerConfidence(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const printable =
    (trimmed.match(/[A-Za-z0-9\s.,;:'"()\-/$%&#@!?*+=_\[\]]/g) ?? []).length /
    trimmed.length;
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  const wordy =
    tokens.filter((t) => /^[A-Za-z][A-Za-z'.,:;-]*$|^\d[\d.,/:-]*$/.test(t))
      .length / Math.max(1, tokens.length);
  return Math.max(0, Math.min(1, 0.99 * printable * Math.min(1, wordy / 0.6)));
}

async function renderPage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any
): Promise<Buffer> {
  const napi = await import("@napi-rs/canvas");
  const { createCanvas } = napi;
  // pdfjs draws with whatever Path2D is global. The text-extraction polyfill's
  // stand-in can't be handed to the native canvas, so use the canvas's own.
  const g = globalThis as Record<string, unknown>;
  g.Path2D = napi.Path2D;
  g.DOMMatrix = napi.DOMMatrix;
  g.ImageData = napi.ImageData;
  const viewport = page.getViewport({ scale: 2 });
  const canvas = createCanvas(
    Math.ceil(viewport.width),
    Math.ceil(viewport.height)
  );
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, canvas, viewport }).promise;
  return canvas.toBuffer("image/png");
}

// ---------------------------------------------------------------- image tiers

async function preprocess(image: Buffer): Promise<Buffer> {
  try {
    return await sharp(image)
      .resize(3000, 3000, { fit: "inside", withoutEnlargement: true })
      .greyscale()
      .normalize()
      .sharpen()
      .png()
      .toBuffer();
  } catch {
    return image;
  }
}

async function runImageTier(
  tier: Exclude<OcrTier, "pdfjs">,
  image: Buffer,
  getWorker: () => Promise<Worker>
): Promise<TierOutput> {
  if (tier === "tesseract") {
    const worker = await getWorker();
    const { data } = await worker.recognize(await preprocess(image));
    return { text: data.text.trim(), confidence: data.confidence / 100 };
  }
  if (tier === "google-vision") {
    const { extractTextWithGoogleVision } = await import(
      "../ocr/google-vision"
    );
    const r = await extractTextWithGoogleVision(image);
    return { text: r.text.trim(), confidence: r.confidence };
  }
  const { extractTextWithTextract } = await import("../ocr/aws-textract");
  const r = await extractTextWithTextract(image);
  return { text: r.text.trim(), confidence: r.confidence };
}

function imageTiers(): Exclude<OcrTier, "pdfjs">[] {
  const tiers: Exclude<OcrTier, "pdfjs">[] = [];
  if (ocrConfig.enableTier2) tiers.push("tesseract");
  if (ocrConfig.enableTier3 && ocrConfig.hasGoogleVisionCredentials())
    tiers.push("google-vision");
  if (ocrConfig.enableTier4 && ocrConfig.hasTextractCredentials())
    tiers.push("aws-textract");
  return tiers;
}

/**
 * Run one page through the cascade. `textLayer` is the pdfjs text for PDF
 * pages (undefined for photos); `render` produces the page image on demand so
 * pages that pass on their text layer are never rasterized.
 */
async function cascadePage(
  pageNumber: number,
  textLayer: string | undefined,
  render: () => Promise<Buffer>,
  getWorker: () => Promise<Worker>
): Promise<{ result: PageOcr; text: string }> {
  const attempts: TierAttempt[] = [];
  let best: { tier: OcrTier; out: TierOutput } | null = null;
  const consider = (tier: OcrTier, out: TierOutput, ms: number) => {
    attempts.push({
      tier,
      confidence: round(out.confidence),
      chars: out.text.length,
      ms,
    });
    if (
      out.text.length > 0 &&
      (!best || out.confidence > best.out.confidence)
    ) {
      best = { tier, out };
    }
    return accepted(out);
  };
  const finish = (): { result: PageOcr; text: string } => {
    const kept = best as { tier: OcrTier; out: TierOutput } | null;
    return {
      result: {
        page: pageNumber,
        tier: kept?.tier ?? "none",
        confidence: round(kept?.out.confidence ?? 0),
        chars: kept?.out.text.length ?? 0,
        attempts,
      },
      text: kept?.out.text ?? "",
    };
  };

  if (textLayer !== undefined && ocrConfig.enableTier1) {
    const started = Date.now();
    const out = {
      text: textLayer.trim(),
      confidence: textLayerConfidence(textLayer),
    };
    if (consider("pdfjs", out, Date.now() - started)) return finish();
  }

  let image: Buffer | null = null;
  for (const tier of imageTiers()) {
    const started = Date.now();
    try {
      image ??= await render();
      const out = await runImageTier(tier, image, getWorker);
      if (consider(tier, out, Date.now() - started)) return finish();
    } catch (error) {
      attempts.push({
        tier,
        confidence: 0,
        chars: 0,
        ms: Date.now() - started,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return finish();
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function summarize(
  pages: { result: PageOcr; text: string }[],
  startedAt: number
): CascadeResult {
  const chars = pages.reduce((n, p) => n + p.result.chars, 0);
  const confidence = chars
    ? pages.reduce((n, p) => n + p.result.confidence * p.result.chars, 0) /
      chars
    : 0;
  const used = pages.map((p) => p.result.tier).filter((t) => t !== "none");
  const method: OcrTier | "none" = used.length
    ? OCR_TIERS[Math.max(...used.map((t) => OCR_TIERS.indexOf(t as OcrTier)))]!
    : "none";
  for (const p of pages) {
    const a = p.result.attempts
      .map((x) => `${x.tier} ${Math.round(x.confidence * 100)}%`)
      .join(" → ");
    console.log(
      `📄 OCR page ${p.result.page}: ${a || "no tiers"} ⇒ kept ${p.result.tier}`
    );
  }
  return {
    text: pages
      .map((p) => p.text)
      .join("\n\n")
      .trim(),
    confidence: round(confidence),
    pageCount: pages.length,
    pages: pages.map((p) => p.result),
    method,
    processingTimeMs: Date.now() - startedAt,
  };
}

/** Lazily created Tesseract worker, shared by every page of one document. */
function workerPool() {
  let worker: Worker | null = null;
  return {
    get: async () =>
      (worker ??= await createWorker("eng", 1, { logger: () => {} })),
    close: async () => {
      if (worker) await worker.terminate();
    },
  };
}

export async function cascadePdf(pdfBuffer: Buffer): Promise<CascadeResult> {
  const startedAt = Date.now();
  const pdfjs = await loadPdfjs();
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(pdfBuffer),
    useSystemFonts: true,
    verbosity: 0,
  }).promise;
  const pool = workerPool();
  const pages: { result: PageOcr; text: string }[] = [];
  try {
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      const textLayer = content.items
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((item: any) => ("str" in item ? item.str : ""))
        .join(" ");
      pages.push(
        await cascadePage(n, textLayer, () => renderPage(page), pool.get)
      );
      page.cleanup();
    }
  } finally {
    await pool.close();
    await doc.destroy();
  }
  return summarize(pages, startedAt);
}

/** Render one page of a PDF to PNG (1-based page number). */
export async function renderPdfPage(
  pdfBuffer: Buffer,
  pageNumber: number
): Promise<Buffer> {
  const pdfjs = await loadPdfjs();
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(pdfBuffer),
    useSystemFonts: true,
    verbosity: 0,
  }).promise;
  try {
    return await renderPage(await doc.getPage(pageNumber));
  } finally {
    await doc.destroy();
  }
}

export async function cascadeImage(image: Buffer): Promise<CascadeResult> {
  const startedAt = Date.now();
  const pool = workerPool();
  try {
    const page = await cascadePage(1, undefined, async () => image, pool.get);
    return summarize([page], startedAt);
  } finally {
    await pool.close();
  }
}
