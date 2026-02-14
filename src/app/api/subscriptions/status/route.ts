import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveRecaFormAccess } from "@/lib/reca/form-access";

export const dynamic = "force-dynamic";

/**
 * GET /api/subscriptions/status
 *
 * Returns the current user's service subscription status.
 * Used by the RECA form to determine if user has paid and can access the form.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionId = request.nextUrl.searchParams.get("sessionId");
    let isPortalOwner = false;

    if (sessionId) {
      const intakeSession = await prisma.intakeSession.findUnique({
        where: { id: sessionId },
        select: {
          claimant: {
            select: { userId: true },
          },
        },
      });

      isPortalOwner = intakeSession?.claimant?.userId === session.user.id;
    }

    // Fetch user's subscription
    const subscription = await prisma.serviceSubscription.findUnique({
      where: { userId: session.user.id },
      include: {
        referredToFirm: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // Check if user has any intake session with PDF downloaded
    // This is used for installment plan commitment tracking
    const hasDownloadedPDF = await prisma.intakeSession
      .findFirst({
        where: {
          claimant: {
            userId: session.user.id,
          },
          recaFormPdfDownloaded: true,
        },
        select: {
          id: true,
        },
      })
      .then((result) => !!result);

    // No subscription = needs to select a tier
    if (!subscription) {
      const accessState = resolveRecaFormAccess({
        hasSubscription: false,
        hasPaidAccess: false,
        isPortalOwner,
      });

      return NextResponse.json({
        hasSubscription: false,
        needsToSelectTier: accessState.needsToSelectTier,
        tier: null,
        status: null,
        canAccessForms: accessState.canAccessForms,
        needsPayment: accessState.needsPayment,
      });
    }

    // Legal path users - must have ACTIVE status (after first payment)
    if (subscription.tier === "LEGAL_REP") {
      const baseAccess = subscription.status === "ACTIVE";
      const accessState = resolveRecaFormAccess({
        hasSubscription: true,
        hasPaidAccess: baseAccess,
        isPortalOwner,
      });

      return NextResponse.json({
        hasSubscription: true,
        needsToSelectTier: false,
        tier: "LEGAL_REP",
        status: subscription.status,
        canAccessForms: accessState.canAccessForms,
        needsPayment: accessState.needsPayment,
        referredToFirm: subscription.referredToFirm,
        referredAt: subscription.referredAt,
      });
    }

    // DIY path users - must have ACTIVE status (set by webhook after payment)
    // OR have setupFeePaid flag set (legacy/manual cases)
    // OR have at least one installment payment made
    // SECURITY FIX: Removed 24-hour grace period that allowed access before payment confirmation.
    // Access is now ONLY granted when webhook confirms payment.
    const baseAccess =
      subscription.tier === "DIY_PREP" &&
      (subscription.status === "ACTIVE" ||
        subscription.setupFeePaid === true ||
        (subscription.installmentPaymentCount ?? 0) > 0);

    // DIAGNOSTIC LOGGING for debugging payment issues
    if (subscription.tier === "DIY_PREP" && !baseAccess) {
      console.log(
        "[Subscription Status] DIY user blocked from forms:",
        "User ID:",
        session.user.id,
        "Status:",
        subscription.status,
        "Setup Fee Paid:",
        subscription.setupFeePaid,
        "Installment Payment Count:",
        subscription.installmentPaymentCount
      );
    }

    const accessState = resolveRecaFormAccess({
      hasSubscription: true,
      hasPaidAccess: baseAccess,
      isPortalOwner,
    });

    return NextResponse.json({
      hasSubscription: true,
      needsToSelectTier: false,
      tier: subscription.tier,
      status: subscription.status,
      setupFeePaid: subscription.setupFeePaid,
      setupFeePaidAt: subscription.setupFeePaidAt,
      nextBillingDate: subscription.nextBillingDate,
      canAccessForms: accessState.canAccessForms,
      needsPayment: accessState.needsPayment,
      isInstallmentPlan: subscription.isInstallmentPlan,
      installmentPaymentCount: subscription.installmentPaymentCount,
      hasDownloadedPDF,
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription status" },
      { status: 500 }
    );
  }
}
