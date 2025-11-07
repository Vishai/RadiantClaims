/**
 * Script to create or update a user to have ADMIN role
 *
 * Usage:
 *   npx tsx scripts/make-admin.ts <email>
 *
 * Example:
 *   npx tsx scripts/make-admin.ts brandon@radiantclaims.com
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("\n❌ Error: Email is required\n");
    console.log("Usage:");
    console.log("  npx tsx scripts/make-admin.ts <email>\n");
    console.log("Example:");
    console.log("  npx tsx scripts/make-admin.ts brandon@radiantclaims.com\n");
    process.exit(1);
  }

  console.log(`\n🔍 Looking for user: ${email}`);

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`\n❌ Error: User with email "${email}" not found`);
    console.log("\nCreate an account first, then run this script again.\n");
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.name || "Unknown"} (${user.email})`);
  console.log(`   Current role: ${user.role}`);

  if (user.role === "ADMIN") {
    console.log("\n✓ User is already an ADMIN. No changes needed.\n");
    return;
  }

  // Update user to ADMIN role
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { role: "ADMIN" },
  });

  console.log(`\n✅ User updated successfully!`);
  console.log(`   Name: ${updatedUser.name || "Not set"}`);
  console.log(`   Email: ${updatedUser.email}`);
  console.log(`   Role: ${updatedUser.role}`);
  console.log(`   User ID: ${updatedUser.id}`);

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: updatedUser.id,
      action: "ROLE_CHANGED",
      resourceType: "User",
      resourceId: updatedUser.id,
      ipAddress: "127.0.0.1",
      metadata: JSON.stringify({
        oldRole: user.role,
        newRole: "ADMIN",
        changedBy: "make-admin script",
      }),
    },
  });

  console.log(`\n📝 Audit log created`);
  console.log(
    `\n🎉 ${updatedUser.name || updatedUser.email} now has full admin access!\n`
  );
}

main()
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
