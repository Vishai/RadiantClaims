import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendClientDocumentFollowUpEmail } from "@/lib/email";
import type { DocumentReminder } from "@/emails/client/document-follow-up";

/**
 * POST /api/cron/document-follow-up
 *
 * Cron job that checks for sessions with low document upload counts
 * after 3+ days and sends follow-up emails to encourage uploads.
 *
 * Schedule: Daily at 10 AM EST (via Vercel Cron or external scheduler)
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const results = {
      emailsSent: 0,
      errors: [] as string[],
    };

    // Find sessions created 3+ days ago with fewer than 3 uploaded documents
    // and where the claimant has an email address
    const sessions = await prisma.intakeSession.findMany({
      where: {
        createdAt: { lte: threeDaysAgo },
        status: { in: ["DRAFT", "IN_PROGRESS"] },
        claimant: {
          email: { not: "" },
        },
      },
      include: {
        claimant: {
          select: { email: true, firstName: true, lastName: true },
        },
        uploadedFiles: {
          select: { id: true, category: true, status: true },
        },
      },
      take: 100,
    });

    for (const session of sessions) {
      if (!session.claimant?.email) continue;

      const uploadedCount = session.uploadedFiles.length;

      // Only send if fewer than 3 documents uploaded
      if (uploadedCount >= 3) continue;

      // Build document reminders based on what's missing
      const uploadedCategories = new Set(
        session.uploadedFiles.map((f) => f.category)
      );

      const documents: DocumentReminder[] = [];

      if (!uploadedCategories.has("PROOF_OF_RESIDENCE")) {
        documents.push({
          name: "Proof of Residence",
          description:
            "Document showing you lived in an affected area during the exposure period",
          status: "missing",
        });
      }
      if (
        !uploadedCategories.has("MEDICAL_RECORDS") &&
        !uploadedCategories.has("PATHOLOGY_REPORT")
      ) {
        documents.push({
          name: "Medical Records",
          description: "Medical records confirming your qualifying condition",
          status: "missing",
        });
      }
      if (!uploadedCategories.has("IDENTITY")) {
        documents.push({
          name: "Photo ID",
          description: "Government-issued identification document",
          status: "missing",
        });
      }

      // Skip if all key documents are already uploaded
      if (documents.length === 0) continue;

      // Calculate progress
      const totalExpected = 5; // rough estimate of typical docs needed
      const progressPercent = Math.round((uploadedCount / totalExpected) * 100);

      try {
        await sendClientDocumentFollowUpEmail({
          to: session.claimant.email,
          claimantName: `${session.claimant.firstName} ${session.claimant.lastName}`,
          progressPercent,
          documents,
          cadenceLabel: "Weekly check-in",
        });

        results.emailsSent++;
        console.log(
          `Sent document follow-up for session ${session.id} to ${session.claimant.email}`
        );
      } catch (error) {
        const errorMsg = `Failed to send document follow-up for session ${session.id}: ${error}`;
        console.error(errorMsg);
        results.errors.push(errorMsg);
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      processedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Error in document follow-up cron:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
