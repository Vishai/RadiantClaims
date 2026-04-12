/**
 * Seed Test Profiles
 *
 * Creates 5 test claimants with workflow sessions so you can jump
 * straight into the RECA form wizard without going through payment.
 *
 * Usage:
 *   npx tsx scripts/seed-test-profiles.ts <your-email>
 *
 * Example:
 *   npx tsx scripts/seed-test-profiles.ts brandon@0tomait.com
 *
 * After running, refresh your portal — you'll see 5 claims ready
 * to fill out. Click "Continue Application" on any of them.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const PROFILES = [
  { firstName: "Dorothy", lastName: "Henderson", label: "Self-filer (simple)" },
  { firstName: "Patricia", lastName: "Whitaker", label: "Surviving spouse" },
  { firstName: "Karen", lastName: "Mitchell", label: "Child w/ siblings" },
  { firstName: "Ryan", lastName: "Begay", label: "Grandchild" },
  {
    firstName: "Bonnie",
    lastName: "Frederickson",
    label: "Self-filer (name changes)",
  },
];

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx scripts/seed-test-profiles.ts <your-email>");
    process.exit(1);
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  // Ensure user has a service subscription so they can access forms
  let subscription = await db.serviceSubscription.findUnique({
    where: { userId: user.id },
  });

  if (!subscription) {
    subscription = await db.serviceSubscription.create({
      data: {
        userId: user.id,
        tier: "DIY_PREP",
        status: "ACTIVE",
        setupFeePaid: true,
        isInstallmentPlan: false,
        installmentPaymentCount: 1,
      },
    });
    console.log("Created service subscription for user");
  } else if (!subscription.setupFeePaid) {
    await db.serviceSubscription.update({
      where: { id: subscription.id },
      data: { setupFeePaid: true, status: "ACTIVE" },
    });
    console.log("Activated existing subscription");
  }

  for (const profile of PROFILES) {
    // Check if profile already exists
    const existing = await db.claimant.findFirst({
      where: {
        userId: user.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
      },
    });

    if (existing) {
      console.log(
        `Skipping ${profile.firstName} ${profile.lastName} — already exists`
      );
      continue;
    }

    // Create claimant
    const claimant = await db.claimant.create({
      data: {
        userId: user.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: email,
        state: "UT",
        county: "Washington",
        claimType: "DOWNWINDER",
      },
    });

    // Create intake session with workflow state
    const resumeToken = `test-${profile.firstName.toLowerCase()}-${Date.now()}`;

    await db.intakeSession.create({
      data: {
        claimantId: claimant.id,
        resumeToken,
        currentStep: "RECA_FORM",
        status: "IN_PROGRESS",
        recaWorkflowStage: 1,
        recaWorkflowSection: "part_1",
        recaCompletionPercent: 0,
        recaFormData: {},
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      },
    });

    console.log(
      `✓ Created: ${profile.firstName} ${profile.lastName} (${profile.label})`
    );
  }

  console.log("\nDone! Refresh your portal to see the test claims.");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
