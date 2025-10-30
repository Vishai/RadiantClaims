import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("Creating test customer user...");

  // Create test customer user
  const hashedPassword = await bcrypt.hash("TestPassword123!", 10);

  const testUser = await prisma.user.upsert({
    where: { email: "customer@test.com" },
    update: {
      password: hashedPassword,
    },
    create: {
      email: "customer@test.com",
      name: "Test Customer",
      password: hashedPassword,
      role: "CUSTOMER",
    },
  });

  console.log("Created test customer user:", testUser.email);

  // Check if claimant already exists
  const existingClaimant = await prisma.claimant.findFirst({
    where: {
      userId: testUser.id,
      email: "customer@test.com",
    },
  });

  let testClaimant;
  if (existingClaimant) {
    testClaimant = existingClaimant;
    console.log("Found existing test claimant:", testClaimant.id);
  } else {
    testClaimant = await prisma.claimant.create({
      data: {
        userId: testUser.id,
        firstName: "Test",
        lastName: "Customer",
        email: "customer@test.com",
        phone: "555-000-0000",
        dob: new Date("1980-01-01"),
        address1: "123 Test Street",
        city: "Test City",
        county: "San Juan",
        state: "UT",
        postalCode: "84000",
      },
    });
    console.log("Created test claimant:", testClaimant.id);
  }

  // Check if intake session already exists
  const existingSession = await prisma.intakeSession.findFirst({
    where: {
      claimantId: testClaimant.id,
    },
  });

  if (!existingSession) {
    const resumeToken = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Expires in 30 days

    const intakeSession = await prisma.intakeSession.create({
      data: {
        claimantId: testClaimant.id,
        resumeToken: resumeToken,
        currentStep: "MEDICAL",
        status: "IN_PROGRESS",
        claimType: "PANCREATIC_CANCER",
        completedSteps: ["SCREENING", "IDENTITY", "RESIDENCE"],
        expiresAt: expiresAt,
      },
    });
    console.log("Created intake session:", intakeSession.id);
  } else {
    console.log("Found existing intake session:", existingSession.id);
  }
  console.log("\n✅ Test customer created successfully!");
  console.log("\nLogin credentials:");
  console.log("Email: customer@test.com");
  console.log("Password: TestPassword123!");
  console.log("\nThis user will be routed to: /portal");
}

main()
  .catch((e) => {
    console.error("Error creating test customer:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
