/**
 * Create Lifetime Free Access Code (100% off forever, no payment required)
 *
 * This script creates a promo code that:
 * - Gives 100% off FOREVER (not just 12 months)
 * - Bypasses Stripe payment collection entirely
 * - Perfect for friends, advisors, beta testers you trust
 *
 * Usage:
 *   npx tsx scripts/create-lifetime-free-code.ts IKNOWBRANDON 5
 *   npx tsx scripts/create-lifetime-free-code.ts VIP-FRIEND 1
 */

import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const code = args[0] || `LIFETIME-${Date.now()}`;
  const maxUses = args[1] ? parseInt(args[1]) : 1;

  console.log(`\n🎁 Creating lifetime free access code...`);
  console.log(`   Code: ${code}`);
  console.log(`   Max Uses: ${maxUses}`);
  console.log(`   Duration: FOREVER (100% off for life)`);

  // Check if code already exists
  const existing = await prisma.promoCode.findUnique({
    where: { code },
  });

  if (existing) {
    console.error(`\n❌ Error: Promo code "${code}" already exists!`);
    process.exit(1);
  }

  // Create Stripe coupon (100% off FOREVER)
  let stripeCouponId = null;
  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
      });

      const coupon = await stripe.coupons.create({
        percent_off: 100,
        duration: "forever", // Lifetime discount in Stripe
        name: `Lifetime Free - ${code}`,
        metadata: {
          promoCode: code,
          type: "LIFETIME_FREE",
        },
      });

      stripeCouponId = coupon.id;
      console.log(
        `   ✓ Stripe coupon created: ${coupon.id} (100% off forever)`
      );
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
      type: "PILOT_ACCOUNT", // Reuse pilot type for free accounts
      description: `Lifetime free access - 100% off forever`,
      duration: "FOREVER", // Lifetime discount
      durationInMonths: null, // Not applicable for FOREVER
      allowedTiers: ["DIY_PREP"], // Default to DIY only
      maxUses,
      expiresAt: null, // Never expires
      stripeCouponId,
      notes: `Created via lifetime-free script on ${new Date().toISOString()}. For friends, advisors, and VIP beta testers.`,
    },
  });

  console.log(`\n✅ Lifetime free access code created successfully!`);
  console.log(`\n📋 Details:`);
  console.log(`   ID: ${promoCode.id}`);
  console.log(`   Code: ${promoCode.code}`);
  console.log(`   Type: ${promoCode.type}`);
  console.log(`   Duration: FOREVER (100% off for life)`);
  console.log(`   Max Uses: ${promoCode.maxUses || "Unlimited"}`);
  console.log(`   Expires: Never`);
  console.log(`   Stripe Coupon: ${stripeCouponId || "None"}`);

  console.log(`\n📝 Share this code with your VIP users:`);
  console.log(`   ${code}`);
  console.log(`\n⚠️  Note: This code gives LIFETIME free access.`);
  console.log(
    `   Users will still need to provide payment details during Stripe checkout.`
  );
  console.log(
    `   However, they will NEVER be charged (100% off applied forever).`
  );
  console.log(
    `\n💡 To bypass payment collection entirely, see create-no-payment-account.ts\n`
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
