import { NextResponse } from "next/server";
import { stripe, STRIPE_CONFIG } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tests = [
      {
        name: "DIY Setup Fee",
        config: STRIPE_CONFIG.DIY_SETUP_FEE,
        expectedAmount: 14999,
        expectedType: "one_time",
      },
      {
        name: "DIY Monthly First Claim",
        config: STRIPE_CONFIG.DIY_MONTHLY_FIRST_CLAIM,
        expectedAmount: 2499,
        expectedType: "recurring",
      },
      {
        name: "DIY Monthly Additional",
        config: STRIPE_CONFIG.DIY_MONTHLY_ADDITIONAL,
        expectedAmount: 1499,
        expectedType: "recurring",
      },
      {
        name: "Legal Setup Fee",
        config: STRIPE_CONFIG.LEGAL_SETUP_FEE,
        expectedAmount: 8999,
        expectedType: "one_time",
      },
      {
        name: "Legal Monthly Per Claim",
        config: STRIPE_CONFIG.LEGAL_MONTHLY_PER_CLAIM,
        expectedAmount: 2499,
        expectedType: "recurring",
      },
    ];

    const results = [];

    for (const test of tests) {
      const result: any = {
        name: test.name,
        priceId: test.config.priceId || null,
        configured: !!test.config.priceId,
      };

      if (test.config.priceId) {
        try {
          const price = await stripe.prices.retrieve(test.config.priceId);
          result.stripeData = {
            amount: price.unit_amount,
            amountFormatted: `$${(price.unit_amount || 0) / 100}`,
            type: price.type,
            currency: price.currency,
            recurring: price.recurring
              ? {
                  interval: price.recurring.interval,
                  interval_count: price.recurring.interval_count,
                }
              : null,
          };
          result.amountMatches = price.unit_amount === test.expectedAmount;
          result.typeMatches = price.type === test.expectedType;
          result.valid = result.amountMatches && result.typeMatches;
        } catch (error) {
          result.error =
            error instanceof Error ? error.message : "Unknown error";
          result.valid = false;
        }
      } else {
        result.valid = false;
        result.error = "Price ID not configured in environment";
      }

      results.push(result);
    }

    const allValid = results.every((r) => r.valid);

    return NextResponse.json({
      success: allValid,
      results,
      summary: {
        total: results.length,
        valid: results.filter((r) => r.valid).length,
        invalid: results.filter((r) => !r.valid).length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to test Stripe configuration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
