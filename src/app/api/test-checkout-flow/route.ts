import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_CONFIG } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tier = searchParams.get("tier") || "DIY_PREP";

    if (!["DIY_PREP", "LEGAL_REP"].includes(tier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    // Create a test customer
    const testCustomer = await stripe.customers.create({
      email: `test-${Date.now()}@example.com`,
      name: "Test User",
      metadata: {
        test: "true",
        tier,
      },
    });

    let checkoutSession;
    let lineItemsConfig;

    if (tier === "DIY_PREP") {
      // DIY Path Test
      const diySetupPriceId = STRIPE_CONFIG.DIY_SETUP_FEE.priceId;
      const diyMonthlyPriceId = STRIPE_CONFIG.DIY_MONTHLY_FIRST_CLAIM.priceId;

      if (!diySetupPriceId || !diyMonthlyPriceId) {
        return NextResponse.json(
          { error: "DIY prices not configured" },
          { status: 503 }
        );
      }

      lineItemsConfig = [
        {
          name: "DIY Setup Fee",
          priceId: diySetupPriceId,
          expected: "$149.99 (one-time)",
        },
        {
          name: "DIY Monthly First Claim",
          priceId: diyMonthlyPriceId,
          expected: "$24.99/month",
        },
      ];

      checkoutSession = await stripe.checkout.sessions.create({
        customer: testCustomer.id,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          { price: diySetupPriceId, quantity: 1 },
          { price: diyMonthlyPriceId, quantity: 1 },
        ],
        subscription_data: {
          trial_period_days: 30,
          metadata: {
            test: "true",
            tier: "DIY_PREP",
          },
        },
        allow_promotion_codes: true,
        success_url: `${process.env.NEXTAUTH_URL}/test-success`,
        cancel_url: `${process.env.NEXTAUTH_URL}/test-cancel`,
        metadata: {
          test: "true",
          tier: "DIY_PREP",
        },
      });
    } else {
      // LEGAL_REP Path Test
      const legalSetupPriceId = STRIPE_CONFIG.LEGAL_SETUP_FEE.priceId;
      const legalMonthlyPriceId = STRIPE_CONFIG.LEGAL_MONTHLY_PER_CLAIM.priceId; // $24.99/mo

      if (!legalSetupPriceId || !legalMonthlyPriceId) {
        return NextResponse.json(
          { error: "Legal prices not configured" },
          { status: 503 }
        );
      }

      lineItemsConfig = [
        {
          name: "Legal Setup Fee",
          priceId: legalSetupPriceId,
          expected: "$89.99 (one-time)",
        },
        {
          name: "Legal Monthly",
          priceId: legalMonthlyPriceId,
          expected: "$24.99/month",
        },
      ];

      checkoutSession = await stripe.checkout.sessions.create({
        customer: testCustomer.id,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          { price: legalSetupPriceId, quantity: 1 },
          { price: legalMonthlyPriceId, quantity: 1 },
        ],
        subscription_data: {
          trial_period_days: 30, // Free first month
          metadata: {
            test: "true",
            tier: "LEGAL_REP",
          },
        },
        allow_promotion_codes: true,
        success_url: `${process.env.NEXTAUTH_URL}/test-success`,
        cancel_url: `${process.env.NEXTAUTH_URL}/test-cancel`,
        metadata: {
          test: "true",
          tier: "LEGAL_REP",
        },
      });
    }

    // Retrieve the full session to get line items
    const fullSession = await stripe.checkout.sessions.retrieve(
      checkoutSession.id,
      {
        expand: ["line_items", "line_items.data.price"],
      }
    );

    // Parse line items
    const lineItems = fullSession.line_items?.data.map((item: any) => {
      const price = item.price;
      return {
        description: item.description,
        amount: price.unit_amount,
        amountFormatted: `$${(price.unit_amount || 0) / 100}`,
        currency: price.currency,
        type: price.type,
        recurring: price.recurring
          ? {
              interval: price.recurring.interval,
              interval_count: price.recurring.interval_count,
            }
          : null,
        quantity: item.quantity,
      };
    });

    // Verify line items match expectations
    const verification = lineItemsConfig.map((expected, index) => {
      const actual = lineItems?.[index];
      return {
        expected: expected.expected,
        actual: actual
          ? `${actual.amountFormatted}${actual.type === "recurring" && actual.recurring ? "/" + actual.recurring.interval : " (one-time)"}`
          : "NOT FOUND",
        priceId: expected.priceId,
        matches: !!actual,
      };
    });

    const allMatched = verification.every((v) => v.matches);

    // Clean up test customer (optional - comment out if you want to inspect in Stripe)
    // await stripe.customers.del(testCustomer.id);

    return NextResponse.json({
      success: allMatched,
      tier,
      testCustomerId: testCustomer.id,
      checkoutSessionId: checkoutSession.id,
      checkoutUrl: checkoutSession.url,
      lineItems,
      verification,
      note: "Test customer created but not deleted. You can inspect it in Stripe Dashboard or delete it manually.",
    });
  } catch (error) {
    console.error("Checkout flow test error:", error);
    return NextResponse.json(
      {
        error: "Failed to test checkout flow",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
