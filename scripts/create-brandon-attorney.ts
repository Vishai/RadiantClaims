import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

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
  console.log("🔐 Creating attorney account for Brandon...\n");

  const email = "brandonaso@gmail.com";
  const name = "Brandon Armstrong";
  const tempPassword = generatePassword();
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    console.log(`⚠️  User ${email} already exists.`);
    console.log(`   User ID: ${existingUser.id}`);
    console.log(`   Role: ${existingUser.role}\n`);

    // Update to attorney role and reset password
    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        role: "ATTORNEY",
        password: hashedPassword,
        passwordResetRequired: true,
      },
    });

    console.log(`✅ Updated existing user to ATTORNEY role\n`);
    console.log("=".repeat(80));
    console.log("🎉 ATTORNEY ACCOUNT UPDATED SUCCESSFULLY!");
    console.log("=".repeat(80) + "\n");
    console.log(`📧 TEMPORARY LOGIN CREDENTIALS:\n`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Name:     ${name}`);
    console.log(`Email:    ${email}`);
    console.log(`Password: ${tempPassword}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    return;
  }

  // Create the attorney user
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name: name,
      password: hashedPassword,
      role: "ATTORNEY",
      passwordResetRequired: true, // Force password change on first login
    },
  });

  console.log(`✅ Created attorney account: ${user.email}\n`);
  console.log("=".repeat(80));
  console.log("🎉 ATTORNEY ACCOUNT CREATED SUCCESSFULLY!");
  console.log("=".repeat(80) + "\n");
  console.log(`📧 TEMPORARY LOGIN CREDENTIALS:\n`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Name:     ${name}`);
  console.log(`Email:    ${email}`);
  console.log(`Password: ${tempPassword}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  console.log("⚠️  IMPORTANT:");
  console.log("   • This is a TEMPORARY password");
  console.log(
    "   • You will be REQUIRED to change your password on first login"
  );
  console.log("   • Password change URL: /portal/change-password\n");
}

main()
  .catch((e) => {
    console.error("❌ Error creating attorney account:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
