import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createTempAdmin() {
  console.log("🔧 Creating temporary admin user for development...\n");

  try {
    // Generate a secure password
    const password = "TempAdmin2024!";
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create temporary admin user
    const admin = await prisma.user.upsert({
      where: { email: "admin@temp.local" },
      update: {
        password: hashedPassword,
        role: "ADMIN",
        name: "Temp Admin (DELETE LATER)",
        emailVerified: new Date(),
      },
      create: {
        email: "admin@temp.local",
        password: hashedPassword,
        role: "ADMIN",
        name: "Temp Admin (DELETE LATER)",
        emailVerified: new Date(),
      },
    });

    console.log("✅ Temporary admin user created successfully!\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 Email:    admin@temp.local");
    console.log("🔑 Password: TempAdmin2024!");
    console.log("👤 Name:     Temp Admin (DELETE LATER)");
    console.log("🎭 Role:     ADMIN");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n⚠️  IMPORTANT: This is a temporary admin account.");
    console.log("   Please delete it when no longer needed:");
    console.log("   Run: npx tsx scripts/delete-temp-admin.ts");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Also create a service subscription for this admin to avoid payment prompts
    await prisma.serviceSubscription.upsert({
      where: { userId: admin.id },
      update: {},
      create: {
        userId: admin.id,
        tier: "DIY_PREP",
        status: "ACTIVE",
        setupFeePaid: true,
        stripeCustomerId: "temp_admin_no_stripe",
      },
    });

    console.log(
      "✅ Also created DIY_PREP subscription for admin (bypasses payment checks)\n"
    );
  } catch (error) {
    console.error("❌ Error creating temp admin:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTempAdmin();
