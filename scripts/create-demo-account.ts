import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@heritagelaw.com";
  const name = "Heritage Law Demo Account";
  const password = "DemoAccess2025!"; // Simple password for demo purposes

  console.log(`🔐 Creating demo account for ${email}...\n`);

  const hashedPassword = await bcrypt.hash(password, 10);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    console.log(`⚠️  User ${email} already exists. Updating password...`);

    // Update existing user
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: {
        password: hashedPassword,
        passwordResetRequired: false, // No password reset required for demo
      },
    });

    console.log(`✅ Updated demo account: ${email}\n`);
  } else {
    // Create new demo user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name,
        password: hashedPassword,
        role: "CUSTOMER", // Demo account as customer to explore the platform
        passwordResetRequired: false, // No password reset required for demo
      },
    });

    console.log(`✅ Created demo account: ${user.email}\n`);
  }

  console.log("=".repeat(80));
  console.log("🎉 DEMO ACCOUNT READY!");
  console.log("=".repeat(80) + "\n");
  console.log(`Name:     ${name}`);
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Role:     CUSTOMER (can explore platform)`);
  console.log("\n" + "=".repeat(80) + "\n");
  console.log("📝 NOTES:");
  console.log("   • This account does NOT require password change");
  console.log("   • Simple password for easy sharing with firm");
  console.log("   • Customer role to explore DIY platform features");
  console.log(
    "\n📍 Login URL: " +
      (process.env.NEXTAUTH_URL || "http://localhost:3000") +
      "/login"
  );
}

main()
  .catch((e) => {
    console.error("❌ Error creating demo account:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
