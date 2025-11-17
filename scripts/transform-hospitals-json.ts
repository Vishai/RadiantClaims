#!/usr/bin/env npx tsx
/**
 * Transform hospital CSV to JSON format ready for import
 * Creates a JSON file you can import via the admin API or directly
 */

import * as fs from "fs";
import * as csv from "csv-parse/sync";

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
  if (!addressStr) return { address: null, city: null, zipCode: null };

  const zipMatch = addressStr.match(/\b(\d{5})\b/);
  const zipCode = zipMatch ? zipMatch[1] : null;

  let city = null;
  let address = addressStr;

  const parts = addressStr.split(",");
  if (parts.length >= 2) {
    address = parts[0].trim();
    const secondPart = parts[1].trim();
    const cityParts = secondPart.split(/\s+[A-Z]{2}\s+/);
    if (cityParts.length > 0) {
      city = cityParts[0].trim();
    }
  }

  return { address: address || null, city: city || null, zipCode };
}

function transformHospital(row: HospitalCSV) {
  const { address, city, zipCode } = parseAddress(row.Address);

  const documentTypesProvided = row.RecordTypes
    ? row.RecordTypes.split(",").map((s) =>
        s.trim().toUpperCase().replace(/ /g, "_")
      )
    : ["MEDICAL_RECORDS"];

  const noteParts = [];
  if (row.HospitalType) noteParts.push(`Type: ${row.HospitalType}`);
  if (row.Ownership) noteParts.push(`Ownership: ${row.Ownership}`);
  if (row.EmergencyServices === "Yes") noteParts.push("Has emergency services");
  if (row.MedicareProvider)
    noteParts.push(`Medicare Provider ID: ${row.MedicareProvider}`);

  return {
    state: row.State.toUpperCase(),
    county: row.County || null,
    resourceType: "HOSPITAL",
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
    processingTimeDays: 14,
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
    estimatedCost: 25.0,
  };
}

function main() {
  const inputFile =
    process.argv[2] || "contact-gathering/reca_hospitals_contacts.csv";
  const outputFile = process.argv[3] || "hospitals_import.json";

  console.log(`📂 Loading: ${inputFile}`);

  const fileContent = fs.readFileSync(inputFile, "utf-8");
  const records: HospitalCSV[] = csv.parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`   Found ${records.length} hospitals`);
  console.log(`🔄 Transforming...`);

  const transformed = records.map(transformHospital);

  console.log(`💾 Saving to: ${outputFile}`);
  fs.writeFileSync(
    outputFile,
    JSON.stringify({ resources: transformed }, null, 2)
  );

  console.log(`\n✅ Done! Created ${transformed.length} hospital contacts`);
  console.log(`\nTo import:`);
  console.log(`1. Via API: POST /api/admin/resources/import with this JSON`);
  console.log(`2. Or use: npx tsx scripts/seed-contacts.ts ${inputFile}`);
}

main();
