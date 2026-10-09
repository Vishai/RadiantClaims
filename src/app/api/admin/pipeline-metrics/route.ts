import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  OCR_TIERS,
  type PageOcr,
} from "@/lib/document-intelligence/ocr-cascade";

export const dynamic = "force-dynamic";

/** Paid cascade tiers, per page. */
const TIER_COST_PER_PAGE: Record<string, number> = {
  "google-vision": 0.0015,
  "aws-textract": 0.0015,
};

const BUCKETS = [0, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0001];

function histogram(values: number[]) {
  return BUCKETS.slice(0, -1).map((lo, i) => {
    const hi = BUCKETS[i + 1] ?? 1;
    return {
      label: `${Math.round(lo * 100)}–${Math.min(100, Math.round(hi * 100))}%`,
      count: values.filter((v) => v >= lo && v < hi).length,
    };
  });
}

/**
 * GET /api/admin/pipeline-metrics?days=30
 * What the document pipeline is doing: which OCR tier each page lands on (the
 * cost), the OCR and extraction confidence distributions, and how many filings
 * end up in staff review.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const days = Math.min(
    365,
    Math.max(1, Number(request.nextUrl.searchParams.get("days")) || 30)
  );
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const files = await prisma.uploadedFile.findMany({
    where: { processedAt: { gte: since } },
    select: { metadata: true, intakeSessionId: true },
  });
  const pages: PageOcr[] = [];
  let legacyFiles = 0;
  for (const f of files) {
    try {
      const meta = f.metadata ? JSON.parse(f.metadata) : {};
      if (Array.isArray(meta.ocrPages))
        pages.push(...(meta.ocrPages as PageOcr[]));
      else legacyFiles++;
    } catch {
      legacyFiles++;
    }
  }
  const tierMix = [...OCR_TIERS, "none" as const].map((tier) => ({
    tier,
    pages: pages.filter((p) => p.tier === tier).length,
  }));
  const ocrCost = pages.reduce(
    (sum, p) =>
      sum +
      p.attempts.reduce((s, a) => s + (TIER_COST_PER_PAGE[a.tier] ?? 0), 0),
    0
  );

  const validations = await prisma.documentValidation.findMany({
    where: { processingCompletedAt: { gte: since } },
    select: {
      status: true,
      overallConfidence: true,
      warnings: true,
      uploadedFile: { select: { intakeSessionId: true } },
    },
  });
  const filings = new Map<string, boolean>();
  for (const v of validations) {
    const id = v.uploadedFile.intakeSessionId;
    filings.set(id, (filings.get(id) ?? false) || v.status === "NEEDS_REVIEW");
  }
  const reviewReasons: Record<string, number> = {};
  for (const v of validations.filter((x) => x.status === "NEEDS_REVIEW")) {
    for (const w of v.warnings as { code?: string }[]) {
      if (w?.code) reviewReasons[w.code] = (reviewReasons[w.code] ?? 0) + 1;
    }
  }
  const filingsInReview = Array.from(filings.values()).filter(Boolean).length;

  return NextResponse.json({
    days,
    documents: files.length,
    legacyDocuments: legacyFiles,
    pages: pages.length,
    tierMix,
    escalatedPages: pages.filter((p) => p.attempts.length > 1).length,
    ocrCostUsd: Math.round(ocrCost * 10000) / 10000,
    ocrConfidence: histogram(
      pages.filter((p) => p.tier !== "none").map((p) => p.confidence)
    ),
    extractionConfidence: histogram(
      validations
        .map((v) => v.overallConfidence)
        .filter((c): c is number => typeof c === "number")
    ),
    review: {
      filings: filings.size,
      filingsInReview,
      filingShare: filings.size ? filingsInReview / filings.size : 0,
      documents: validations.length,
      documentsInReview: validations.filter((v) => v.status === "NEEDS_REVIEW")
        .length,
      reasons: reviewReasons,
    },
  });
}
