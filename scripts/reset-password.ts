/**
 * Script to reset a user's password
 *
 * Usage:
 *   npx tsx scripts/reset-password.ts <email> <newPassword>
 *
 * Example:
 *   npx tsx scripts/reset-password.ts brandon@radiantclaims.com MyNewPassword123
 */

import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error("\n❌ Error: Email and new password are required\n");
    console.log("Usage:");
    console.log("  npx tsx scripts/reset-password.ts <email> <newPassword>\n");
    console.log("Example:");
    console.log(
      "  npx tsx scripts/reset-password.ts brandon@radiantclaims.com MyNewPassword123\n"
    );
    process.exit(1);
  }

  console.log(`\n🔍 Looking for user: ${email}`);

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`\n❌ Error: User with email "${email}" not found\n`);
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.name || "Unknown"} (${user.email})`);

  // Hash new password
  console.log(`\n🔐 Hashing new password...`);
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetRequired: false, // Clear any forced password reset flag
    },
  });

  console.log(`\n✅ Password updated successfully!`);

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "PASSWORD_CHANGED",
      resourceType: "User",
      resourceId: user.id,
      ipAddress: "127.0.0.1",
      metadata: JSON.stringify({
        changedBy: "reset-password script",
        timestamp: new Date().toISOString(),
      }),
    },
  });

  console.log(`📝 Audit log created`);
  console.log(`\n🎉 Password reset complete! You can now log in with:`);
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${newPassword}\n`);
}

main()
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
