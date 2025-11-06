/**
 * Helper Script: Create Pilot Account Promo Code
 *
 * This script quickly generates a pilot account promo code for testing.
 * Pilot accounts get free usage for 1 year.
 *
 * Usage:
 *   npx tsx scripts/create-pilot-account.ts [CODE] [MAX_USES]
 *
 * Examples:
 *   npx tsx scripts/create-pilot-account.ts PILOT2025 10
 *   npx tsx scripts/create-pilot-account.ts DEMO-ABC 1
 */

import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const code = args[0] || `PILOT-${Date.now()}`;
  const maxUses = args[1] ? parseInt(args[1]) : 1;

  console.log(`\n🚀 Creating pilot account promo code...`);
  console.log(`   Code: ${code}`);
  console.log(`   Max Uses: ${maxUses}`);

  // Check if code already exists
  const existing = await prisma.promoCode.findUnique({
    where: { code },
  });

  if (existing) {
    console.error(`\n❌ Error: Promo code "${code}" already exists!`);
    process.exit(1);
  }

  // Create Stripe coupon (100% off for 12 months)
  let stripeCouponId = null;
  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
      });

      const coupon = await stripe.coupons.create({
        percent_off: 100,
        duration: "repeating",
        duration_in_months: 12,
        name: `Pilot Account - ${code}`,
        metadata: {
          promoCode: code,
          type: "PILOT_ACCOUNT",
        },
      });

      stripeCouponId = coupon.id;
      console.log(`   ✓ Stripe coupon created: ${coupon.id}`);
    } catch (error) {
      console.warn(
        `   ⚠ Warning: Could not create Stripe coupon: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      console.warn(`   Continuing without Stripe integration...`);
    }
  } else {
    console.warn(`   ⚠ Warning: STRIPE_SECRET_KEY not found`);
    console.warn(`   Promo code will be created without Stripe integration`);
  }

  // Create promo code in database
  const promoCode = await prisma.promoCode.create({
    data: {
      code,
      type: "PILOT_ACCOUNT",
      description: `Pilot account - Free usage for 12 months`,
      duration: "REPEATING",
      durationInMonths: 12,
      allowedTiers: ["DIY_PREP"], // Default to DIY only
      maxUses,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      stripeCouponId,
      notes: `Created via script on ${new Date().toISOString()}`,
    },
  });

  console.log(`\n✅ Pilot account promo code created successfully!`);
  console.log(`\n📋 Details:`);
  console.log(`   ID: ${promoCode.id}`);
  console.log(`   Code: ${promoCode.code}`);
  console.log(`   Type: ${promoCode.type}`);
  console.log(`   Max Uses: ${promoCode.maxUses || "Unlimited"}`);
  console.log(
    `   Expires: ${promoCode.expiresAt?.toLocaleDateString() || "Never"}`
  );
  console.log(`   Stripe Coupon: ${stripeCouponId || "None"}`);

  console.log(`\n📝 Share this code with pilot users:`);
  console.log(`   ${code}`);
  console.log(
    `\nUsers can apply this code when creating their subscription to get free usage.\n`
  );
}

main()
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
