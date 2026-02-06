/**
 * Comprehensive Test User Seed Script
 *
 * Creates 14 test users covering ALL logic paths in the RECA form:
 * - 6 Happy Path users (should complete successfully)
 * - 8 Breaking/Contradiction users (should fail or warn)
 *
 * Each user gets:
 * - User account with hashed password
 * - Claimant record
 * - IntakeSession with pre-filled recaFormData (all 16 parts)
 * - Active ServiceSubscription (bypasses Stripe payment)
 * - Simulated document metadata
 *
 * Usage: npx tsx scripts/seed-test-comprehensive.ts
 *
 * To clean up: npx tsx scripts/seed-test-comprehensive.ts --cleanup
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const TEST_EMAIL_DOMAIN = "@radiantclaims.test";
const TEST_PASSWORD = "TestPassword123!";

// ============================================================================
// HAPPY PATH TEST USERS
// ============================================================================

const happyPathUsers = [
  {
    // TEST 1: Self-Filer, Simplest Path — Single disease, no name changes, Utah
    id: "hp-1-self-simple",
    user: {
      email: `test-self-simple${TEST_EMAIL_DOMAIN}`,
      name: "John Martinez",
    },
    claimant: {
      firstName: "John",
      lastName: "Martinez",
      email: `test-self-simple${TEST_EMAIL_DOMAIN}`,
      phone: "(435) 555-0101",
      dob: new Date("1945-03-15"),
      address1: "456 Oak St",
      city: "Cedar City",
      county: "Iron",
      state: "UT",
      postalCode: "84720",
      claimType: "DOWNWINDER" as const,
      relationshipToClaimant: "SELF" as const,
    },
    formData: {
      part_1: {
        filingForSelf: true,
        firstName: "John",
        middleName: "",
        lastName: "Martinez",
        formerNames: [],
        ssn: "123-45-6789",
        dob: "1945-03-15",
        mailingAddress: "456 Oak St",
        city: "Cedar City",
        state: "Utah",
        zipCode: "84720",
        phoneDay: "(435) 555-0101",
        phoneEvening: "",
        email: `test-self-simple${TEST_EMAIL_DOMAIN}`,
        residenceAddress: "",
        tribalAffiliation: "",
        tribalCensusNumber: "",
      },
      part_2: {
        firstName: "John",
        middleName: "",
        lastName: "Martinez",
        formerNames: [],
        ssn: "123-45-6789",
        dob: "1945-03-15",
      },
      part_3: { relationship: "Self", filingForSelf: true },
      part_4: {},
      part_8: {
        exposureOptions: ["option_1a"],
        locations: [
          {
            type: "designated",
            state: "Utah",
            townCity: "Cedar City",
            timePeriod: "January 1952 - December 1960",
          },
        ],
      },
      part_9: { uploadedDocuments: [], ldsChurchAssistance: false },
      part_10: { diseases: ["thyroid"] },
      part_11: {
        medicalRecordsSubmitted: true,
        resepClinicAssistance: "NO",
        uploadedDocuments: [],
      },
      part_12: { receivedPayment: "NO", eeoicpaClaim: "NO" },
      part_13: { hasAttorney: "NO" },
      part_16: {
        authorization: true,
        signature: "John Martinez",
        signatureDate: new Date().toISOString().split("T")[0],
      },
    },
    description:
      "Self-filer, simplest path. Single disease (thyroid), Utah, no name changes, no prior payments.",
  },

  {
    // TEST 2: Surviving Spouse — Name change (maiden), multiple diseases
    id: "hp-2-spouse",
    user: { email: `test-spouse${TEST_EMAIL_DOMAIN}`, name: "Maria Thompson" },
    claimant: {
      firstName: "Maria",
      lastName: "Thompson",
      email: `test-spouse${TEST_EMAIL_DOMAIN}`,
      phone: "(435) 555-0202",
      dob: new Date("1948-07-22"),
      address1: "789 Pine Ave",
      city: "St George",
      county: "Washington",
      state: "UT",
      postalCode: "84770",
      claimType: "DOWNWINDER" as const,
      relationshipToClaimant: "SPOUSE" as const,
    },
    formData: {
      part_1: {
        filingForSelf: false,
        firstName: "Maria",
        middleName: "",
        lastName: "Thompson",
        formerNames: [{ name: "Maria Garcia", type: "MAIDEN", year: "1968" }],
        ssn: "234-56-7890",
        dob: "1948-07-22",
        mailingAddress: "789 Pine Ave",
        city: "St George",
        state: "Utah",
        zipCode: "84770",
        phoneDay: "(435) 555-0202",
        phoneEvening: "",
        email: `test-spouse${TEST_EMAIL_DOMAIN}`,
        residenceAddress: "",
        tribalAffiliation: "",
        tribalCensusNumber: "",
      },
      part_2: {
        firstName: "Robert",
        middleName: "James",
        lastName: "Thompson",
        formerNames: [],
        ssn: "345-67-8901",
        dob: "1942-01-10",
        dod: "2019-08-15",
      },
      part_3: { relationship: "Spouse", filingForSelf: false },
      part_5: {
        claimantDeceased: "YES",
        marriedOneYear: "YES",
        claimantPreviousMarriages: "NO",
        filerOtherMarriages: "NO",
      },
      part_8: {
        exposureOptions: ["option_1a"],
        locations: [
          {
            type: "designated",
            state: "Utah",
            townCity: "St George",
            timePeriod: "March 1953 - November 1962",
          },
        ],
      },
      part_9: { uploadedDocuments: [], ldsChurchAssistance: false },
      part_10: { diseases: ["lung", "thyroid"] },
      part_11: {
        medicalRecordsSubmitted: true,
        resepClinicAssistance: "NO",
        uploadedDocuments: [],
      },
      part_12: { receivedPayment: "NO", eeoicpaClaim: "NO" },
      part_13: { hasAttorney: "NO" },
      part_16: {
        authorization: true,
        signature: "Maria Thompson",
        signatureDate: new Date().toISOString().split("T")[0],
      },
    },
    description:
      "Surviving spouse. Maiden name change, 2 diseases (lung+thyroid), deceased husband Robert.",
  },

  {
    // TEST 3: Surviving Child — No surviving spouse, 3 siblings (1 deceased), name change on sibling
    id: "hp-3-child",
    user: { email: `test-child${TEST_EMAIL_DOMAIN}`, name: "David Wilson" },
    claimant: {
      firstName: "David",
      lastName: "Wilson",
      email: `test-child${TEST_EMAIL_DOMAIN}`,
      phone: "(775) 555-0303",
      dob: new Date("1960-11-03"),
      address1: "321 Elm Rd",
      city: "Ely",
      county: "White Pine",
      state: "NV",
      postalCode: "89301",
      claimType: "DOWNWINDER" as const,
      relationshipToClaimant: "CHILD" as const,
    },
    formData: {
      part_1: {
        filingForSelf: false,
        firstName: "David",
        middleName: "",
        lastName: "Wilson",
        formerNames: [],
        ssn: "456-78-9012",
        dob: "1960-11-03",
        mailingAddress: "321 Elm Rd",
        city: "Ely",
        state: "Nevada",
        zipCode: "89301",
        phoneDay: "(775) 555-0303",
        phoneEvening: "",
        email: `test-child${TEST_EMAIL_DOMAIN}`,
        residenceAddress: "",
        tribalAffiliation: "",
        tribalCensusNumber: "",
      },
      part_2: {
        firstName: "Harold",
        middleName: "Eugene",
        lastName: "Wilson",
        formerNames: [],
        ssn: "567-89-0123",
        dob: "1935-05-20",
        dod: "2015-03-12",
      },
      part_3: { relationship: "Child", filingForSelf: false },
      part_6: {
        claimantDeceased: "YES",
        claimantEverMarried: "YES",
        claimantSpouses: [
          {
            spouseName: "Dorothy Wilson",
            marriageStart: "1958-06-01",
            marriageEnd: "2010-02-15",
          },
        ],
        survivingSpouseExists: "NO",
        childType: "NATURAL",
        otherChildrenExist: "YES",
        siblings: [
          {
            name: "David Wilson",
            dateOfBirth: "11/03/1960",
            cityOfBirth: "Ely",
            stateOfBirth: "Nevada",
            isDeceased: "NO",
            currentAddress: "321 Elm Rd, Ely NV 89301",
            phoneNumber: "(775) 555-0303",
            hadNameChange: "NO",
          },
          {
            name: "Susan Baker",
            dateOfBirth: "03/15/1958",
            cityOfBirth: "Ely",
            stateOfBirth: "Nevada",
            isDeceased: "NO",
            currentAddress: "100 Main St, Ely NV 89301",
            phoneNumber: "(775) 555-0102",
            hadNameChange: "YES",
            originalLastName: "Wilson",
            nameChangeHistory: [
              {
                previousName: "Susan Wilson",
                dateOfChange: "06/15/1980",
                reasonForChange: "MARRIAGE",
              },
            ],
          },
          {
            name: "Thomas Wilson",
            dateOfBirth: "08/22/1963",
            cityOfBirth: "Ely",
            stateOfBirth: "Nevada",
            isDeceased: "YES",
            dateOfDeath: "01/05/2020",
            cityOfDeath: "Ely",
            stateOfDeath: "Nevada",
            hasDeathCertificate: "YES",
            hadNameChange: "NO",
          },
        ],
      },
      part_8: {
        exposureOptions: ["option_1a"],
        locations: [
          {
            type: "nevada",
            county: "White Pine",
            townCity: "Ely",
            timePeriod: "June 1951 - December 1962",
          },
        ],
      },
      part_9: { uploadedDocuments: [], ldsChurchAssistance: false },
      part_10: { diseases: ["stomach", "colon"] },
      part_11: {
        medicalRecordsSubmitted: true,
        resepClinicAssistance: "NO",
        uploadedDocuments: [],
      },
      part_12: { receivedPayment: "NO", eeoicpaClaim: "YES" },
      part_13: { hasAttorney: "NO" },
      part_16: {
        authorization: true,
        signature: "David Wilson",
        signatureDate: new Date().toISOString().split("T")[0],
      },
    },
    description:
      "Surviving child. 3 siblings (1 deceased Thomas, 1 name-changed Susan). No eligible spouse. Nevada White Pine.",
  },

  {
    // TEST 4: Arizona Downwinder + Tribal Affiliation + Prior EEOICPA
    id: "hp-4-tribal-az",
    user: { email: `test-tribal${TEST_EMAIL_DOMAIN}`, name: "Anna Begay" },
    claimant: {
      firstName: "Anna",
      lastName: "Begay",
      email: `test-tribal${TEST_EMAIL_DOMAIN}`,
      phone: "(928) 555-0404",
      dob: new Date("1950-09-08"),
      address1: "PO Box 234",
      city: "Tuba City",
      county: "Coconino",
      state: "AZ",
      postalCode: "86045",
      claimType: "DOWNWINDER" as const,
      relationshipToClaimant: "SELF" as const,
    },
    formData: {
      part_1: {
        filingForSelf: true,
        firstName: "Anna",
        middleName: "",
        lastName: "Begay",
        formerNames: [],
        ssn: "678-90-1234",
        dob: "1950-09-08",
        mailingAddress: "PO Box 234",
        city: "Tuba City",
        state: "Arizona",
        zipCode: "86045",
        phoneDay: "(928) 555-0404",
        phoneEvening: "",
        email: `test-tribal${TEST_EMAIL_DOMAIN}`,
        residenceAddress: "",
        tribalAffiliation: "Navajo Nation",
        tribalCensusNumber: "NN-2024-45678",
      },
      part_2: {
        firstName: "Anna",
        middleName: "",
        lastName: "Begay",
        formerNames: [],
        ssn: "678-90-1234",
        dob: "1950-09-08",
      },
      part_3: { relationship: "Self", filingForSelf: true },
      part_4: {},
      part_8: {
        exposureOptions: ["option_1a"],
        locations: [
          {
            type: "arizona",
            county: "Coconino",
            townCity: "Tuba City",
            timePeriod: "January 1951 - November 1962",
          },
        ],
      },
      part_9: { uploadedDocuments: [], ldsChurchAssistance: false },
      part_10: { diseases: ["breast", "ovary", "lung"] },
      part_11: {
        medicalRecordsSubmitted: true,
        resepClinicAssistance: "YES",
        resepClinicName: "Tuba City Regional Health Care",
        uploadedDocuments: [],
      },
      part_12: {
        receivedPayment: "YES",
        paymentDetails:
          "EEOICPA Part B payment of $150,000 received 03/2018 from Department of Labor",
        eeoicpaClaim: "YES",
      },
      part_13: { hasAttorney: "NO" },
      part_16: {
        authorization: true,
        signature: "Anna Begay",
        signatureDate: new Date().toISOString().split("T")[0],
      },
    },
    description:
      "Self-filer, Arizona Coconino county, Navajo Nation tribal, 3 diseases, prior EEOICPA payment, RESEP clinic.",
  },

  {
    // TEST 5: New Mexico Option 2 Path + LDS Church Records
    id: "hp-5-newmexico",
    user: { email: `test-newmexico${TEST_EMAIL_DOMAIN}`, name: "James Lovato" },
    claimant: {
      firstName: "James",
      lastName: "Lovato",
      email: `test-newmexico${TEST_EMAIL_DOMAIN}`,
      phone: "(505) 555-0505",
      dob: new Date("1940-12-01"),
      address1: "567 Rio Grande Blvd",
      city: "Albuquerque",
      county: "Bernalillo",
      state: "NM",
      postalCode: "87102",
      claimType: "DOWNWINDER" as const,
      relationshipToClaimant: "SELF" as const,
    },
    formData: {
      part_1: {
        filingForSelf: true,
        firstName: "James",
        middleName: "Antonio",
        lastName: "Lovato",
        formerNames: [],
        ssn: "789-01-2345",
        dob: "1940-12-01",
        mailingAddress: "567 Rio Grande Blvd",
        city: "Albuquerque",
        state: "New Mexico",
        zipCode: "87102",
        phoneDay: "(505) 555-0505",
        phoneEvening: "",
        email: `test-newmexico${TEST_EMAIL_DOMAIN}`,
        residenceAddress: "",
        tribalAffiliation: "",
        tribalCensusNumber: "",
      },
      part_2: {
        firstName: "James",
        middleName: "Antonio",
        lastName: "Lovato",
        formerNames: [],
        ssn: "789-01-2345",
        dob: "1940-12-01",
      },
      part_3: { relationship: "Self", filingForSelf: true },
      part_4: {},
      part_8: {
        exposureOptions: ["option_2"],
        locations: [
          {
            type: "designated",
            state: "New Mexico",
            townCity: "Albuquerque",
            timePeriod: "September 1944 - December 1955",
          },
        ],
      },
      part_9: { uploadedDocuments: [], ldsChurchAssistance: true },
      part_10: { diseases: ["leukemia"] },
      part_11: {
        medicalRecordsSubmitted: true,
        resepClinicAssistance: "NO",
        uploadedDocuments: [],
      },
      part_12: { receivedPayment: "NO", eeoicpaClaim: "NO" },
      part_13: { hasAttorney: "NO" },
      part_16: {
        authorization: true,
        signature: "James Lovato",
        signatureDate: new Date().toISOString().split("T")[0],
      },
    },
    description:
      "Self-filer, NM option_2 exposure path (1944-1962), leukemia, LDS church records assistance.",
  },

  {
    // TEST 6: Grandchild filing
    id: "hp-6-grandchild",
    user: {
      email: `test-grandchild${TEST_EMAIL_DOMAIN}`,
      name: "Emily Rodriguez",
    },
    claimant: {
      firstName: "Emily",
      lastName: "Rodriguez",
      email: `test-grandchild${TEST_EMAIL_DOMAIN}`,
      phone: "(505) 555-0606",
      dob: new Date("1990-02-14"),
      address1: "456 Sunset Blvd",
      city: "Albuquerque",
      county: "Bernalillo",
      state: "NM",
      postalCode: "87101",
      claimType: "DOWNWINDER" as const,
      relationshipToClaimant: "GRANDCHILD" as const,
    },
    formData: {
      part_1: {
        filingForSelf: false,
        firstName: "Emily",
        middleName: "",
        lastName: "Rodriguez",
        formerNames: [],
        ssn: "890-12-3456",
        dob: "1990-02-14",
        mailingAddress: "456 Sunset Blvd",
        city: "Albuquerque",
        state: "New Mexico",
        zipCode: "87101",
        phoneDay: "(505) 555-0606",
        phoneEvening: "",
        email: `test-grandchild${TEST_EMAIL_DOMAIN}`,
        residenceAddress: "",
        tribalAffiliation: "",
        tribalCensusNumber: "",
      },
      part_2: {
        firstName: "Maria",
        middleName: "",
        lastName: "Lopez",
        formerNames: [],
        ssn: "901-23-4567",
        dob: "1940-03-22",
        dod: "2015-11-05",
      },
      part_3: { relationship: "Grandchild", filingForSelf: false },
      part_7: { relationshipType: "GRANDCHILD" },
      part_8: {
        exposureOptions: ["option_2"],
        locations: [
          {
            type: "designated",
            state: "New Mexico",
            townCity: "Los Alamos",
            timePeriod: "March 1951 - December 1962",
          },
        ],
      },
      part_9: { uploadedDocuments: [], ldsChurchAssistance: false },
      part_10: { diseases: ["kidney_cancer"] },
      part_11: {
        medicalRecordsSubmitted: true,
        resepClinicAssistance: "NO",
        uploadedDocuments: [],
      },
      part_12: { receivedPayment: "NO", eeoicpaClaim: "NO" },
      part_13: { hasAttorney: "NO" },
      part_16: {
        authorization: true,
        signature: "Emily Rodriguez",
        signatureDate: new Date().toISOString().split("T")[0],
      },
    },
    description:
      "Grandchild filing for deceased grandmother Maria Lopez. NM option_2, kidney cancer.",
  },
];

// ============================================================================
// BREAKING / CONTRADICTION TEST USERS
// ============================================================================

const breakingUsers = [
  {
    // BREAK 1: Self-filer contradiction — filingForSelf=true but relationship=Spouse
    id: "brk-1-self-contradiction",
    user: {
      email: `test-break1${TEST_EMAIL_DOMAIN}`,
      name: "Break1 SelfContradict",
    },
    claimant: {
      firstName: "Break1",
      lastName: "SelfContradict",
      email: `test-break1${TEST_EMAIL_DOMAIN}`,
      phone: "(000) 555-0001",
      dob: new Date("1950-01-01"),
      address1: "1 Test St",
      city: "Cedar City",
      county: "Iron",
      state: "UT",
      postalCode: "84720",
      claimType: "DOWNWINDER" as const,
      relationshipToClaimant: "SELF" as const,
    },
    formData: {
      part_1: {
        filingForSelf: true, // Says filing for self...
        firstName: "Break1",
        middleName: "",
        lastName: "SelfContradict",
        formerNames: [],
        ssn: "111-11-1111",
        dob: "1950-01-01",
        mailingAddress: "1 Test St",
        city: "Cedar City",
        state: "Utah",
        zipCode: "84720",
        phoneDay: "(000) 555-0001",
        phoneEvening: "",
        email: `test-break1${TEST_EMAIL_DOMAIN}`,
        residenceAddress: "",
        tribalAffiliation: "",
        tribalCensusNumber: "",
      },
      part_2: {
        firstName: "Deceased",
        middleName: "",
        lastName: "Person",
        formerNames: [],
        ssn: "222-22-2222",
        dob: "1940-01-01",
        dod: "2020-01-01", // ...but enters a deceased person with DOD
      },
      part_3: { relationship: "Spouse", filingForSelf: true }, // CONTRADICTION: Self + Spouse
    },
    description:
      "🔴 CONTRADICTION: filingForSelf=true but relationship=Spouse and Part 2 has DOD. Should be blocked or auto-corrected.",
  },

  {
    // BREAK 2: Child filing when eligible spouse exists
    id: "brk-2-spouse-blocks-child",
    user: { email: `test-break2${TEST_EMAIL_DOMAIN}`, name: "Karen Adams" },
    claimant: {
      firstName: "Karen",
      lastName: "Adams",
      email: `test-break2${TEST_EMAIL_DOMAIN}`,
      phone: "(000) 555-0002",
      dob: new Date("1965-06-15"),
      address1: "2 Test St",
      city: "St George",
      county: "Washington",
      state: "UT",
      postalCode: "84770",
      claimType: "DOWNWINDER" as const,
      relationshipToClaimant: "CHILD" as const,
    },
    formData: {
      part_1: {
        filingForSelf: false,
        firstName: "Karen",
        middleName: "",
        lastName: "Adams",
        formerNames: [],
        ssn: "333-33-3333",
        dob: "1965-06-15",
        mailingAddress: "2 Test St",
        city: "St George",
        state: "Utah",
        zipCode: "84770",
        phoneDay: "(000) 555-0002",
        phoneEvening: "",
        email: `test-break2${TEST_EMAIL_DOMAIN}`,
        residenceAddress: "",
        tribalAffiliation: "",
        tribalCensusNumber: "",
      },
      part_2: {
        firstName: "Frank",
        middleName: "",
        lastName: "Adams",
        formerNames: [],
        ssn: "444-44-4444",
        dob: "1938-03-10",
        dod: "2022-05-20",
      },
      part_3: { relationship: "Child", filingForSelf: false },
      part_6: {
        claimantDeceased: "YES",
        claimantEverMarried: "YES",
        claimantSpouses: [
          {
            spouseName: "Helen Adams",
            marriageStart: "1960-06-01",
            marriageEnd: "",
          },
        ],
        survivingSpouseExists: "YES", // Spouse is alive
        survivingSpouseMetOneYearRequirement: "YES", // And married 60+ years
        childType: "NATURAL",
        otherChildrenExist: "NO",
      },
    },
    description:
      "🔴 SHOULD BLOCK: Child filing but eligible surviving spouse (Helen, married 60+ years). Part 6 gate should prevent filing.",
  },

  {
    // BREAK 3: Incomplete sibling data — deceased sibling missing death info
    id: "brk-3-incomplete-sibling",
    user: { email: `test-break3${TEST_EMAIL_DOMAIN}`, name: "Mike Incomplete" },
    claimant: {
      firstName: "Mike",
      lastName: "Incomplete",
      email: `test-break3${TEST_EMAIL_DOMAIN}`,
      phone: "(000) 555-0003",
      dob: new Date("1958-04-20"),
      address1: "3 Test St",
      city: "Ely",
      county: "White Pine",
      state: "NV",
      postalCode: "89301",
      claimType: "DOWNWINDER" as const,
      relationshipToClaimant: "CHILD" as const,
    },
    formData: {
      part_1: {
        filingForSelf: false,
        firstName: "Mike",
        middleName: "",
        lastName: "Incomplete",
        formerNames: [],
        ssn: "555-55-5555",
        dob: "1958-04-20",
        mailingAddress: "3 Test St",
        city: "Ely",
        state: "Nevada",
        zipCode: "89301",
        phoneDay: "(000) 555-0003",
        phoneEvening: "",
        email: `test-break3${TEST_EMAIL_DOMAIN}`,
        residenceAddress: "",
        tribalAffiliation: "",
        tribalCensusNumber: "",
      },
      part_2: {
        firstName: "Dad",
        middleName: "",
        lastName: "Incomplete",
        formerNames: [],
        ssn: "666-66-6666",
        dob: "1930-01-01",
        dod: "2018-06-01",
      },
      part_3: { relationship: "Child", filingForSelf: false },
      part_6: {
        claimantDeceased: "YES",
        claimantEverMarried: "NO",
        survivingSpouseExists: "NO",
        childType: "NATURAL",
        otherChildrenExist: "YES",
        siblings: [
          {
            name: "Sibling Deceased",
            dateOfBirth: "01/15/1955",
            cityOfBirth: "Ely",
            stateOfBirth: "Nevada",
            isDeceased: "YES",
            // MISSING: dateOfDeath, cityOfDeath, stateOfDeath, hasDeathCertificate
          },
        ],
      },
    },
    description:
      "🔴 SHOULD FAIL: Deceased sibling with no death date, city, state, or death cert status. Part 6 validation should catch.",
  },

  {
    // BREAK 4: Exposure dates outside eligible window
    id: "brk-4-bad-exposure-dates",
    user: { email: `test-break4${TEST_EMAIL_DOMAIN}`, name: "Bad Dates" },
    claimant: {
      firstName: "Bad",
      lastName: "Dates",
      email: `test-break4${TEST_EMAIL_DOMAIN}`,
      phone: "(000) 555-0004",
      dob: new Date("1955-07-01"),
      address1: "4 Test St",
      city: "Cedar City",
      county: "Iron",
      state: "UT",
      postalCode: "84720",
      claimType: "DOWNWINDER" as const,
      relationshipToClaimant: "SELF" as const,
    },
    formData: {
      part_1: {
        filingForSelf: true,
        firstName: "Bad",
        middleName: "",
        lastName: "Dates",
        formerNames: [],
        ssn: "777-77-7777",
        dob: "1955-07-01",
        mailingAddress: "4 Test St",
        city: "Cedar City",
        state: "Utah",
        zipCode: "84720",
        phoneDay: "(000) 555-0004",
        phoneEvening: "",
        email: `test-break4${TEST_EMAIL_DOMAIN}`,
        residenceAddress: "",
        tribalAffiliation: "",
        tribalCensusNumber: "",
      },
      part_2: {
        firstName: "Bad",
        middleName: "",
        lastName: "Dates",
        formerNames: [],
        ssn: "777-77-7777",
        dob: "1955-07-01",
      },
      part_3: { relationship: "Self", filingForSelf: true },
      part_4: {},
      part_8: {
        exposureOptions: ["option_1a"], // 1951-1962 window
        locations: [
          {
            type: "designated",
            state: "Utah",
            townCity: "Cedar City",
            timePeriod: "January 1975 - December 1980",
          },
          // ^^^ PROBLEM: 1975-1980 is WAY outside the 1951-1962 window
        ],
      },
      part_10: { diseases: ["thyroid"] },
    },
    description:
      "⚠️ GAP: Exposure dates (1975-1980) outside option_1a window (1951-1962). App currently does NOT validate this — DOJ would reject.",
  },

  {
    // BREAK 5: No diseases selected
    id: "brk-5-no-diseases",
    user: { email: `test-break5${TEST_EMAIL_DOMAIN}`, name: "No Disease" },
    claimant: {
      firstName: "No",
      lastName: "Disease",
      email: `test-break5${TEST_EMAIL_DOMAIN}`,
      phone: "(000) 555-0005",
      dob: new Date("1948-02-14"),
      address1: "5 Test St",
      city: "Cedar City",
      county: "Iron",
      state: "UT",
      postalCode: "84720",
      claimType: "DOWNWINDER" as const,
      relationshipToClaimant: "SELF" as const,
    },
    formData: {
      part_1: {
        filingForSelf: true,
        firstName: "No",
        middleName: "",
        lastName: "Disease",
        formerNames: [],
        ssn: "888-88-8888",
        dob: "1948-02-14",
        mailingAddress: "5 Test St",
        city: "Cedar City",
        state: "Utah",
        zipCode: "84720",
        phoneDay: "(000) 555-0005",
        phoneEvening: "",
        email: `test-break5${TEST_EMAIL_DOMAIN}`,
        residenceAddress: "",
        tribalAffiliation: "",
        tribalCensusNumber: "",
      },
      part_2: {
        firstName: "No",
        middleName: "",
        lastName: "Disease",
        formerNames: [],
        ssn: "888-88-8888",
        dob: "1948-02-14",
      },
      part_3: { relationship: "Self", filingForSelf: true },
      part_4: {},
      part_8: {
        exposureOptions: ["option_1a"],
        locations: [
          {
            type: "designated",
            state: "Utah",
            townCity: "Cedar City",
            timePeriod: "Jan 1952 - Nov 1962",
          },
        ],
      },
      part_10: { diseases: [] }, // EMPTY — Zod should enforce min 1
    },
    description:
      "🔴 SHOULD FAIL: No diseases selected. Part 10 Zod schema enforces minimum 1.",
  },

  {
    // BREAK 6: Signature name mismatch
    id: "brk-6-sig-mismatch",
    user: { email: `test-break6${TEST_EMAIL_DOMAIN}`, name: "John Smith" },
    claimant: {
      firstName: "John",
      lastName: "Smith",
      email: `test-break6${TEST_EMAIL_DOMAIN}`,
      phone: "(000) 555-0006",
      dob: new Date("1945-08-30"),
      address1: "6 Test St",
      city: "St George",
      county: "Washington",
      state: "UT",
      postalCode: "84770",
      claimType: "DOWNWINDER" as const,
      relationshipToClaimant: "SELF" as const,
    },
    formData: {
      part_1: {
        filingForSelf: true,
        firstName: "John",
        middleName: "",
        lastName: "Smith",
        formerNames: [],
        ssn: "999-99-9999",
        dob: "1945-08-30",
        mailingAddress: "6 Test St",
        city: "St George",
        state: "Utah",
        zipCode: "84770",
        phoneDay: "(000) 555-0006",
        phoneEvening: "",
        email: `test-break6${TEST_EMAIL_DOMAIN}`,
        residenceAddress: "",
        tribalAffiliation: "",
        tribalCensusNumber: "",
      },
      part_2: {
        firstName: "John",
        middleName: "",
        lastName: "Smith",
        formerNames: [],
        ssn: "999-99-9999",
        dob: "1945-08-30",
      },
      part_3: { relationship: "Self", filingForSelf: true },
      part_4: {},
      part_8: {
        exposureOptions: ["option_1a"],
        locations: [
          {
            type: "designated",
            state: "Utah",
            townCity: "St George",
            timePeriod: "Jan 1952 - Nov 1962",
          },
        ],
      },
      part_10: { diseases: ["brain"] },
      part_11: {
        medicalRecordsSubmitted: true,
        resepClinicAssistance: "NO",
        uploadedDocuments: [],
      },
      part_12: { receivedPayment: "NO", eeoicpaClaim: "NO" },
      part_13: { hasAttorney: "NO" },
      part_16: {
        authorization: true,
        signature: "Robert Johnson", // MISMATCH: Part 1 says "John Smith"
        signatureDate: new Date().toISOString().split("T")[0],
      },
    },
    description:
      "🔴 SHOULD WARN: Signature 'Robert Johnson' doesn't match Part 1 name 'John Smith'. Red warning expected.",
  },

  {
    // BREAK 7: Previous payment YES but no details
    id: "brk-7-payment-no-details",
    user: {
      email: `test-break7${TEST_EMAIL_DOMAIN}`,
      name: "Payment NoDetails",
    },
    claimant: {
      firstName: "Payment",
      lastName: "NoDetails",
      email: `test-break7${TEST_EMAIL_DOMAIN}`,
      phone: "(000) 555-0007",
      dob: new Date("1947-11-11"),
      address1: "7 Test St",
      city: "Cedar City",
      county: "Iron",
      state: "UT",
      postalCode: "84720",
      claimType: "DOWNWINDER" as const,
      relationshipToClaimant: "SELF" as const,
    },
    formData: {
      part_1: {
        filingForSelf: true,
        firstName: "Payment",
        middleName: "",
        lastName: "NoDetails",
        formerNames: [],
        ssn: "000-00-0001",
        dob: "1947-11-11",
        mailingAddress: "7 Test St",
        city: "Cedar City",
        state: "Utah",
        zipCode: "84720",
        phoneDay: "(000) 555-0007",
        phoneEvening: "",
        email: `test-break7${TEST_EMAIL_DOMAIN}`,
        residenceAddress: "",
        tribalAffiliation: "",
        tribalCensusNumber: "",
      },
      part_2: {
        firstName: "Payment",
        middleName: "",
        lastName: "NoDetails",
        formerNames: [],
        ssn: "000-00-0001",
        dob: "1947-11-11",
      },
      part_3: { relationship: "Self", filingForSelf: true },
      part_4: {},
      part_8: {
        exposureOptions: ["option_1a"],
        locations: [
          {
            type: "designated",
            state: "Utah",
            townCity: "Cedar City",
            timePeriod: "Jan 1952 - Nov 1962",
          },
        ],
      },
      part_10: { diseases: ["pancreas"] },
      part_11: {
        medicalRecordsSubmitted: true,
        resepClinicAssistance: "NO",
        uploadedDocuments: [],
      },
      part_12: {
        receivedPayment: "YES",
        paymentDetails: "", // EMPTY — should be required when receivedPayment=YES
        eeoicpaClaim: "NO",
      },
      part_13: { hasAttorney: "NO" },
      part_16: {
        authorization: true,
        signature: "Payment NoDetails",
        signatureDate: new Date().toISOString().split("T")[0],
      },
    },
    description:
      "🔴 SHOULD FAIL: receivedPayment=YES but paymentDetails is empty. Part 12 validation should require details.",
  },

  {
    // BREAK 8: Spouse married < 1 year before death
    id: "brk-8-short-marriage",
    user: { email: `test-break8${TEST_EMAIL_DOMAIN}`, name: "Short Marriage" },
    claimant: {
      firstName: "Short",
      lastName: "Marriage",
      email: `test-break8${TEST_EMAIL_DOMAIN}`,
      phone: "(000) 555-0008",
      dob: new Date("1960-05-05"),
      address1: "8 Test St",
      city: "St George",
      county: "Washington",
      state: "UT",
      postalCode: "84770",
      claimType: "DOWNWINDER" as const,
      relationshipToClaimant: "SPOUSE" as const,
    },
    formData: {
      part_1: {
        filingForSelf: false,
        firstName: "Short",
        middleName: "",
        lastName: "Marriage",
        formerNames: [],
        ssn: "000-00-0002",
        dob: "1960-05-05",
        mailingAddress: "8 Test St",
        city: "St George",
        state: "Utah",
        zipCode: "84770",
        phoneDay: "(000) 555-0008",
        phoneEvening: "",
        email: `test-break8${TEST_EMAIL_DOMAIN}`,
        residenceAddress: "",
        tribalAffiliation: "",
        tribalCensusNumber: "",
      },
      part_2: {
        firstName: "Deceased",
        middleName: "",
        lastName: "Spouse",
        formerNames: [],
        ssn: "000-00-0003",
        dob: "1955-01-01",
        dod: "2023-06-15", // Died June 2023
      },
      part_3: { relationship: "Spouse", filingForSelf: false },
      part_5: {
        claimantDeceased: "YES",
        marriedOneYear: "NO", // Married Jan 2023, death Jun 2023 = 5 months
        claimantPreviousMarriages: "NO",
        filerOtherMarriages: "NO",
      },
    },
    description:
      "⚠️ ELIGIBILITY: Spouse married < 1 year before death. Part 5 auto-submits YES currently — should warn ineligible.",
  },
];

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function cleanup() {
  console.log("🧹 Cleaning up existing test users...\n");

  const testEmails = [...happyPathUsers, ...breakingUsers].map(
    (u) => u.user.email
  );

  for (const email of testEmails) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      // Delete in correct order to avoid FK constraints
      await prisma.serviceSubscription.deleteMany({
        where: { userId: user.id },
      });
      // Delete claimants and cascade will handle intakeSession, uploadedFiles, etc.
      await prisma.claimant.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
      console.log(`  🗑️  Deleted: ${email}`);
    }
  }
  console.log("");
}

async function seedUser(
  profile: (typeof happyPathUsers)[0] | (typeof breakingUsers)[0]
) {
  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);

  // 1. Create User
  const user = await prisma.user.create({
    data: {
      email: profile.user.email,
      password: hashedPassword,
      name: profile.user.name,
      role: "CUSTOMER",
      emailVerified: new Date(),
    },
  });

  // 2. Create Claimant
  const claimant = await prisma.claimant.create({
    data: {
      ...profile.claimant,
      userId: user.id,
    },
  });

  // 3. Create IntakeSession with pre-filled form data
  const totalParts = Object.keys(profile.formData).length;
  const completionPercent = Math.round((totalParts / 11.5) * 100); // 11.5 = 10 sections + 1.5 bonus

  await prisma.intakeSession.create({
    data: {
      claimantId: claimant.id,
      resumeToken: `test-${profile.id}-${Date.now()}`,
      currentStep: "REVIEW",
      status: "IN_PROGRESS",
      claimType: "DOWNWINDER",
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      lastActivityAt: new Date(),
      recaWorkflowStage: 2, // Form completion stage
      recaWorkflowSection: "part_1",
      recaFormData: profile.formData,
      recaCompletionPercent: completionPercent,
      recaEligibilityData: {
        isEligible: true,
        relationship: profile.claimant.relationshipToClaimant || "SELF",
        exposureVerified: true,
      },
    },
  });

  // 4. Create ServiceSubscription (bypass payment)
  await prisma.serviceSubscription.create({
    data: {
      userId: user.id,
      tier: "DIY_PREP",
      status: "ACTIVE",
      setupFeePaid: true,
      setupFeeAmount: 499.0,
      setupFeePaidAt: new Date(),
      isInstallmentPlan: false,
      installmentPaymentCount: 1,
      installmentCompleted: true,
      stripeCustomerId: `cus_test_${profile.id}`,
    },
  });

  return { user, claimant };
}

async function main() {
  const isCleanup = process.argv.includes("--cleanup");

  if (isCleanup) {
    await cleanup();
    console.log("✅ Cleanup complete!");
    return;
  }

  // Always clean up first to avoid duplicates
  await cleanup();

  console.log("🌱 Seeding comprehensive test users...\n");
  console.log(
    "═══════════════════════════════════════════════════════════════"
  );
  console.log("  HAPPY PATH USERS (should complete successfully)");
  console.log(
    "═══════════════════════════════════════════════════════════════\n"
  );

  for (const profile of happyPathUsers) {
    try {
      const { user } = await seedUser(profile);
      console.log(`  ✅ ${profile.user.name}`);
      console.log(`     📧 ${profile.user.email}`);
      console.log(`     📝 ${profile.description}\n`);
    } catch (error) {
      console.error(`  ❌ Failed: ${profile.user.name}`, error);
    }
  }

  console.log(
    "═══════════════════════════════════════════════════════════════"
  );
  console.log("  BREAKING / CONTRADICTION USERS (should fail or warn)");
  console.log(
    "═══════════════════════════════════════════════════════════════\n"
  );

  for (const profile of breakingUsers) {
    try {
      const { user } = await seedUser(profile);
      console.log(`  ✅ ${profile.user.name}`);
      console.log(`     📧 ${profile.user.email}`);
      console.log(`     💥 ${profile.description}\n`);
    } catch (error) {
      console.error(`  ❌ Failed: ${profile.user.name}`, error);
    }
  }

  console.log(
    "═══════════════════════════════════════════════════════════════"
  );
  console.log("  ALL TEST ACCOUNTS");
  console.log(`  Password for all: ${TEST_PASSWORD}`);
  console.log(
    "═══════════════════════════════════════════════════════════════\n"
  );

  console.log("  HAPPY PATH:");
  for (const p of happyPathUsers) {
    console.log(`    ${p.user.email.padEnd(45)} ${p.user.name}`);
  }

  console.log("\n  BREAKING:");
  for (const p of breakingUsers) {
    console.log(`    ${p.user.email.padEnd(45)} ${p.user.name}`);
  }

  console.log(
    `\n  Total: ${happyPathUsers.length + breakingUsers.length} test users created`
  );
  console.log(
    "═══════════════════════════════════════════════════════════════\n"
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
