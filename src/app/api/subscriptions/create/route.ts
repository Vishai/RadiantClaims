import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { STRIPE_CONFIG } from "@/lib/stripe";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify that the user exists in the database
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found. Please log out and log back in.",
          code: "USER_NOT_FOUND",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tier, policyType, policyVersion, ipAddress } = body;

    if (!tier || !["DIY_PREP", "LEGAL_REP"].includes(tier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    // Check if user already has a subscription
    const existingSubscription = await db.serviceSubscription.findUnique({
      where: { userId: session.user.id },
    });

    if (existingSubscription) {
      if (tier === "DIY_PREP") {
        // Record policy acceptance for audit/compliance even on re-attempt
        const policyAcceptance = await db.policyAcceptance.create({
          data: {
            userId: session.user.id,
            policyType: policyType || "TERMS_OF_SERVICE",
            policyVersion: policyVersion || "1.0",
            policyText: "DIY Terms Agreement",
            ipAddress:
              ipAddress || request.headers.get("x-forwarded-for") || "unknown",
            userAgent: request.headers.get("user-agent") || undefined,
          },
        });

        // If the DIY subscription is already active/paid, send them back to the portal
        if (existingSubscription.setupFeePaid) {
          await createAuditLog({
            userId: session.user.id,
            action: "POLICY_ACCEPTED",
            resourceType: "ServiceSubscription",
            resourceId: existingSubscription.id,
            ipAddress: request.headers.get("x-forwarded-for") || "unknown",
            userAgent: request.headers.get("user-agent") || undefined,
            metadata: {
              tier: "DIY_PREP",
              policyAcceptanceId: policyAcceptance.id,
              note: "User re-accepted DIY terms with active subscription",
            },
          });

          return NextResponse.json({
            success: true,
            subscription: existingSubscription,
            redirectTo: "/portal",
            message: "Subscription already active",
          });
        }

        // Ensure we have a Stripe customer for this subscription
        let stripeCustomerId = existingSubscription.stripeCustomerId;

        if (!stripeCustomerId) {
          const customer = await stripe.customers.create({
            email: session.user.email || undefined,
            name: session.user.name || undefined,
            metadata: {
              userId: session.user.id,
              subscriptionId: existingSubscription.id,
            },
          });

          await db.serviceSubscription.update({
            where: { id: existingSubscription.id },
            data: { stripeCustomerId: customer.id },
          });

          stripeCustomerId = customer.id;
        }

        // Create a fresh checkout session so the user can finish payment
        const diySetupPriceId = STRIPE_CONFIG.DIY_SETUP_FEE.priceId;
        const diyMonthlyPriceId = STRIPE_CONFIG.DIY_MONTHLY.priceId;

        if (!diySetupPriceId || !diyMonthlyPriceId) {
          return NextResponse.json(
            {
              error:
                "DIY checkout is temporarily unavailable. Please contact support.",
              code: "DIY_PRICE_NOT_CONFIGURED",
            },
            { status: 503 }
          );
        }

        const checkoutSession = await stripe.checkout.sessions.create({
          customer: stripeCustomerId,
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [
            {
              price: diySetupPriceId,
              quantity: 1,
            },
            {
              price: diyMonthlyPriceId,
              quantity: 1,
            },
          ],
          subscription_data: {
            trial_period_days: 30,
          },
          allow_promotion_codes: true,
          success_url: `${process.env.NEXTAUTH_URL}/portal?payment=success`,
          cancel_url: `${process.env.NEXTAUTH_URL}/service-tiers?payment=canceled`,
          metadata: {
            userId: session.user.id,
            subscriptionId: existingSubscription.id,
            policyAcceptanceId: policyAcceptance.id,
            reusedSubscription: "true",
          },
        });

        await createAuditLog({
          userId: session.user.id,
          action: "SUBSCRIPTION_CREATED",
          resourceType: "ServiceSubscription",
          resourceId: existingSubscription.id,
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          userAgent: request.headers.get("user-agent") || undefined,
          metadata: {
            tier: "DIY_PREP",
            stripeCheckoutSessionId: checkoutSession.id,
            policyAcceptanceId: policyAcceptance.id,
            reusedSubscription: true,
          },
        });

        return NextResponse.json({
          success: true,
          subscription: existingSubscription,
          checkoutUrl: checkoutSession.url,
          message:
            "Existing subscription requires payment. Redirecting to checkout.",
        });
      }

      if (tier === "LEGAL_REP" && existingSubscription.tier === "LEGAL_REP") {
        return NextResponse.json({
          success: true,
          subscription: existingSubscription,
          redirectTo: "/portal",
          message: "Legal representation already active",
        });
      }

      return NextResponse.json(
        {
          error:
            "A subscription already exists. Contact support if you need to change plans.",
        },
        { status: 400 }
      );
    }

    // Create policy acceptance record
    const policyAcceptance = await db.policyAcceptance.create({
      data: {
        userId: session.user.id,
        policyType: policyType || "TERMS_OF_SERVICE",
        policyVersion: policyVersion || "1.0",
        policyText:
          tier === "DIY_PREP"
            ? "DIY Terms Agreement"
            : "Legal Representation Agreement",
        ipAddress:
          ipAddress || request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || undefined,
      },
    });

    if (tier === "LEGAL_REP") {
      // For Legal Rep: Create subscription and Stripe checkout for $14.99/month
      const legalRepMonthlyPriceId = STRIPE_CONFIG.LEGAL_REP_MONTHLY.priceId;

      if (!legalRepMonthlyPriceId) {
        return NextResponse.json(
          {
            error:
              "Legal Rep checkout is temporarily unavailable. Please contact support.",
            code: "LEGAL_REP_PRICE_NOT_CONFIGURED",
          },
          { status: 503 }
        );
      }

      const subscription = await db.serviceSubscription.create({
        data: {
          userId: session.user.id,
          tier: "LEGAL_REP",
          status: "PENDING", // Will be set to ACTIVE by webhook after payment
          setupFeePaid: false, // No setup fee, but need first month payment
          setupFeeAmount: 0,
          monthlyFeeAmount: 14.99,
        },
      });

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: session.user.email || undefined,
        name: session.user.name || undefined,
        metadata: {
          userId: session.user.id,
          subscriptionId: subscription.id,
        },
      });

      // Update subscription with Stripe customer ID
      await db.serviceSubscription.update({
        where: { id: subscription.id },
        data: { stripeCustomerId: customer.id },
      });

      // Create Stripe Checkout Session for monthly subscription only
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customer.id,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: legalRepMonthlyPriceId, quantity: 1 }],
        allow_promotion_codes: true,
        success_url: `${process.env.NEXTAUTH_URL}/portal?payment=success`,
        cancel_url: `${process.env.NEXTAUTH_URL}/service-tiers?payment=canceled`,
        metadata: {
          userId: session.user.id,
          subscriptionId: subscription.id,
          policyAcceptanceId: policyAcceptance.id,
        },
      });

      // Audit log
      await createAuditLog({
        userId: session.user.id,
        action: "SUBSCRIPTION_CREATED",
        resourceType: "ServiceSubscription",
        resourceId: subscription.id,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || undefined,
        metadata: {
          tier: "LEGAL_REP",
          stripeCheckoutSessionId: checkoutSession.id,
          policyAcceptanceId: policyAcceptance.id,
        },
      });

      return NextResponse.json({
        success: true,
        subscription,
        checkoutUrl: checkoutSession.url,
      });
    } else {
      // For DIY: Create subscription and Stripe checkout session
      const diySetupPriceId = STRIPE_CONFIG.DIY_SETUP_FEE.priceId;
      const diyMonthlyPriceId = STRIPE_CONFIG.DIY_MONTHLY.priceId;

      if (!diySetupPriceId || !diyMonthlyPriceId) {
        return NextResponse.json(
          {
            error:
              "DIY checkout is temporarily unavailable. Please contact support.",
            code: "DIY_PRICE_NOT_CONFIGURED",
          },
          { status: 503 }
        );
      }

      const subscription = await db.serviceSubscription.create({
        data: {
          userId: session.user.id,
          tier: "DIY_PREP",
          status: "PENDING", // Changed from ACTIVE - will be set to ACTIVE by webhook
          setupFeePaid: false,
          setupFeeAmount: 149.99,
          monthlyFeeAmount: 24.99,
        },
      });

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: session.user.email || undefined,
        name: session.user.name || undefined,
        metadata: {
          userId: session.user.id,
          subscriptionId: subscription.id,
        },
      });

      // Update subscription with Stripe customer ID
      await db.serviceSubscription.update({
        where: { id: subscription.id },
        data: { stripeCustomerId: customer.id },
      });

      // Create Stripe Checkout Session for setup fee + monthly subscription
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customer.id,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          { price: diySetupPriceId, quantity: 1 },
          { price: diyMonthlyPriceId, quantity: 1 },
        ],
        subscription_data: {
          trial_period_days: 30,
        },
        allow_promotion_codes: true,
        success_url: `${process.env.NEXTAUTH_URL}/portal?payment=success`,
        cancel_url: `${process.env.NEXTAUTH_URL}/service-tiers?payment=canceled`,
        metadata: {
          userId: session.user.id,
          subscriptionId: subscription.id,
          policyAcceptanceId: policyAcceptance.id,
        },
      });

      // Audit log
      await createAuditLog({
        userId: session.user.id,
        action: "SUBSCRIPTION_CREATED",
        resourceType: "ServiceSubscription",
        resourceId: subscription.id,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || undefined,
        metadata: {
          tier: "DIY_PREP",
          stripeCheckoutSessionId: checkoutSession.id,
          policyAcceptanceId: policyAcceptance.id,
        },
      });

      return NextResponse.json({
        success: true,
        subscription,
        checkoutUrl: checkoutSession.url,
      });
    }
  } catch (error) {
    console.error("Error creating subscription:", error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        {
          error: "Payment setup failed. Please verify billing is configured.",
          code: error.code ?? "STRIPE_ERROR",
          details: error.message,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create subscription",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
