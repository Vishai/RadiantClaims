/**
 * Test User Packet Generator
 *
 * Creates 5 comprehensive test user packets with:
 * - Realistic RECA claimant data
 * - Simulated document metadata (no actual files needed for testing)
 * - Various claim scenarios (downwinder, different cancers, deceased relatives)
 * - Different workflow stages for testing
 *
 * Usage: npx tsx scripts/seed-test-packets.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Helper to create simulated document metadata
function createDocumentMetadata(
  category: string,
  originalFilename: string,
  extractedData: Record<string, any>
) {
  return {
    category,
    originalFilename,
    normalizedName: originalFilename.toLowerCase().replace(/\s+/g, "_"),
    mimeType: "application/pdf",
    sizeBytes: Math.floor(Math.random() * 5000000) + 500000, // 500KB - 5.5MB
    status: "READY" as const,
    customerStatus: "VERIFIED" as const,
    ocrText: `Simulated OCR text for ${originalFilename}`,
    ocrConfidence: 0.85 + Math.random() * 0.15, // 85-100% confidence
    metadata: JSON.stringify(extractedData),
    extractedDataSummary: extractedData,
    categoryLocked: true,
    categoryLockedAt: new Date(),
    userConfirmed: true,
    uploadedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Within last 30 days
    processedAt: new Date(),
  };
}

const testPackets = [
  {
    // TEST PACKET 1: Simple Downwinder - Thyroid Cancer (Utah)
    user: {
      email: "test.downwinder.utah@radiantclaims.test",
      password: "TestPassword123!",
      name: "Mary Johnson",
      role: "CUSTOMER" as const,
    },
    claimant: {
      firstName: "Mary",
      lastName: "Johnson",
      email: "test.downwinder.utah@radiantclaims.test",
      phone: "(801) 555-1234",
      dob: new Date("1948-03-15"),
      address1: "1234 Main Street",
      city: "St. George",
      county: "Washington",
      state: "UT",
      postalCode: "84770",
      claimType: "DOWNWINDER" as const,
    },
    intakeSession: {
      claimType: "DOWNWINDER" as const,
      recaWorkflowStage: 4, // Documents stage
      recaCompletionPercent: 75,
      recaFormData: {
        part1: {
          firstName: "Mary",
          lastName: "Johnson",
          ssn: "***-**-1234",
          dob: "03/15/1948",
          phone: "(801) 555-1234",
        },
        part3: {
          cancerType: "THYROID_CANCER",
          diagnosisDate: "06/15/2010",
          diagnosisLocation: "Dixie Regional Medical Center",
        },
        part8: {
          residenceCity: "St. George",
          residenceCounty: "Washington",
          residenceState: "UT",
          residencePeriodStart: "01/01/1951",
          residencePeriodEnd: "12/31/1962",
        },
      },
      recaEligibilityData: {
        relationship: "SELF",
        exposureLocation: "St. George, UT",
        exposureYears: "1951-1962",
        disease: "Thyroid Cancer",
        eligible: true,
        confidence: 0.95,
      },
    },
    documents: [
      createDocumentMetadata("IDENTITY", "Mary_Johnson_Drivers_License.pdf", {
        documentType: "Drivers License",
        name: "MARY JOHNSON",
        dateOfBirth: "03/15/1948",
        address: "1234 Main Street, St. George, UT 84770",
        issueDate: "01/15/2023",
        expirationDate: "03/15/2031",
      }),
      createDocumentMetadata(
        "PATHOLOGY_REPORT",
        "Thyroid_Biopsy_Report_2010.pdf",
        {
          patientName: "Johnson, Mary",
          dateOfService: "06/12/2010",
          diagnosis: "Papillary Thyroid Carcinoma",
          physician: "Dr. Robert Williams, MD",
          facility: "Dixie Regional Medical Center",
          icd10Code: "C73",
        }
      ),
      createDocumentMetadata(
        "PROOF_OF_RESIDENCE",
        "Elementary_School_Records_1956.pdf",
        {
          studentName: "Mary Henderson",
          schoolName: "Woodward Elementary School",
          schoolYear: "1955-1956",
          address: "1234 Main Street, St. George, Utah",
          gradeLevel: "2nd Grade",
        }
      ),
      createDocumentMetadata("PROOF_OF_RESIDENCE", "Utility_Bill_1960.pdf", {
        accountHolder: "Henderson Family",
        serviceAddress: "1234 Main Street, St. George, UT",
        serviceDate: "July 1960",
        utilityCompany: "Dixie Power & Water",
      }),
    ],
  },

  {
    // TEST PACKET 2: Deceased Relative - Lung Cancer (Nevada)
    user: {
      email: "test.survivor.nevada@radiantclaims.test",
      password: "TestPassword123!",
      name: "Robert Martinez",
      role: "CUSTOMER" as const,
    },
    claimant: {
      firstName: "Robert",
      lastName: "Martinez",
      email: "test.survivor.nevada@radiantclaims.test",
      phone: "(702) 555-5678",
      dob: new Date("1975-08-22"),
      address1: "567 Desert View Drive",
      city: "Las Vegas",
      county: "Clark",
      state: "NV",
      postalCode: "89101",
      claimType: "DOWNWINDER" as const,
      relationshipToClaimant: "CHILD" as const,
    },
    intakeSession: {
      claimType: "DOWNWINDER" as const,
      recaWorkflowStage: 3, // Supporting forms stage
      recaCompletionPercent: 60,
      recaFormData: {
        part1: {
          // Filing for deceased father
          deceasedFirstName: "Carlos",
          deceasedLastName: "Martinez",
          deceasedSSN: "***-**-5678",
          deceasedDOB: "05/10/1945",
          dateOfDeath: "03/20/2018",
        },
        claimantInfo: {
          // Robert's info as claimant
          firstName: "Robert",
          lastName: "Martinez",
          relationship: "Son",
          ssn: "***-**-9999",
        },
        part3: {
          cancerType: "LUNG_CANCER",
          diagnosisDate: "01/15/2017",
          diagnosisLocation: "University Medical Center",
        },
        part8: {
          residenceCity: "Las Vegas",
          residenceCounty: "Clark",
          residenceState: "NV",
          residencePeriodStart: "06/01/1951",
          residencePeriodEnd: "08/31/1962",
        },
      },
      recaEligibilityData: {
        relationship: "CHILD",
        exposureLocation: "Las Vegas, NV",
        exposureYears: "1951-1962",
        disease: "Lung Cancer",
        eligible: true,
        confidence: 0.92,
      },
    },
    documents: [
      createDocumentMetadata(
        "DEATH_CERTIFICATE",
        "Carlos_Martinez_Death_Certificate.pdf",
        {
          decedentName: "CARLOS MARTINEZ",
          dateOfDeath: "03/20/2018",
          placeOfDeath: "Las Vegas, Nevada",
          causeOfDeath: "Respiratory failure due to lung cancer",
          fileNumber: "NV-2018-012345",
        }
      ),
      createDocumentMetadata(
        "BIRTH_CERTIFICATE",
        "Robert_Martinez_Birth_Certificate.pdf",
        {
          childName: "ROBERT MARTINEZ",
          dateOfBirth: "08/22/1975",
          fatherName: "CARLOS MARTINEZ",
          motherName: "MARIA MARTINEZ",
          placeOfBirth: "Las Vegas, Nevada",
        }
      ),
      createDocumentMetadata(
        "MEDICAL_RECORDS",
        "Lung_Cancer_Diagnosis_2017.pdf",
        {
          patientName: "Martinez, Carlos",
          dateOfService: "01/15/2017",
          diagnosis: "Non-small cell lung carcinoma",
          physician: "Dr. Sarah Chen, MD",
          facility: "University Medical Center",
          icd10Code: "C34.90",
        }
      ),
      createDocumentMetadata(
        "EMPLOYMENT_RECORDS",
        "Nevada_Test_Site_Badge_1955.pdf",
        {
          employeeName: "Carlos Martinez",
          employer: "Nevada Test Site",
          employmentPeriod: "June 1955 - September 1962",
          badgeNumber: "NTS-12345",
          department: "Security",
        }
      ),
    ],
  },

  {
    // TEST PACKET 3: Complex Case - Multiple Cancers (Idaho)
    user: {
      email: "test.complex.idaho@radiantclaims.test",
      password: "TestPassword123!",
      name: "Patricia Wilson",
      role: "CUSTOMER" as const,
    },
    claimant: {
      firstName: "Patricia",
      lastName: "Wilson",
      email: "test.complex.idaho@radiantclaims.test",
      phone: "(208) 555-9012",
      dob: new Date("1952-11-08"),
      address1: "890 Mountain Road",
      city: "Idaho Falls",
      county: "Bonneville",
      state: "ID",
      postalCode: "83401",
      claimType: "DOWNWINDER" as const,
    },
    intakeSession: {
      claimType: "DOWNWINDER" as const,
      recaWorkflowStage: 5, // Review stage
      recaCompletionPercent: 95,
      recaFormData: {
        part1: {
          firstName: "Patricia",
          lastName: "Wilson",
          maidenName: "Thompson",
          ssn: "***-**-3456",
          dob: "11/08/1952",
          phone: "(208) 555-9012",
        },
        part3: {
          cancerType: "THYROID_CANCER",
          diagnosisDate: "04/10/2005",
          diagnosisLocation: "Eastern Idaho Regional Medical Center",
          secondaryCancer: "KIDNEY_CANCER",
          secondaryDiagnosisDate: "09/22/2019",
        },
        part8: {
          residenceCity: "Idaho Falls",
          residenceCounty: "Bonneville",
          residenceState: "ID",
          residencePeriodStart: "11/08/1952",
          residencePeriodEnd: "06/30/1962",
          additionalLocations: [
            {
              city: "Arco",
              county: "Butte",
              state: "ID",
              periodStart: "01/01/1958",
              periodEnd: "12/31/1960",
            },
          ],
        },
      },
      recaEligibilityData: {
        relationship: "SELF",
        exposureLocation: "Idaho Falls & Arco, ID",
        exposureYears: "1952-1962",
        disease: "Thyroid Cancer, Kidney Cancer",
        eligible: true,
        confidence: 0.98,
        notes: "Multiple eligible cancers, strong residence proof",
      },
      recaFormPdfGenerated: true,
      recaFormPdfGeneratedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    documents: [
      createDocumentMetadata("IDENTITY", "Patricia_Wilson_Passport.pdf", {
        documentType: "US Passport",
        name: "PATRICIA WILSON",
        dateOfBirth: "11/08/1952",
        passportNumber: "123456789",
        issueDate: "05/15/2019",
      }),
      createDocumentMetadata("PATHOLOGY_REPORT", "Thyroid_Pathology_2005.pdf", {
        patientName: "Wilson, Patricia",
        dateOfService: "04/10/2005",
        diagnosis: "Follicular thyroid carcinoma",
        physician: "Dr. Michael Brown, MD",
        facility: "Eastern Idaho Regional Medical Center",
      }),
      createDocumentMetadata("PATHOLOGY_REPORT", "Kidney_Biopsy_2019.pdf", {
        patientName: "Wilson, Patricia",
        dateOfService: "09/22/2019",
        diagnosis: "Renal cell carcinoma",
        physician: "Dr. Jennifer Lee, MD",
        facility: "Mountain View Hospital",
      }),
      createDocumentMetadata(
        "LDS_CHURCH_RECORDS",
        "LDS_Membership_Records_1952-1962.pdf",
        {
          memberName: "Patricia Thompson",
          ward: "Idaho Falls 3rd Ward",
          stake: "Idaho Falls Idaho Stake",
          baptismDate: "11/15/1960",
          residencePeriod: "1952-1962",
        }
      ),
      createDocumentMetadata(
        "SCHOOL_RECORDS",
        "High_School_Transcript_1967.pdf",
        {
          studentName: "Patricia Thompson",
          school: "Idaho Falls High School",
          graduationYear: "1970",
          address: "890 Mountain Road, Idaho Falls, ID",
          attendancePeriod: "1966-1970",
        }
      ),
    ],
  },

  {
    // TEST PACKET 4: Early Stage - Just Started (Arizona)
    user: {
      email: "test.earlystage.arizona@radiantclaims.test",
      password: "TestPassword123!",
      name: "James Chen",
      role: "CUSTOMER" as const,
    },
    claimant: {
      firstName: "James",
      lastName: "Chen",
      email: "test.earlystage.arizona@radiantclaims.test",
      phone: "(928) 555-3456",
      dob: new Date("1955-07-12"),
      address1: "234 Canyon Drive",
      city: "Flagstaff",
      county: "Coconino",
      state: "AZ",
      postalCode: "86001",
      claimType: "DOWNWINDER" as const,
    },
    intakeSession: {
      claimType: "DOWNWINDER" as const,
      recaWorkflowStage: 1, // Eligibility stage
      recaCompletionPercent: 15,
      recaFormData: {
        part1: {
          firstName: "James",
          lastName: "Chen",
          dob: "07/12/1955",
        },
      },
      recaEligibilityData: {
        relationship: "SELF",
        exposureLocation: "Flagstaff, AZ",
        exposureYears: "1955-1962",
        disease: "Pancreatic Cancer",
        eligible: true,
        confidence: 0.88,
      },
    },
    documents: [
      createDocumentMetadata("IDENTITY", "James_Chen_SSN_Card.pdf", {
        documentType: "Social Security Card",
        name: "JAMES CHEN",
        ssn: "***-**-7890",
      }),
    ],
  },

  {
    // TEST PACKET 5: Grandparent Filing - New Mexico
    user: {
      email: "test.grandchild.newmexico@radiantclaims.test",
      password: "TestPassword123!",
      name: "Emily Rodriguez",
      role: "CUSTOMER" as const,
    },
    claimant: {
      firstName: "Emily",
      lastName: "Rodriguez",
      email: "test.grandchild.newmexico@radiantclaims.test",
      phone: "(505) 555-7890",
      dob: new Date("1990-02-14"),
      address1: "456 Sunset Boulevard",
      city: "Albuquerque",
      county: "Bernalillo",
      state: "NM",
      postalCode: "87101",
      claimType: "DOWNWINDER" as const,
      relationshipToClaimant: "GRANDCHILD" as const,
    },
    intakeSession: {
      claimType: "DOWNWINDER" as const,
      recaWorkflowStage: 2, // Form filling stage
      recaCompletionPercent: 40,
      recaFormData: {
        part1: {
          deceasedFirstName: "Maria",
          deceasedLastName: "Lopez",
          deceasedSSN: "***-**-2468",
          deceasedDOB: "03/22/1940",
          dateOfDeath: "11/05/2015",
        },
        claimantInfo: {
          firstName: "Emily",
          lastName: "Rodriguez",
          relationship: "Granddaughter",
          ssn: "***-**-1357",
        },
        part3: {
          cancerType: "KIDNEY_CANCER",
          diagnosisDate: "08/15/2012",
          diagnosisLocation: "Presbyterian Hospital",
        },
        part8: {
          residenceCity: "Los Alamos",
          residenceCounty: "Los Alamos",
          residenceState: "NM",
          residencePeriodStart: "03/01/1951",
          residencePeriodEnd: "12/31/1962",
        },
      },
      recaEligibilityData: {
        relationship: "GRANDCHILD",
        exposureLocation: "Los Alamos, NM",
        exposureYears: "1951-1962",
        disease: "Kidney Cancer",
        eligible: true,
        confidence: 0.91,
        notes: "Grandparent filing - requires additional family documentation",
      },
    },
    documents: [
      createDocumentMetadata(
        "DEATH_CERTIFICATE",
        "Maria_Lopez_Death_Certificate.pdf",
        {
          decedentName: "MARIA LOPEZ",
          dateOfDeath: "11/05/2015",
          placeOfDeath: "Albuquerque, New Mexico",
          causeOfDeath: "Renal failure due to kidney cancer",
          fileNumber: "NM-2015-067890",
        }
      ),
      createDocumentMetadata(
        "BIRTH_CERTIFICATE",
        "Emily_Rodriguez_Birth_Certificate.pdf",
        {
          childName: "EMILY RODRIGUEZ",
          dateOfBirth: "02/14/1990",
          motherName: "CARMEN RODRIGUEZ (nee LOPEZ)",
          placeOfBirth: "Albuquerque, New Mexico",
        }
      ),
      createDocumentMetadata(
        "BIRTH_CERTIFICATE",
        "Carmen_Lopez_Birth_Certificate.pdf",
        {
          childName: "CARMEN LOPEZ",
          dateOfBirth: "06/18/1965",
          motherName: "MARIA LOPEZ",
          fatherName: "JUAN LOPEZ",
          placeOfBirth: "Los Alamos, New Mexico",
        }
      ),
      createDocumentMetadata(
        "MEDICAL_RECORDS",
        "Kidney_Cancer_Diagnosis_2012.pdf",
        {
          patientName: "Lopez, Maria",
          dateOfService: "08/15/2012",
          diagnosis: "Renal cell carcinoma, stage III",
          physician: "Dr. Robert Garcia, MD",
          facility: "Presbyterian Hospital",
        }
      ),
      createDocumentMetadata("TAX_RETURN", "IRS_1040_1960.pdf", {
        taxpayerName: "Juan & Maria Lopez",
        taxYear: "1960",
        address: "123 Oak Street, Los Alamos, NM",
        filingStatus: "Married Filing Jointly",
      }),
    ],
  },
];

async function main() {
  console.log("🌱 Starting test packet generation...\n");

  for (const packet of testPackets) {
    console.log(`Creating test packet for: ${packet.user.name}`);

    try {
      // 1. Create User Account
      const hashedPassword = await bcrypt.hash(packet.user.password, 10);
      const user = await prisma.user.create({
        data: {
          email: packet.user.email,
          password: hashedPassword,
          name: packet.user.name,
          role: packet.user.role,
          emailVerified: new Date(), // Pre-verified for testing
        },
      });
      console.log(`  ✓ Created user: ${user.email}`);

      // 2. Create Claimant
      const claimant = await prisma.claimant.create({
        data: {
          ...packet.claimant,
          userId: user.id,
        },
      });
      console.log(
        `  ✓ Created claimant: ${claimant.firstName} ${claimant.lastName}`
      );

      // 3. Create Intake Session
      const intakeSession = await prisma.intakeSession.create({
        data: {
          claimantId: claimant.id,
          resumeToken: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          currentStep: "REVIEW",
          status:
            packet.intakeSession.recaWorkflowStage === 5
              ? "READY_FOR_REVIEW"
              : "IN_PROGRESS",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          lastActivityAt: new Date(),
          ...packet.intakeSession,
        },
      });
      console.log(
        `  ✓ Created intake session at stage ${packet.intakeSession.recaWorkflowStage}`
      );

      // 4. Create Simulated Documents
      if (packet.documents && packet.documents.length > 0) {
        for (const docMeta of packet.documents) {
          const doc = await prisma.uploadedFile.create({
            data: {
              intakeSessionId: intakeSession.id,
              fileKey: `test/${claimant.id}/${docMeta.originalFilename}`,
              ...docMeta,
            },
          });
          console.log(`  ✓ Created document: ${doc.originalFilename}`);
        }
      }

      // 5. Create Service Subscription (DIY Path)
      const subscription = await prisma.serviceSubscription.create({
        data: {
          userId: user.id,
          tier: "DIY_PREP",
          status: "ACTIVE",
          setupFeePaid: true,
          setupFeeAmount: 499.99,
          setupFeePaidAt: new Date(),
          isInstallmentPlan: false,
          installmentPaymentCount: 1,
          installmentCompleted: true,
          stripeCustomerId: `cus_test_${claimant.id}`,
          stripeSubscriptionId: `sub_test_${claimant.id}`,
        },
      });
      console.log(`  ✓ Created DIY subscription (paid $499.99)\n`);
    } catch (error) {
      console.error(
        `  ✗ Error creating packet for ${packet.user.name}:`,
        error
      );
      console.log("");
    }
  }

  console.log("✅ Test packet generation complete!\n");
  console.log("📋 Test Accounts Created:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  testPackets.forEach((packet, index) => {
    console.log(`\n${index + 1}. ${packet.user.name}`);
    console.log(`   Email: ${packet.user.email}`);
    console.log(`   Password: ${packet.user.password}`);
    console.log(
      `   Location: ${packet.claimant.city}, ${packet.claimant.state}`
    );
    console.log(
      `   Stage: ${packet.intakeSession.recaWorkflowStage}/5 (${packet.intakeSession.recaCompletionPercent}% complete)`
    );
    console.log(`   Documents: ${packet.documents.length} files`);
  });
  console.log(
    "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
  );
}

main()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
