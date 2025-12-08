/**
 * Test Stripe Price IDs Configuration
 * Verifies that all price IDs exist in Stripe and have correct amounts
 */

import { stripe, STRIPE_CONFIG } from "../src/lib/stripe";

async function testStripePrices() {
  console.log("\n========================================");
  console.log("Testing Stripe Price Configuration");
  console.log("========================================\n");

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

  let allPassed = true;

  for (const test of tests) {
    try {
      console.log(`\nTesting: ${test.name}`);
      console.log(`  Price ID: ${test.config.priceId || "(not set)"}`);

      if (!test.config.priceId) {
        console.log(`  ❌ FAIL: Price ID not configured`);
        allPassed = false;
        continue;
      }

      const price = await stripe.prices.retrieve(test.config.priceId);

      console.log(`  Product: ${price.product}`);
      console.log(`  Amount: $${(price.unit_amount || 0) / 100}`);
      console.log(`  Type: ${price.type}`);
      console.log(`  Currency: ${price.currency}`);

      if (price.type === "recurring") {
        console.log(
          `  Interval: ${price.recurring?.interval} (${price.recurring?.interval_count})`
        );
      }

      // Verify amount
      if (price.unit_amount !== test.expectedAmount) {
        console.log(
          `  ❌ FAIL: Expected amount $${test.expectedAmount / 100}, got $${(price.unit_amount || 0) / 100}`
        );
        allPassed = false;
      } else {
        console.log(`  ✅ Amount correct`);
      }

      // Verify type
      if (price.type !== test.expectedType) {
        console.log(
          `  ❌ FAIL: Expected type ${test.expectedType}, got ${price.type}`
        );
        allPassed = false;
      } else {
        console.log(`  ✅ Type correct`);
      }
    } catch (error) {
      console.log(`  ❌ FAIL: Error retrieving price`);
      if (error instanceof Error) {
        console.log(`  Error: ${error.message}`);
      }
      allPassed = false;
    }
  }

  console.log("\n========================================");
  if (allPassed) {
    console.log("✅ All price tests passed!");
  } else {
    console.log("❌ Some price tests failed");
    process.exit(1);
  }
  console.log("========================================\n");
}

testStripePrices().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
