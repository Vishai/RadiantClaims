/**
 * Helper Script: Create Discount Promo Code
 *
 * This script creates discount promo codes (percentage or fixed amount).
 *
 * Usage:
 *   # Percentage discount
 *   npx tsx scripts/create-discount-code.ts SAVE50 --percent 50 --max-uses 100
 *
 *   # Fixed amount discount
 *   npx tsx scripts/create-discount-code.ts SAVE20 --amount 20 --max-uses 50
 *
 *   # Waive setup fee only
 *   npx tsx scripts/create-discount-code.ts NOSETUP --waive-setup --max-uses 20
 */

import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

const prisma = new PrismaClient();

interface Args {
  code: string;
  percent?: number;
  amount?: number;
  waiveSetup?: boolean;
  maxUses?: number;
  expiresInDays?: number;
  description?: string;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const code = args[0];

  if (!code) {
    console.error("\n❌ Error: Promo code is required as the first argument\n");
    console.log("Usage:");
    console.log("  npx tsx scripts/create-discount-code.ts CODE [options]\n");
    console.log("Options:");
    console.log("  --percent <number>      Percentage discount (0-100)");
    console.log("  --amount <number>       Fixed dollar amount discount");
    console.log("  --waive-setup           Waive setup fee only");
    console.log("  --max-uses <number>     Maximum redemptions (default: 1)");
    console.log("  --expires-in <days>     Expires in N days (default: 365)\n");
    process.exit(1);
  }

  const result: Args = { code, maxUses: 1, expiresInDays: 365 };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--percent" && args[i + 1]) {
      result.percent = parseInt(args[i + 1]);
      i++;
    } else if (arg === "--amount" && args[i + 1]) {
      result.amount = parseFloat(args[i + 1]);
      i++;
    } else if (arg === "--waive-setup") {
      result.waiveSetup = true;
    } else if (arg === "--max-uses" && args[i + 1]) {
      result.maxUses = parseInt(args[i + 1]);
      i++;
    } else if (arg === "--expires-in" && args[i + 1]) {
      result.expiresInDays = parseInt(args[i + 1]);
      i++;
    } else if (arg === "--description" && args[i + 1]) {
      result.description = args[i + 1];
      i++;
    }
  }

  return result;
}

async function main() {
  const args = parseArgs();

  // Validate arguments
  if (!args.percent && !args.amount && !args.waiveSetup) {
    console.error(
      "\n❌ Error: Must specify --percent, --amount, or --waive-setup\n"
    );
    process.exit(1);
  }

  if (
    (args.percent && args.amount) ||
    (args.percent && args.waiveSetup) ||
    (args.amount && args.waiveSetup)
  ) {
    console.error(
      "\n❌ Error: Can only specify one of --percent, --amount, or --waive-setup\n"
    );
    process.exit(1);
  }

  console.log(`\n🎟️  Creating discount promo code...`);
  console.log(`   Code: ${args.code}`);

  if (args.percent) {
    console.log(`   Type: Percentage Discount`);
    console.log(`   Discount: ${args.percent}%`);
  } else if (args.amount) {
    console.log(`   Type: Fixed Amount Discount`);
    console.log(`   Discount: $${args.amount.toFixed(2)}`);
  } else if (args.waiveSetup) {
    console.log(`   Type: Waive Setup Fee`);
  }

  console.log(`   Max Uses: ${args.maxUses}`);
  console.log(`   Expires In: ${args.expiresInDays} days`);

  // Check if code already exists
  const existing = await prisma.promoCode.findUnique({
    where: { code: args.code },
  });

  if (existing) {
    console.error(`\n❌ Error: Promo code "${args.code}" already exists!`);
    process.exit(1);
  }

  // Determine promo code type
  let type: "PERCENT_OFF" | "AMOUNT_OFF" | "WAIVE_SETUP";
  if (args.percent) {
    type = "PERCENT_OFF";
  } else if (args.amount) {
    type = "AMOUNT_OFF";
  } else {
    type = "WAIVE_SETUP";
  }

  // Create Stripe coupon if applicable
  let stripeCouponId = null;
  if (process.env.STRIPE_SECRET_KEY && (args.percent || args.amount)) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
      });

      if (args.percent) {
        const coupon = await stripe.coupons.create({
          percent_off: args.percent,
          duration: "once",
          name: args.code,
          metadata: {
            promoCode: args.code,
            type,
          },
        });
        stripeCouponId = coupon.id;
      } else if (args.amount) {
        const coupon = await stripe.coupons.create({
          amount_off: Math.round(args.amount * 100), // Convert to cents
          currency: "usd",
          duration: "once",
          name: args.code,
          metadata: {
            promoCode: args.code,
            type,
          },
        });
        stripeCouponId = coupon.id;
      }

      console.log(`   ✓ Stripe coupon created: ${stripeCouponId}`);
    } catch (error) {
      console.warn(
        `   ⚠ Warning: Could not create Stripe coupon: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      console.warn(`   Continuing without Stripe integration...`);
    }
  }

  // Calculate expiration date
  const expiresAt = new Date(
    Date.now() + args.expiresInDays! * 24 * 60 * 60 * 1000
  );

  // Create promo code in database
  const promoCode = await prisma.promoCode.create({
    data: {
      code: args.code,
      type,
      description:
        args.description ||
        (args.percent
          ? `${args.percent}% off discount`
          : args.amount
            ? `$${args.amount.toFixed(2)} off discount`
            : "Setup fee waived"),
      percentOff: args.percent,
      amountOff: args.amount,
      duration: "ONCE", // Default to one-time discount
      allowedTiers: ["DIY_PREP"], // Default to DIY only
      maxUses: args.maxUses,
      expiresAt,
      stripeCouponId,
      notes: `Created via script on ${new Date().toISOString()}`,
    },
  });

  console.log(`\n✅ Discount promo code created successfully!`);
  console.log(`\n📋 Details:`);
  console.log(`   ID: ${promoCode.id}`);
  console.log(`   Code: ${promoCode.code}`);
  console.log(`   Type: ${promoCode.type}`);
  console.log(`   Max Uses: ${promoCode.maxUses || "Unlimited"}`);
  console.log(
    `   Expires: ${promoCode.expiresAt?.toLocaleDateString() || "Never"}`
  );
  console.log(`   Stripe Coupon: ${stripeCouponId || "None"}`);

  console.log(`\n📝 Share this code:`);
  console.log(`   ${args.code}`);
  console.log(
    `\nUsers can apply this code at checkout to receive the discount.\n`
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
