import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.update({
    where: { email: "brandonaso@gmail.com" },
    data: { passwordResetRequired: true },
  });

  console.log("✅ Password reset required flag set for brandonaso@gmail.com");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
