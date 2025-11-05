import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Fixing Brandon's attorney account for login...\n");

  const email = "brandonaso@gmail.com";
  const newPassword = "TestPassword123!"; // Simple password for testing

  // Find the user
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    console.error(`❌ User not found: ${email}`);
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.email}\n`);

  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update user with:
  // 1. Simple known password
  // 2. Remove password reset requirement for testing
  // 3. Ensure email is lowercase
  await prisma.user.update({
    where: { id: user.id },
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      passwordResetRequired: false, // Allow login without forced password change
    },
  });

  console.log("✅ Account updated successfully!\n");
  console.log("=".repeat(80));
  console.log("NEW LOGIN CREDENTIALS");
  console.log("=".repeat(80));
  console.log(`Email:                   ${email.toLowerCase()}`);
  console.log(`Password:                ${newPassword}`);
  console.log(`Password Reset Required: false (can test login flow)`);
  console.log("=".repeat(80));
  console.log("\n💡 Try logging in now with these credentials.");
  console.log("   After testing, you can change the password in the portal.\n");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
