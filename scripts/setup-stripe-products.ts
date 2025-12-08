/**
 * Stripe Products Setup Script
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
 *   npx tsx scripts/setup-stripe-products.ts
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

async function createSetupFeeProduct() {
  logSection("Creating DIY Setup Fee Product");

  log("Creating product...", "blue");

  // Create product
  const product = await stripe.products.create({
    name: "RadiantClaims DIY Document Preparation - Setup Fee",
    description: "One-time setup fee for DIY document preparation service",
    metadata: {
      service_tier: "DIY_PREP",
      charge_type: "setup_fee",
    },
  });

  log(`✓ Product created: ${product.id}`, "green");
  log(`  Name: ${product.name}`, "blue");

  // Create one-time price
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 14999, // $149.99
    currency: "usd",
    nickname: "DIY Setup Fee",
    metadata: {
      service_tier: "DIY_PREP",
      charge_type: "setup_fee",
    },
  });

  log(`✓ Price created: ${price.id}`, "green");
  log(`  Amount: $${(price.unit_amount || 0) / 100}`, "blue");
  log(`  Type: ${price.type}`, "blue");

  return { product, price };
}

async function createMonthlySubscriptionProduct() {
  logSection("Creating DIY Monthly Subscription Product");

  log("Creating product...", "blue");

  // Create product
  const product = await stripe.products.create({
    name: "RadiantClaims DIY Document Preparation - Monthly",
    description: "Monthly subscription for DIY document preparation service",
    metadata: {
      service_tier: "DIY_PREP",
      charge_type: "monthly_fee",
    },
  });

  log(`✓ Product created: ${product.id}`, "green");
  log(`  Name: ${product.name}`, "blue");

  // Create recurring monthly price
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 2499, // $24.99
    currency: "usd",
    recurring: {
      interval: "month",
    },
    nickname: "DIY Monthly Subscription",
    metadata: {
      service_tier: "DIY_PREP",
      charge_type: "monthly_fee",
    },
  });

  log(`✓ Price created: ${price.id}`, "green");
  log(`  Amount: $${(price.unit_amount || 0) / 100}`, "blue");
  log(`  Type: ${price.type}`, "blue");
  log(`  Interval: ${price.recurring?.interval}`, "blue");

  return { product, price };
}

async function displayConfiguration(
  setupPrice: Stripe.Price,
  monthlyPrice: Stripe.Price
) {
  logSection("Configuration Complete!");

  log("Add these to your .env file:", "bold");
  log("", "reset");
  log(`STRIPE_PRICE_ID_DIY_SETUP=${setupPrice.id}`, "green");
  log(`STRIPE_PRICE_ID_DIY_MONTHLY=${monthlyPrice.id}`, "green");

  log("\nOr update them using:", "blue");
  log(
    `echo "STRIPE_PRICE_ID_DIY_SETUP=${setupPrice.id}" >> .env.local`,
    "cyan"
  );
  log(
    `echo "STRIPE_PRICE_ID_DIY_MONTHLY=${monthlyPrice.id}" >> .env.local`,
    "cyan"
  );

  log("\nProduct Details:", "bold");
  log("", "reset");
  log("Setup Fee:", "cyan");
  log(`  Product ID: ${setupPrice.product}`, "blue");
  log(`  Price ID: ${setupPrice.id}`, "blue");
  log(`  Amount: $${(setupPrice.unit_amount || 0) / 100}`, "blue");
  log(`  Type: ${setupPrice.type}`, "blue");

  log("\nMonthly Subscription:", "cyan");
  log(`  Product ID: ${monthlyPrice.product}`, "blue");
  log(`  Price ID: ${monthlyPrice.id}`, "blue");
  log(`  Amount: $${(monthlyPrice.unit_amount || 0) / 100}`, "blue");
  log(`  Type: ${monthlyPrice.type}`, "blue");
  log(`  Interval: ${monthlyPrice.recurring?.interval}`, "blue");

  log("\nView in Stripe Dashboard:", "bold");
  const dashboardUrl = setupPrice.id.startsWith("price_test_")
    ? "https://dashboard.stripe.com/test/products"
    : "https://dashboard.stripe.com/products";
  log(dashboardUrl, "cyan");
}

async function checkExistingProducts() {
  logSection("Checking for Existing Products");

  const products = await stripe.products.list({
    limit: 100,
  });

  const existingSetup = products.data.find(
    (p) =>
      p.metadata?.service_tier === "DIY_PREP" &&
      p.metadata?.charge_type === "setup_fee"
  );

  const existingMonthly = products.data.find(
    (p) =>
      p.metadata?.service_tier === "DIY_PREP" &&
      p.metadata?.charge_type === "monthly_fee"
  );

  if (existingSetup) {
    log(`⚠️  Found existing setup fee product: ${existingSetup.id}`, "yellow");
    log(`   Name: ${existingSetup.name}`, "blue");

    // Get price
    const prices = await stripe.prices.list({
      product: existingSetup.id,
      limit: 1,
    });

    if (prices.data.length > 0) {
      log(`   Price ID: ${prices.data[0].id}`, "blue");
      log(`   Amount: $${(prices.data[0].unit_amount || 0) / 100}`, "blue");
    }
  }

  if (existingMonthly) {
    log(
      `⚠️  Found existing monthly subscription product: ${existingMonthly.id}`,
      "yellow"
    );
    log(`   Name: ${existingMonthly.name}`, "blue");

    // Get price
    const prices = await stripe.prices.list({
      product: existingMonthly.id,
      limit: 1,
    });

    if (prices.data.length > 0) {
      log(`   Price ID: ${prices.data[0].id}`, "blue");
      log(
        `   Amount: $${(prices.data[0].unit_amount || 0) / 100}/${prices.data[0].recurring?.interval}`,
        "blue"
      );
    }
  }

  if (existingSetup && existingMonthly) {
    log("\n⚠️  Products already exist!", "yellow");
    log(
      "Would you like to create new ones anyway? (they won't conflict)",
      "yellow"
    );
    log("Press Ctrl+C to cancel, or wait 5 seconds to continue...", "yellow");

    await new Promise((resolve) => setTimeout(resolve, 5000));
    log("Continuing...\n", "green");
  }

  return { existingSetup, existingMonthly };
}

async function main() {
  try {
    log("\n🎨 RadiantClaims Stripe Products Setup\n", "cyan");

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

    // Check for existing products
    await checkExistingProducts();

    // Create products
    const { price: setupPrice } = await createSetupFeeProduct();
    const { price: monthlyPrice } = await createMonthlySubscriptionProduct();

    // Display configuration
    await displayConfiguration(setupPrice, monthlyPrice);

    logSection("Next Steps");

    log("1. Update your .env file with the price IDs above", "blue");
    log("2. Restart your development server", "blue");
    log(
      "3. Run the payment flow test: npx tsx scripts/test-payment-flow.ts",
      "blue"
    );
    log("4. Test the checkout flow in your browser", "blue");

    log("\n✓ Setup complete!", "green");
  } catch (error) {
    log(`\n✗ ERROR: ${error}`, "red");
    console.error(error);
    process.exit(1);
  }
}

// Run the setup
main();
