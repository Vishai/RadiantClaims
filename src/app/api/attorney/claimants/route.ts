import { NextRequest, NextResponse } from "next/server";
import {
  getAccessibleClaimants,
  requirePermission,
} from "@/lib/auth/permissions";
import { logClaimantAccess, getClientIp, getUserAgent } from "@/lib/audit";
import { ClaimantWorkflowStatus } from "@prisma/client";

/**
 * GET /api/attorney/claimants
 * Fetch claimants accessible to the current attorney
 * Implements multi-tenant isolation and audit logging
 */
export async function GET(req: NextRequest) {
  try {
    // Require authentication and permission
    const { user } = await requirePermission("claimant:view");

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") as ClaimantWorkflowStatus | null;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Get claimants with multi-tenant filtering
    let claimants = await getAccessibleClaimants();

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      claimants = claimants.filter(
        (c) =>
          c.firstName.toLowerCase().includes(searchLower) ||
          c.lastName.toLowerCase().includes(searchLower) ||
          c.email.toLowerCase().includes(searchLower) ||
          c.state.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter if provided
    if (status && claimants.length > 0) {
      claimants = claimants.filter((c) => {
        const assignment = (c as any).firmAssignments?.[0];
        return assignment?.status === status;
      });
    }

    // Apply pagination
    const total = claimants.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const paginatedClaimants = claimants.slice(skip, skip + limit);

    // Audit log the access
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    await logClaimantAccess(
      user.id,
      "bulk_list",
      "CLAIMANT_VIEWED",
      ipAddress,
      userAgent,
      {
        count: paginatedClaimants.length,
        filters: { search, status },
      }
    );

    // Transform data for response
    const responseData = paginatedClaimants.map((claimant) => {
      const assignment = (claimant as any).firmAssignments?.[0];
      const intakeSession = claimant.intakeSession;
      const subscription = intakeSession?.serviceSubscription as any;
      const promoCode = subscription?.promoCode;

      const complimentaryReason = (() => {
        if (!subscription) return null;
        if (subscription.setupFeeWaived) return "Setup fee waived";
        if (subscription.isPilotAccount) return "Pilot / courtesy account";
        if (subscription.discountPercent === 100)
          return "100% discount applied";
        if (
          subscription.discountAmount &&
          subscription.setupFeeAmount &&
          subscription.discountAmount >= subscription.setupFeeAmount
        ) {
          return "Discount covered full setup fee";
        }
        if (promoCode?.code) {
          return `Promo: ${promoCode.code}`;
        }
        return null;
      })();

      return {
        id: claimant.id,
        firstName: claimant.firstName,
        lastName: claimant.lastName,
        email: claimant.email,
        phone: claimant.phone,
        state: claimant.state,
        county: claimant.county,
        createdAt: claimant.createdAt,
        updatedAt: claimant.updatedAt,
        workflowStatus: assignment?.status || "INTAKE",
        assignedAt: assignment?.assignedAt,
        documentCount: intakeSession?.uploadedFiles?.length || 0,
        hasCompletedIntake: intakeSession?.status === "SUBMITTED",
        claimType: intakeSession?.claimType,
        isPremiumService: intakeSession?.isPremiumService || false,
        subscription: subscription
          ? {
              tier: subscription.tier,
              status: subscription.status,
              setupFeePaid: subscription.setupFeePaid,
              setupFeePaidAt: subscription.setupFeePaidAt,
              setupFeeWaived: subscription.setupFeeWaived,
              setupFeeAmount: subscription.setupFeeAmount,
              monthlyFeeAmount: subscription.monthlyFeeAmount,
              discountPercent: subscription.discountPercent,
              discountAmount: subscription.discountAmount,
              isPilotAccount: subscription.isPilotAccount,
              promoCode: promoCode?.code || null,
              promoName: promoCode?.name || null,
              promoCampaign: promoCode?.campaignName || null,
              complimentaryReason,
              isComplimentary: Boolean(complimentaryReason),
            }
          : null,
      };
    });

    return NextResponse.json({
      claimants: responseData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      user: {
        id: user.id,
        role: user.role,
        firmId: user.firmId,
      },
    });
  } catch (error) {
    console.error("[Attorney API] Failed to fetch claimants:", error);

    // Return appropriate error based on error type
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch claimants" },
      { status: 500 }
    );
  }
}
