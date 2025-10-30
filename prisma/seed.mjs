import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("Passw0rd!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@radiantclaims.dev" },
    update: {},
    create: {
      email: "admin@radiantclaims.dev",
      name: "Admin User",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("Created admin user:", admin.email);

  // Create sample referral
  const referral = await prisma.referral.upsert({
    where: { code: "DEMO2024" },
    update: {},
    create: {
      code: "DEMO2024",
      referrerName: "John Smith",
      contact: "john.smith@example.com",
      notes: "Sample referral for testing purposes",
    },
  });

  console.log("Created referral:", referral.code);

  // Create demo claimant
  const existingClaimant = await prisma.claimant.findFirst({
    where: { email: "jane.doe@example.com" },
  });

  const claimant = existingClaimant || await prisma.claimant.create({
    data: {
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe@example.com",
      phone: "555-123-4567",
      dob: new Date("1985-06-15"),
      address1: "123 Main Street",
      address2: "Apt 4B",
      city: "San Francisco",
      county: "San Francisco",
      state: "CA",
      postalCode: "94102",
      referralCode: referral.code,
    },
  });

  console.log("Created demo claimant:", claimant.email);

  // Create sample document
  const document = await prisma.document.create({
    data: {
      claimantId: claimant.id,
      type: "ID",
      fileKey: "uploads/sample-id-document.pdf",
      originalName: "drivers-license.pdf",
      mimeType: "application/pdf",
      size: 524288, // 512 KB
    },
  });

  console.log("Created sample document:", document.originalName);

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
