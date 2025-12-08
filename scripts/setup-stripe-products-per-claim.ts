/**
 * Stripe Products Setup Script - Per-Claim Pricing
 *
 * This script creates the required Stripe products and prices for RadiantClaims:
 *
 * DIY Path (per claim):
 * 1. Setup Fee: $149.99 (includes first month)
 * 2. First Claim Monthly: $24.99/mo (starting month 2)
 * 3. Additional Claim Monthly: $14.99/mo (each additional claim)
 *
 * Lawyer Path (per claim):
 * 4. Setup Fee: $89.99 (refundable on DOJ claim receipt)
 * 5. Monthly per Claim: $24.99/mo (no discount for additional claims)
 *
 * Usage:
 *   npx tsx scripts/setup-stripe-products-per-claim.ts
 *
 * This will:
 * - Create products in your Stripe account (test mode)
 * - Output the price IDs to add to your .env file
 */

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
});

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log("\n" + "=".repeat(60));
  log(title, "cyan");
  console.log("=".repeat(60) + "\n");
}

// DIY Products
async function createDIYSetupFeeProduct() {
  logSection("Creating DIY Setup Fee Product");

  const product = await stripe.products.create({
    name: "RadiantClaims DIY - Setup Fee per Claim",
    description:
      "One-time setup fee per claim (includes first month of service)",
    metadata: {
      service_tier: "DIY_PREP",
      charge_type: "setup_fee",
      pricing_version: "per_claim_v1",
    },
  });

  log(`✓ Product created: ${product.id}`, "green");

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 14999, // $149.99
    currency: "usd",
    nickname: "DIY Setup Fee (per claim)",
    metadata: {
      service_tier: "DIY_PREP",
      charge_type: "setup_fee",
    },
  });

  log(`✓ Price created: ${price.id}`, "green");
  log(`  Amount: $${(price.unit_amount || 0) / 100}`, "blue");

  return { product, price };
}

async function createDIYFirstClaimMonthlyProduct() {
  logSection("Creating DIY First Claim Monthly Product");

  const product = await stripe.products.create({
    name: "RadiantClaims DIY - First Claim Monthly",
    description: "Monthly fee for first claim (starting month 2)",
    metadata: {
      service_tier: "DIY_PREP",
      charge_type: "monthly_first_claim",
      pricing_version: "per_claim_v1",
    },
  });

  log(`✓ Product created: ${product.id}`, "green");

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 2499, // $24.99
    currency: "usd",
    recurring: {
      interval: "month",
    },
    nickname: "DIY First Claim Monthly",
    metadata: {
      service_tier: "DIY_PREP",
      charge_type: "monthly_first_claim",
    },
  });

  log(`✓ Price created: ${price.id}`, "green");
  log(`  Amount: $${(price.unit_amount || 0) / 100}/month`, "blue");

  return { product, price };
}

async function createDIYAdditionalClaimMonthlyProduct() {
  logSection("Creating DIY Additional Claim Monthly Product");

  const product = await stripe.products.create({
    name: "RadiantClaims DIY - Additional Claim Monthly",
    description: "Monthly fee for each additional claim (discounted)",
    metadata: {
      service_tier: "DIY_PREP",
      charge_type: "monthly_additional_claim",
      pricing_version: "per_claim_v1",
    },
  });

  log(`✓ Product created: ${product.id}`, "green");

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 1499, // $14.99
    currency: "usd",
    recurring: {
      interval: "month",
    },
    nickname: "DIY Additional Claim Monthly",
    metadata: {
      service_tier: "DIY_PREP",
      charge_type: "monthly_additional_claim",
    },
  });

  log(`✓ Price created: ${price.id}`, "green");
  log(`  Amount: $${(price.unit_amount || 0) / 100}/month`, "blue");

  return { product, price };
}

// Lawyer Products
async function createLegalSetupFeeProduct() {
  logSection("Creating Legal Path Setup Fee Product");

  const product = await stripe.products.create({
    name: "RadiantClaims Legal - Setup Fee per Claim",
    description:
      "Refundable setup fee per claim (refunded on DOJ claim receipt)",
    metadata: {
      service_tier: "LEGAL_REP",
      charge_type: "setup_fee",
      refundable: "true",
      pricing_version: "per_claim_v1",
    },
  });

  log(`✓ Product created: ${product.id}`, "green");

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 8999, // $89.99
    currency: "usd",
    nickname: "Legal Setup Fee (per claim, refundable)",
    metadata: {
      service_tier: "LEGAL_REP",
      charge_type: "setup_fee",
      refundable: "true",
    },
  });

  log(`✓ Price created: ${price.id}`, "green");
  log(`  Amount: $${(price.unit_amount || 0) / 100} (refundable)`, "blue");

  return { product, price };
}

async function createLegalMonthlyPerClaimProduct() {
  logSection("Creating Legal Path Monthly per Claim Product");

  const product = await stripe.products.create({
    name: "RadiantClaims Legal - Monthly per Claim",
    description: "Monthly fee per claim (no discount for additional claims)",
    metadata: {
      service_tier: "LEGAL_REP",
      charge_type: "monthly_per_claim",
      pricing_version: "per_claim_v1",
    },
  });

  log(`✓ Product created: ${product.id}`, "green");

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 2499, // $24.99
    currency: "usd",
    recurring: {
      interval: "month",
    },
    nickname: "Legal Monthly per Claim",
    metadata: {
      service_tier: "LEGAL_REP",
      charge_type: "monthly_per_claim",
    },
  });

  log(`✓ Price created: ${price.id}`, "green");
  log(`  Amount: $${(price.unit_amount || 0) / 100}/month`, "blue");

  return { product, price };
}

async function displayConfiguration(prices: {
  diySetup: Stripe.Price;
  diyFirstMonthly: Stripe.Price;
  diyAdditionalMonthly: Stripe.Price;
  legalSetup: Stripe.Price;
  legalMonthly: Stripe.Price;
}) {
  logSection("Configuration Complete!");

  log("Add these to your .env file:", "bold");
  log("", "reset");
  log(`STRIPE_PRICE_ID_DIY_SETUP=${prices.diySetup.id}`, "green");
  log(
    `STRIPE_PRICE_ID_DIY_MONTHLY_FIRST=${prices.diyFirstMonthly.id}`,
    "green"
  );
  log(
    `STRIPE_PRICE_ID_DIY_MONTHLY_ADDITIONAL=${prices.diyAdditionalMonthly.id}`,
    "green"
  );
  log(`STRIPE_PRICE_ID_LEGAL_SETUP=${prices.legalSetup.id}`, "green");
  log(
    `STRIPE_PRICE_ID_LEGAL_MONTHLY_PER_CLAIM=${prices.legalMonthly.id}`,
    "green"
  );

  log("\nPricing Summary:", "bold");
  log("\nDIY Path (per claim):", "cyan");
  log(
    `  Setup: $${(prices.diySetup.unit_amount || 0) / 100} (includes month 1)`,
    "blue"
  );
  log(
    `  First Claim Monthly: $${(prices.diyFirstMonthly.unit_amount || 0) / 100}/mo`,
    "blue"
  );
  log(
    `  Additional Claims: $${(prices.diyAdditionalMonthly.unit_amount || 0) / 100}/mo each`,
    "blue"
  );

  log("\nLegal Path (per claim):", "cyan");
  log(
    `  Setup: $${(prices.legalSetup.unit_amount || 0) / 100} (refundable)`,
    "blue"
  );
  log(
    `  Monthly per Claim: $${(prices.legalMonthly.unit_amount || 0) / 100}/mo (no discount)`,
    "blue"
  );

  log("\nExample Monthly Pricing:", "bold");
  log("\nDIY with 3 claims:", "cyan");
  log(`  Setup: 3 × $149.99 = $449.97 (first month)`, "blue");
  log(`  Monthly (from month 2): $24.99 + $14.99 + $14.99 = $54.97/mo`, "blue");

  log("\nLegal with 3 claims:", "cyan");
  log(`  Setup: 3 × $89.99 = $269.97 (refundable)`, "blue");
  log(`  Monthly: 3 × $24.99 = $74.97/mo`, "blue");

  const dashboardUrl = prices.diySetup.id.startsWith("price_test_")
    ? "https://dashboard.stripe.com/test/products"
    : "https://dashboard.stripe.com/products";

  log("\nView in Stripe Dashboard:", "bold");
  log(dashboardUrl, "cyan");
}

async function main() {
  try {
    log(
      "\n🎨 RadiantClaims Stripe Products Setup - Per-Claim Pricing\n",
      "cyan"
    );

    if (!process.env.STRIPE_SECRET_KEY) {
      log(
        "✗ ERROR: STRIPE_SECRET_KEY not found in environment variables",
        "red"
      );
      log("  Please set STRIPE_SECRET_KEY in your .env file", "yellow");
      process.exit(1);
    }

    const isTestMode = process.env.STRIPE_SECRET_KEY.startsWith("sk_test_");
    log(`Mode: ${isTestMode ? "TEST" : "LIVE"}`, isTestMode ? "green" : "red");

    if (!isTestMode) {
      log("\n⚠️  WARNING: You are using LIVE mode Stripe keys!", "red");
      log("This will create REAL products in your LIVE Stripe account.", "red");
      log(
        "Press Ctrl+C to cancel, or wait 10 seconds to continue...",
        "yellow"
      );

      await new Promise((resolve) => setTimeout(resolve, 10000));
    }

    // Create all products
    const { price: diySetup } = await createDIYSetupFeeProduct();
    const { price: diyFirstMonthly } =
      await createDIYFirstClaimMonthlyProduct();
    const { price: diyAdditionalMonthly } =
      await createDIYAdditionalClaimMonthlyProduct();
    const { price: legalSetup } = await createLegalSetupFeeProduct();
    const { price: legalMonthly } = await createLegalMonthlyPerClaimProduct();

    // Display configuration
    await displayConfiguration({
      diySetup,
      diyFirstMonthly,
      diyAdditionalMonthly,
      legalSetup,
      legalMonthly,
    });

    logSection("Next Steps");

    log("1. Update your .env file with the price IDs above", "blue");
    log("2. Restart your development server", "blue");
    log("3. Run database migration: npx prisma migrate dev", "blue");
    log("4. Test the new per-claim pricing flow", "blue");

    log("\n✓ Setup complete!", "green");
  } catch (error) {
    log(`\n✗ ERROR: ${error}`, "red");
    console.error(error);
    process.exit(1);
  }
}

// Run the setup
main();
