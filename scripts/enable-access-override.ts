import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const code = args[0];
  const seatsArg = args.find((arg) => arg.startsWith("--seats="));
  const seats = seatsArg ? parseInt(seatsArg.split("=")[1]) : 1;

  if (!code) {
    console.error("Please provide a promo code.");
    console.log(
      "Usage: npx tsx scripts/enable-access-override.ts CODE [--seats=N]"
    );
    process.exit(1);
  }

  const promo = await prisma.promoCode.findUnique({
    where: { code },
  });

  if (!promo) {
    console.error(`Promo code ${code} not found.`);
    process.exit(1);
  }

  const updated = await prisma.promoCode.update({
    where: { id: promo.id },
    data: {
      accessOverrideEnabled: true,
      accessSeatsTotal: seats,
    },
  });

  console.log(`✅ Updated ${code}:`);
  console.log(`   Access Override: Enabled`);
  console.log(`   Access Seats: ${updated.accessSeatsTotal}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
