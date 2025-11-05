import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // Hash password for all users
  const hashedPassword = await bcrypt.hash("Password123!", 10);

  // Create 15 users
  const users = [
    { email: "user1@radiantclaims.dev", name: "Alice Johnson", role: "CUSTOMER" },
    { email: "user2@radiantclaims.dev", name: "Bob Smith", role: "CUSTOMER" },
    { email: "user3@radiantclaims.dev", name: "Carol Williams", role: "CUSTOMER" },
    { email: "user4@radiantclaims.dev", name: "David Brown", role: "CUSTOMER" },
    { email: "user5@radiantclaims.dev", name: "Emma Davis", role: "CUSTOMER" },
    { email: "user6@radiantclaims.dev", name: "Frank Miller", role: "CUSTOMER" },
    { email: "user7@radiantclaims.dev", name: "Grace Wilson", role: "CUSTOMER" },
    { email: "user8@radiantclaims.dev", name: "Henry Moore", role: "CUSTOMER" },
    { email: "user9@radiantclaims.dev", name: "Ivy Taylor", role: "CUSTOMER" },
    { email: "user10@radiantclaims.dev", name: "Jack Anderson", role: "CUSTOMER" },
    { email: "user11@radiantclaims.dev", name: "Kelly Thomas", role: "CUSTOMER" },
    { email: "user12@radiantclaims.dev", name: "Liam Jackson", role: "CUSTOMER" },
    { email: "user13@radiantclaims.dev", name: "Mia White", role: "CUSTOMER" },
    { email: "user14@radiantclaims.dev", name: "Noah Harris", role: "CUSTOMER" },
    { email: "user15@radiantclaims.dev", name: "Olivia Martin", role: "CUSTOMER" },
  ];

  console.log("Creating 15 users with password: Password123!");

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        role: userData.role,
      },
    });
    console.log(`✓ Created user: ${user.email} (${user.name})`);
  }

  console.log("\nAll users created successfully!");

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
