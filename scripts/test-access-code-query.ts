import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const testCode = "IKNOWBRANDONALRIGHT";
  const normalizedCode = testCode.trim().toUpperCase();

  console.log(`\n🔍 Testing access code query for: "${testCode}"`);
  console.log(`   Normalized: "${normalizedCode}"\n`);

  // This is the exact query from /api/auth/register and /api/access/validate
  const promo = await prisma.promoCode.findFirst({
    where: {
      code: normalizedCode,
      accessOverrideEnabled: true,
      isActive: true,
      isArchived: false,
    },
    select: {
      id: true,
      code: true,
      accessOverrideEnabled: true,
      isActive: true,
      isArchived: true,
      accessSeatsTotal: true,
      accessSeatsUsed: true,
      expiresAt: true,
      percentOff: true,
      duration: true,
    },
  });

  if (!promo) {
    console.log("❌ Query returned NULL - Code would be rejected with 403\n");

    // Check if code exists at all
    const anyCode = await prisma.promoCode.findFirst({
      where: { code: normalizedCode },
    });

    if (anyCode) {
      console.log("⚠️  Code EXISTS but doesn't match all criteria:");
      console.log(
        `   accessOverrideEnabled: ${anyCode.accessOverrideEnabled} (needs: true)`
      );
      console.log(`   isActive: ${anyCode.isActive} (needs: true)`);
      console.log(`   isArchived: ${anyCode.isArchived} (needs: false)`);
    } else {
      console.log("⚠️  Code does NOT exist in database at all");
    }
  } else {
    console.log("✅ Query FOUND the code - Would allow registration\n");
    console.table(promo);

    // Check seat availability
    if (promo.accessSeatsTotal !== null) {
      const remaining = promo.accessSeatsTotal - promo.accessSeatsUsed;
      console.log(
        `\n📊 Seats: ${promo.accessSeatsUsed} / ${promo.accessSeatsTotal} used (${remaining} remaining)`
      );

      if (remaining <= 0) {
        console.log("❌ No seats available - Would be rejected with 409");
      }
    }

    // Check expiration
    if (promo.expiresAt) {
      const now = new Date();
      if (promo.expiresAt < now) {
        console.log(
          `❌ Code expired on ${promo.expiresAt} - Would be rejected with 410`
        );
      } else {
        console.log(`✅ Code expires: ${promo.expiresAt}`);
      }
    } else {
      console.log("✅ Code never expires");
    }
  }

  console.log("\n");
}

main()
  .catch((e) => {
    console.error("\n❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
