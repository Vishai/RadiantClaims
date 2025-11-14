/**
 * RECA PDF Generation API Endpoint
 * Generates a comprehensive PDF package for RECA claims
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateRECAPDF } from "@/lib/reca/pdf-generator";
import { fillOfficialRECAPDF } from "@/lib/reca/pdf-form-filler";
import * as path from "path";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Confirm active subscription before allowing download
    const subscription = await db.serviceSubscription.findUnique({
      where: { userId: session.user.id },
      select: {
        tier: true,
        status: true,
        setupFeePaid: true,
      },
    });

    const isLegalTier =
      subscription?.tier === "LEGAL_REP" && subscription.status !== "CANCELED";
    const isActiveDIY =
      subscription?.tier === "DIY_PREP" &&
      subscription.setupFeePaid === true &&
      subscription.status === "ACTIVE";

    if (!subscription || (!isLegalTier && !isActiveDIY)) {
      return NextResponse.json(
        {
          error:
            "An active RadiantClaims subscription is required to download completed RECA documents.",
        },
        { status: 403 }
      );
    }

    // Get workflow state from database
    const intakeSession = await db.intakeSession.findUnique({
      where: { id: params.sessionId },
      include: { claimant: true },
    });

    if (!intakeSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Verify ownership
    if (intakeSession.claimant?.email !== session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Parse form data
    const formData = intakeSession.recaFormData as any;
    const supportingForms = intakeSession.recaSupportingForms as any;

    if (!formData) {
      return NextResponse.json(
        { error: "No form data found" },
        { status: 400 }
      );
    }

    // Path to the official RECA PDF template
    const officialPdfPath = path.join(
      process.cwd(),
      "public",
      "forms",
      "reca-downwinder-claim-form.pdf"
    );

    // Generate the filled official RECA PDF
    const pdfBytes = await fillOfficialRECAPDF({
      formData,
      supportingForms: supportingForms || {},
      sessionId: params.sessionId,
      officialPdfPath,
    });

    if (!intakeSession.recaFormPdfDownloaded) {
      await db.intakeSession.update({
        where: { id: params.sessionId },
        data: {
          recaFormPdfDownloaded: true,
          recaFormPdfDownloadedAt: new Date(),
        },
      });
    }

    // Return PDF with appropriate headers
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="RECA-Downwinder-Form-${params.sessionId}.pdf"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error generating RECA PDF:", error);
    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Generate complete document package (ZIP file)
 * POST /api/reca/pdf/[sessionId]?package=true
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const generatePackage = searchParams.get("package") === "true";

    if (!generatePackage) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await db.serviceSubscription.findUnique({
      where: { userId: session.user.id },
      select: {
        tier: true,
        status: true,
        setupFeePaid: true,
      },
    });

    const isLegalTier =
      subscription?.tier === "LEGAL_REP" && subscription.status !== "CANCELED";
    const isActiveDIY =
      subscription?.tier === "DIY_PREP" &&
      subscription.setupFeePaid === true &&
      subscription.status === "ACTIVE";

    if (!subscription || (!isLegalTier && !isActiveDIY)) {
      return NextResponse.json(
        {
          error:
            "An active RadiantClaims subscription is required to download completed RECA documents.",
        },
        { status: 403 }
      );
    }

    // Get workflow state from database
    const intakeSession = await db.intakeSession.findUnique({
      where: { id: params.sessionId },
      include: { claimant: true },
    });

    if (!intakeSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Verify ownership
    if (intakeSession.claimant?.email !== session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = intakeSession.recaFormData as any;
    const supportingForms = intakeSession.recaSupportingForms as any;

    // Path to the official RECA PDF template
    const officialPdfPath = path.join(
      process.cwd(),
      "public",
      "forms",
      "reca-downwinder-claim-form.pdf"
    );

    // Generate both PDFs
    const filledFormBytes = await fillOfficialRECAPDF({
      formData,
      supportingForms: supportingForms || {},
      sessionId: params.sessionId,
      officialPdfPath,
    });

    // Also generate data summary for future use (persist once we have storage wired up)
    await generateRECAPDF({
      formData,
      supportingForms: supportingForms || {},
      sessionId: params.sessionId,
    });

    if (!intakeSession.recaFormPdfDownloaded) {
      await db.intakeSession.update({
        where: { id: params.sessionId },
        data: {
          recaFormPdfDownloaded: true,
          recaFormPdfDownloadedAt: new Date(),
        },
      });
    }

    // For now, return the filled official form
    // TODO: In the future, create a ZIP package with both PDFs
    return new NextResponse(Buffer.from(filledFormBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="RECA-Complete-Package-${params.sessionId}.pdf"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error generating RECA package:", error);
    return NextResponse.json(
      {
        error: "Failed to generate package",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
