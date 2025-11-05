import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔐 Creating test attorney account...\n");

  const email = "test.attorney@radiantclaims.test";
  const password = "TestAttorney123!"; // Simple password for testing
  const hashedPassword = await bcrypt.hash(password, 10);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    console.log(`⚠️  User ${email} already exists.`);
    console.log(`\n📧 EXISTING TEST ATTORNEY CREDENTIALS:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Email:    ${email}`);
    console.log(`Password: TestAttorney123!`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    return;
  }

  // Create the test attorney user
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name: "Test Attorney",
      password: hashedPassword,
      role: "ATTORNEY",
      passwordResetRequired: false, // Don't force password change for test account
    },
  });

  console.log(`✅ Created test attorney account: ${user.email}\n`);
  console.log("=".repeat(80));
  console.log("🎉 TEST ATTORNEY ACCOUNT CREATED SUCCESSFULLY!");
  console.log("=".repeat(80) + "\n");
  console.log(`📧 TEST ATTORNEY CREDENTIALS:\n`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Name:     Test Attorney`);
  console.log(`Email:    ${email}`);
  console.log(`Password: TestAttorney123!`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  console.log("ℹ️  This is a TEST account with a simple password.");
  console.log("   Password change is NOT required on first login.\n");
}

main()
  .catch((e) => {
    console.error("❌ Error creating test attorney account:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
