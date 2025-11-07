/**
 * Find user by password hash
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const targetHash = process.argv[2];

  if (!targetHash) {
    console.error("\n❌ Error: Password hash is required\n");
    console.log("Usage:");
    console.log("  npx tsx scripts/find-user-by-hash.ts <hash>\n");
    process.exit(1);
  }

  console.log(
    `\n🔍 Searching for user with hash: ${targetHash.substring(0, 20)}...\n`
  );

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      password: true,
    },
  });

  const user = users.find((u) => u.password === targetHash);

  if (user) {
    console.log("✅ User found!");
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name || "Not set"}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   User ID: ${user.id}\n`);
    console.log("💡 To reset this user's password, run:");
    console.log(
      `   npx tsx scripts/reset-password.ts ${user.email} NewPassword123\n`
    );
  } else {
    console.log("❌ No user found with that password hash\n");
  }
}

main()
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
