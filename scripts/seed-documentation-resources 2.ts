import {
  PrismaClient,
  ResourceType,
  ClaimType,
  RelationshipType,
  RequirementPriority,
} from "@prisma/client";

const db = new PrismaClient();

async function seedDocumentResources() {
  console.log("🌱 Seeding DocumentResources...");

  // ============================================================================
  // UTAH STATE-LEVEL RESOURCES
  // ============================================================================

  await db.documentResource.upsert({
    where: {
      id: "utah-vital-records",
    },
    update: {},
    create: {
      id: "utah-vital-records",
      state: "UT",
      county: null,
      resourceType: ResourceType.VITAL_RECORDS,
      name: "Utah Department of Health and Human Services - Vital Records",
      address: "288 N 1460 W",
      city: "Salt Lake City",
      stateCode: "UT",
      zipCode: "84116",
      phone: "(801) 538-6105",
      website: "vitalrecords.utah.gov",
      documentTypesProvided: [
        "BIRTH_CERTIFICATE",
        "DEATH_CERTIFICATE",
        "MARRIAGE_CERTIFICATE",
      ],
      certificationAvailable: true,
      processingTimeDays: 14,
      notes:
        "State vital records office. Birth certificates available from 1905+, death certificates from 1905+.",
    },
  });

  await db.documentResource.upsert({
    where: {
      id: "utah-state-archives",
    },
    update: {},
    create: {
      id: "utah-state-archives",
      state: "UT",
      county: null,
      resourceType: ResourceType.STATE_ARCHIVES,
      name: "Utah State Archives & Records Service",
      address: "346 S Rio Grande St",
      city: "Salt Lake City",
      stateCode: "UT",
      zipCode: "84101",
      phone: "(801) 531-3850",
      website: "archives.utah.gov",
      documentTypesProvided: ["HISTORICAL_RECORDS", "EMPLOYMENT_RECORDS"],
      certificationAvailable: true,
      processingTimeDays: 21,
      notes:
        "Historical records, state employee records, historical documents.",
    },
  });

  await db.documentResource.upsert({
    where: {
      id: "utah-tax-commission",
    },
    update: {},
    create: {
      id: "utah-tax-commission",
      state: "UT",
      county: null,
      resourceType: ResourceType.TAX_COMMISSION,
      name: "Utah State Tax Commission",
      address: "210 N 1950 W",
      city: "Salt Lake City",
      stateCode: "UT",
      zipCode: "84134",
      phone: "(801) 297-2200",
      website: "tax.utah.gov",
      documentTypesProvided: ["TAX_RECORDS", "PROPERTY_RECORDS"],
      certificationAvailable: true,
      processingTimeDays: 21,
      notes: "Historical tax records, property records showing residency.",
    },
  });

  // LDS CHURCH - CRITICAL RESOURCE (Fastest for Utah residents)
  await db.documentResource.upsert({
    where: {
      id: "lds-church-records",
    },
    update: {},
    create: {
      id: "lds-church-records",
      state: "UT",
      county: null,
      resourceType: ResourceType.CHURCH,
      name: "The Church of Jesus Christ of Latter-day Saints",
      department: "Member and Statistical Records Division",
      address: "50 East North Temple Street, Seventeenth Floor",
      city: "Salt Lake City",
      stateCode: "UT",
      zipCode: "84150",
      phone: "(801) 240-3500",
      documentTypesProvided: [
        "CHURCH_RECORDS",
        "MEMBERSHIP_RECORDS",
        "RESIDENCE_PROOF",
      ],
      certificationAvailable: true,
      processingTimeDays: 14,
      notes:
        "⚡ FASTEST OPTION for many Utah residents! Church records are often the quickest way to prove residence. You must call them directly and request they send information to the RECA Program. Records include membership records, blessing certificates, and other documents that show residence.",
    },
  });

  console.log("✅ Seeded Utah state resources");

  // ============================================================================
  // SALT LAKE COUNTY RESOURCES
  // ============================================================================

  await db.documentResource.upsert({
    where: {
      id: "salt-lake-county-clerk",
    },
    update: {},
    create: {
      id: "salt-lake-county-clerk",
      state: "UT",
      county: "Salt Lake",
      resourceType: ResourceType.COUNTY_CLERK,
      name: "Salt Lake County Clerk",
      address: "2001 S State St",
      city: "Salt Lake City",
      stateCode: "UT",
      zipCode: "84190",
      phone: "(385) 468-7370",
      website: "slco.org/clerk",
      documentTypesProvided: [
        "MARRIAGE_CERTIFICATE",
        "VOTER_REGISTRATION",
        "BUSINESS_LICENSE",
      ],
      certificationAvailable: true,
      processingTimeDays: 7,
      notes:
        "Walk-in service available. Certified copies $10 each. Marriage records, voter registration records.",
    },
  });

  await db.documentResource.upsert({
    where: {
      id: "salt-lake-county-recorder",
    },
    update: {},
    create: {
      id: "salt-lake-county-recorder",
      state: "UT",
      county: "Salt Lake",
      resourceType: ResourceType.COUNTY_RECORDER,
      name: "Salt Lake County Recorder",
      address: "2001 S State St",
      city: "Salt Lake City",
      stateCode: "UT",
      zipCode: "84190",
      phone: "(385) 468-7000",
      website: "slco.org/recorder",
      documentTypesProvided: ["PROPERTY_DEED", "MORTGAGE_RECORDS"],
      certificationAvailable: true,
      processingTimeDays: 7,
      notes:
        "Property records showing ownership/residence. Many records available online.",
    },
  });

  await db.documentResource.upsert({
    where: {
      id: "salt-lake-county-assessor",
    },
    update: {},
    create: {
      id: "salt-lake-county-assessor",
      state: "UT",
      county: "Salt Lake",
      resourceType: ResourceType.COUNTY_ASSESSOR,
      name: "Salt Lake County Assessor",
      address: "2001 S State St",
      city: "Salt Lake City",
      stateCode: "UT",
      zipCode: "84190",
      phone: "(385) 468-8300",
      website: "slco.org/assessor",
      documentTypesProvided: ["PROPERTY_TAX_RECORDS", "ASSESSMENT_RECORDS"],
      certificationAvailable: true,
      processingTimeDays: 14,
      notes:
        "Property tax records showing residence. Historical records available.",
    },
  });

  console.log("✅ Seeded Salt Lake County resources");

  // ============================================================================
  // MEDICAL FACILITIES (Example: University of Utah Hospital)
  // ============================================================================

  await db.documentResource.upsert({
    where: {
      id: "university-utah-hospital",
    },
    update: {},
    create: {
      id: "university-utah-hospital",
      state: "UT",
      county: "Salt Lake",
      resourceType: ResourceType.HOSPITAL,
      name: "University of Utah Hospital",
      department: "Health Information Management / Medical Records",
      address: "50 North Medical Drive",
      city: "Salt Lake City",
      stateCode: "UT",
      zipCode: "84132",
      phone: "(801) 587-2373",
      website: "healthcare.utah.edu",
      documentTypesProvided: [
        "MEDICAL_RECORDS",
        "PATHOLOGY_REPORT",
        "TREATMENT_RECORDS",
      ],
      certificationAvailable: true,
      processingTimeDays: 14,
      notes:
        "Request medical records including pathology reports. Fees may apply. HIPAA authorization required.",
    },
  });

  await db.documentResource.upsert({
    where: {
      id: "utah-cancer-registry",
    },
    update: {},
    create: {
      id: "utah-cancer-registry",
      state: "UT",
      county: null,
      resourceType: ResourceType.CANCER_REGISTRY,
      name: "Utah Cancer Registry",
      department: "University of Utah Huntsman Cancer Institute",
      address: "2000 Circle of Hope",
      city: "Salt Lake City",
      stateCode: "UT",
      zipCode: "84112",
      phone: "(801) 585-6910",
      website: "uofuhealth.utah.edu/huntsman/utah-cancer-registry",
      documentTypesProvided: ["CANCER_DIAGNOSIS", "TUMOR_REGISTRY"],
      certificationAvailable: true,
      processingTimeDays: 21,
      notes:
        "Statewide cancer surveillance program. Can provide cancer diagnosis verification. Patient authorization required.",
    },
  });

  console.log("✅ Seeded medical facilities");

  console.log(
    `\n📊 Total DocumentResources seeded: ${await db.documentResource.count()}`
  );
}

async function seedDocumentRequirements() {
  console.log("\n🌱 Seeding DocumentRequirements...");

  // ============================================================================
  // UNIVERSAL REQUIREMENTS (All claim types)
  // ============================================================================

  // Birth Certificate - Self
  await db.documentRequirement.upsert({
    where: {
      claimType_relationshipToClaimant_documentType: {
        claimType: ClaimType.DOWNWINDER,
        relationshipToClaimant: RelationshipType.SELF,
        documentType: "BIRTH_CERTIFICATE_SELF",
      },
    },
    update: {},
    create: {
      claimType: ClaimType.DOWNWINDER,
      relationshipToClaimant: RelationshipType.SELF,
      documentType: "BIRTH_CERTIFICATE_SELF",
      displayName: "Your Birth Certificate",
      description:
        "Certified or original birth certificate to verify your identity and date of birth.",
      requiresCertification: true,
      acceptsDigital: true,
      isRequired: true,
      priority: RequirementPriority.HIGH,
      resourceTypes: [ResourceType.VITAL_RECORDS],
      formSection: "Part 4",
      notes:
        "Unless filing electronically at justice.gov/civil/reca, you must provide certified or original copies if mailing.",
    },
  });

  // Death Certificate - For children filing
  await db.documentRequirement.upsert({
    where: {
      claimType_relationshipToClaimant_documentType: {
        claimType: ClaimType.DOWNWINDER,
        relationshipToClaimant: RelationshipType.CHILD,
        documentType: "DEATH_CERTIFICATE_PARENT",
      },
    },
    update: {},
    create: {
      claimType: ClaimType.DOWNWINDER,
      relationshipToClaimant: RelationshipType.CHILD,
      documentType: "DEATH_CERTIFICATE_PARENT",
      displayName: "Death Certificate of Deceased Parent",
      description:
        "Official death certificate of the parent who passed away from a RECA-covered cancer.",
      requiresCertification: true,
      acceptsDigital: true,
      isRequired: true,
      priority: RequirementPriority.HIGH,
      resourceTypes: [ResourceType.VITAL_RECORDS],
      formSection: "Part 5",
      notes: "Must show cause of death. Required for survivor claims.",
    },
  });

  // ============================================================================
  // PROOF OF RESIDENCE (2+ sources required)
  // ============================================================================

  await db.documentRequirement.upsert({
    where: {
      claimType_relationshipToClaimant_documentType: {
        claimType: ClaimType.DOWNWINDER,
        relationshipToClaimant: RelationshipType.SELF,
        documentType: "PROOF_OF_RESIDENCE",
      },
    },
    update: {},
    create: {
      claimType: ClaimType.DOWNWINDER,
      relationshipToClaimant: RelationshipType.SELF,
      documentType: "PROOF_OF_RESIDENCE",
      displayName: "Proof of Residence (2+ sources required)",
      description:
        "Documents showing you lived in an affected area during the atmospheric nuclear testing period (1951-1962 Nevada, 1945-1962 Utah/Arizona).",
      requiresCertification: true,
      acceptsDigital: true,
      isRequired: true,
      priority: RequirementPriority.HIGH,
      resourceTypes: [
        ResourceType.CHURCH,
        ResourceType.SCHOOL_DISTRICT,
        ResourceType.COUNTY_ASSESSOR,
        ResourceType.COUNTY_CLERK,
        ResourceType.TAX_COMMISSION,
      ],
      formSection: "Part 9",
      multipleRequired: true,
      quantityRequired: 2,
      exampleDocuments: [
        "⚡ Church membership records (fastest!)",
        "School records or yearbooks",
        "Employment or tax records",
        "Property tax or assessment records",
        "Utility bills or letters with postmarks",
        "Marriage or birth certificates listing residence",
        "Voter or military registration",
      ],
      notes:
        "⚡ TIP: Church records are often the fastest! You need at least 2 different sources covering the exposure period.",
    },
  });

  // ============================================================================
  // MEDICAL DOCUMENTATION
  // ============================================================================

  await db.documentRequirement.upsert({
    where: {
      claimType_relationshipToClaimant_documentType: {
        claimType: ClaimType.DOWNWINDER,
        relationshipToClaimant: RelationshipType.SELF,
        documentType: "PATHOLOGY_REPORT",
      },
    },
    update: {},
    create: {
      claimType: ClaimType.DOWNWINDER,
      relationshipToClaimant: RelationshipType.SELF,
      documentType: "PATHOLOGY_REPORT",
      displayName: "Pathology Report",
      description:
        "Pathology report of tissue biopsy showing cancer diagnosis. This is the most important medical document for your claim.",
      requiresCertification: true,
      acceptsDigital: true,
      isRequired: true,
      priority: RequirementPriority.HIGH,
      resourceTypes: [ResourceType.HOSPITAL, ResourceType.CANCER_REGISTRY],
      formSection: "Part 11",
      notes:
        "⚠️ CRITICAL: This is the most important medical document. See Medical Records Attachment in form for cancer-specific alternatives if pathology report is unavailable.",
    },
  });

  // ============================================================================
  // SIBLING DISCLOSURE (Children filing only)
  // ============================================================================

  await db.documentRequirement.upsert({
    where: {
      claimType_relationshipToClaimant_documentType: {
        claimType: ClaimType.DOWNWINDER,
        relationshipToClaimant: RelationshipType.CHILD,
        documentType: "SIBLING_DEATH_CERTIFICATES",
      },
    },
    update: {},
    create: {
      claimType: ClaimType.DOWNWINDER,
      relationshipToClaimant: RelationshipType.CHILD,
      documentType: "SIBLING_DEATH_CERTIFICATES",
      displayName: "Death Certificates for ALL Deceased Siblings",
      description:
        "Death certificates for every sibling who has passed away. All siblings must be disclosed even if not filing.",
      requiresCertification: true,
      acceptsDigital: true,
      isRequired: true,
      priority: RequirementPriority.HIGH,
      resourceTypes: [ResourceType.VITAL_RECORDS],
      formSection: "Part 6",
      multipleRequired: true,
      notes:
        "🚨 CRITICAL: ALL siblings must be documented. The $100,000 award is divided equally among all eligible children. If any siblings have passed away, their death certificates are REQUIRED.",
    },
  });

  await db.documentRequirement.upsert({
    where: {
      claimType_relationshipToClaimant_documentType: {
        claimType: ClaimType.DOWNWINDER,
        relationshipToClaimant: RelationshipType.CHILD,
        documentType: "SIBLING_BIRTH_CERTIFICATES",
      },
    },
    update: {},
    create: {
      claimType: ClaimType.DOWNWINDER,
      relationshipToClaimant: RelationshipType.CHILD,
      documentType: "SIBLING_BIRTH_CERTIFICATES",
      displayName: "Birth Certificates for ALL Living Siblings",
      description:
        "Birth certificates for all living siblings to verify family relationship and equal distribution of award.",
      requiresCertification: true,
      acceptsDigital: true,
      isRequired: true,
      priority: RequirementPriority.HIGH,
      resourceTypes: [ResourceType.VITAL_RECORDS],
      formSection: "Part 6",
      multipleRequired: true,
      notes:
        "All eligible children share the $100,000 award equally. Complete sibling disclosure is mandatory.",
    },
  });

  console.log(
    `✅ Seeded DocumentRequirements: ${await db.documentRequirement.count()}`
  );
}

async function seedMedicalRecordRequirements() {
  console.log("\n🌱 Seeding MedicalRecordRequirements...");

  // ============================================================================
  // LEUKEMIA (except CLL)
  // ============================================================================

  await db.medicalRecordRequirement.upsert({
    where: {
      cancerType_recordType: {
        cancerType: "LEUKEMIA",
        recordType: "BONE_MARROW_BIOPSY",
      },
    },
    update: {},
    create: {
      cancerType: "LEUKEMIA",
      recordType: "BONE_MARROW_BIOPSY",
      displayName: "Bone marrow biopsy or aspirate report",
      description:
        "Pathology report from bone marrow biopsy or aspirate showing leukemia diagnosis.",
      priority: 1,
      formSection: "Medical Records Attachment - (1)",
    },
  });

  await db.medicalRecordRequirement.upsert({
    where: {
      cancerType_recordType: {
        cancerType: "LEUKEMIA",
        recordType: "BLOOD_COUNT",
      },
    },
    update: {},
    create: {
      cancerType: "LEUKEMIA",
      recordType: "BLOOD_COUNT",
      displayName: "Peripheral white blood cell differential count report",
      description:
        "Blood test results showing abnormal white blood cell counts characteristic of leukemia.",
      priority: 2,
      formSection: "Medical Records Attachment - (1)",
    },
  });

  // ============================================================================
  // THYROID CANCER
  // ============================================================================

  await db.medicalRecordRequirement.upsert({
    where: {
      cancerType_recordType: {
        cancerType: "THYROID_CANCER",
        recordType: "PATHOLOGY_REPORT",
      },
    },
    update: {},
    create: {
      cancerType: "THYROID_CANCER",
      recordType: "PATHOLOGY_REPORT",
      displayName: "Pathology report of tissue biopsy or fine needle aspirate",
      description:
        "Pathology report from thyroid tissue biopsy or fine needle aspirate showing cancer.",
      priority: 1,
      formSection: "Medical Records Attachment - (4)",
    },
  });

  await db.medicalRecordRequirement.upsert({
    where: {
      cancerType_recordType: {
        cancerType: "THYROID_CANCER",
        recordType: "SURGICAL_PATHOLOGY",
      },
    },
    update: {},
    create: {
      cancerType: "THYROID_CANCER",
      recordType: "SURGICAL_PATHOLOGY",
      displayName: "Surgical pathology report",
      description:
        "Pathology report from thyroid surgery showing cancer diagnosis.",
      priority: 2,
      formSection: "Medical Records Attachment - (4)",
    },
  });

  // ============================================================================
  // LUNG CANCER
  // ============================================================================

  await db.medicalRecordRequirement.upsert({
    where: {
      cancerType_recordType: {
        cancerType: "LUNG_CANCER",
        recordType: "PATHOLOGY_REPORT",
      },
    },
    update: {},
    create: {
      cancerType: "LUNG_CANCER",
      recordType: "PATHOLOGY_REPORT",
      displayName: "Pathology report of tissue biopsy",
      description: "Pathology report from lung tissue biopsy showing cancer.",
      priority: 1,
      formSection: "Medical Records Attachment - (3)",
    },
  });

  await db.medicalRecordRequirement.upsert({
    where: {
      cancerType_recordType: {
        cancerType: "LUNG_CANCER",
        recordType: "AUTOPSY_REPORT",
      },
    },
    update: {},
    create: {
      cancerType: "LUNG_CANCER",
      recordType: "AUTOPSY_REPORT",
      displayName: "Autopsy report",
      description:
        "Autopsy report documenting lung cancer as cause of death or contributing factor.",
      priority: 2,
      formSection: "Medical Records Attachment - (3)",
    },
  });

  console.log(
    `✅ Seeded MedicalRecordRequirements: ${await db.medicalRecordRequirement.count()}`
  );
}

async function main() {
  try {
    console.log("🚀 Starting documentation resources seeding...\n");

    await seedDocumentResources();
    await seedDocumentRequirements();
    await seedMedicalRecordRequirements();

    console.log("\n🎉 All documentation resources seeded successfully!");
    console.log("\n📊 Summary:");
    console.log(`   DocumentResources: ${await db.documentResource.count()}`);
    console.log(
      `   DocumentRequirements: ${await db.documentRequirement.count()}`
    );
    console.log(
      `   MedicalRecordRequirements: ${await db.medicalRecordRequirement.count()}`
    );
  } catch (error) {
    console.error("❌ Error seeding documentation resources:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

main();
