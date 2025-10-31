#!/usr/bin/env tsx
/**
 * Quick PDF Regeneration Script
 *
 * Run this anytime you adjust coordinates in pdf-form-filler.ts
 * to see your changes immediately.
 *
 * Usage:
 *   npx tsx scripts/regenerate-test-pdf.ts
 *
 * Or make it executable and run directly:
 *   chmod +x scripts/regenerate-test-pdf.ts
 *   ./scripts/regenerate-test-pdf.ts
 */

import { fillOfficialRECAPDF } from "../src/lib/reca/pdf-form-filler";
import * as fs from "fs";
import * as path from "path";

async function regenerateTestPDF() {
  console.log("🔄 Regenerating test PDF...\n");

  // COMPREHENSIVE Test data - Every field filled to show all overlays
  const testFormData = {
    part_1: {
      firstName: "JOHN",
      middleName: "MICHAEL",
      lastName: "SMITH",
      formerNames: "JOHN DOE",
      ssn: "123-45-6789",
      dob: "1965-03-15",
      mailingAddress: "123 Main Street",
      mailingAddress2: "Apartment 5B",
      city: "PHOENIX",
      state: "AZ",
      zipCode: "85001",
      phoneDay: "602-555-1234",
      phoneEvening: "602-555-5678",
      email: "john.smith@example.com",
      // Page 2 fields
      residenceAddress: "456 Oak Avenue",
      residenceAddress2: "Unit 3B Floor 2",
      tribalAffiliation: "NAVAJO NATION",
      tribalCensusNumber: "NC-123456",
      tribalAssistance: "navajo",
      tribalAssistanceOther: "",
    },
    part_2: {
      firstName: "JANE",
      middleName: "MARIE",
      lastName: "SMITH",
      formerNames: "JANE JOHNSON",
      ssn: "987-65-4321",
      dob: "1960-06-20",
      dod: "2020-12-31",
    },
    part_3: {
      // Use 'spouse' for normal testing, or comment out to test all checkboxes
      relationship: "spouse",
      // For calibration: uncomment below to see all checkboxes marked
      testAllCheckboxes: true,
    },
    part_4: {
      birthCertificate: true,
      marriageCertificates: true,
    },
    part_5: {
      claimantDeceased: "YES",
      marriedOneYear: "YES",
      claimantPreviousMarriages: "YES",
      claimantPreviousSpouses: [
        {
          spouseName: "Elizabeth Johnson",
          marriageStart: "01/15/1955",
          marriageEnd: "03/20/1958",
        },
        {
          spouseName: "Sarah Williams",
          marriageStart: "06/10/1959",
          marriageEnd: "12/05/1960",
        },
      ],
      filerOtherMarriages: "YES",
      filerOtherSpouses: [
        {
          spouseName: "Michael Davis",
          marriageStart: "02/14/1980",
          marriageEnd: "11/30/1985",
        },
        {
          spouseName: "Christopher Brown",
          marriageStart: "05/22/1987",
          marriageEnd: "08/15/1990",
        },
        {
          spouseName: "Robert Wilson",
          marriageStart: "03/10/1992",
          marriageEnd: "09/25/1998",
        },
        {
          spouseName: "David Martinez",
          marriageStart: "11/05/2000",
          marriageEnd: "04/18/2010",
        },
      ],
      // Document checkboxes (Page 4)
      birthCertificateClaimant: true,
      deathCertificate: true,
      marriageCertificate: true,
      marriageCertificatesPrevious: true,
      divorceDecreesPrevious: true,
      birthCertificateFiler: true,
      marriageCertificatesFiler: true,
      divorceDecreesFiler: true,
    },
    part_6: {
      claimantDeceased: "YES",
      claimantEverMarried: "YES",
      childType: "NATURAL",
      otherChildrenExist: "YES",
      additionalChildrenAttached: true,
      // Document requirement checkboxes (Page 5)
      birthCertificateClaimant: true,
      deathCertificate: true,
      marriageCertificates: true,
      divorceDecrees: true,
      birthCertificateFiler: true,
      marriageCertificatesFiler: true,
      stepChildProof: true,
      siblingDeathCertificates: true,
      // Spouse information (Page 4 top section)
      spouseInfo: [
        {
          name: "Robert Smith",
          marriageDate: "06/15/1980",
          endDate: "12/31/2020",
        },
        {
          name: "Patricia Jones",
          marriageDate: "03/10/1975",
          endDate: "05/20/1979",
        },
      ],
      // Children detailed information (Page 5)
      children: [
        {
          name: "Jennifer Smith",
          birthDate: "04/12/1985",
          birthPlace: "Phoenix, AZ",
          isLiving: true,
          phone: "602-555-2000",
          address: "789 Oak Street, Phoenix, AZ 85001",
        },
        {
          name: "Michael Smith Jr.",
          birthDate: "08/25/1987",
          birthPlace: "Tucson, AZ",
          isLiving: false,
          deathDate: "02/14/2015",
          deathPlace: "University Medical Center, Tucson, AZ",
        },
        {
          name: "Sarah Smith",
          birthDate: "11/03/1990",
          birthPlace: "Flagstaff, AZ",
          isLiving: false,
          deathDate: "07/22/2018",
          deathPlace: "Banner Health Hospital, Phoenix, AZ",
        },
      ],
    },
    part_7: {
      relationshipType: "PARENT",
    },
    part_8: {
      exposureOption: "designated_1year",
      locations: {
        idaho: {
          townCity: "BOISE",
          timePeriod: "1955-1960",
        },
        newMexico: {
          townCity: "ALBUQUERQUE",
          timePeriod: "1952-1957",
        },
        utah: {
          townCity: "SALT LAKE CITY",
          timePeriod: "1958-1962",
        },
        arizona: [
          {
            county: "Coconino",
            townCity: "FLAGSTAFF",
            timePeriod: "1956-1958",
          },
          {
            county: "Navajo",
            townCity: "HOLBROOK",
            timePeriod: "1958-1960",
          },
          {
            county: "Apache",
            townCity: "ST JOHNS",
            timePeriod: "1959-1961",
          },
          {
            county: "Yavapai",
            townCity: "PRESCOTT",
            timePeriod: "1955-1957",
          },
          {
            county: "Gila",
            townCity: "GLOBE",
            timePeriod: "1960-1962",
          },
          {
            county: "Mohave",
            townCity: "KINGMAN",
            timePeriod: "1954-1956",
          },
        ],
        nevada: [
          {
            county: "Nye",
            townCity: "TONOPAH",
            timePeriod: "1955-1962",
          },
          {
            county: "Lincoln",
            townCity: "CALIENTE",
            timePeriod: "1956-1960",
          },
          {
            county: "White Pine",
            townCity: "ELY",
            timePeriod: "1957-1961",
          },
          {
            county: "Clark",
            townCity: "LAS VEGAS",
            timePeriod: "1951-1955",
          },
          {
            county: "Eureka",
            townCity: "EUREKA",
            timePeriod: "1958-1959",
          },
          {
            county: "Lander",
            townCity: "BATTLE MTN",
            timePeriod: "1959-1962",
          },
        ],
      },
    },
    part_9: {
      contactedChurchLDS: true,
    },
    part_10: {
      // Include ALL diseases to see all checkboxes for calibration
      diseases: [
        "leukemia",
        "multiple_myeloma",
        "lymphomas",
        "thyroid",
        "breast",
        "esophagus",
        "stomach",
        "pharynx",
        "small_intestine",
        "pancreas",
        "bile_ducts",
        "gall_bladder",
        "salivary_gland",
        "urinary_bladder",
        "brain",
        "colon",
        "ovary",
        "liver",
        "lung",
      ],
    },
    part_11: {
      medicalRecordsSubmitted: true,
      cancerRegistryAuthorization: true,
      resepAssistance: "YES",
      resepClinicName: "Phoenix RESEP Clinic - Downtown Location",
    },
    part_12: {
      receivedPayment: "NO",
      eeoicpaClaim: "NO",
    },
    part_13: {
      hasAttorney: "YES",
      attorneyFirstName: "ROBERT",
      attorneyLastName: "JOHNSON",
      attorneyFirm: "Johnson & Associates International Law Firm LLC",
      attorneyAddress: "789 Legal Plaza Suite 400",
      attorneyCity: "PHOENIX",
      attorneyState: "AZ",
      attorneyZip: "85003",
      attorneyPhone: "602-555-9000",
      attorneyFax: "602-555-9001",
      attorneyEmail: "rjohnson@lawfirm.com",
    },
    part_14: {
      feeType: "initial_2_percent",
      attorneySignatureDate: new Date().toISOString().split("T")[0],
    },
    part_15: {
      guardianFirstName: "MARY",
      guardianMiddleName: "ANN",
      guardianLastName: "WILLIAMS",
      guardianAddress: "321 Guardian Street Suite 100 Building A",
      guardianCity: "PHOENIX",
      guardianState: "AZ",
      guardianZip: "85004",
      guardianPhoneDay: "602-555-7000",
      guardianPhoneEvening: "602-555-7001",
      guardianEmail: "mwilliams@guardian.com",
    },
    part_16: {
      signatureDate: new Date().toISOString().split("T")[0],
    },
    medical_release: {
      stateOfResidence: "ARIZONA",
      patientName: "JANE MARIE SMITH",
      patientSSN: "987-65-4321",
      patientDOB: "06/20/1960",
      patientDOD: "12/31/2020",
      requesterName: "JOHN MICHAEL SMITH",
      requesterRelationship: "SPOUSE",
      signatureDate: new Date().toISOString().split("T")[0],
    },
    privacy_release: {
      claimNumber: "RECA-2025-12345",
      fullName: "JOHN MICHAEL SMITH",
      citizenshipStatus: "U.S. CITIZEN",
      ssn: "123-45-6789",
      currentAddress: "123 Main Street, Apartment 5B, Phoenix, AZ 85001",
      dob: "03/15/1965",
      placeOfBirth: "PHOENIX, ARIZONA",
      section1SignatureDate: new Date().toISOString().split("T")[0],
      authorizeName: "MARY ANN WILLIAMS",
      authorizeRelationship: "GUARDIAN",
      authorizePhone: "602-555-7000",
      authorizeAddress: "321 Guardian Street Suite 100, Phoenix, AZ 85004",
      section2SignatureDate: new Date().toISOString().split("T")[0],
    },
    tribal_release: {
      tribe: "other",
      otherTribeName: "WHITE MOUNTAIN APACHE TRIBE",
      claimantName: "JANE MARIE SMITH",
      tribalOrganizationName: "WHITE MOUNTAIN APACHE TRIBE",
      signatureDate: new Date().toISOString().split("T")[0],
    },
    beneficiary_signatures: {
      beneficiaries: [
        {
          name: "JENNIFER SMITH",
          ssn: "111-22-3333",
          date: new Date().toISOString().split("T")[0],
          attorneyName: "ROBERT JOHNSON",
          phoneNumber: "602-555-1111",
        },
        {
          name: "MICHAEL SMITH JR",
          ssn: "222-33-4444",
          date: new Date().toISOString().split("T")[0],
          attorneyName: "ROBERT JOHNSON",
          phoneNumber: "602-555-2222",
        },
        {
          name: "SARAH SMITH",
          ssn: "333-44-5555",
          date: new Date().toISOString().split("T")[0],
          phoneNumber: "602-555-3333",
        },
      ],
      additionalChildrenAttached: true,
    },
  };

  try {
    const officialPdfPath = path.join(
      process.cwd(),
      "docs",
      "RECA Downwinder Claim Form.pdf"
    );
    const outputPath = path.join(
      process.cwd(),
      "docs",
      "test-output",
      "filled-reca-form-test.pdf"
    );

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log("📝 Filling form with test data...");

    const pdfBytes = await fillOfficialRECAPDF({
      formData: testFormData as any,
      supportingForms: {},
      sessionId: "test",
      officialPdfPath,
    });

    fs.writeFileSync(outputPath, pdfBytes);

    console.log("✅ PDF regenerated successfully!");
    console.log(`📁 Saved to: ${outputPath}\n`);

    console.log("📋 Test data includes:");
    console.log("  • Part 1 (Page 1): JOHN MICHAEL SMITH");
    console.log("  • Part 1 (Page 2): Residence & Tribal info");
    console.log("  • Part 2: JANE MARIE SMITH (deceased)");
    console.log("  • Part 3: Spouse relationship (all checkboxes)");
    console.log("  • Part 4: Birth & Marriage certificates");
    console.log("  • Part 5: Surviving Spouse (YES/NO checkboxes)");
    console.log("  • Part 6: Surviving Child (NATURAL type)");
    console.log("  • Part 7: Other Relatives (PARENT)");
    console.log("  • Part 8: Idaho, Arizona (2 counties), Nevada");
    console.log("  • Part 9: Contacted Church of LDS");
    console.log("  • Part 10: 3 diseases (lung, thyroid, leukemia)");
    console.log("  • Part 11: Medical records & RESEP assistance");
    console.log("  • Part 12: No previous payments");
    console.log("  • Part 13: Attorney ROBERT JOHNSON");
    console.log("  • Part 14: Attorney acknowledgment (2%)");
    console.log("  • Part 15: Guardian MARY ANN WILLIAMS");
    console.log("  • Part 16: Today's date\n");

    console.log("💡 Quick tips:");
    console.log("  • Edit coordinates in: src/lib/reca/pdf-form-filler.ts");
    console.log("  • Lines 46-165: FIELD_COORDINATES object");
    console.log("  • Adjust x/y values by ±1-2 points to fine-tune");
    console.log("  • Adjust characterSpacing if text is too tight/loose");
    console.log("  • Run this script again to see changes\n");

    // Optionally open the PDF automatically (macOS only)
    if (process.platform === "darwin") {
      const { execSync } = require("child_process");
      try {
        execSync(`open "${outputPath}"`, { stdio: "ignore" });
        console.log("📂 Opened PDF in default viewer\n");
      } catch (err) {
        // Silently fail if open command doesn't work
      }
    }
  } catch (error) {
    console.error("❌ Error regenerating PDF:", error);
    process.exit(1);
  }
}

// Run the regeneration
regenerateTestPDF();
