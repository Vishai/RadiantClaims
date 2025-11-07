import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || "admin@local.dev";

  console.log(`\n🔍 Looking for user: ${email}`);

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      password: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    console.log(`\n❌ User not found: ${email}\n`);
    return;
  }

  console.log(`\n✅ User found:`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Name: ${user.name}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Email Verified: ${user.emailVerified ? "Yes" : "No"}`);
  console.log(`   Created: ${user.createdAt}`);
  console.log(
    `   Password Hash: ${user.password ? user.password.substring(0, 30) + "..." : "NONE"}`
  );

  // Test password
  if (user.password) {
    const testPassword = process.argv[3];
    if (testPassword) {
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log(
        `\n🔑 Password test for "${testPassword}": ${isValid ? "✅ VALID" : "❌ INVALID"}`
      );
    }
  }

  console.log("");
}

main()
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
