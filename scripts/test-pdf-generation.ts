/**
 * Test script for RECA PDF generation
 * Creates a sample PDF to verify the generator works correctly
 */

import { generateRECAPDF } from '../src/lib/reca/pdf-generator';
import * as fs from 'fs';
import * as path from 'path';

// Sample test data
const testFormData = {
  part_1: {
    firstName: 'John',
    middleName: 'A',
    lastName: 'Doe',
    ssn: '123-45-6789',
    dob: '1965-03-15',
    mailingAddress: '123 Main Street',
    city: 'Salt Lake City',
    state: 'Utah',
    zipCode: '84101',
    phoneDay: '(801) 555-1234',
    email: 'john.doe@example.com',
  },
  part_3: {
    relationship: 'Self' as const,
  },
  part_8: {
    exposureOptions: ['option_1a' as const],
    affectedAreas: [
      {
        state: 'Utah' as const,
        townCity: 'Salt Lake City',
        timePeriod: 'January 1952 - December 1962',
      },
    ],
  },
  part_10: {
    diseases: ['thyroid' as const, 'lung' as const],
  },
  part_11: {
    medicalRecordsSubmitted: true,
    cancerRegistryAuthorization: true,
    resepAssistance: 'NO' as const,
  },
  part_12: {
    receivedPayment: 'NO' as const,
    eeoicpaClaim: 'NO' as const,
  },
  part_13: {
    hasAttorney: 'YES' as const,
    attorneyFirstName: 'Jane',
    attorneyLastName: 'Smith',
    attorneyFirm: 'RadiantClaims Legal Services',
    attorneyAddress: '456 Legal Ave',
    attorneyCity: 'Washington',
    attorneyState: 'DC',
    attorneyZip: '20001',
    attorneyPhone: '(202) 555-6789',
    attorneyEmail: 'jane.smith@radiantclaims.com',
  },
  part_16: {
    signature: 'John A. Doe',
    signatureDate: '2025-01-27',
    authorizationAcknowledgment: true,
  },
};

const testSupportingForms = {
  certificationOfIdentity: {
    fullName: 'John A. Doe',
    citizenshipStatus: 'US Citizen' as const,
    ssn: '123-45-6789',
    currentAddress: '123 Main Street, Salt Lake City, UT 84101',
    dob: '1965-03-15',
    placeOfBirth: 'Salt Lake City, Utah',
    signature: 'John A. Doe',
    signatureDate: '2025-01-27',
  },
};

async function testPDFGeneration() {
  try {
    console.log('\n🧪 Testing RECA PDF Generation...\n');

    console.log('📝 Generating PDF with test data...');
    const pdfBytes = await generateRECAPDF({
      formData: testFormData,
      supportingForms: testSupportingForms,
      sessionId: 'test-123',
    });

    console.log(`✅ PDF generated successfully! Size: ${pdfBytes.length} bytes`);

    // Save to file
    const outputPath = path.join(process.cwd(), 'test-output.pdf');
    fs.writeFileSync(outputPath, pdfBytes);
    console.log(`💾 PDF saved to: ${outputPath}`);

    console.log('\n✨ Test completed successfully!');
    console.log('👉 Open test-output.pdf to review the generated PDF\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

testPDFGeneration();
