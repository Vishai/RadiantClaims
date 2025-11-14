/**
 * POST /api/subscriptions/upgrade-to-legal
 *
 * Upgrades a DIY subscription to Legal Representation.
 * - Cancels the DIY Stripe subscription
 * - Updates tier to LEGAL_REP
 * - Optionally assigns to a law firm (e.g., Heritage Law)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's subscription
    const subscription = await prisma.serviceSubscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    if (subscription.tier === "LEGAL_REP") {
      return NextResponse.json(
        { error: "You are already on the Legal Representation plan" },
        { status: 400 }
      );
    }

    if (subscription.status === "CANCELED") {
      return NextResponse.json(
        { error: "Cannot upgrade a canceled subscription" },
        { status: 400 }
      );
    }

    // Cancel existing Stripe subscription if exists
    if (subscription.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId, {
          prorate: true, // Provide prorated credit
        });
      } catch (stripeError) {
        console.error("Error canceling Stripe subscription:", stripeError);
        // Continue with upgrade even if Stripe cancellation fails
      }
    }

    // Find Heritage Law or default law firm
    // For now, we'll just update the tier without assigning a firm
    // In production, you'd want to implement firm assignment logic
    const heritageLaw = await prisma.lawFirm.findFirst({
      where: {
        OR: [
          { slug: "heritage-law" },
          { name: { contains: "Heritage Law", mode: "insensitive" } },
        ],
        status: "ACTIVE",
      },
    });

    // Update subscription to LEGAL_REP tier
    const updatedSubscription = await prisma.serviceSubscription.update({
      where: { id: subscription.id },
      data: {
        tier: "LEGAL_REP",
        status: "ACTIVE",
        referredToFirmId: heritageLaw?.id || null,
        referredAt: heritageLaw ? new Date() : null,
        // Clear DIY-specific fields
        stripeSubscriptionId: null,
        nextBillingDate: null,
        lastBillingDate: null,
      },
    });

    // If user has claimants, assign them to the law firm
    if (heritageLaw) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { claimants: true },
      });

      if (user?.claimants && user.claimants.length > 0) {
        // Create assignments for each claimant
        await Promise.all(
          user.claimants.map((claimant) =>
            prisma.claimantAssignment.upsert({
              where: {
                claimantId_firmId: {
                  claimantId: claimant.id,
                  firmId: heritageLaw.id,
                },
              },
              create: {
                claimantId: claimant.id,
                firmId: heritageLaw.id,
                status: "INTAKE",
                assignedBy: session.user.id,
              },
              update: {
                status: "INTAKE",
              },
            })
          )
        );
      }
    }

    // Record acceptance of Legal Representation Agreement (Terms of Service)
    await prisma.policyAcceptance.create({
      data: {
        userId: session.user.id,
        firmId: heritageLaw?.id || null,
        policyType: "TERMS_OF_SERVICE",
        policyVersion: "1.0",
        policyText:
          "Legal Representation Agreement - Contingency Fee Agreement accepted upon upgrade to Legal Representation tier. Full agreement text provided to user at time of acceptance.",
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || undefined,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "SUBSCRIPTION_UPGRADED",
        resourceType: "ServiceSubscription",
        resourceId: subscription.id,
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || undefined,
        metadata: JSON.stringify({
          fromTier: "DIY_PREP",
          toTier: "LEGAL_REP",
          firmAssigned: heritageLaw?.name || null,
          legalAgreementAccepted: true,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: heritageLaw
        ? `You've been successfully upgraded to Legal Representation. You've been connected with ${heritageLaw.name}.`
        : "You've been successfully upgraded to Legal Representation. A law firm will be assigned to you shortly.",
      subscription: updatedSubscription,
    });
  } catch (error) {
    console.error("Error upgrading subscription:", error);
    return NextResponse.json(
      {
        error: "Failed to upgrade subscription",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
