#!/usr/bin/env npx tsx
/**
 * Seed initial contact resources into the database
 *
 * Usage:
 *   npx tsx scripts/seed-contacts.ts
 */

import { PrismaClient, ResourceType } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import * as csv from "csv-parse/sync";

const prisma = new PrismaClient();

interface CSVContact {
  State?: string;
  StateCode?: string;
  County?: string;
  InstitutionName?: string;
  Name?: string;
  InstitutionType?: string;
  Department?: string;
  Address?: string;
  Address2?: string;
  City?: string;
  ZipCode?: string;
  PostalCode?: string;
  Phone?: string;
  PhoneTollFree?: string;
  Fax?: string;
  Website?: string;
  Email?: string;
  Notes?: string;
  RecordTypes?: string;
  CertificationAvailable?: string;
  ProcessingTimeDays?: string;
  SpecialInstructions?: string;
  IsTribal?: string;
  TribalAffiliation?: string;
  PurposeDescription?: string;
  WhatToBring?: string;
  AppointmentRequired?: string;
  AcceptsMailRequests?: string;
  AcceptsOnlineRequests?: string;
  EstimatedCost?: string;
}

const RESOURCE_TYPE_MAP: Record<string, ResourceType> = {
  vital_records: "VITAL_RECORDS",
  county_clerk: "COUNTY_CLERK",
  county_recorder: "COUNTY_RECORDER",
  county_assessor: "COUNTY_ASSESSOR",
  hospital: "HOSPITAL",
  cancer_registry: "CANCER_REGISTRY",
  school_district: "SCHOOL_DISTRICT",
  tribal_office: "TRIBAL_OFFICE",
  tribal_vital_records: "TRIBAL_VITAL_RECORDS",
};

function loadCSV(filePath: string): CSVContact[] {
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const records = csv.parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });
  return records;
}

function transformContact(row: CSVContact) {
  // Map resource type
  const resourceTypeRaw = (row.InstitutionType || "")
    .toLowerCase()
    .replace(/ /g, "_");
  const resourceType = RESOURCE_TYPE_MAP[resourceTypeRaw] || "VITAL_RECORDS";

  // Parse document types
  const documentTypesProvided = row.RecordTypes
    ? row.RecordTypes.split(",").map((s) => s.trim())
    : [];

  // Parse what to bring
  const whatToBring = row.WhatToBring
    ? row.WhatToBring.split(",").map((s) => s.trim())
    : [];

  // Parse estimated cost
  let estimatedCost: number | null = null;
  if (row.EstimatedCost) {
    const costStr = row.EstimatedCost.replace("$", "").trim();
    const parsed = parseFloat(costStr);
    if (!isNaN(parsed)) {
      estimatedCost = parsed;
    }
  }

  // Parse processing time
  let processingTimeDays: number | null = null;
  if (row.ProcessingTimeDays) {
    const parsed = parseInt(row.ProcessingTimeDays);
    if (!isNaN(parsed)) {
      processingTimeDays = parsed;
    }
  }

  return {
    state: (row.State || row.StateCode || "").toUpperCase(),
    county: row.County || null,
    resourceType,
    name: row.InstitutionName || row.Name || "",
    department: row.Department || null,
    address: row.Address || null,
    address2: row.Address2 || null,
    city: row.City || null,
    stateCode: (row.StateCode || row.State || "").toUpperCase(),
    zipCode: row.ZipCode || row.PostalCode || null,
    phone: row.Phone || null,
    phoneTollFree: row.PhoneTollFree || null,
    fax: row.Fax || null,
    website: row.Website || null,
    email: row.Email || null,
    notes: row.Notes || null,
    documentTypesProvided,
    certificationAvailable:
      row.CertificationAvailable?.toLowerCase() !== "false",
    processingTimeDays,
    specialInstructions: row.SpecialInstructions || null,
    isTribal: row.IsTribal?.toLowerCase() === "true",
    tribalAffiliation: row.TribalAffiliation || null,
    purposeDescription: row.PurposeDescription || null,
    whatToBring,
    appointmentRequired: row.AppointmentRequired?.toLowerCase() === "true",
    acceptsMailRequests: row.AcceptsMailRequests?.toLowerCase() !== "false",
    acceptsOnlineRequests: row.AcceptsOnlineRequests?.toLowerCase() === "true",
    estimatedCost,
  };
}

async function importContacts(contacts: ReturnType<typeof transformContact>[]) {
  const results = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[],
  };

  for (const contact of contacts) {
    try {
      if (!contact.state || !contact.name) {
        results.errors.push(
          `Skipped contact: Missing required fields (state: ${contact.state}, name: ${contact.name})`
        );
        results.skipped++;
        continue;
      }

      // Check if exists
      const existing = await prisma.documentResource.findFirst({
        where: {
          name: contact.name,
          state: contact.state,
          county: contact.county,
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
    } catch (error) {
      results.errors.push(
        `Error importing ${contact.name}: ${error instanceof Error ? error.message : "Unknown"}`
      );
      results.skipped++;
    }
  }

  return results;
}

async function seedSampleContacts() {
  console.log("📝 Seeding sample RECA institutional contacts...\n");

  // Sample contacts for testing
  const sampleContacts = [
    {
      state: "UT",
      county: "Washington",
      resourceType: "VITAL_RECORDS" as ResourceType,
      name: "Washington County Clerk",
      department: "Vital Records Division",
      address: "111 E Tabernacle St",
      city: "St George",
      stateCode: "UT",
      zipCode: "84770",
      phone: "(435) 301-7200",
      email: "clerk@washco.utah.gov",
      website: "https://www.washco.utah.gov/clerk",
      notes: "Handles birth and death certificates for Washington County",
      documentTypesProvided: ["BIRTH_CERTIFICATE", "DEATH_CERTIFICATE"],
      certificationAvailable: true,
      processingTimeDays: 10,
      specialInstructions: "Bring valid photo ID for in-person requests",
      whatToBring: [
        "Photo ID",
        "Proof of relationship",
        "Payment ($20 check or cash)",
      ],
      appointmentRequired: false,
      acceptsMailRequests: true,
      acceptsOnlineRequests: true,
      estimatedCost: 20.0,
      purposeDescription:
        "Visit this office to obtain certified birth or death certificates for RECA claims",
      isTribal: false,
      tribalAffiliation: null,
      address2: null,
      phoneTollFree: null,
      fax: null,
    },
    {
      state: "NV",
      county: "Clark",
      resourceType: "VITAL_RECORDS" as ResourceType,
      name: "Clark County Recorder",
      department: "Vital Records Section",
      address: "500 S Grand Central Pkwy",
      city: "Las Vegas",
      stateCode: "NV",
      zipCode: "89155",
      phone: "(702) 671-0600",
      email: "recorder@clarkcountynv.gov",
      website: "https://www.clarkcountynv.gov/recorder",
      notes: "Handles vital records for Las Vegas and Clark County",
      documentTypesProvided: [
        "BIRTH_CERTIFICATE",
        "DEATH_CERTIFICATE",
        "MARRIAGE_CERTIFICATE",
      ],
      certificationAvailable: true,
      processingTimeDays: 7,
      acceptsMailRequests: true,
      acceptsOnlineRequests: true,
      estimatedCost: 25.0,
      appointmentRequired: false,
      isTribal: false,
      tribalAffiliation: null,
      address2: null,
      phoneTollFree: null,
      fax: null,
      specialInstructions: null,
      whatToBring: [],
      purposeDescription: null,
    },
    {
      state: "UT",
      county: null,
      resourceType: "CANCER_REGISTRY" as ResourceType,
      name: "Utah Cancer Registry",
      department: "Utah Department of Health and Human Services",
      address: "288 North 1460 West",
      city: "Salt Lake City",
      stateCode: "UT",
      zipCode: "84116",
      phone: "(801) 538-6105",
      email: "ucr@utah.gov",
      website: "https://ucr.utah.gov",
      notes:
        "State cancer registry that can confirm cancer diagnoses for RECA claims",
      documentTypesProvided: ["CANCER_REGISTRY_REPORT"],
      certificationAvailable: true,
      processingTimeDays: 14,
      acceptsMailRequests: true,
      acceptsOnlineRequests: false,
      estimatedCost: 0.0,
      appointmentRequired: false,
      specialInstructions: "Requires signed medical release form from claimant",
      whatToBring: ["Medical release authorization", "Photo ID"],
      isTribal: false,
      tribalAffiliation: null,
      address2: null,
      phoneTollFree: null,
      fax: null,
      purposeDescription:
        "Contact to verify cancer diagnoses for RECA eligibility",
    },
  ];

  const results = await importContacts(sampleContacts);

  console.log("✅ Seed completed!");
  console.log(`   Created: ${results.created}`);
  console.log(`   Updated: ${results.updated}`);
  console.log(`   Skipped: ${results.skipped}`);

  if (results.errors.length > 0) {
    console.log(`\n❌ Errors (${results.errors.length}):`);
    results.errors.forEach((err) => console.log(`   - ${err}`));
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.length > 0 && args[0].endsWith(".csv")) {
      // Import from CSV file
      const csvPath = args[0];
      console.log(`📂 Loading contacts from: ${csvPath}\n`);

      const csvData = loadCSV(csvPath);
      console.log(`   Found ${csvData.length} rows`);

      console.log(`🔄 Transforming data...`);
      const contacts = csvData.map(transformContact);

      console.log(`📥 Importing to database...`);
      const results = await importContacts(contacts);

      console.log("\n✅ Import completed!");
      console.log(`   Created: ${results.created}`);
      console.log(`   Updated: ${results.updated}`);
      console.log(`   Skipped: ${results.skipped}`);

      if (results.errors.length > 0) {
        console.log(`\n❌ Errors (${results.errors.length}):`);
        results.errors
          .slice(0, 10)
          .forEach((err) => console.log(`   - ${err}`));
        if (results.errors.length > 10) {
          console.log(`   ... and ${results.errors.length - 10} more`);
        }
      }
    } else {
      // Seed sample data
      await seedSampleContacts();
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
