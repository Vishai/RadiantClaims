import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Generate a secure random password
function generatePassword(): string {
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
  const email = "brandon.armstrong@outlook.com";
  const name = "Brandon Armstrong (Outlook)";

  console.log(`🔐 Creating attorney account for ${email}...\n`);

  // Generate password
  const tempPassword = generatePassword();
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    console.log(`⚠️  User ${email} already exists.`);
    console.log(`Would you like to reset the password? (Not implemented yet)`);
    return;
  }

  // Create the attorney user
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name: name,
      password: hashedPassword,
      role: "ATTORNEY",
      passwordResetRequired: true,
    },
  });

  console.log(`✅ Created attorney account: ${user.email}\n`);
  console.log("=".repeat(80));
  console.log("🎉 ATTORNEY ACCOUNT CREATED!");
  console.log("=".repeat(80) + "\n");
  console.log(`Name:     ${name}`);
  console.log(`Email:    ${email}`);
  console.log(`Password: ${tempPassword}`);
  console.log("\n" + "=".repeat(80) + "\n");
  console.log("⚠️  IMPORTANT SECURITY NOTES:");
  console.log("   • This is a TEMPORARY password");
  console.log("   • User will be REQUIRED to change password on first login");
  console.log(
    "\n📍 Login URL: " +
      (process.env.NEXTAUTH_URL || "http://localhost:3000") +
      "/login"
  );
}

main()
  .catch((e) => {
    console.error("❌ Error creating attorney account:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
