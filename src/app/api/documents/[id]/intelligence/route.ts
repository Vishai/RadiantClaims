import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type {
  EntityExtractionResult,
  RECAComplianceResult,
  RiskAnalysisResult,
  DocumentQualification,
} from "@/lib/document-intelligence/schemas";
import type { OtherDocumentAnalysis } from "@/lib/document-intelligence/other-document-analyzer";

export interface IntelligenceResponse {
  ocrConfidence: number;
  textLength: number;
  entities: EntityExtractionResult;
  compliance: RECAComplianceResult;
  risks: RiskAnalysisResult;
  quality?: {
    qualityScore: number;
    isBlurry: boolean;
    isLowContrast: boolean;
  };
  aiCategorization?: {
    suggestedCategory: string;
    confidence: number;
    reasoning: string;
    alternatives?: Array<{ category: string; confidence: number }>;
  };
  qualification?: DocumentQualification;
  otherDocumentAnalysis?: OtherDocumentAnalysis | null;
  categoryInsights?: {
    userSelectedCategory?: string;
    aiCategorization?: {
      suggestedCategory: string;
      confidence: number;
      reasoning?: string;
      alternatives?: Array<{ category: string; confidence: number }>;
    };
    heuristicReason?: string;
    heuristicSignals?: string[];
    finalCategory?: string;
    autoCorrected?: boolean;
    autoCorrectionSource?: string;
    categoryLocked?: boolean;
  };
  tags: Array<{ tag: string; confidence?: number }>;
  metadata: {
    processingTimeMs?: number;
    entitiesExtractedAt?: string;
    complianceCheckedAt?: string;
    risksAnalyzedAt?: string;
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Fetch document with tags
    const file = await db.uploadedFile.findUnique({
      where: { id },
      include: {
        tags: {
          select: {
            tag: true,
            confidence: true,
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Check if document has been processed
    if (file.status !== "READY") {
      return NextResponse.json(
        { error: "Document is still processing" },
        { status: 400 }
      );
    }

    // Parse metadata (Prisma returns JSON fields as strings)
    let metadata: any = null;
    if (file.metadata) {
      metadata =
        typeof file.metadata === "string"
          ? JSON.parse(file.metadata)
          : file.metadata;
    }

    if (!metadata) {
      return NextResponse.json(
        { error: "No intelligence data available for this document" },
        { status: 404 }
      );
    }

    // Check if intelligence has been run
    if (!metadata.entities || !metadata.compliance || !metadata.risks) {
      return NextResponse.json(
        {
          error:
            "Document has not been fully analyzed yet. Please try again shortly.",
        },
        { status: 404 }
      );
    }

    // Build response
    const response: IntelligenceResponse = {
      ocrConfidence: metadata.ocrConfidence || 0,
      textLength: metadata.textLength || 0,
      entities: metadata.entities,
      compliance: metadata.compliance,
      risks: metadata.risks,
      quality: metadata.qualityMetrics,
      aiCategorization: metadata.aiCategorization,
      qualification:
        metadata.documentQualification ||
        metadata.compliance?.documentQualification,
      otherDocumentAnalysis: metadata.otherDocumentAnalysis ?? null,
      categoryInsights: metadata.categoryInsights,
      tags: file.tags.map((t) => ({
        tag: t.tag,
        confidence: t.confidence ?? undefined,
      })),
      metadata: {
        processingTimeMs: metadata.processingTimeMs,
        entitiesExtractedAt: metadata.entitiesExtractedAt,
        complianceCheckedAt: metadata.complianceCheckedAt,
        risksAnalyzedAt: metadata.risksAnalyzedAt,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching intelligence data:", error);
    return NextResponse.json(
      { error: "Failed to fetch intelligence data" },
      { status: 500 }
    );
  }
}
