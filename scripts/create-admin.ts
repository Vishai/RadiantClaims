/**
 * Script to create a new admin user
 *
 * Usage:
 *   npx tsx scripts/create-admin.ts <email> <name> <password>
 *
 * Example:
 *   npx tsx scripts/create-admin.ts brandon@radiantclaims.com "Brandon Armstrong" mypassword123
 */

import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const name = process.argv[3];
  const password = process.argv[4];

  if (!email || !name || !password) {
    console.error("\n❌ Error: Email, name, and password are required\n");
    console.log("Usage:");
    console.log(
      "  npx tsx scripts/create-admin.ts <email> <name> <password>\n"
    );
    console.log("Example:");
    console.log(
      '  npx tsx scripts/create-admin.ts brandon@radiantclaims.com "Brandon Armstrong" SecurePass123\n'
    );
    process.exit(1);
  }

  console.log(`\n🔍 Checking if user already exists: ${email}`);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.error(`\n❌ Error: User with email "${email}" already exists`);
    console.log(`\nIf you want to make them an admin, run:`);
    console.log(`  npx tsx scripts/make-admin.ts ${email}\n`);
    process.exit(1);
  }

  // Hash password
  console.log(`\n🔐 Hashing password...`);
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create admin user
  console.log(`\n👤 Creating admin user...`);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: "ADMIN",
      emailVerified: new Date(), // Auto-verify admin users
    },
  });

  console.log(`\n✅ Admin user created successfully!`);
  console.log(`   Name: ${user.name}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   User ID: ${user.id}`);
  console.log(`   Email Verified: ${user.emailVerified ? "Yes" : "No"}`);

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "USER_CREATED",
      resourceType: "User",
      resourceId: user.id,
      ipAddress: "127.0.0.1",
      metadata: JSON.stringify({
        role: "ADMIN",
        createdBy: "create-admin script",
        emailVerified: true,
      }),
    },
  });

  console.log(`\n📝 Audit log created`);
  console.log(`\n🎉 You can now log in with:`);
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`\n⚠️  Make sure to change your password after first login!\n`);
}

main()
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
