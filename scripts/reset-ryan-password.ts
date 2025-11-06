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
  const email = "ryan.heritagelaw@gmail.com";

  console.log(`🔐 Resetting password for ${email}...\n`);

  // Generate new password
  const tempPassword = generatePassword();
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  // Update user password
  await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: {
      password: hashedPassword,
      passwordResetRequired: true, // Force password change on first login
    },
  });

  console.log(`✅ Password reset successfully!\n`);
  console.log("=".repeat(80));
  console.log("🎉 NEW CREDENTIALS FOR RYAN");
  console.log("=".repeat(80) + "\n");
  console.log(`Email:    ${email}`);
  console.log(`Password: ${tempPassword}`);
  console.log("\n" + "=".repeat(80));
}

main()
  .catch((e) => {
    console.error("❌ Error resetting password:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
