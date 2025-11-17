#!/usr/bin/env npx tsx
/**
 * Import hospital contacts from CMS scraper output
 *
 * Usage:
 *   DATABASE_URL="..." npx tsx scripts/import-hospitals.ts reca_hospitals_contacts.csv
 */

import { PrismaClient, ResourceType } from "@prisma/client";
import * as fs from "fs";
import * as csv from "csv-parse/sync";

const prisma = new PrismaClient();

interface HospitalCSV {
  State: string;
  County: string;
  InstitutionName: string;
  InstitutionType: string;
  RecordTypes: string;
  Status: string;
  Address: string;
  Phone: string;
  Website: string;
  HospitalType: string;
  Ownership: string;
  EmergencyServices: string;
  MedicareProvider: string;
  Source: string;
  SourceURL: string;
  ExtractedDate: string;
}

function parseAddress(addressStr: string) {
  // Address format: "1034 NORTH 500 WEST , UT 84604"
  // OR: "1034 NORTH 500 WEST PROVO, UT 84604"

  if (!addressStr) return { address: null, city: null, zipCode: null };

  // Try to extract zip code (5 digits)
  const zipMatch = addressStr.match(/\b(\d{5})\b/);
  const zipCode = zipMatch ? zipMatch[1] : null;

  // Try to extract city (word(s) before state code)
  const cityMatch = addressStr.match(/([A-Z\s]+),?\s+[A-Z]{2}\s+\d{5}/);
  let city = null;
  let address = addressStr;

  if (cityMatch) {
    const parts = addressStr.split(",");
    if (parts.length >= 2) {
      address = parts[0].trim();
      // Extract city from the second part
      const secondPart = parts[1].trim();
      const cityParts = secondPart.split(/\s+[A-Z]{2}\s+/);
      if (cityParts.length > 0) {
        city = cityParts[0].trim();
      }
    }
  }

  return {
    address: address || null,
    city: city || null,
    zipCode,
  };
}

function transformHospital(row: HospitalCSV) {
  const { address, city, zipCode } = parseAddress(row.Address);

  // Parse document types
  const documentTypesProvided = row.RecordTypes
    ? row.RecordTypes.split(",").map((s) =>
        s.trim().toUpperCase().replace(/ /g, "_")
      )
    : ["MEDICAL_RECORDS"];

  // Build notes
  const noteParts = [];
  if (row.HospitalType) noteParts.push(`Type: ${row.HospitalType}`);
  if (row.Ownership) noteParts.push(`Ownership: ${row.Ownership}`);
  if (row.EmergencyServices === "Yes") noteParts.push("Has emergency services");
  if (row.MedicareProvider)
    noteParts.push(`Medicare Provider ID: ${row.MedicareProvider}`);

  return {
    state: row.State.toUpperCase(),
    county: row.County || null,
    resourceType: "HOSPITAL" as ResourceType,
    name: row.InstitutionName,
    department: "Medical Records Department",
    address,
    address2: null,
    city,
    stateCode: row.State.toUpperCase(),
    zipCode,
    phone: row.Phone || null,
    phoneTollFree: null,
    fax: null,
    website: row.Website || null,
    email: null,
    notes: noteParts.length > 0 ? noteParts.join(". ") : null,
    documentTypesProvided,
    certificationAvailable: true,
    processingTimeDays: 14, // Typical for medical records
    specialInstructions:
      "Contact Medical Records Department for historical records. May require signed HIPAA authorization.",
    isTribal: false,
    tribalAffiliation: null,
    purposeDescription:
      "Contact this hospital to obtain medical records, pathology reports, and operative notes for RECA claims.",
    whatToBring: [
      "Photo ID",
      "HIPAA authorization form",
      "Proof of relationship if requesting for family member",
    ],
    appointmentRequired: false,
    acceptsMailRequests: true,
    acceptsOnlineRequests: false,
    estimatedCost: 25.0, // Typical medical records fee
  };
}

async function importHospitals(filePath: string) {
  console.log(`📂 Loading hospitals from: ${filePath}\n`);

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const records: HospitalCSV[] = csv.parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`   Found ${records.length} hospital records`);
  console.log(`🔄 Transforming and importing...\n`);

  const results = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[],
  };

  for (const row of records) {
    try {
      if (!row.State || !row.InstitutionName) {
        results.errors.push(`Skipped: Missing state or name`);
        results.skipped++;
        continue;
      }

      const contact = transformHospital(row);

      // Check if exists
      const existing = await prisma.documentResource.findFirst({
        where: {
          name: contact.name,
          state: contact.state,
        },
      });

      if (existing) {
        await prisma.documentResource.update({
          where: { id: existing.id },
          data: contact,
        });
        results.updated++;
      } else {
        await prisma.documentResource.create({
          data: contact,
        });
        results.created++;
      }

      // Progress indicator
      if ((results.created + results.updated + results.skipped) % 20 === 0) {
        process.stdout.write(".");
      }
    } catch (error) {
      results.errors.push(
        `Error importing ${row.InstitutionName}: ${error instanceof Error ? error.message : "Unknown"}`
      );
      results.skipped++;
    }
  }

  console.log("\n\n✅ Import completed!");
  console.log(`   Created: ${results.created}`);
  console.log(`   Updated: ${results.updated}`);
  console.log(`   Skipped: ${results.skipped}`);

  if (results.errors.length > 0) {
    console.log(`\n❌ Errors (${results.errors.length}):`);
    results.errors.slice(0, 5).forEach((err) => console.log(`   - ${err}`));
    if (results.errors.length > 5) {
      console.log(`   ... and ${results.errors.length - 5} more`);
    }
  }

  // Show summary by state
  console.log("\n📊 Summary by state:");
  const byState = await prisma.documentResource.groupBy({
    by: ["state"],
    where: {
      resourceType: "HOSPITAL",
    },
    _count: true,
  });

  byState.forEach((item) => {
    console.log(`   ${item.state}: ${item._count} hospitals`);
  });
}

async function main() {
  try {
    const filePath = process.argv[2] || "reca_hospitals_contacts.csv";

    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      console.error("\nUsage: npx tsx scripts/import-hospitals.ts <csv-file>");
      process.exit(1);
    }

    await importHospitals(filePath);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
