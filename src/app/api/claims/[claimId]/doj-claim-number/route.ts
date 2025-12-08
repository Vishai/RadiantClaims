import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/claims/[claimId]/doj-claim-number
 * Get the DOJ claim number for a claimant
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { claimId: string } }
) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { claimId: claimantId } = params;

    // Get claimant with lifecycle
    const claimant = await db.claimant.findUnique({
      where: { id: claimantId },
      include: {
        lifecycle: true,
        user: {
          select: { id: true, email: true, role: true },
        },
      },
    });

    if (!claimant) {
      return NextResponse.json(
        { error: "Claimant not found" },
        { status: 404 }
      );
    }

    // Check authorization
    const isOwner = claimant.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    const isAttorney = session.user.role === "ATTORNEY";
    const isStaff =
      session.user.role === "STAFF_REVIEWER" ||
      session.user.role === "SENIOR_REVIEWER";

    if (!isOwner && !isAdmin && !isAttorney && !isStaff) {
      return NextResponse.json(
        { error: "Forbidden - not authorized to view this claim" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      claimantId: claimant.id,
      claimantName: `${claimant.firstName} ${claimant.lastName}`,
      dojClaimNumber: claimant.lifecycle?.dojClaimNumber || null,
      currentMilestone: claimant.lifecycle?.currentMilestone || "NOT_SUBMITTED",
      submittedToDOJAt:
        claimant.lifecycle?.submittedToDOJAt?.toISOString() || null,
      receivedByDOJAt:
        claimant.lifecycle?.receivedByDOJAt?.toISOString() || null,
    });
  } catch (error) {
    console.error("Error fetching DOJ claim number:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch DOJ claim number",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/claims/[claimId]/doj-claim-number
 * Update the DOJ claim number for a claimant
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { claimId: string } }
) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { claimId: claimantId } = params;
    const body = await req.json();
    const { dojClaimNumber, receivedByDOJAt } = body;

    if (!dojClaimNumber || typeof dojClaimNumber !== "string") {
      return NextResponse.json(
        { error: "DOJ claim number is required and must be a string" },
        { status: 400 }
      );
    }

    // Get claimant
    const claimant = await db.claimant.findUnique({
      where: { id: claimantId },
      include: {
        lifecycle: true,
        user: {
          select: { id: true, email: true, role: true },
        },
      },
    });

    if (!claimant) {
      return NextResponse.json(
        { error: "Claimant not found" },
        { status: 404 }
      );
    }

    // Check authorization - only owner, admin, attorney, or staff can update
    const isOwner = claimant.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    const isAttorney = session.user.role === "ATTORNEY";
    const isStaff =
      session.user.role === "STAFF_REVIEWER" ||
      session.user.role === "SENIOR_REVIEWER";

    if (!isOwner && !isAdmin && !isAttorney && !isStaff) {
      return NextResponse.json(
        { error: "Forbidden - not authorized to update this claim" },
        { status: 403 }
      );
    }

    // Check if DOJ claim number already exists for another claimant
    if (claimant.lifecycle) {
      const existingClaim = await db.claimLifecycle.findFirst({
        where: {
          dojClaimNumber: dojClaimNumber.trim(),
          claimantId: { not: claimantId },
        },
        include: {
          claimant: {
            select: { firstName: true, lastName: true },
          },
        },
      });

      if (existingClaim) {
        return NextResponse.json(
          {
            error: "Duplicate DOJ claim number",
            details: `This DOJ claim number is already assigned to ${existingClaim.claimant.firstName} ${existingClaim.claimant.lastName}`,
          },
          { status: 409 }
        );
      }
    }

    // Create or update lifecycle
    let lifecycle;
    if (claimant.lifecycle) {
      // Update existing lifecycle
      lifecycle = await db.claimLifecycle.update({
        where: { claimantId },
        data: {
          dojClaimNumber: dojClaimNumber.trim(),
          receivedByDOJAt: receivedByDOJAt
            ? new Date(receivedByDOJAt)
            : claimant.lifecycle.receivedByDOJAt || new Date(),
          currentMilestone:
            claimant.lifecycle.currentMilestone === "NOT_SUBMITTED" ||
            claimant.lifecycle.currentMilestone === "SUBMITTED_TO_DOJ"
              ? "RECEIVED_BY_DOJ"
              : claimant.lifecycle.currentMilestone,
          currentMilestoneDate:
            claimant.lifecycle.currentMilestone === "NOT_SUBMITTED" ||
            claimant.lifecycle.currentMilestone === "SUBMITTED_TO_DOJ"
              ? new Date()
              : claimant.lifecycle.currentMilestoneDate,
        },
      });
    } else {
      // Create new lifecycle
      lifecycle = await db.claimLifecycle.create({
        data: {
          claimantId,
          dojClaimNumber: dojClaimNumber.trim(),
          receivedByDOJAt: receivedByDOJAt
            ? new Date(receivedByDOJAt)
            : new Date(),
          currentMilestone: "RECEIVED_BY_DOJ",
          currentMilestoneDate: new Date(),
        },
      });
    }

    // Create milestone event
    await db.claimMilestoneEvent.create({
      data: {
        lifecycleId: lifecycle.id,
        milestone: "RECEIVED_BY_DOJ",
        occurredAt: receivedByDOJAt ? new Date(receivedByDOJAt) : new Date(),
        notes: `DOJ Claim Number assigned: ${dojClaimNumber.trim()}`,
        updatedBy: session.user.id,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DOJ_CLAIM_NUMBER_UPDATED",
        resourceType: "ClaimLifecycle",
        resourceId: lifecycle.id,
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        metadata: JSON.stringify({
          claimantId,
          dojClaimNumber: dojClaimNumber.trim(),
          receivedByDOJAt: receivedByDOJAt || null,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      lifecycle: {
        id: lifecycle.id,
        claimantId: lifecycle.claimantId,
        dojClaimNumber: lifecycle.dojClaimNumber,
        currentMilestone: lifecycle.currentMilestone,
        receivedByDOJAt: lifecycle.receivedByDOJAt?.toISOString() || null,
      },
      message: "DOJ claim number updated successfully",
    });
  } catch (error) {
    console.error("Error updating DOJ claim number:", error);
    return NextResponse.json(
      {
        error: "Failed to update DOJ claim number",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/claims/[claimId]/doj-claim-number
 * Remove the DOJ claim number (admin/staff only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { claimId: string } }
) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin or senior staff can delete
    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "SENIOR_REVIEWER"
    ) {
      return NextResponse.json(
        { error: "Forbidden - insufficient permissions" },
        { status: 403 }
      );
    }

    const { claimId: claimantId } = params;

    const lifecycle = await db.claimLifecycle.findUnique({
      where: { claimantId },
    });

    if (!lifecycle || !lifecycle.dojClaimNumber) {
      return NextResponse.json(
        { error: "No DOJ claim number to remove" },
        { status: 404 }
      );
    }

    // Update lifecycle to remove DOJ claim number
    await db.claimLifecycle.update({
      where: { claimantId },
      data: {
        dojClaimNumber: null,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DOJ_CLAIM_NUMBER_REMOVED",
        resourceType: "ClaimLifecycle",
        resourceId: lifecycle.id,
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        metadata: JSON.stringify({
          claimantId,
          removedDojClaimNumber: lifecycle.dojClaimNumber,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "DOJ claim number removed successfully",
    });
  } catch (error) {
    console.error("Error removing DOJ claim number:", error);
    return NextResponse.json(
      {
        error: "Failed to remove DOJ claim number",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
