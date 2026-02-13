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
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has paid for access (one-time $499 or installment plan)
    const subscription = await db.serviceSubscription.findUnique({
      where: { userId: session.user.id },
      select: {
        tier: true,
        status: true,
        setupFeePaid: true,
        isInstallmentPlan: true,
        installmentPaymentCount: true,
        installmentCompleted: true,
      },
    });

    // User has access if they've paid anything:
    // - Full payment: setupFeePaid = true
    // - Installment plan: installmentPaymentCount > 0
    const hasPaid =
      subscription?.setupFeePaid ||
      (subscription?.installmentPaymentCount ?? 0) > 0;

    // DIAGNOSTIC: Log payment details for debugging
    console.log("[PDF Download] Payment check:", {
      userId: session.user.id,
      hasSub: !!subscription,
      tier: subscription?.tier,
      status: subscription?.status,
      setupFeePaid: subscription?.setupFeePaid,
      isInstallmentPlan: subscription?.isInstallmentPlan,
      installmentPaymentCount: subscription?.installmentPaymentCount,
      installmentCompleted: subscription?.installmentCompleted,
      hasPaid,
      hasAccess: subscription && hasPaid,
    });

    if (!subscription || !hasPaid) {
      return NextResponse.json(
        {
          error:
            "Payment is required to download completed RECA documents. Please complete your payment to access your form.",
          debug: {
            tier: subscription?.tier,
            status: subscription?.status,
            setupFeePaid: subscription?.setupFeePaid,
            installmentPaymentCount: subscription?.installmentPaymentCount,
            hasPaid,
          },
        },
        { status: 403 }
      );
    }

    // Get workflow state from database
    const intakeSession = await db.intakeSession.findUnique({
      where: { id: params.sessionId },
      include: {
        claimant: true,
        uploadedFiles: {
          select: {
            category: true,
            validatedAt: true,
            validation: { select: { status: true } },
          },
        },
      },
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

    const uploadedFiles = (intakeSession as any).uploadedFiles || [];
    const uploadedFilesSummary = uploadedFiles.map((f: any) => ({
      category: f.category,
      validatedAt: f.validatedAt,
      validationStatus: f.validation?.status || null,
    }));

    if (!formData) {
      return NextResponse.json(
        { error: "No form data found" },
        { status: 400 }
      );
    }

    if (request.method === "HEAD") {
      return new NextResponse(null, { status: 200 });
    }

    // Path to the official RECA PDF template
    const officialPdfPath = path.join(
      process.cwd(),
      "public",
      "forms",
      "reca-downwinder-claim-form.pdf"
    );

    // Generate the filled official RECA PDF
    const qaOverlay = request.nextUrl.searchParams.get("qa") === "true";

    const pdfBytes = await fillOfficialRECAPDF({
      formData,
      supportingForms: supportingForms || {},
      sessionId: params.sessionId,
      officialPdfPath,
      uploadedFiles: uploadedFilesSummary,
      qaOverlay,
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
    const filename = `RECA-Downwinder-Form-${params.sessionId}.pdf`;
    const body = Buffer.from(pdfBytes);

    // Include both filename and RFC 5987 filename* for maximum browser compatibility.
    // (Chrome should honor filename, but filename* helps in edge cases.)
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(
          filename
        )}`,
        "Content-Length": body.length.toString(),
        "X-Content-Type-Options": "nosniff",
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
        isInstallmentPlan: true,
        installmentPaymentCount: true,
        installmentCompleted: true,
      },
    });

    // User has access if they've paid anything
    const hasPaid =
      subscription?.setupFeePaid ||
      (subscription?.installmentPaymentCount ?? 0) > 0;

    if (!subscription || !hasPaid) {
      return NextResponse.json(
        {
          error:
            "Payment is required to download completed RECA documents. Please complete your payment to access your form.",
          debug: {
            tier: subscription?.tier,
            setupFeePaid: subscription?.setupFeePaid,
            installmentPaymentCount: subscription?.installmentPaymentCount,
            hasPaid,
          },
        },
        { status: 403 }
      );
    }

    // Get workflow state from database
    const intakeSession = await db.intakeSession.findUnique({
      where: { id: params.sessionId },
      include: {
        claimant: true,
        uploadedFiles: {
          select: {
            category: true,
            validatedAt: true,
            validation: { select: { status: true } },
          },
        },
      },
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

    const uploadedFiles = (intakeSession as any).uploadedFiles || [];
    const uploadedFilesSummary = uploadedFiles.map((f: any) => ({
      category: f.category,
      validatedAt: f.validatedAt,
      validationStatus: f.validation?.status || null,
    }));

    // Path to the official RECA PDF template
    const officialPdfPath = path.join(
      process.cwd(),
      "public",
      "forms",
      "reca-downwinder-claim-form.pdf"
    );

    // Generate both PDFs
    const qaOverlay = request.nextUrl.searchParams.get("qa") === "true";

    const filledFormBytes = await fillOfficialRECAPDF({
      formData,
      supportingForms: supportingForms || {},
      sessionId: params.sessionId,
      officialPdfPath,
      uploadedFiles: uploadedFilesSummary,
      qaOverlay,
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
