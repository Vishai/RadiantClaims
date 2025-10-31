/**
 * Request Refund API Route
 *
 * Handles refund requests for DIY setup fee.
 * Checks eligibility:
 * - Must be within 7 days of payment
 * - Cannot have downloaded the RECA form PDF
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { differenceInDays } from "date-fns";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    // Get user's subscription
    const subscription = await prisma.serviceSubscription.findUnique({
      where: { userId: session.user.id },
      include: {
        payments: {
          where: {
            paymentType: "SETUP_FEE",
            status: "COMPLETED",
          },
          orderBy: { paidAt: "desc" },
        },
        intakeSessions: {
          select: {
            recaFormPdfDownloaded: true,
            recaFormPdfDownloadedAt: true,
          },
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    const setupFeePayment = subscription.payments[0];

    if (!setupFeePayment) {
      return NextResponse.json(
        { error: "No setup fee payment found" },
        { status: 404 }
      );
    }

    if (!setupFeePayment.paidAt) {
      return NextResponse.json(
        { error: "Payment date not found" },
        { status: 400 }
      );
    }

    // Check 7-day window
    const daysSincePurchase = differenceInDays(
      new Date(),
      setupFeePayment.paidAt
    );

    if (daysSincePurchase > 7) {
      return NextResponse.json(
        {
          eligible: false,
          reason:
            "Refund period has expired. Setup fee is non-refundable after 7 days.",
        },
        { status: 400 }
      );
    }

    // Check if PDF was downloaded
    const hasDownloadedPdf = subscription.intakeSessions.some(
      (sess) => sess.recaFormPdfDownloaded === true
    );

    if (hasDownloadedPdf) {
      return NextResponse.json(
        {
          eligible: false,
          reason:
            "Refund is not available because you have already downloaded your completed RECA form PDF. You have received the full service deliverable.",
        },
        { status: 400 }
      );
    }

    // Process refund in Stripe
    if (!setupFeePayment.stripePaymentIntentId) {
      return NextResponse.json(
        { error: "Payment intent ID not found" },
        { status: 400 }
      );
    }

    const refund = await stripe.refunds.create({
      payment_intent: setupFeePayment.stripePaymentIntentId,
      reason: "requested_by_customer",
      metadata: {
        userId: session.user.id,
        subscriptionId: subscription.id,
      },
    });

    // Update payment record
    await prisma.payment.update({
      where: { id: setupFeePayment.id },
      data: {
        status: "REFUNDED",
        refundedAt: new Date(),
        refundReason:
          "Customer requested refund within 7-day period (no PDF downloaded)",
      },
    });

    // Cancel Stripe subscription if it exists
    if (subscription.stripeSubscriptionId) {
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
    }

    // Update subscription status
    await prisma.serviceSubscription.update({
      where: { id: subscription.id },
      data: {
        status: "CANCELED",
        canceledAt: new Date(),
        cancelReason:
          "Refund processed - customer requested within 7-day window",
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "REFUND_PROCESSED",
        resourceType: "Payment",
        resourceId: setupFeePayment.id,
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || undefined,
        metadata: JSON.stringify({
          amount: 149.99,
          refundId: refund.id,
          daysSincePurchase,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      amount: 149.99,
      message:
        "Refund processed successfully. You will receive $149.99 back to your original payment method within 5-10 business days.",
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    return NextResponse.json(
      {
        error: "Failed to process refund",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check refund eligibility
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    // Get user's subscription
    const subscription = await prisma.serviceSubscription.findUnique({
      where: { userId: session.user.id },
      include: {
        payments: {
          where: {
            paymentType: "SETUP_FEE",
            status: "COMPLETED",
          },
          orderBy: { paidAt: "desc" },
        },
        intakeSessions: {
          select: {
            recaFormPdfDownloaded: true,
          },
        },
      },
    });

    if (!subscription) {
      return NextResponse.json({
        eligible: false,
        reason: "No subscription found",
      });
    }

    const setupFeePayment = subscription.payments[0];

    if (!setupFeePayment || !setupFeePayment.paidAt) {
      return NextResponse.json({
        eligible: false,
        reason: "No setup fee payment found",
      });
    }

    // Check 7-day window
    const daysSincePurchase = differenceInDays(
      new Date(),
      setupFeePayment.paidAt
    );

    if (daysSincePurchase > 7) {
      return NextResponse.json({
        eligible: false,
        reason: "Refund period has expired (more than 7 days since purchase)",
        daysSincePurchase,
      });
    }

    // Check if PDF was downloaded
    const hasDownloadedPdf = subscription.intakeSessions.some(
      (sess) => sess.recaFormPdfDownloaded === true
    );

    if (hasDownloadedPdf) {
      return NextResponse.json({
        eligible: false,
        reason: "RECA form PDF has been downloaded",
      });
    }

    // Eligible for refund
    return NextResponse.json({
      eligible: true,
      amount: 149.99,
      daysRemaining: 7 - daysSincePurchase,
      paidAt: setupFeePayment.paidAt,
    });
  } catch (error) {
    console.error("Error checking refund eligibility:", error);
    return NextResponse.json(
      {
        error: "Failed to check refund eligibility",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
