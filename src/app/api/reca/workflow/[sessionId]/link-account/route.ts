import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find the intake session
    const intakeSession = await db.intakeSession.findUnique({
      where: { id: sessionId },
    });

    if (!intakeSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Find the user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if claimant exists for this email
    let claimant = await db.claimant.findFirst({
      where: { email: email.toLowerCase() },
    });

    // If no claimant exists, create one from the session data
    if (!claimant) {
      const formData = intakeSession.recaFormData as any;
      claimant = await db.claimant.create({
        data: {
          userId: user.id,
          email: email.toLowerCase(),
          firstName: formData?.part_1?.firstName || "",
          lastName: formData?.part_1?.lastName || "",
          phone: formData?.part_1?.phone || "",
          dob: formData?.part_1?.dob || new Date().toISOString(),
          address1: formData?.part_1?.address1 || "",
          address2: formData?.part_1?.address2 || "",
          city: formData?.part_1?.city || "",
          county: formData?.part_1?.county || "",
          state: formData?.part_1?.state || "",
          postalCode: formData?.part_1?.postalCode || "",
          claimType: "DOWNWINDER",
        },
      });
    }

    // Link the session to the claimant
    await db.intakeSession.update({
      where: { id: sessionId },
      data: {
        claimantId: claimant.id,
      },
    });

    return NextResponse.json({
      success: true,
      claimantId: claimant.id,
      message: "Session linked to account successfully",
    });
  } catch (error) {
    console.error("Error linking session to account:", error);
    return NextResponse.json(
      {
        error: "Failed to link session to account",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
