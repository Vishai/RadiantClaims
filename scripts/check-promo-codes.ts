import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const codes = await prisma.promoCode.findMany({
    where: {
      code: {
        in: ["IKNOWBRANDON", "IKNOWBRANDONALRIGHT"],
      },
    },
    select: {
      code: true,
      accessOverrideEnabled: true,
      isActive: true,
      isArchived: true,
      accessSeatsTotal: true,
      accessSeatsUsed: true,
      percentOff: true,
      duration: true,
    },
  });

  console.log("\n📋 Promo Codes in Production Database:\n");
  console.table(codes);
}

main()
  .catch((e) => {
    console.error("\n❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
