import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { stripe, STRIPE_CONFIG } from "@/lib/stripe";
import Stripe from "stripe";
import { getBetaStripeCouponId } from "@/lib/beta-stripe";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Get the base URL from the request (adaptive to current port/host)
    const baseUrl =
      request.headers.get("origin") ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";

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
    const { tier, policyType, policyVersion, ipAddress, paymentPlan } = body;

    // Check if beta discount is available (server-side 30-user cap enforcement)
    const betaCouponId =
      tier === "DIY_PREP" ? await getBetaStripeCouponId() : null;
    const hasBetaDiscount = !!betaCouponId;

    if (!tier || !["DIY_PREP", "LEGAL_REP"].includes(tier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    // Validate payment plan (for DIY tier only)
    const normalizedPaymentPlan =
      paymentPlan === "installment" ? "installment" : "full";
    const isInstallmentPlan =
      tier === "DIY_PREP" && normalizedPaymentPlan === "installment";
    if (
      tier === "DIY_PREP" &&
      paymentPlan &&
      !["full", "installment"].includes(paymentPlan)
    ) {
      return NextResponse.json(
        { error: "Invalid payment plan" },
        { status: 400 }
      );
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
        const diyPriceId = isInstallmentPlan
          ? STRIPE_CONFIG.DIY_PACKET_INSTALLMENT.priceId
          : STRIPE_CONFIG.DIY_PACKET_FULL.priceId;

        if (!diyPriceId) {
          return NextResponse.json(
            {
              error:
                "DIY checkout is temporarily unavailable. Please contact support.",
              code: "DIY_PRICE_NOT_CONFIGURED",
            },
            { status: 503 }
          );
        }

        await db.serviceSubscription.update({
          where: { id: existingSubscription.id },
          data: {
            isInstallmentPlan,
            installmentPaymentCount: 0,
            installmentCompleted: false,
            setupFeePaid: false,
            setupFeeAmount: 499.0,
            monthlyFeeAmount: 0,
          },
        });

        const checkoutSession = await stripe.checkout.sessions.create({
          customer: stripeCustomerId,
          mode: isInstallmentPlan ? "subscription" : "payment",
          payment_method_types: isInstallmentPlan
            ? ["card"] // Subscriptions only support card payments
            : ["card", "klarna", "affirm", "afterpay_clearpay"],
          line_items: [
            {
              price: diyPriceId,
              quantity: 1,
            },
          ],
          ...(isInstallmentPlan && {
            subscription_data: {
              metadata: {
                subscriptionId: existingSubscription.id,
                paymentPlan: "installment",
                maxPayments: "2",
              },
            },
          }),
          // Beta coupon and promo codes are mutually exclusive in Stripe
          ...(betaCouponId
            ? { discounts: [{ coupon: betaCouponId }] }
            : { allow_promotion_codes: true }),
          success_url: `${baseUrl}/portal?payment=success`,
          cancel_url: `${baseUrl}/service-tiers?payment=canceled`,
          metadata: {
            userId: session.user.id,
            subscriptionId: existingSubscription.id,
            policyAcceptanceId: policyAcceptance.id,
            reusedSubscription: "true",
            tier: "DIY_PREP",
            type: isInstallmentPlan
              ? "INSTALLMENT_PAYMENT"
              : "ONE_TIME_PAYMENT",
            paymentPlan: normalizedPaymentPlan,
            betaDiscount: hasBetaDiscount ? "true" : "false",
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
            paymentPlan: normalizedPaymentPlan,
            isInstallmentPlan,
            betaDiscount: hasBetaDiscount,
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
      // LEGAL REP PATH: $0 Upfront, No Stripe Checkout
      // Immediate activation of "subscription" (tracking record)

      const subscription = await db.serviceSubscription.create({
        data: {
          userId: session.user.id,
          tier: "LEGAL_REP",
          status: "ACTIVE", // Active immediately (no payment needed)
          setupFeePaid: true, // Considered paid/waived
          setupFeeAmount: 0, // $0 upfront
          monthlyFeeAmount: 0, // No monthly fee
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
          note: "Strategic Pivot: $0 Upfront Legal Sign-up",
          policyAcceptanceId: policyAcceptance.id,
        },
      });

      return NextResponse.json({
        success: true,
        subscription,
        redirectTo: "/portal",
        message: "Legal representation profile created.",
      });
    } else {
      // DIY PATH: $499.00 One-time OR 2-Payment Installment Plan
      const diyPriceId = isInstallmentPlan
        ? STRIPE_CONFIG.DIY_PACKET_INSTALLMENT.priceId
        : STRIPE_CONFIG.DIY_PACKET_FULL.priceId;

      if (!diyPriceId) {
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
          status: "PENDING",
          setupFeePaid: false,
          setupFeeAmount: 499.0, // $499 Flat Fee (total)
          monthlyFeeAmount: 0,
          isInstallmentPlan,
          installmentPaymentCount: 0,
          installmentCompleted: false,
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

      // Create Stripe Checkout Session
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customer.id,
        mode: isInstallmentPlan ? "subscription" : "payment",
        payment_method_types: isInstallmentPlan
          ? ["card"] // Subscriptions only support card payments
          : ["card", "klarna", "affirm", "afterpay_clearpay"],
        line_items: [{ price: diyPriceId, quantity: 1 }],
        ...(isInstallmentPlan && {
          subscription_data: {
            metadata: {
              subscriptionId: subscription.id,
              maxPayments: "2",
              paymentPlan: "installment",
            },
          },
        }),
        // Beta coupon and promo codes are mutually exclusive in Stripe
        ...(betaCouponId
          ? { discounts: [{ coupon: betaCouponId }] }
          : { allow_promotion_codes: true }),
        success_url: `${baseUrl}/portal?payment=success`,
        cancel_url: `${baseUrl}/service-tiers?payment=canceled`,
        metadata: {
          userId: session.user.id,
          subscriptionId: subscription.id,
          policyAcceptanceId: policyAcceptance.id,
          tier: "DIY_PREP",
          type: isInstallmentPlan ? "INSTALLMENT_PAYMENT" : "ONE_TIME_PAYMENT",
          paymentPlan: normalizedPaymentPlan,
          betaDiscount: hasBetaDiscount ? "true" : "false",
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
          paymentPlan: normalizedPaymentPlan,
          isInstallmentPlan,
          betaDiscount: hasBetaDiscount,
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
