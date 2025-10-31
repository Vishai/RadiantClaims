import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("Creating test claimant user...");

  // Create test customer user
  const hashedPassword = await bcrypt.hash("TestPassword123!", 10);

  const testUser = await prisma.user.upsert({
    where: { email: "claimant@test.com" },
    update: {
      password: hashedPassword,
    },
    create: {
      email: "claimant@test.com",
      name: "Test Claimant",
      password: hashedPassword,
      role: "CUSTOMER",
    },
  });

  console.log("✅ Created test user:", testUser.email);

  // Check if claimant already exists
  const existingClaimant = await prisma.claimant.findFirst({
    where: {
      userId: testUser.id,
      email: "claimant@test.com",
    },
  });

  let testClaimant;
  if (existingClaimant) {
    testClaimant = existingClaimant;
    console.log("✅ Found existing test claimant:", testClaimant.id);
  } else {
    testClaimant = await prisma.claimant.create({
      data: {
        userId: testUser.id,
        firstName: "Mary",
        lastName: "Johnson",
        email: "claimant@test.com",
        phone: "435-555-1234",
        dob: new Date("1955-03-15"),
        address1: "456 Downwinder Ave",
        city: "St. George",
        county: "Washington",
        state: "UT",
        postalCode: "84770",
        claimType: "DOWNWINDER",
        relationshipToClaimant: "SELF",
        cancerType: "Lung Cancer",
      },
    });
    console.log("✅ Created test claimant:", testClaimant.id);
  }

  // Check if intake session already exists
  let intakeSession = await prisma.intakeSession.findFirst({
    where: {
      claimantId: testClaimant.id,
    },
  });

  if (!intakeSession) {
    const resumeToken = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Expires in 30 days

    intakeSession = await prisma.intakeSession.create({
      data: {
        claimantId: testClaimant.id,
        resumeToken: resumeToken,
        currentStep: "MEDICAL",
        status: "IN_PROGRESS",
        claimType: "DOWNWINDER",
        completedSteps: ["SCREENING", "IDENTITY", "RESIDENCE"],
        expiresAt: expiresAt,
        recaWorkflowStage: 2, // Stage 2: Form filling
        recaWorkflowSection: "part_1",
        recaCompletionPercent: 15,
      },
    });
    console.log("✅ Created intake session:", intakeSession.id);
  } else {
    console.log("✅ Found existing intake session:", intakeSession.id);
  }

  console.log("\n" + "=".repeat(60));
  console.log("🎉 Test Claimant Created Successfully!");
  console.log("=".repeat(60));
  console.log("\n📧 Login credentials:");
  console.log("   Email:    claimant@test.com");
  console.log("   Password: TestPassword123!");
  console.log("\n🏠 Portal URL:");
  console.log("   http://localhost:3000/portal");
  console.log("\n📄 Documents Page:");
  console.log("   http://localhost:3000/portal/documents");
  console.log("\n📋 RECA Form:");
  console.log("   http://localhost:3000/reca/form/" + intakeSession.id);
  console.log("\n" + "=".repeat(60));
}

main()
  .catch((e) => {
    console.error("❌ Error creating test claimant:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
