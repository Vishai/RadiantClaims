import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const resources = [
  // ============================================================================
  // UTAH RESOURCES
  // ============================================================================

  // Utah State-Wide Vital Records
  {
    state: "UT",
    county: null,
    resourceType: "VITAL_RECORDS",
    name: "Utah Office of Vital Records & Statistics",
    department: "Member and Statistical Records Division",
    address: "288 North 1460 West",
    city: "Salt Lake City",
    stateCode: "UT",
    zipCode: "84116",
    phone: "(801) 538-6105",
    phoneTollFree: null,
    website: "https://vitalrecords.utah.gov",
    email: "vitalrecords@utah.gov",
    notes:
      "Birth and death certificates from 1905 to present. Allow 4-6 weeks for processing.",
    documentTypesProvided: [
      "BIRTH_CERTIFICATE",
      "DEATH_CERTIFICATE",
      "MARRIAGE_CERTIFICATE",
    ],
    certificationAvailable: true,
    processingTimeDays: 30,
    specialInstructions:
      "ID required. Payment by check, money order, or credit card. Online ordering available.",
    purposeDescription:
      "Visit this office to obtain certified birth certificates, death certificates, and marriage certificates for your RECA claim. Certified copies are required by the Department of Justice for proof of identity and relationship to the claimant.",
    whatToBring: [
      "Valid government-issued photo ID (driver's license, passport, or state ID)",
      "Proof of relationship to person on certificate (if requesting someone else's record)",
      "Completed application form (available on website or at office)",
      "$20 per certificate (cash, check, or money order)",
      "Specific information about the record (full name, date of event, location)",
    ],
    appointmentRequired: false,
    acceptsMailRequests: true,
    acceptsOnlineRequests: true,
    estimatedCost: 20.0,
  },

  // Washington County, UT (St. George area)
  {
    state: "UT",
    county: "Washington",
    resourceType: "COUNTY_CLERK",
    name: "Washington County Clerk",
    department: "Clerk's Office",
    address: "111 East Tabernacle Street",
    city: "St. George",
    stateCode: "UT",
    zipCode: "84770",
    phone: "(435) 301-5100",
    website: "https://www.washco.utah.gov/clerks-office",
    email: "countyclerk@washco.utah.gov",
    notes: "Marriage records, property records, and historical documents.",
    documentTypesProvided: [
      "MARRIAGE_CERTIFICATE",
      "PROPERTY_RECORDS",
      "COURT_RECORDS",
    ],
    certificationAvailable: true,
    processingTimeDays: 14,
  },

  {
    state: "UT",
    county: "Washington",
    resourceType: "COUNTY_RECORDER",
    name: "Washington County Recorder",
    department: "Recorder's Office",
    address: "111 East Tabernacle Street",
    city: "St. George",
    stateCode: "UT",
    zipCode: "84770",
    phone: "(435) 301-5185",
    website: "https://www.washco.utah.gov/recorder",
    email: "recorder@washco.utah.gov",
    notes: "Property deeds, mortgages, and land records dating back to 1860s.",
    documentTypesProvided: ["PROPERTY_RECORDS", "DEED_RECORDS"],
    certificationAvailable: true,
    processingTimeDays: 7,
  },

  {
    state: "UT",
    county: "Washington",
    resourceType: "HOSPITAL",
    name: "Intermountain St. George Regional Hospital",
    department: "Medical Records Department",
    address: "1380 East Medical Center Drive",
    city: "St. George",
    stateCode: "UT",
    zipCode: "84790",
    phone: "(435) 251-1000",
    website:
      "https://intermountainhealthcare.org/locations/st-george-regional-hospital",
    notes:
      "Operating since 1953. Request medical records through their patient portal or by mail.",
    documentTypesProvided: ["MEDICAL_RECORDS", "PATHOLOGY_REPORT"],
    certificationAvailable: true,
    processingTimeDays: 21,
    specialInstructions:
      "HIPAA authorization form required. $25 fee for copies.",
    purposeDescription:
      "Contact this hospital to obtain medical records, pathology reports, and cancer diagnosis documentation for your RECA claim. These records are crucial for proving the compensable disease requirement. The Department of Justice requires official medical documentation showing cancer diagnosis and treatment.",
    whatToBring: [
      "Valid government-issued photo ID",
      "Completed HIPAA authorization form (download from website or request by phone)",
      "Social Security number or patient account number",
      "Specific dates of treatment or approximate time period",
      "$25 fee for medical record copies (check, money order, or credit card)",
      "If requesting for deceased patient: Death certificate and proof of relationship/legal authority",
    ],
    appointmentRequired: false,
    acceptsMailRequests: true,
    acceptsOnlineRequests: true,
    estimatedCost: 25.0,
  },

  // Iron County, UT (Cedar City area)
  {
    state: "UT",
    county: "Iron",
    resourceType: "COUNTY_CLERK",
    name: "Iron County Clerk",
    address: "68 South 100 East",
    city: "Cedar City",
    stateCode: "UT",
    zipCode: "84720",
    phone: "(435) 477-8340",
    website: "https://www.ironcounty.net/departments/clerk",
    documentTypesProvided: ["MARRIAGE_CERTIFICATE", "PROPERTY_RECORDS"],
    certificationAvailable: true,
    processingTimeDays: 14,
  },

  // Millard County, UT
  {
    state: "UT",
    county: "Millard",
    resourceType: "COUNTY_CLERK",
    name: "Millard County Clerk",
    address: "50 South Main Street",
    city: "Fillmore",
    stateCode: "UT",
    zipCode: "84631",
    phone: "(435) 743-6223",
    website: "https://www.millardcounty.org",
    documentTypesProvided: ["MARRIAGE_CERTIFICATE", "PROPERTY_RECORDS"],
    certificationAvailable: true,
    processingTimeDays: 14,
  },

  // Utah State Archives
  {
    state: "UT",
    county: null,
    resourceType: "STATE_ARCHIVES",
    name: "Utah State Archives",
    department: "Research Center",
    address: "346 South Rio Grande Street",
    city: "Salt Lake City",
    stateCode: "UT",
    zipCode: "84101",
    phone: "(801) 531-3850",
    website: "https://archives.utah.gov",
    email: "research@utah.gov",
    notes:
      "Historical records including old school records, census data, and government documents from 1850s-1970s.",
    documentTypesProvided: [
      "SCHOOL_RECORDS",
      "HISTORICAL_DOCUMENTS",
      "CENSUS_RECORDS",
    ],
    certificationAvailable: false,
    processingTimeDays: 30,
    specialInstructions:
      "Some records require in-person research. Call ahead for record availability.",
  },

  // Utah Cancer Registry
  {
    state: "UT",
    county: null,
    resourceType: "CANCER_REGISTRY",
    name: "Utah Cancer Registry",
    department: "Huntsman Cancer Institute",
    address: "2000 Circle of Hope",
    city: "Salt Lake City",
    stateCode: "UT",
    zipCode: "84112",
    phone: "(801) 587-9520",
    website:
      "https://healthcare.utah.edu/huntsmancancerinstitute/research/updb/utah-cancer-registry",
    email: "cancer.registry@hci.utah.edu",
    notes:
      "Cancer incidence data from 1966 to present. Can verify cancer diagnosis for RECA claims.",
    documentTypesProvided: ["CANCER_RECORDS", "DIAGNOSIS_VERIFICATION"],
    certificationAvailable: true,
    processingTimeDays: 45,
    specialInstructions:
      "Patient authorization required. Used for RECA claim verification.",
  },

  // ============================================================================
  // NEVADA RESOURCES
  // ============================================================================

  // Nevada State-Wide Vital Records
  {
    state: "NV",
    county: null,
    resourceType: "VITAL_RECORDS",
    name: "Nevada Office of Vital Records",
    department: "Bureau of Health Care Quality and Compliance",
    address: "4150 Technology Way, Suite 104",
    city: "Carson City",
    stateCode: "NV",
    zipCode: "89706",
    phone: "(775) 684-4242",
    website: "https://dpbh.nv.gov/Reg/VitalRecords/Vital_Records_-_Home",
    notes: "Birth and death certificates from 1911 to present.",
    documentTypesProvided: ["BIRTH_CERTIFICATE", "DEATH_CERTIFICATE"],
    certificationAvailable: true,
    processingTimeDays: 21,
    specialInstructions:
      "Online ordering available. Expedited service for additional fee.",
  },

  // Clark County, NV (Las Vegas area - downwinder affected)
  {
    state: "NV",
    county: "Clark",
    resourceType: "COUNTY_CLERK",
    name: "Clark County Clerk",
    department: "Recorder's Office",
    address: "500 South Grand Central Parkway",
    city: "Las Vegas",
    stateCode: "NV",
    zipCode: "89155",
    phone: "(702) 671-0600",
    website: "https://www.clarkcountynv.gov/government/departments/clerk",
    documentTypesProvided: ["MARRIAGE_CERTIFICATE", "PROPERTY_RECORDS"],
    certificationAvailable: true,
    processingTimeDays: 14,
  },

  // Lincoln County, NV (Pioche area - heavily affected)
  {
    state: "NV",
    county: "Lincoln",
    resourceType: "COUNTY_CLERK",
    name: "Lincoln County Clerk",
    address: "181 Main Street, Room 301",
    city: "Pioche",
    stateCode: "NV",
    zipCode: "89043",
    phone: "(775) 962-5390",
    website: "https://www.lincolncountynv.gov",
    notes: "Closest county to Nevada Test Site. Many RECA-eligible residents.",
    documentTypesProvided: [
      "MARRIAGE_CERTIFICATE",
      "PROPERTY_RECORDS",
      "VITAL_RECORDS",
    ],
    certificationAvailable: true,
    processingTimeDays: 14,
  },

  // Nye County, NV (includes parts of test site)
  {
    state: "NV",
    county: "Nye",
    resourceType: "COUNTY_CLERK",
    name: "Nye County Clerk",
    address: "101 Radar Road",
    city: "Tonopah",
    stateCode: "NV",
    zipCode: "89049",
    phone: "(775) 482-8127",
    website: "https://www.nyecounty.net",
    documentTypesProvided: ["MARRIAGE_CERTIFICATE", "PROPERTY_RECORDS"],
    certificationAvailable: true,
    processingTimeDays: 14,
  },

  // ============================================================================
  // ARIZONA RESOURCES
  // ============================================================================

  // Arizona State-Wide Vital Records
  {
    state: "AZ",
    county: null,
    resourceType: "VITAL_RECORDS",
    name: "Arizona Office of Vital Records",
    department: "Bureau of Public Health Statistics",
    address: "1818 West Adams Street",
    city: "Phoenix",
    stateCode: "AZ",
    zipCode: "85007",
    phone: "(602) 364-1300",
    website: "https://azdhs.gov/licensing/vital-records",
    notes: "Birth and death certificates from 1909 to present.",
    documentTypesProvided: ["BIRTH_CERTIFICATE", "DEATH_CERTIFICATE"],
    certificationAvailable: true,
    processingTimeDays: 28,
  },

  // Coconino County, AZ (Flagstaff area - downwinder affected)
  {
    state: "AZ",
    county: "Coconino",
    resourceType: "COUNTY_RECORDER",
    name: "Coconino County Recorder",
    address: "110 East Cherry Avenue",
    city: "Flagstaff",
    stateCode: "AZ",
    zipCode: "86001",
    phone: "(928) 679-7850",
    website: "https://www.coconino.az.gov/recorder",
    documentTypesProvided: ["PROPERTY_RECORDS", "DEED_RECORDS"],
    certificationAvailable: true,
    processingTimeDays: 10,
  },

  // Mohave County, AZ (border with Nevada - affected area)
  {
    state: "AZ",
    county: "Mohave",
    resourceType: "COUNTY_RECORDER",
    name: "Mohave County Recorder",
    address: "700 West Beale Street",
    city: "Kingman",
    stateCode: "AZ",
    zipCode: "86401",
    phone: "(928) 753-0703",
    website: "https://www.mohavecounty.us/depts/recorder",
    documentTypesProvided: ["PROPERTY_RECORDS", "MARRIAGE_CERTIFICATE"],
    certificationAvailable: true,
    processingTimeDays: 14,
  },

  // Navajo Nation (Tribal - spans AZ, NM, UT)
  {
    state: "AZ",
    county: null,
    resourceType: "TRIBAL_VITAL_RECORDS",
    name: "Navajo Nation Vital Records",
    department: "Office of Vital Records and Identification",
    address: "Highway 264",
    city: "Window Rock",
    stateCode: "AZ",
    zipCode: "86515",
    phone: "(928) 871-6941",
    website: "https://www.navajo-nsn.gov",
    notes: "Serves Navajo Nation members across Arizona, New Mexico, and Utah.",
    documentTypesProvided: [
      "BIRTH_CERTIFICATE",
      "DEATH_CERTIFICATE",
      "TRIBAL_ENROLLMENT",
    ],
    certificationAvailable: true,
    processingTimeDays: 30,
    isTribal: true,
    tribalAffiliation: "Navajo Nation",
    specialInstructions:
      "Tribal enrollment documentation may be required. Serves one of the largest RECA claimant populations.",
  },

  // ============================================================================
  // IDAHO RESOURCES
  // ============================================================================

  // Idaho State-Wide Vital Records
  {
    state: "ID",
    county: null,
    resourceType: "VITAL_RECORDS",
    name: "Idaho Vital Records",
    department: "Bureau of Vital Records and Health Statistics",
    address: "450 West State Street, 1st Floor",
    city: "Boise",
    stateCode: "ID",
    zipCode: "83702",
    phone: "(208) 334-5988",
    website:
      "https://healthandwelfare.idaho.gov/services-programs/vital-records",
    documentTypesProvided: [
      "BIRTH_CERTIFICATE",
      "DEATH_CERTIFICATE",
      "MARRIAGE_CERTIFICATE",
    ],
    certificationAvailable: true,
    processingTimeDays: 21,
  },

  // ============================================================================
  // NEW MEXICO RESOURCES
  // ============================================================================

  // New Mexico State-Wide Vital Records
  {
    state: "NM",
    county: null,
    resourceType: "VITAL_RECORDS",
    name: "New Mexico Vital Records",
    department: "Bureau of Vital Records and Health Statistics",
    address: "1105 St. Francis Drive",
    city: "Santa Fe",
    stateCode: "NM",
    zipCode: "87502",
    phone: "(505) 827-0121",
    website: "https://www.nmhealth.org/about/erd/bvrhs",
    documentTypesProvided: ["BIRTH_CERTIFICATE", "DEATH_CERTIFICATE"],
    certificationAvailable: true,
    processingTimeDays: 30,
  },

  // Sandoval County, NM
  {
    state: "NM",
    county: "Sandoval",
    resourceType: "COUNTY_CLERK",
    name: "Sandoval County Clerk",
    address: "1500 Idalia Road, Building A",
    city: "Bernalillo",
    stateCode: "NM",
    zipCode: "87004",
    phone: "(505) 867-7572",
    website: "https://www.sandovalcountynm.gov/clerk",
    documentTypesProvided: ["MARRIAGE_CERTIFICATE", "PROPERTY_RECORDS"],
    certificationAvailable: true,
    processingTimeDays: 14,
  },

  // ============================================================================
  // ADDITIONAL USEFUL RESOURCES (ALL STATES)
  // ============================================================================

  // Social Security Administration
  {
    state: "UT",
    county: null,
    resourceType: "FEDERAL_ARCHIVES",
    name: "Social Security Administration",
    department: "Office of Central Records Operations",
    address: "P.O. Box 17769",
    city: "Baltimore",
    stateCode: "MD",
    zipCode: "21235",
    phoneTollFree: "(800) 772-1213",
    website: "https://www.ssa.gov",
    notes:
      "Can provide verification of earnings records, death records, and SSN verification. Useful for RECA claims.",
    documentTypesProvided: [
      "SSN_VERIFICATION",
      "DEATH_VERIFICATION",
      "EARNINGS_RECORDS",
    ],
    certificationAvailable: true,
    processingTimeDays: 60,
  },
];

async function main() {
  console.log("🌱 Seeding document resources...");

  // Clear existing resources
  await prisma.documentResource.deleteMany({});
  console.log("🗑️  Cleared existing resources");

  // Create new resources
  let created = 0;
  for (const resource of resources) {
    await prisma.documentResource.create({
      data: resource,
    });
    created++;
    console.log(
      `✅ Created: ${resource.name} (${resource.state}${resource.county ? ` - ${resource.county} County` : ""})`
    );
  }

  console.log(`\n🎉 Successfully seeded ${created} document resources!`);
  console.log("\nBreakdown by state:");
  console.log(
    `  - Utah: ${resources.filter((r) => r.state === "UT").length} resources`
  );
  console.log(
    `  - Nevada: ${resources.filter((r) => r.state === "NV").length} resources`
  );
  console.log(
    `  - Arizona: ${resources.filter((r) => r.state === "AZ").length} resources`
  );
  console.log(
    `  - Idaho: ${resources.filter((r) => r.state === "ID").length} resources`
  );
  console.log(
    `  - New Mexico: ${resources.filter((r) => r.state === "NM").length} resources`
  );
}

main()
  .catch((e) => {
    console.error("❌ Error seeding resources:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
