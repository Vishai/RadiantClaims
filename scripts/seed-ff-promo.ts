/**
 * Seed: Friends & Family 100% Discount Code
 *
 * Creates a "RADIANTFF" promo code that gives 100% off, limited to 10 uses.
 * Run with: npx tsx scripts/seed-ff-promo.ts
 *
 * Safe to re-run — will skip if the code already exists.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FF_CODE = "RADIANTFF";

async function main() {
  const existing = await prisma.promoCode.findUnique({
    where: { code: FF_CODE },
  });

  if (existing) {
    console.log(`Promo code "${FF_CODE}" already exists (id: ${existing.id})`);
    console.log(`  Active: ${existing.isActive}`);
    console.log(`  Uses: ${existing.currentUses}/${existing.maxUses}`);
    return;
  }

  const promo = await prisma.promoCode.create({
    data: {
      code: FF_CODE,
      type: "PERCENT_OFF",
      description:
        "Friends & Family — 100% off for early supporters. Limited to 10 uses.",
      percentOff: 100,
      duration: "ONCE",
      maxUses: 10,
      currentUses: 0,
      isActive: true,
      allowedTiers: [], // All tiers allowed
      campaignName: "friends-and-family",
      notes: "Created for beta launch. 100% discount, 10 redemptions max.",
    },
  });

  console.log(`Created promo code "${FF_CODE}"`);
  console.log(`  ID: ${promo.id}`);
  console.log(`  Discount: 100% off`);
  console.log(`  Max uses: 10`);
  console.log(`  Campaign: friends-and-family`);
  console.log(`\nNote: A Stripe coupon will be auto-created on first use.`);
}

main()
  .catch((e) => {
    console.error("Error seeding F&F promo code:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
