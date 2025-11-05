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

  // Create test customer
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

  // Create admin user
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

  // Create law firm
  const lawFirm = await prisma.lawFirm.upsert({
    where: { email: "contact@heritagelaw.com" },
    update: {},
    create: {
      name: "Heritage Law Offices",
      slug: "heritage-law",
      email: "contact@heritagelaw.com",
      phone: "1-800-555-1234",
      address: "123 Main St",
      city: "Salt Lake City",
      state: "UT",
      postalCode: "84101",
      status: "ACTIVE",
      primaryContactName: "John Heritage",
      primaryContactEmail: "john@heritagelaw.com",
    },
  });
  console.log("✓ Created law firm: Heritage Law Offices");

  // Create attorney user
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

  // Create staff reviewer
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
    where: { email: "jane.doe@example.com" },
  });

  const claimant =
    existingClaimant ||
    (await prisma.claimant.create({
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
    }));

  console.log("✓ Created demo claimant:", claimant.email);

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

  console.log("\n🎉 Seeding completed!");
  console.log("\n📝 Test Credentials:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Customer:  customer@test.com / customer123");
  console.log("Admin:     admin@radiantclaims.com / admin123");
  console.log("Attorney:  attorney@heritagelaw.com / attorney123");
  console.log("Reviewer:  reviewer@radiantclaims.com / reviewer123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n🔗 Referral Code: DEMO2024");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
