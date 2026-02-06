/**
 * CSV-Driven Test User Seed Script
 *
 * Reads test-profiles.csv and creates test users in the database.
 * Edit the CSV to add/modify/remove test profiles, then re-run this script.
 *
 * Usage:
 *   npx tsx scripts/seed-from-csv.ts                    # Seed from CSV
 *   npx tsx scripts/seed-from-csv.ts --cleanup          # Remove all test users
 *   npx tsx scripts/seed-from-csv.ts --dry-run          # Parse CSV, show what would be created
 *   npx tsx scripts/seed-from-csv.ts --file custom.csv  # Use a different CSV file
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();
const TEST_EMAIL_DOMAIN = "@radiantclaims.test";

// ============================================================================
// CSV PARSER (handles quoted fields with commas and newlines)
// ============================================================================

function parseCSV(content: string): Record<string, string>[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '"') {
      if (inQuotes && content[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "\n" && !inQuotes) {
      lines.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) lines.push(current.trim());

  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] || "").trim();
    });
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// ============================================================================
// CSV ROW → STRUCTURED DATA TRANSFORMERS
// ============================================================================

function parseFormerNames(
  raw: string
): Array<{ name: string; type: string; year: string }> {
  if (!raw) return [];
  // Format: "Maria Garcia|MAIDEN|1968" or "Name1|TYPE1|YEAR1;Name2|TYPE2|YEAR2"
  return raw
    .split(";")
    .filter(Boolean)
    .map((entry) => {
      const [name, type, year] = entry.split("|");
      return { name: name || "", type: type || "", year: year || "" };
    });
}

function parseLocations(raw: string): Array<Record<string, string>> {
  if (!raw) return [];
  // Format: "designated|Utah|Cedar City|January 1952 - December 1960"
  // Multiple: separated by ; if needed (for now, single location per profile)
  return raw
    .split(";")
    .filter(Boolean)
    .map((entry) => {
      const [type, stateOrCounty, townCity, timePeriod] = entry.split("|");
      if (type === "designated") {
        return { type, state: stateOrCounty, townCity, timePeriod };
      } else {
        // nevada, arizona types use county instead of state
        return { type, county: stateOrCounty, townCity, timePeriod };
      }
    });
}

function parseDiseases(raw: string): string[] {
  if (!raw) return [];
  // Use semicolons as delimiter to avoid CSV comma conflicts
  return raw
    .split(";")
    .map((d) => d.trim())
    .filter(Boolean);
}

function parseSpouses(raw: string): Array<Record<string, string>> {
  if (!raw) return [];
  // Format: "Dorothy Wilson|1958-06-01|2010-02-15"
  return raw
    .split(";")
    .filter(Boolean)
    .map((entry) => {
      const [spouseName, marriageStart, marriageEnd] = entry.split("|");
      return {
        spouseName: spouseName || "",
        marriageStart: marriageStart || "",
        marriageEnd: marriageEnd || "",
      };
    });
}

function parseSiblings(raw: string): Array<Record<string, any>> {
  if (!raw) return [];
  // Siblings separated by ~ (tilde) to avoid CSV conflicts
  // Format: "Name|DOB|CityBirth|StateBirth|isDeceased|DOD_or_Address|CityDeath_or_Phone|StateDeath_or_empty|HasDeathCert_or_empty|HadNameChange"
  // Living: "David Wilson|11/03/1960|Ely|Nevada|NO|321 Elm Rd Ely NV 89301|(775) 555-0303||NO"
  // Deceased: "Thomas Wilson|08/22/1963|Ely|Nevada|YES|01/05/2020|Ely|Nevada|YES|NO"
  // Name changed: "Susan Baker|03/15/1958|Ely|Nevada|NO|100 Main St Ely NV 89301|(775) 555-0102|YES|Wilson|Susan Wilson|06/15/1980|MARRIAGE"
  return raw
    .split("~")
    .filter(Boolean)
    .map((entry) => {
      const parts = entry.split("|");
      const name = parts[0] || "";
      const dateOfBirth = parts[1] || "";
      const cityOfBirth = parts[2] || "";
      const stateOfBirth = parts[3] || "";
      const isDeceased = parts[4] || "NO";

      const sibling: Record<string, any> = {
        name,
        dateOfBirth,
        cityOfBirth,
        stateOfBirth,
        isDeceased,
      };

      if (isDeceased === "YES") {
        sibling.dateOfDeath = parts[5] || undefined;
        sibling.cityOfDeath = parts[6] || undefined;
        sibling.stateOfDeath = parts[7] || undefined;
        sibling.hasDeathCertificate = parts[8] || undefined;
        sibling.hadNameChange = parts[9] || "NO";
      } else {
        sibling.currentAddress = parts[5] || "";
        sibling.phoneNumber = parts[6] || "";
        const hadNameChange = parts[7] || "NO";
        sibling.hadNameChange = hadNameChange;
        if (hadNameChange === "YES") {
          sibling.originalLastName = parts[8] || "";
          sibling.nameChangeHistory = [
            {
              previousName: parts[9] || "",
              dateOfChange: parts[10] || "",
              reasonForChange: parts[11] || "",
            },
          ];
        }
      }

      return sibling;
    });
}

// ============================================================================
// BUILD FORM DATA FROM CSV ROW
// ============================================================================

function buildFormData(row: Record<string, string>): Record<string, any> {
  const formData: Record<string, any> = {};
  const today = new Date().toISOString().split("T")[0];
  const filingForSelf = row.filing_for_self === "true";
  const relationship = row.p3_relationship || row.relationship;

  // Part 1 — Claimant/Filer Info
  formData.part_1 = {
    filingForSelf,
    firstName: row.first_name,
    middleName: row.middle_name || "",
    lastName: row.last_name,
    formerNames: parseFormerNames(row.former_names),
    ssn: row.ssn,
    dob: row.dob,
    mailingAddress: row.address1,
    city: row.city,
    state: stateFullName(row.state),
    zipCode: row.postal_code,
    phoneDay: row.phone,
    phoneEvening: "",
    email: `${row.email_prefix}${TEST_EMAIL_DOMAIN}`,
    residenceAddress: row.residence_address || "",
    tribalAffiliation: row.tribal_affiliation || "",
    tribalCensusNumber: row.tribal_census_number || "",
  };

  // Part 2 — Exposed Individual
  formData.part_2 = {
    firstName: row.p2_first_name || row.first_name,
    middleName: row.p2_middle_name || "",
    lastName: row.p2_last_name || row.last_name,
    formerNames: [],
    ssn: row.p2_ssn || row.ssn,
    dob: row.p2_dob || row.dob,
  };
  if (row.p2_dod) {
    formData.part_2.dod = row.p2_dod;
  }

  // Part 3 — Relationship
  formData.part_3 = {
    relationship: relationship,
    filingForSelf,
  };

  // Parts 4-7 based on relationship
  if (filingForSelf || relationship === "Self") {
    formData.part_4 = {};
  }

  if (relationship === "Spouse") {
    formData.part_5 = {};
    if (row.p5_claimant_deceased)
      formData.part_5.claimantDeceased = row.p5_claimant_deceased;
    if (row.p5_married_one_year)
      formData.part_5.marriedOneYear = row.p5_married_one_year;
    if (row.p5_claimant_previous_marriages)
      formData.part_5.claimantPreviousMarriages =
        row.p5_claimant_previous_marriages;
    if (row.p5_filer_other_marriages)
      formData.part_5.filerOtherMarriages = row.p5_filer_other_marriages;
  }

  if (relationship === "Child") {
    formData.part_6 = {};
    if (row.p6_claimant_deceased)
      formData.part_6.claimantDeceased = row.p6_claimant_deceased;
    if (row.p6_claimant_ever_married)
      formData.part_6.claimantEverMarried = row.p6_claimant_ever_married;
    if (row.p6_surviving_spouse_exists)
      formData.part_6.survivingSpouseExists = row.p6_surviving_spouse_exists;
    if (row.p6_surviving_spouse_met_requirement)
      formData.part_6.survivingSpouseMetOneYearRequirement =
        row.p6_surviving_spouse_met_requirement;
    if (row.p6_child_type) formData.part_6.childType = row.p6_child_type;
    if (row.p6_other_children_exist)
      formData.part_6.otherChildrenExist = row.p6_other_children_exist;

    const spouses = parseSpouses(row.p6_spouses);
    if (spouses.length > 0) formData.part_6.claimantSpouses = spouses;

    const siblings = parseSiblings(row.p6_siblings);
    if (siblings.length > 0) formData.part_6.siblings = siblings;
  }

  if (["Grandchild", "Parent", "Grandparent"].includes(relationship)) {
    formData.part_7 = {};
    if (row.p7_relationship_type)
      formData.part_7.relationshipType = row.p7_relationship_type;
  }

  // Part 8 — Exposure
  if (row.exposure_options) {
    formData.part_8 = {
      exposureOptions: row.exposure_options
        .split(",")
        .map((o: string) => o.trim()),
      locations: parseLocations(row.locations),
    };
  }

  // Part 9 — Documents
  formData.part_9 = {
    uploadedDocuments: [],
    ldsChurchAssistance: row.lds_church_assistance === "true",
  };

  // Part 10 — Diseases
  if (row.diseases !== undefined) {
    formData.part_10 = { diseases: parseDiseases(row.diseases) };
  }

  // Part 11 — Medical Records
  if (row.medical_records_submitted) {
    formData.part_11 = {
      medicalRecordsSubmitted: row.medical_records_submitted === "true",
      resepClinicAssistance: row.resep_clinic_assistance || "NO",
      uploadedDocuments: [],
    };
    if (row.resep_clinic_name) {
      formData.part_11.resepClinicName = row.resep_clinic_name;
    }
  }

  // Part 12 — Prior Payments
  if (row.received_payment) {
    formData.part_12 = {
      receivedPayment: row.received_payment,
      eeoicpaClaim: row.eeoicpa_claim || "NO",
    };
    if (row.payment_details) {
      formData.part_12.paymentDetails = row.payment_details;
    }
  }

  // Part 13 — Attorney
  if (row.has_attorney) {
    formData.part_13 = { hasAttorney: row.has_attorney };
    if (row.attorney_details) {
      formData.part_13.attorneyDetails = row.attorney_details;
    }
  }

  // Part 16 — Signature
  if (row.signature_name) {
    formData.part_16 = {
      authorization: row.authorization === "true",
      signature: row.signature_name,
      signatureDate: today,
    };
  }

  return formData;
}

// ============================================================================
// STATE ABBREVIATION → FULL NAME
// ============================================================================

const STATE_MAP: Record<string, string> = {
  UT: "Utah",
  NV: "Nevada",
  AZ: "Arizona",
  NM: "New Mexico",
  CO: "Colorado",
  ID: "Idaho",
  MT: "Montana",
  WY: "Wyoming",
  OR: "Oregon",
  WA: "Washington",
  CA: "California",
  TX: "Texas",
};

function stateFullName(abbr: string): string {
  return STATE_MAP[abbr] || abbr;
}

// ============================================================================
// CLEANUP
// ============================================================================

async function cleanupTestUsers() {
  console.log("🧹 Cleaning up test users (@radiantclaims.test)...\n");

  const testUsers = await prisma.user.findMany({
    where: { email: { endsWith: TEST_EMAIL_DOMAIN } },
    select: { id: true, email: true },
  });

  if (testUsers.length === 0) {
    console.log("  No test users found.\n");
    return;
  }

  for (const user of testUsers) {
    try {
      // Delete subscription
      await prisma.serviceSubscription.deleteMany({
        where: { userId: user.id },
      });
      // Delete claimant (cascades to IntakeSession)
      await prisma.claimant.deleteMany({ where: { userId: user.id } });
      // Delete user
      await prisma.user.delete({ where: { id: user.id } });
      console.log(`  🗑️  Removed: ${user.email}`);
    } catch (e: any) {
      console.log(`  ⚠️  Could not remove ${user.email}: ${e.message}`);
    }
  }
  console.log(`\n  Removed ${testUsers.length} test users.\n`);
}

// ============================================================================
// SEED FROM CSV ROW
// ============================================================================

async function seedUser(row: Record<string, string>) {
  const email = `${row.email_prefix}${TEST_EMAIL_DOMAIN}`;
  const fullName = `${row.first_name} ${row.last_name}`.trim();

  // Check if already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`  ⏩ Skipped (exists): ${email}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(
    row.password || "TestPassword123!",
    10
  );

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: fullName,
      role: "CUSTOMER",
      emailVerified: new Date(),
    },
  });

  // Create claimant
  const claimant = await prisma.claimant.create({
    data: {
      firstName: row.first_name,
      lastName: row.last_name,
      email,
      phone: row.phone,
      dob: new Date(row.dob),
      address1: row.address1,
      city: row.city,
      county: row.county,
      state: row.state,
      postalCode: row.postal_code,
      claimType: (row.claim_type || "DOWNWINDER") as any,
      relationshipToClaimant: (row.relationship || "SELF") as any,
      userId: user.id,
    },
  });

  // Build form data from CSV
  const formData = buildFormData(row);

  // Create intake session
  await prisma.intakeSession.create({
    data: {
      claimantId: claimant.id,
      resumeToken: `test-${row.profile_id}-${Date.now()}`,
      currentStep: "REVIEW" as any,
      status: "IN_PROGRESS" as any,
      claimType: (row.claim_type || "DOWNWINDER") as any,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      lastActivityAt: new Date(),
      recaWorkflowStage: 16,
      recaWorkflowSection: "review",
      recaFormData: formData,
      recaCompletionPercent: row.category === "happy" ? 100 : 60,
      recaEligibilityData: {
        eligible: row.category === "happy",
        claimType: row.claim_type || "DOWNWINDER",
        relationship: row.relationship || "SELF",
      },
    },
  });

  // Create subscription (bypass Stripe)
  await prisma.serviceSubscription.create({
    data: {
      userId: user.id,
      tier: "DIY_PREP" as any,
      status: "ACTIVE" as any,
      setupFeePaid: true,
      setupFeeAmount: 499.0,
      setupFeePaidAt: new Date(),
      isInstallmentPlan: false,
      installmentPaymentCount: 1,
      installmentCompleted: true,
      stripeCustomerId: `test_cus_${row.profile_id}`,
    },
  });

  const icon = row.category === "happy" ? "✅" : "💥";
  console.log(`  ${icon} ${fullName}`);
  console.log(`     📧 ${email}`);
  console.log(`     📝 ${row.description}`);
  if (row.expected_result) {
    console.log(`     🎯 Expected: ${row.expected_result}`);
  }
  console.log();
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const isCleanup = args.includes("--cleanup");
  const isDryRun = args.includes("--dry-run");
  const fileIdx = args.indexOf("--file");
  const csvFile =
    fileIdx >= 0 && args[fileIdx + 1]
      ? args[fileIdx + 1]
      : path.join(__dirname, "test-profiles.csv");

  if (isCleanup) {
    await cleanupTestUsers();
    await prisma.$disconnect();
    return;
  }

  // Read CSV
  if (!fs.existsSync(csvFile)) {
    console.error(`❌ CSV file not found: ${csvFile}`);
    console.error(`   Create it or specify: --file path/to/profiles.csv`);
    process.exit(1);
  }

  const content = fs.readFileSync(csvFile, "utf-8");
  const rows = parseCSV(content);

  if (rows.length === 0) {
    console.error("❌ No data rows found in CSV.");
    process.exit(1);
  }

  console.log(
    `\n📂 Loaded ${rows.length} profiles from ${path.basename(csvFile)}\n`
  );

  if (isDryRun) {
    console.log("🔍 DRY RUN — showing what would be created:\n");
    for (const row of rows) {
      const email = `${row.email_prefix}${TEST_EMAIL_DOMAIN}`;
      const fullName = `${row.first_name} ${row.last_name}`.trim();
      const icon = row.category === "happy" ? "✅" : "💥";
      console.log(`  ${icon} ${fullName} (${email})`);
      console.log(`     ${row.description}`);
      console.log(
        `     Relationship: ${row.relationship} | Diseases: ${row.diseases || "none"}`
      );
      console.log(`     Expected: ${row.expected_result || "N/A"}`);
      console.log();
    }
    console.log(`Total: ${rows.length} profiles would be created.`);
    await prisma.$disconnect();
    return;
  }

  // Clean existing first
  await cleanupTestUsers();

  // Seed
  console.log("🌱 Seeding test users from CSV...\n");

  const happyRows = rows.filter((r) => r.category === "happy");
  const breakingRows = rows.filter((r) => r.category === "breaking");

  if (happyRows.length > 0) {
    console.log(
      "═══════════════════════════════════════════════════════════════"
    );
    console.log("  HAPPY PATH USERS");
    console.log(
      "═══════════════════════════════════════════════════════════════\n"
    );
    for (const row of happyRows) {
      await seedUser(row);
    }
  }

  if (breakingRows.length > 0) {
    console.log(
      "═══════════════════════════════════════════════════════════════"
    );
    console.log("  BREAKING / CONTRADICTION USERS");
    console.log(
      "═══════════════════════════════════════════════════════════════\n"
    );
    for (const row of breakingRows) {
      await seedUser(row);
    }
  }

  // Summary
  console.log(
    "═══════════════════════════════════════════════════════════════"
  );
  console.log(`  ALL TEST ACCOUNTS (password: TestPassword123!)`);
  console.log(
    "═══════════════════════════════════════════════════════════════\n"
  );

  for (const row of rows) {
    const email = `${row.email_prefix}${TEST_EMAIL_DOMAIN}`;
    const fullName = `${row.first_name} ${row.last_name}`.trim();
    console.log(`  ${email.padEnd(45)} ${fullName}`);
  }

  console.log(`\n  Total: ${rows.length} test users created`);
  console.log(
    "═══════════════════════════════════════════════════════════════\n"
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ Seed failed:", e);
  prisma.$disconnect();
  process.exit(1);
});
