/**
 * Enable IKNOWBRANDON for Access Override + Free Service
 *
 * This script updates an existing promo code in your PRODUCTION database
 * to enable both:
 * 1. Access override (bypass registration lock)
 * 2. Lifetime free service (100% off forever)
 *
 * Run this against your production database to lock down the site
 * and only allow invite-only access.
 *
 * Usage:
 *   # For production (use production DATABASE_URL)
 *   DATABASE_URL="your-production-db-url" npx tsx scripts/enable-access-and-free-service.ts IKNOWBRANDON 10
 *
 *   # For local testing
 *   npx tsx scripts/enable-access-and-free-service.ts IKNOWBRANDON 10
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const code = args[0];
  const seats = args[1] ? parseInt(args[1]) : 10;

  if (!code) {
    console.error("Please provide a promo code.");
    console.log(
      "Usage: npx tsx scripts/enable-access-and-free-service.ts CODE [SEATS]"
    );
    console.log("\nExamples:");
    console.log(
      "  npx tsx scripts/enable-access-and-free-service.ts IKNOWBRANDON 10"
    );
    console.log(
      "  npx tsx scripts/enable-access-and-free-service.ts BETA-2025 50"
    );
    process.exit(1);
  }

  console.log(`\n🔐 Enabling access override for: ${code}`);
  console.log(`   Seats: ${seats}`);

  const promo = await prisma.promoCode.findUnique({
    where: { code },
  });

  if (!promo) {
    console.error(`\n❌ Promo code ${code} not found.`);
    console.log("\nMake sure the code exists in your database first.");
    console.log(
      "You may need to create it via the admin UI at /admin/promo-codes"
    );
    process.exit(1);
  }

  console.log(`\n📋 Current Settings:`);
  console.log(`   Type: ${promo.type}`);
  console.log(`   Duration: ${promo.duration}`);
  console.log(`   Percent Off: ${promo.percentOff || "N/A"}%`);
  console.log(
    `   Access Override: ${promo.accessOverrideEnabled ? "✅ Enabled" : "❌ Disabled"}`
  );
  console.log(`   Access Seats: ${promo.accessSeatsTotal || "Unlimited"}`);

  const updated = await prisma.promoCode.update({
    where: { id: promo.id },
    data: {
      accessOverrideEnabled: true,
      accessSeatsTotal: seats,
      // Ensure it's set up for lifetime free if not already
      duration: promo.duration === "ONCE" ? "FOREVER" : promo.duration,
      percentOff: promo.percentOff || 100,
    },
  });

  console.log(`\n✅ Updated ${code}:`);
  console.log(`   Access Override: Enabled ✅`);
  console.log(`   Access Seats: ${updated.accessSeatsTotal}`);
  console.log(`   Duration: ${updated.duration}`);
  console.log(`   Discount: ${updated.percentOff}% off`);

  console.log(`\n📝 Next Steps:`);
  console.log(`   1. Set REGISTRATION_ENABLED=false in production environment`);
  console.log(`   2. Share code "${code}" with trusted users`);
  console.log(`   3. They enter it during registration to bypass lock`);
  console.log(`   4. They get 100% free service + full access`);
  console.log(`   5. Monitor usage at /admin/promo-codes`);

  console.log(`\n⚠️  Important:`);
  console.log(`   • Code has ${updated.accessSeatsTotal} seats available`);
  console.log(`   • Once seats are full, code won't work for new users`);
  console.log(
    `   • Current uses: ${updated.accessSeatsUsed} / ${updated.accessSeatsTotal}`
  );
  console.log(
    `   • Remaining seats: ${updated.accessSeatsTotal! - updated.accessSeatsUsed}\n`
  );
}

main()
  .catch((e) => {
    console.error("\n❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
