import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/subscriptions/status
 *
 * Returns the current user's service subscription status.
 * Used by the RECA form to determine if user has paid and can access the form.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json({
        hasSubscription: false,
        needsToSelectTier: true,
        tier: null,
        status: null,
        canAccessForms: false,
      });
    }

    // Legal path users - must have ACTIVE status (after first payment)
    if (subscription.tier === "LEGAL_REP") {
      const canAccessForms = subscription.status === "ACTIVE";

      return NextResponse.json({
        hasSubscription: true,
        needsToSelectTier: false,
        tier: "LEGAL_REP",
        status: subscription.status,
        canAccessForms,
        needsPayment: !canAccessForms,
        referredToFirm: subscription.referredToFirm,
        referredAt: subscription.referredAt,
      });
    }

    // DIY path users - must have ACTIVE status (set by webhook after payment)
    // OR have setupFeePaid flag set (legacy/manual cases)
    // FIX: Also check if subscription was created recently and has Stripe customer ID
    // This handles race condition where user returns from Stripe before webhook processes
    // Using 24 hours for development testing (webhooks not configured locally)
    // In production with webhooks, this serves as a backup for very fast users
    const hasRecentStripeCheckout =
      subscription.stripeCustomerId &&
      subscription.createdAt &&
      Date.now() - new Date(subscription.createdAt).getTime() <
        24 * 60 * 60 * 1000; // 24 hours

    const canAccessForms =
      subscription.tier === "DIY_PREP" &&
      (subscription.status === "ACTIVE" ||
        subscription.setupFeePaid === true ||
        hasRecentStripeCheckout);

    // DIAGNOSTIC LOGGING for debugging payment issues
    if (subscription.tier === "DIY_PREP" && !canAccessForms) {
      console.log(
        "[Subscription Status] DIY user blocked from forms:",
        "User ID:",
        session.user.id,
        "Status:",
        subscription.status,
        "Setup Fee Paid:",
        subscription.setupFeePaid,
        "Stripe Customer ID:",
        subscription.stripeCustomerId,
        "Created At:",
        subscription.createdAt,
        "Has Recent Checkout:",
        hasRecentStripeCheckout
      );
    } else if (subscription.tier === "DIY_PREP" && hasRecentStripeCheckout) {
      console.log(
        "[Subscription Status] DIY user granted access via recent checkout:",
        "User ID:",
        session.user.id,
        "Waiting for webhook to confirm payment"
      );
    }

    return NextResponse.json({
      hasSubscription: true,
      needsToSelectTier: false,
      tier: subscription.tier,
      status: subscription.status,
      setupFeePaid: subscription.setupFeePaid,
      setupFeePaidAt: subscription.setupFeePaidAt,
      nextBillingDate: subscription.nextBillingDate,
      canAccessForms,
      needsPayment: !canAccessForms,
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
