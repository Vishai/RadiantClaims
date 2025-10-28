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

import { fillOfficialRECAPDF } from '../src/lib/reca/pdf-form-filler';
import * as fs from 'fs';
import * as path from 'path';

async function regenerateTestPDF() {
  console.log('🔄 Regenerating test PDF...\n');

  // Test data
  const testFormData = {
    part_1: {
      firstName: 'JOHN',
      middleName: 'MICHAEL',
      lastName: 'SMITH',
      formerNames: '',
      ssn: '123-45-6789',
      dob: '1965-03-15',
      mailingAddress: '123 Main Street',
      city: 'PHOENIX',
      state: 'AZ',
      zipCode: '85001',
      phoneDay: '602-555-1234',
      phoneEvening: '602-555-5678',
      email: 'john.smith@example.com',
      // Page 2 fields
      residenceAddress: '456 Oak Avenue',
      residenceAddress2: 'Apartment 3B',
      tribalAffiliation: 'NAVAJO NATION',
      tribalCensusNumber: 'NC-123456',
      tribalAssistance: 'navajo',
      tribalAssistanceOther: '',
    },
    part_2: {
      firstName: 'JANE',
      middleName: 'MARIE',
      lastName: 'SMITH',
      formerNames: '',
      ssn: '987-65-4321',
      dob: '1960-06-20',
      dod: '2020-12-31',
    },
    part_3: {
      relationship: 'spouse',
    },
    part_8: {
      exposureOption: 'designated_1year',
      locations: {
        idaho: {
          townCity: 'BOISE',
          timePeriod: '1955-1960',
        },
        arizona: [
          {
            county: 'Coconino',
            townCity: 'FLAGSTAFF',
            timePeriod: '1956-1958',
          },
          {
            county: 'Navajo',
            townCity: 'HOLBROOK',
            timePeriod: '1958-1960',
          },
        ],
        nevada: [
          {
            county: 'Nye',
            townCity: 'TONOPAH',
            timePeriod: '1955-1962',
          },
        ],
      },
    },
    part_10: {
      diseases: ['lung', 'thyroid', 'leukemia'],
    },
    part_16: {
      signatureDate: new Date().toISOString().split('T')[0],
    },
  };

  try {
    const officialPdfPath = path.join(process.cwd(), 'docs', 'RECA Downwinder Claim Form.pdf');
    const outputPath = path.join(process.cwd(), 'docs', 'test-output', 'filled-reca-form-test.pdf');

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('📝 Filling form with test data...');

    const pdfBytes = await fillOfficialRECAPDF({
      formData: testFormData as any,
      supportingForms: {},
      sessionId: 'test',
      officialPdfPath,
    });

    fs.writeFileSync(outputPath, pdfBytes);

    console.log('✅ PDF regenerated successfully!');
    console.log(`📁 Saved to: ${outputPath}\n`);

    console.log('📋 Test data includes:');
    console.log('  • Part 1 (Page 1): JOHN MICHAEL SMITH');
    console.log('  • Part 1 (Page 2): Residence & Tribal info');
    console.log('  • Part 2: JANE MARIE SMITH (deceased)');
    console.log('  • Part 3: Spouse relationship');
    console.log('  • Part 8: Idaho, Arizona (2 counties), Nevada');
    console.log('  • Part 10: 3 diseases (lung, thyroid, leukemia)');
    console.log('  • Part 16: Today\'s date\n');

    console.log('💡 Quick tips:');
    console.log('  • Edit coordinates in: src/lib/reca/pdf-form-filler.ts');
    console.log('  • Lines 46-165: FIELD_COORDINATES object');
    console.log('  • Adjust x/y values by ±1-2 points to fine-tune');
    console.log('  • Adjust characterSpacing if text is too tight/loose');
    console.log('  • Run this script again to see changes\n');

    // Optionally open the PDF automatically (macOS only)
    if (process.platform === 'darwin') {
      const { execSync } = require('child_process');
      try {
        execSync(`open "${outputPath}"`, { stdio: 'ignore' });
        console.log('📂 Opened PDF in default viewer\n');
      } catch (err) {
        // Silently fail if open command doesn't work
      }
    }

  } catch (error) {
    console.error('❌ Error regenerating PDF:', error);
    process.exit(1);
  }
}

// Run the regeneration
regenerateTestPDF();
