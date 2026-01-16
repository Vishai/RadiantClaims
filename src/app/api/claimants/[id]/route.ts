import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const claimant = await db.claimant.findUnique({
      where: { id: params.id },
      include: {
        referral: true,
        documents: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!claimant) {
      return NextResponse.json(
        { error: "Claimant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(claimant);
  } catch (error) {
    console.error("Failed to fetch claimant:", error);
    return NextResponse.json(
      { error: "Failed to fetch claimant" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify claimant belongs to user
    const claimant = await db.claimant.findUnique({
      where: { id: params.id },
      include: {
        claimSubscription: true,
        intakeSession: true,
      },
    });

    if (!claimant) {
      return NextResponse.json(
        { error: "Claimant not found" },
        { status: 404 }
      );
    }

    if (claimant.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to delete this claim" },
        { status: 403 }
      );
    }

    // Delete related data first (cascade should handle most, but be explicit)
    // Delete claim subscription if exists
    if (claimant.claimSubscription) {
      await db.claimSubscription.delete({
        where: { id: claimant.claimSubscription.id },
      });
    }

    // Delete intake session if exists
    if (claimant.intakeSession) {
      await db.intakeSession.delete({
        where: { id: claimant.intakeSession.id },
      });
    }

    // Delete the claimant
    await db.claimant.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "Claim deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete claimant:", error);
    return NextResponse.json(
      {
        error: "Failed to delete claim",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
