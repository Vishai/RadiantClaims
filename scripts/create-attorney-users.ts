import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

// Attorney accounts to create
const attorneys = [
  {
    email: "Ryan.heritagelaw@gmail.com",
    name: "Ryan (Heritage Law)",
  },
  {
    email: "joshuajjwilkinson@gmail.com",
    name: "Joshua J. Wilkinson",
  },
];

// Generate a secure random password
function generatePassword(): string {
  // Generate a strong password with uppercase, lowercase, numbers
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowercase = "abcdefghijkmnpqrstuvwxyz";
  const numbers = "23456789";
  const special = "!@#$%";

  let password = "";
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Add more random characters
  const all = uppercase + lowercase + numbers + special;
  for (let i = 0; i < 8; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

async function main() {
  console.log("🔐 Creating attorney user accounts...\n");

  const createdAccounts: Array<{
    email: string;
    password: string;
    name: string;
  }> = [];

  for (const attorney of attorneys) {
    // Generate a temporary password
    const tempPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: attorney.email.toLowerCase() },
    });

    if (existingUser) {
      console.log(`⚠️  User ${attorney.email} already exists. Skipping...`);
      continue;
    }

    // Create the attorney user
    const user = await prisma.user.create({
      data: {
        email: attorney.email.toLowerCase(),
        name: attorney.name,
        password: hashedPassword,
        role: "ATTORNEY",
        passwordResetRequired: true, // Force password change on first login
      },
    });

    createdAccounts.push({
      email: attorney.email,
      password: tempPassword,
      name: attorney.name,
    });

    console.log(`✅ Created attorney account: ${user.email}`);
  }

  console.log("\n" + "=".repeat(80));
  console.log("🎉 ATTORNEY ACCOUNTS CREATED SUCCESSFULLY!");
  console.log("=".repeat(80) + "\n");

  if (createdAccounts.length > 0) {
    console.log("📧 TEMPORARY LOGIN CREDENTIALS (share these securely):\n");

    for (const account of createdAccounts) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Name:     ${account.name}`);
      console.log(`Email:    ${account.email}`);
      console.log(`Password: ${account.password}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    }

    console.log("⚠️  IMPORTANT SECURITY NOTES:");
    console.log("   • These are TEMPORARY passwords");
    console.log(
      "   • Users will be REQUIRED to change their password on first login"
    );
    console.log(
      "   • Send these credentials via a SECURE channel (encrypted email, password manager)"
    );
    console.log("   • DO NOT send both email and password in the same message");
    console.log(
      "   • After they log in, they can change their password at: /portal/change-password"
    );
    console.log(
      "\n📍 Login URL: " +
        (process.env.NEXTAUTH_URL || "http://localhost:3000") +
        "/login"
    );
    console.log(
      "\n💡 Password Change URL: " +
        (process.env.NEXTAUTH_URL || "http://localhost:3000") +
        "/portal/change-password"
    );
  } else {
    console.log("ℹ️  No new accounts were created (all users already exist)");
  }
}

main()
  .catch((e) => {
    console.error("❌ Error creating attorney accounts:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
