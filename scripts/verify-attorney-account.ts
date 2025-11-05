import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Verifying attorney account...\n");

  const email = "brandonaso@gmail.com";
  const testPassword = "Dd@t2!eGs@Ef";

  // Find the user
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      password: true,
      passwordResetRequired: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    console.error(`❌ User not found: ${email}`);
    process.exit(1);
  }

  console.log("✅ User found in database:\n");
  console.log("=".repeat(80));
  console.log(`ID:                      ${user.id}`);
  console.log(`Email:                   ${user.email}`);
  console.log(`Name:                    ${user.name}`);
  console.log(`Role:                    ${user.role}`);
  console.log(`Password Reset Required: ${user.passwordResetRequired}`);
  console.log(`Password Hash Exists:    ${user.password ? "Yes" : "No"}`);
  console.log(`Created At:              ${user.createdAt}`);
  console.log(`Updated At:              ${user.updatedAt}`);
  console.log("=".repeat(80) + "\n");

  if (!user.password) {
    console.error("❌ No password hash found for user!");
    process.exit(1);
  }

  // Test password verification
  console.log("🔐 Testing password verification...\n");
  const isValid = await bcrypt.compare(testPassword, user.password);

  if (isValid) {
    console.log("✅ Password verification SUCCESSFUL!");
    console.log(
      `   The password "${testPassword}" matches the hash in database.\n`
    );
  } else {
    console.log("❌ Password verification FAILED!");
    console.log(
      `   The password "${testPassword}" does NOT match the hash in database.\n`
    );

    // Let's try to set a new password
    console.log("🔧 Setting a new known password...\n");
    const newPassword = "TestAttorney123!";
    const newHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: newHash },
    });

    console.log("✅ Password reset to: TestAttorney123!");
    console.log("   Try logging in with this password instead.\n");
  }

  console.log("=".repeat(80));
  console.log("LOGIN CREDENTIALS");
  console.log("=".repeat(80));
  console.log(`Email:    ${email}`);
  console.log(`Password: ${isValid ? testPassword : "TestAttorney123!"}`);
  console.log("=".repeat(80));
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
