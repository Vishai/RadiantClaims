/**
 * Test script for PDF form filling
 * This script tests overlaying text on the official RECA form
 */

import * as fs from 'fs';
import * as path from 'path';
import { fillOfficialRECAPDF } from '../src/lib/reca/pdf-form-filler';
import { RECAFormData } from '../src/lib/reca/types';

async function testPDFFormFilling() {
  console.log('🧪 Testing PDF Form Filling...\n');

  // Sample data for testing
  const sampleFormData: Partial<RECAFormData> = {
    part_1: {
      firstName: 'JOHN',
      middleName: 'MICHAEL',
      lastName: 'SMITH',
      formerNames: 'JOHNATHAN SMITH',
      ssn: '123-45-6789',
      dob: '1965-03-15',
      mailingAddress: '123 Main Street',
      city: 'Phoenix',
      state: 'AZ',
      zipCode: '85001',
      phoneDay: '602-555-0100',
      phoneEvening: '602-555-0101',
      email: 'john.smith@example.com',
      residenceAddress: '123 Main Street, Phoenix, AZ 85001',
      tribalAffiliation: 'Navajo Nation',
      tribalCensusNumber: 'N123456',
      tribalAssistance: 'navajo',
      tribalAssistanceOther: null,
    },
    part_2: {
      firstName: 'JANE',
      middleName: 'MARIE',
      lastName: 'SMITH',
      formerNames: null,
      ssn: '987-65-4321',
      dob: '1963-07-22',
      dod: '2020-12-31',
    },
    part_3: {
      relationship: 'spouse',
    },
    part_8: {
      exposureOption: 'designated_1year',
      locations: {
        idaho: {
          townCity: 'Boise',
          timePeriod: '1955-1960',
        },
        arizona: [
          {
            county: 'Coconino',
            townCity: 'Flagstaff',
            timePeriod: '1956-1958',
          },
          {
            county: 'Navajo',
            townCity: 'Holbrook',
            timePeriod: '1958-1960',
          },
        ],
        nevada: [
          {
            county: 'Nye',
            townCity: 'Tonopah',
            timePeriod: '1955-1962',
          },
        ],
      },
    },
    part_10: {
      diseases: ['lung', 'thyroid', 'leukemia'],
    },
    part_16: {
      signatureDate: '10/27/2025',
    },
  };

  try {
    const officialPdfPath = path.join(process.cwd(), 'docs', 'RECA Downwinder Claim Form.pdf');

    if (!fs.existsSync(officialPdfPath)) {
      console.error('❌ Official PDF not found at:', officialPdfPath);
      process.exit(1);
    }

    console.log('📄 Loading official PDF from:', officialPdfPath);

    const filledPdfBytes = await fillOfficialRECAPDF({
      formData: sampleFormData,
      supportingForms: {},
      sessionId: 'test-session',
      officialPdfPath,
    });

    // Save the filled PDF
    const outputPath = path.join(process.cwd(), 'docs', 'test-output', 'filled-reca-form-test.pdf');
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, filledPdfBytes);

    console.log('\n✅ Successfully created filled PDF!');
    console.log('📁 Saved to:', outputPath);
    console.log('\n📋 Test Data Used:');
    console.log('  Part 1 - Filer:');
    console.log('    - Name: JOHN MICHAEL SMITH');
    console.log('    - SSN: 123-45-6789');
    console.log('    - DOB: 03/15/1965');
    console.log('    - Address: 123 Main Street, Phoenix, AZ 85001');
    console.log('  Part 2 - Claimant:');
    console.log('    - Name: JANE MARIE SMITH (Deceased 12/31/2020)');
    console.log('  Part 3 - Relationship: Spouse');
    console.log('  Part 8 - Exposure:');
    console.log('    - Option: Designated area 1+ year (1951-1962)');
    console.log('    - Idaho: Boise (1955-1960)');
    console.log('    - Arizona: Flagstaff, Coconino Co (1956-1958)');
    console.log('    - Arizona: Holbrook, Navajo Co (1958-1960)');
    console.log('    - Nevada: Tonopah, Nye Co (1955-1962)');
    console.log('  Part 10 - Diseases: Lung, Thyroid, Leukemia');
    console.log('  Part 16 - Signature Date: 10/27/2025');
    console.log('\n👀 Please open the PDF and verify:');
    console.log('  1. Part 1-3 fields (already tested - should work)');
    console.log('  2. Part 8 exposure checkbox is marked on page 6');
    console.log('  3. Part 8 location data appears on page 7');
    console.log('  4. Part 10 disease checkboxes (3) are marked on page 9');
    console.log('  5. Part 16 signature date appears on page 13');
    console.log('  6. All text is readable and properly aligned');
    console.log('  7. No text overlaps or extends beyond field boundaries');
    console.log('\n💡 If coordinates need adjustment, edit FIELD_COORDINATES in pdf-form-filler.ts\n');

  } catch (error) {
    console.error('❌ Error filling PDF:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testPDFFormFilling();
