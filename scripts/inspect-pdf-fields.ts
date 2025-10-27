/**
 * Script to inspect PDF form fields in the RECA Downwinder Claim Form
 * This helps us understand what fields exist so we can map our data to them
 */

import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

async function inspectPDFFields() {
  try {
    // Load the PDF
    const pdfPath = path.join(process.cwd(), 'docs', 'RECA Downwinder Claim Form.pdf');
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Get the form
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    console.log('\n=== RECA Downwinder Claim Form - PDF Field Inspection ===\n');
    console.log(`Total number of form fields: ${fields.length}\n`);

    if (fields.length === 0) {
      console.log('❌ No fillable form fields found in this PDF.');
      console.log('This PDF may not be a fillable form, or fields may be flattened.\n');
      return;
    }

    // Organize fields by type
    const fieldsByType: Record<string, any[]> = {
      text: [],
      checkbox: [],
      radio: [],
      dropdown: [],
      other: [],
    };

    fields.forEach((field, index) => {
      const name = field.getName();
      const type = field.constructor.name;

      const fieldInfo = {
        index,
        name,
        type,
      };

      // Try to get additional info based on type
      try {
        if (type === 'PDFTextField') {
          fieldsByType.text.push({
            ...fieldInfo,
            maxLength: (field as any).getMaxLength?.() || 'unlimited',
          });
        } else if (type === 'PDFCheckBox') {
          fieldsByType.checkbox.push(fieldInfo);
        } else if (type === 'PDFRadioGroup') {
          fieldsByType.radio.push({
            ...fieldInfo,
            options: (field as any).getOptions?.() || [],
          });
        } else if (type === 'PDFDropdown') {
          fieldsByType.dropdown.push({
            ...fieldInfo,
            options: (field as any).getOptions?.() || [],
          });
        } else {
          fieldsByType.other.push(fieldInfo);
        }
      } catch (err) {
        fieldsByType.other.push(fieldInfo);
      }
    });

    // Print summary
    console.log('📊 Field Type Summary:');
    console.log(`  - Text fields: ${fieldsByType.text.length}`);
    console.log(`  - Checkboxes: ${fieldsByType.checkbox.length}`);
    console.log(`  - Radio groups: ${fieldsByType.radio.length}`);
    console.log(`  - Dropdowns: ${fieldsByType.dropdown.length}`);
    console.log(`  - Other: ${fieldsByType.other.length}\n`);

    // Print detailed field information
    console.log('📝 Text Fields:');
    console.log('─'.repeat(80));
    fieldsByType.text.forEach((field) => {
      console.log(`[${field.index}] ${field.name}`);
      console.log(`    Max Length: ${field.maxLength}`);
    });

    console.log('\n☑️  Checkboxes:');
    console.log('─'.repeat(80));
    fieldsByType.checkbox.forEach((field) => {
      console.log(`[${field.index}] ${field.name}`);
    });

    console.log('\n🔘 Radio Groups:');
    console.log('─'.repeat(80));
    fieldsByType.radio.forEach((field) => {
      console.log(`[${field.index}] ${field.name}`);
      if (field.options.length > 0) {
        console.log(`    Options: ${field.options.join(', ')}`);
      }
    });

    console.log('\n📋 Dropdowns:');
    console.log('─'.repeat(80));
    fieldsByType.dropdown.forEach((field) => {
      console.log(`[${field.index}] ${field.name}`);
      if (field.options.length > 0) {
        console.log(`    Options: ${field.options.join(', ')}`);
      }
    });

    if (fieldsByType.other.length > 0) {
      console.log('\n❓ Other Fields:');
      console.log('─'.repeat(80));
      fieldsByType.other.forEach((field) => {
        console.log(`[${field.index}] ${field.name} (${field.type})`);
      });
    }

    // Save field list to JSON file for reference
    const outputPath = path.join(process.cwd(), 'docs', 'parsed_form_data', 'pdf_field_names.json');
    const allFields = fields.map((field, index) => ({
      index,
      name: field.getName(),
      type: field.constructor.name,
    }));

    fs.writeFileSync(outputPath, JSON.stringify(allFields, null, 2));
    console.log(`\n✅ Field list saved to: ${outputPath}\n`);

  } catch (error) {
    console.error('❌ Error inspecting PDF:', error);
    process.exit(1);
  }
}

// Run the inspection
inspectPDFFields();
