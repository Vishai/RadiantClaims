import {
  PrismaClient,
  DocumentStatusType,
  ResourceFeedbackType,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding document tracking and feedback data...");

  // Find or create a test user
  let testUser = await prisma.user.findUnique({
    where: { email: "customer@test.com" },
    include: { claimants: true },
  });

  if (!testUser) {
    console.log("Creating test user...");
    testUser = await prisma.user.create({
      data: {
        email: "customer@test.com",
        name: "John Doe",
        password: "$2a$10$test.hash.placeholder", // You'd need to hash a real password
        role: "CUSTOMER",
        claimants: {
          create: {
            firstName: "John",
            lastName: "Doe",
            email: "customer@test.com",
            phone: "555-0123",
            dob: new Date("1960-05-15"),
            address1: "123 Main St",
            city: "St. George",
            county: "Washington",
            state: "UT",
            postalCode: "84770",
          },
        },
      },
      include: { claimants: true },
    });
  }

  const claimant = testUser.claimants[0];

  // Find some resources to use (assuming you have some from contact-gather)
  const resources = await prisma.documentResource.findMany({
    take: 5,
  });

  if (resources.length === 0) {
    console.log("⚠️  No resources found. Run contact seeding first!");
    return;
  }

  console.log(`Found ${resources.length} resources to use`);

  // Create document tracking statuses with various states
  const documentStatuses = [
    {
      documentType: "BIRTH_CERTIFICATE",
      status: "UPLOADED" as DocumentStatusType,
      resourceContactedId: resources[0]?.id,
      requestedDate: new Date("2024-11-01"),
      receivedDate: new Date("2024-11-10"),
      uploadedDate: new Date("2024-11-12"),
      notes: "Received certified copy. Uploaded to portal.",
    },
    {
      documentType: "DEATH_CERTIFICATE",
      status: "AWAITING" as DocumentStatusType,
      resourceContactedId: resources[1]?.id,
      requestedDate: new Date("2024-11-05"),
      notes: "Mailed request with $20 fee. Tracking number: 1234567890",
    },
    {
      documentType: "MEDICAL_RECORDS",
      status: "RECEIVED" as DocumentStatusType,
      resourceContactedId: resources[2]?.id,
      requestedDate: new Date("2024-11-08"),
      receivedDate: new Date("2024-11-15"),
      notes: "Received 150 pages of medical records. Need to upload.",
    },
    {
      documentType: "RESIDENCE_PROOF",
      status: "REQUESTED" as DocumentStatusType,
      resourceContactedId: resources[0]?.id,
      requestedDate: new Date("2024-11-14"),
      notes:
        "Called county recorder's office. Should arrive in 5-7 business days.",
    },
    {
      documentType: "EMPLOYMENT_RECORDS",
      status: "NOT_STARTED" as DocumentStatusType,
      notes: "Found via contact agent: Navajo Mine. Need to request.",
    },
  ];

  console.log("Creating document statuses...");
  for (const docStatus of documentStatuses) {
    await prisma.claimantDocumentStatus.upsert({
      where: {
        claimantId_documentType: {
          claimantId: claimant.id,
          documentType: docStatus.documentType,
        },
      },
      create: {
        claimantId: claimant.id,
        ...docStatus,
      },
      update: docStatus,
    });
    console.log(`  ✓ ${docStatus.documentType} - ${docStatus.status}`);
  }

  // Create resource interactions (simulate contact agent showing resources)
  console.log("\nCreating resource interactions...");
  const interactions = [
    {
      resourceId: resources[0].id,
      userId: testUser.id,
      documentType: "BIRTH_CERTIFICATE",
      searchQuery: "I need my birth certificate from St. George Utah",
      shownVia: "chat_bot",
      followUpScheduledFor: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      followUpSentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      immediatelyHelpful: true,
      immediateFeedbackAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
    {
      resourceId: resources[1].id,
      userId: testUser.id,
      documentType: "DEATH_CERTIFICATE",
      searchQuery: "death certificate Iron County Utah",
      shownVia: "chat_bot",
      followUpScheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      immediatelyHelpful: true,
      immediateFeedbackAt: new Date(),
    },
    {
      resourceId: resources[2].id,
      userId: testUser.id,
      documentType: "MEDICAL_RECORDS",
      searchQuery: "medical records from Dixie Regional Medical Center",
      shownVia: "chat_bot",
      followUpScheduledFor: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    },
  ];

  for (const interaction of interactions) {
    const created = await prisma.resourceInteraction.create({
      data: interaction,
    });
    console.log(`  ✓ Interaction for ${interaction.documentType}`);
  }

  // Create resource feedback with detailed responses
  console.log("\nCreating resource feedback...");
  const feedbackData = [
    {
      resourceId: resources[0].id,
      userId: testUser.id,
      feedbackType: "DOCUMENT_OBTAINED" as ResourceFeedbackType,
      rating: 5,
      wasHelpful: true,
      documentType: "BIRTH_CERTIFICATE",
      comments:
        "Very helpful staff! Got certified copy in 8 days. Cost was exactly as listed on website.",
      contactedAt: new Date("2024-11-01"),
      responseTime: "within_week",
      successfullyObtained: true,
      actualCost: 20.0,
      actualProcessingDays: 8,
    },
    {
      resourceId: resources[0].id,
      feedbackType: "DOCUMENT_OBTAINED" as ResourceFeedbackType,
      rating: 4,
      wasHelpful: true,
      documentType: "MARRIAGE_CERTIFICATE",
      comments: "Easy process but took longer than expected.",
      contactedAt: new Date("2024-10-15"),
      responseTime: "1_2_weeks",
      successfullyObtained: true,
      actualCost: 20.0,
      actualProcessingDays: 12,
    },
    {
      resourceId: resources[0].id,
      feedbackType: "DOCUMENT_OBTAINED" as ResourceFeedbackType,
      rating: 5,
      wasHelpful: true,
      documentType: "BIRTH_CERTIFICATE",
      comments:
        "Quick turnaround! Mailed request on Monday, received on Thursday.",
      contactedAt: new Date("2024-10-20"),
      responseTime: "within_3_days",
      successfullyObtained: true,
      actualCost: 20.0,
      actualProcessingDays: 4,
    },
    {
      resourceId: resources[1].id,
      feedbackType: "CONTACTED" as ResourceFeedbackType,
      rating: 3,
      wasHelpful: true,
      documentType: "DEATH_CERTIFICATE",
      comments: "Still waiting for response. Called twice, left messages.",
      contactedAt: new Date("2024-11-05"),
      responseTime: "no_response",
      successfullyObtained: false,
    },
    {
      resourceId: resources[2].id,
      feedbackType: "DOCUMENT_OBTAINED" as ResourceFeedbackType,
      rating: 4,
      wasHelpful: true,
      documentType: "MEDICAL_RECORDS",
      comments: "Had to fill out HIPAA form first. Records arrived complete.",
      contactedAt: new Date("2024-11-08"),
      responseTime: "within_week",
      successfullyObtained: true,
      actualCost: 25.0,
      actualProcessingDays: 7,
    },
  ];

  for (const feedback of feedbackData) {
    await prisma.resourceFeedback.create({
      data: feedback,
    });
    console.log(
      `  ✓ Feedback for ${feedback.documentType} - ${feedback.feedbackType}`
    );
  }

  // Link feedback to interactions where applicable
  const interactionWithFeedback = await prisma.resourceInteraction.findFirst({
    where: {
      resourceId: resources[0].id,
      userId: testUser.id,
      documentType: "BIRTH_CERTIFICATE",
    },
  });

  if (interactionWithFeedback) {
    const relatedFeedback = await prisma.resourceFeedback.findFirst({
      where: {
        resourceId: resources[0].id,
        userId: testUser.id,
        documentType: "BIRTH_CERTIFICATE",
      },
    });

    if (relatedFeedback) {
      await prisma.resourceInteraction.update({
        where: { id: interactionWithFeedback.id },
        data: {
          feedbackId: relatedFeedback.id,
          followUpCompletedAt: new Date(),
        },
      });
      console.log("  ✓ Linked feedback to interaction");
    }
  }

  // Run stats aggregation
  console.log("\nAggregating resource stats...");
  const resourceIds = resources.map((r) => r.id);

  for (const resourceId of resourceIds) {
    const feedback = await prisma.resourceFeedback.findMany({
      where: { resourceId },
    });

    if (feedback.length === 0) continue;

    const helpfulCount = feedback.filter((f) => f.wasHelpful === true).length;
    const notHelpfulCount = feedback.filter(
      (f) => f.wasHelpful === false
    ).length;
    const contactedCount = feedback.filter(
      (f) =>
        f.feedbackType === "CONTACTED" || f.feedbackType === "DOCUMENT_OBTAINED"
    ).length;
    const successCount = feedback.filter(
      (f) => f.successfullyObtained === true
    ).length;

    const ratingsWithValues = feedback.filter((f) => f.rating !== null);
    const avgRating =
      ratingsWithValues.length > 0
        ? ratingsWithValues.reduce((sum, f) => sum + (f.rating || 0), 0) /
          ratingsWithValues.length
        : null;

    const costsWithValues = feedback.filter((f) => f.actualCost !== null);
    const avgActualCost =
      costsWithValues.length > 0
        ? costsWithValues.reduce((sum, f) => sum + (f.actualCost || 0), 0) /
          costsWithValues.length
        : null;

    const processingWithValues = feedback.filter(
      (f) => f.actualProcessingDays !== null
    );
    const avgProcessingDays =
      processingWithValues.length > 0
        ? processingWithValues.reduce(
            (sum, f) => sum + (f.actualProcessingDays || 0),
            0
          ) / processingWithValues.length
        : null;

    const helpfulnessRate =
      helpfulCount + notHelpfulCount > 0
        ? (helpfulCount / (helpfulCount + notHelpfulCount)) * 100
        : null;

    const successRate =
      contactedCount > 0 ? (successCount / contactedCount) * 100 : null;

    await prisma.resourceStats.upsert({
      where: { resourceId },
      create: {
        resourceId,
        totalFeedback: feedback.length,
        totalSearches: Math.floor(Math.random() * 20) + 5, // Random searches
        totalSelections: Math.floor(Math.random() * 10) + feedback.length,
        helpfulCount,
        notHelpfulCount,
        contactedCount,
        successCount,
        avgRating,
        avgActualCost,
        avgProcessingDays,
        helpfulnessRate,
        successRate,
        lastFeedbackAt: feedback[0].createdAt,
      },
      update: {
        totalFeedback: feedback.length,
        helpfulCount,
        notHelpfulCount,
        contactedCount,
        successCount,
        avgRating,
        avgActualCost,
        avgProcessingDays,
        helpfulnessRate,
        successRate,
        lastFeedbackAt: feedback[0].createdAt,
      },
    });

    const resource = resources.find((r) => r.id === resourceId);
    console.log(
      `  ✓ ${resource?.name} - ${successRate?.toFixed(0)}% success rate`
    );
  }

  console.log("\n✅ Seed data created successfully!");
  console.log("\nTest user credentials:");
  console.log("  Email: customer@test.com");
  console.log("  (Use existing password or magic link)");
  console.log("\nDocument Tracking Summary:");
  console.log("  - 1 Uploaded (Birth Certificate)");
  console.log("  - 1 Awaiting (Death Certificate - 12 days)");
  console.log("  - 1 Received (Medical Records - ready to upload)");
  console.log("  - 1 Requested (Residence Proof)");
  console.log("  - 1 Not Started (Employment Records)");
  console.log("\nResource Stats:");
  console.log(`  - ${resources.length} resources with feedback`);
  console.log("  - Success rates and ratings aggregated");
  console.log("  - Social proof ready to display");
}

main()
  .catch((e) => {
    console.error("Error seeding data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
