import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPresignedGetUrl } from "@/lib/r2";

export const dynamic = "force-dynamic";

// Maps file categories to DOJ portal tab names
const CATEGORY_TO_DOJ_TAB: Record<string, string> = {
  IDENTITY: "Identification Documentation",
  BIRTH_CERTIFICATE: "Identification Documentation",
  MARRIAGE_CERTIFICATE: "Identification Documentation",
  UTILITY_BILL: "Proof of Presence",
  SCHOOL_RECORDS: "Proof of Presence",
  EMPLOYMENT_RECORDS: "Proof of Presence",
  TAX_RETURN: "Proof of Presence",
  LDS_CHURCH_RECORDS: "Proof of Presence",
  PROOF_OF_RESIDENCE: "Proof of Presence",
  CHURCH_RECORDS: "Proof of Presence",
  MORTGAGE_STATEMENT: "Proof of Presence",
  PROPERTY_RECORDS: "Proof of Presence",
  VOTING_RECORDS: "Proof of Presence",
  CENSUS_RECORDS: "Proof of Presence",
  PATHOLOGY_REPORT: "Compensable and Proof of Disease",
  MEDICAL_RECORDS: "Compensable and Proof of Disease",
  DISCHARGE_SUMMARY: "Compensable and Proof of Disease",
  TREATMENT_RECORDS: "Compensable and Proof of Disease",
  DEATH_CERTIFICATE: "Compensable and Proof of Disease",
};

function corsHeaders(origin?: string | null) {
  // Chrome extensions with host_permissions bypass CORS, but add headers defensively
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
  if (origin?.startsWith("chrome-extension://")) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}

/**
 * GET /api/portal/extension-data?claimId=xxx
 * Returns claim data formatted for the Chrome extension
 */
export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  try {
    const session = await getServerAuthSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers }
      );
    }

    const claimId = req.nextUrl.searchParams.get("claimId");
    if (!claimId) {
      return NextResponse.json(
        { error: "claimId is required" },
        { status: 400, headers }
      );
    }

    // Get user
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || session.user.id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers }
      );
    }

    // Get claimant and verify ownership
    const claimant = await db.claimant.findUnique({
      where: { id: claimId },
      include: {
        intakeSession: {
          include: {
            uploadedFiles: {
              where: {
                status: { notIn: ["FAILED", "REJECTED"] },
              },
            },
          },
        },
      },
    });

    if (!claimant) {
      return NextResponse.json(
        { error: "Claim not found" },
        { status: 404, headers }
      );
    }

    if (claimant.userId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403, headers }
      );
    }

    const intakeSession = claimant.intakeSession;
    if (!intakeSession) {
      return NextResponse.json(
        { error: "No intake session found for this claim" },
        { status: 404, headers }
      );
    }

    // Build documents with signed download URLs
    const documents = await Promise.all(
      (intakeSession.uploadedFiles || []).map(async (f) => {
        let downloadUrl: string | null = null;
        try {
          downloadUrl = await getPresignedGetUrl(f.fileKey, 3600);
        } catch (e) {
          console.error(`Failed to generate signed URL for ${f.fileKey}:`, e);
        }

        return {
          id: f.id,
          filename: f.originalFilename,
          category: f.category || "OTHER",
          dojTab: CATEGORY_TO_DOJ_TAB[f.category || ""] || "Other",
          downloadUrl,
        };
      })
    );

    // Parse form data from intake session
    const formData =
      typeof intakeSession.recaFormData === "string"
        ? JSON.parse(intakeSession.recaFormData)
        : intakeSession.recaFormData || {};

    const responseBody = {
      version: 1,
      exportedAt: new Date().toISOString(),
      sessionId: intakeSession.id,
      claimant: {
        name: `${claimant.firstName} ${claimant.lastName}`,
        claimType: claimant.claimType || "downwinder",
      },
      answers: formData,
      documents,
    };

    return NextResponse.json(responseBody, { headers });
  } catch (error) {
    console.error("[Extension Data API] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch extension data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers }
    );
  }
}
