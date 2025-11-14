import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // Hash passwords
  const customerPassword = await bcrypt.hash("customer123", 10);
  const adminPassword = await bcrypt.hash("admin123", 10);
  const attorneyPassword = await bcrypt.hash("attorney123", 10);
  const reviewerPassword = await bcrypt.hash("reviewer123", 10);

  // Create test customer (login: customer@test.com, emails go to brandon@radiantclaims.com)
  const customer = await prisma.user.upsert({
    where: { email: "customer@test.com" },
    update: {},
    create: {
      email: "customer@test.com",
      name: "Test Customer",
      password: customerPassword,
      role: "CUSTOMER",
      emailVerified: new Date(),
    },
  });
  console.log("✓ Created customer user: customer@test.com / customer123");

  // Create admin user (login: admin@radiantclaims.com, emails go to brandon@radiantclaims.com)
  const admin = await prisma.user.upsert({
    where: { email: "admin@radiantclaims.com" },
    update: {},
    create: {
      email: "admin@radiantclaims.com",
      name: "Admin User",
      password: adminPassword,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });
  console.log("✓ Created admin user: admin@radiantclaims.com / admin123");

  // Create law firm (all emails go to brandon@radiantclaims.com)
  const lawFirm = await prisma.lawFirm.upsert({
    where: { slug: "heritage-law" },
    update: {
      email: "brandon@radiantclaims.com",
      primaryContactEmail: "brandon@radiantclaims.com",
    },
    create: {
      name: "Heritage Law Offices",
      slug: "heritage-law",
      email: "brandon@radiantclaims.com",
      phone: "1-800-555-1234",
      address: "123 Main St",
      city: "Salt Lake City",
      state: "UT",
      postalCode: "84101",
      status: "ACTIVE",
      primaryContactName: "John Heritage",
      primaryContactEmail: "brandon@radiantclaims.com",
    },
  });
  console.log("✓ Created law firm: Heritage Law Offices");

  const notificationSchedule =
    (await prisma.lawFirmNotificationSchedule.findUnique({
      where: { firmId: lawFirm.id },
    })) ||
    (await prisma.lawFirmNotificationSchedule.create({
      data: {
        firmId: lawFirm.id,
        summaryEmailTimes: ["06:00", "14:00"],
        timezone: "America/Denver",
        minimumActivities: 1,
      },
    }));
  console.log(
    "✓ Configured notification schedule:",
    notificationSchedule.summaryEmailTimes?.join(", ")
  );

  // Create attorney user (login: attorney@heritagelaw.com, emails go to brandon@radiantclaims.com)
  const attorney = await prisma.user.upsert({
    where: { email: "attorney@heritagelaw.com" },
    update: {},
    create: {
      email: "attorney@heritagelaw.com",
      name: "Test Attorney",
      password: attorneyPassword,
      role: "ATTORNEY",
      firmId: lawFirm.id,
      emailVerified: new Date(),
    },
  });
  console.log(
    "✓ Created attorney user: attorney@heritagelaw.com / attorney123"
  );

  // Create staff reviewer (login: reviewer@radiantclaims.com, emails go to brandon@radiantclaims.com)
  const reviewer = await prisma.user.upsert({
    where: { email: "reviewer@radiantclaims.com" },
    update: {},
    create: {
      email: "reviewer@radiantclaims.com",
      name: "Staff Reviewer",
      password: reviewerPassword,
      role: "STAFF_REVIEWER",
      emailVerified: new Date(),
    },
  });
  console.log(
    "✓ Created reviewer user: reviewer@radiantclaims.com / reviewer123"
  );

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
    where: { email: "brandon@radiantclaims.com" },
  });

  const claimant =
    existingClaimant ||
    (await prisma.claimant.create({
      data: {
        firstName: "Jane",
        lastName: "Doe",
        email: "brandon@radiantclaims.com",
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
    }));

  console.log("✓ Created demo claimant:", claimant.email);

  const intakeSession = await prisma.intakeSession.upsert({
    where: { resumeToken: "demo-claim-session" },
    update: {},
    create: {
      resumeToken: "demo-claim-session",
      claimantId: claimant.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "IN_PROGRESS",
      currentStep: "MEDICAL",
      recaCompletionPercent: 65,
      lastActivityAt: new Date(),
    },
  });
  console.log("✓ Prepared intake session:", intakeSession.id);

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

  console.log("✓ Created sample document:", document.originalName);

  const activityNewClient = await prisma.attorneyActivityLog.create({
    data: {
      firmId: lawFirm.id,
      claimantId: claimant.id,
      sessionId: intakeSession.id,
      activityType: "NEW_CLIENT_SIGNUP",
      title: "New Client: Jane Doe",
      description: "Completed onboarding and assigned to Heritage Law.",
      metadata: {
        progress: "65%",
        county: claimant.county,
      },
    },
  });

  const activityDocument = await prisma.attorneyActivityLog.create({
    data: {
      firmId: lawFirm.id,
      claimantId: claimant.id,
      sessionId: intakeSession.id,
      activityType: "DOCUMENT_UPLOADED",
      title: "Uploaded pathology report",
      description: "Automated validation passed.",
      metadata: {
        filename: document.originalName,
        sizeBytes: document.size,
      },
    },
  });

  const summaryNotification = await prisma.attorneyNotificationLog.create({
    data: {
      firmId: lawFirm.id,
      notificationType: "SCHEDULED_SUMMARY",
      recipients: ["brandon@radiantclaims.com"],
      subject: "Morning Activity Summary",
      activityIds: [activityNewClient.id, activityDocument.id],
    },
  });

  await prisma.attorneyActivityLog.updateMany({
    where: { id: { in: [activityNewClient.id, activityDocument.id] } },
    data: { includedInSummary: true, summaryEmailId: summaryNotification.id },
  });
  console.log("✓ Seeded attorney activity + summary email log");

  await prisma.attorneyNotificationLog.create({
    data: {
      firmId: lawFirm.id,
      notificationType: "IMMEDIATE_NEW_CLIENT",
      recipients: ["brandon@radiantclaims.com"],
      subject: "New Client Assigned: Jane Doe",
      sessionId: intakeSession.id,
    },
  });

  const followUp = await prisma.claimantFollowUp.create({
    data: {
      claimantId: claimant.id,
      sessionId: intakeSession.id,
      followUpType: "DOCUMENT_SPECIFIC",
      documentType: "Proof of Residency",
      phase: "ACTIVE_SUPPORT",
      scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const priorityQueue = await prisma.followUpPriorityQueue.upsert({
    where: { claimantId: claimant.id },
    update: {
      priorityScore: 72,
      recentActivity: true,
      uploadedRecently: true,
      nextFollowUpAt: followUp.scheduledFor,
    },
    create: {
      claimantId: claimant.id,
      priorityScore: 72,
      recentActivity: true,
      uploadedRecently: true,
      nextFollowUpAt: followUp.scheduledFor,
    },
  });

  await prisma.documentRequestAssistance.create({
    data: {
      claimantId: claimant.id,
      sessionId: intakeSession.id,
      documentType: "School Records (1958)",
      assistanceLevel: "GUIDED_SUPPORT",
      providerName: "Arizona Department of Education",
      providerContact: {
        phone: "(602) 542-5393",
        hours: "Mon-Fri 8am-5pm",
      },
      staffAssistanceRequested: true,
      assignedStaffId: reviewer.id,
      staffStatus: "ASSIGNED",
      formTemplateUrl: "https://radiantclaims.com/forms/school-record.pdf",
      formPrefilledData: {
        claimantName: `${claimant.firstName} ${claimant.lastName}`,
        years: "1956-1961",
      },
      requestedHelp: true,
    },
  });

  console.log(
    "✓ Seeded follow-up cadence + assistance (priority score:",
    priorityQueue.priorityScore,
    ")"
  );

  console.log("\n🎉 Seeding completed!");
  console.log("\n📬 Notification + Follow-up demo data ready:");
  console.log("- Attorney activity logs & summary email sample");
  console.log("- Client follow-up cadence with priority scoring");
  console.log("- Document assistance record with staff assignment");
  console.log("\n📝 Test Credentials:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Customer:  customer@test.com / customer123");
  console.log("Admin:     admin@radiantclaims.com / admin123");
  console.log("Attorney:  attorney@heritagelaw.com / attorney123");
  console.log("Reviewer:  reviewer@radiantclaims.com / reviewer123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n🔗 Referral Code: DEMO2024");
  console.log(
    "\n⚠️  NOTE: All notification emails will be sent to: brandon@radiantclaims.com"
  );
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
