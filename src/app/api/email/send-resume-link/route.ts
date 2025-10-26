import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendResumeLinkEmail } from "@/lib/email";
import { z } from "zod";

const sendResumeLinkSchema = z.object({
  email: z.string().email("Invalid email address"),
  resumeToken: z.string().min(1, "Resume token is required"),
});

/**
 * POST /api/email/send-resume-link
 * Send a resume link email to the user
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = sendResumeLinkSchema.parse(body);

    // Find the intake session by token
    const session = await db.intakeSession.findUnique({
      where: { resumeToken: validated.resumeToken },
      include: {
        claimant: true,
        uploadedFiles: {
          where: { status: "READY" },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Invalid resume token" },
        { status: 404 }
      );
    }

    // Check if session has expired
    if (session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Resume link has expired" },
        { status: 400 }
      );
    }

    // Verify email matches
    if (session.claimant?.email !== validated.email) {
      return NextResponse.json(
        { error: "Email does not match session" },
        { status: 403 }
      );
    }

    // Get claimant name
    const name = session.claimant
      ? `${session.claimant.firstName} ${session.claimant.lastName}`
      : "User";

    // Get current step name
    const stepNames: Record<string, string> = {
      SCREENING: "Initial Screening",
      IDENTITY: "Identity Verification",
      RESIDENCE: "Proof of Residence",
      MEDICAL: "Medical Documentation",
      ADDITIONAL: "Additional Documents",
      CONSENT: "Consent & Signature",
      REVIEW: "Final Review",
    };
    const currentStep = stepNames[session.currentStep] || "Document Upload";

    // Send the email
    await sendResumeLinkEmail({
      to: validated.email,
      name,
      resumeToken: validated.resumeToken,
      currentStep,
      uploadedDocuments: session.uploadedFiles.length,
      expiresAt: session.expiresAt,
    });

    // Update last activity
    await db.intakeSession.update({
      where: { id: session.id },
      data: { lastActivityAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "Resume link sent successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Failed to send resume link:", error);
    return NextResponse.json(
      {
        error: "Failed to send resume link",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
