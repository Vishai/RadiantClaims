/**
 * PDF Coordinate Parser
 *
 * This script helps you input measured coordinates from the calibration grid
 * and calculates optimal character spacing for form fields.
 *
 * Usage: Edit the MEASUREMENTS section below with coordinates from your annotated PDF
 */

interface FieldMeasurement {
  fieldName: string;
  // Coordinates of the FIRST character box
  firstBoxX: number;
  firstBoxY: number;
  // Coordinates of the SECOND character box (to calculate spacing)
  secondBoxX?: number;
  // Width of a single character box
  boxWidth?: number;
  // Maximum number of characters in this field
  maxChars: number;
}

// ============================================================================
// EDIT THIS SECTION: Add your measurements from the annotated calibration PDF
// ============================================================================

const MEASUREMENTS: FieldMeasurement[] = [
  // Measurements from calibration grid screenshot
  {
    fieldName: "firstName",
    firstBoxX: 100,
    firstBoxY: 443, // Text baseline in box
    secondBoxX: 114, // Second box position (14pt spacing)
    maxChars: 18, // Count of boxes in First Name field
  },
  {
    fieldName: "middleName",
    firstBoxX: 400,
    firstBoxY: 443,
    secondBoxX: 414,
    maxChars: 14, // Count of boxes in Middle Name field
  },
  {
    fieldName: "lastName",
    firstBoxX: 100,
    firstBoxY: 403,
    secondBoxX: 114,
    maxChars: 34, // Count of boxes in Last Name field
  },
  {
    fieldName: "formerName",
    firstBoxX: 100,
    firstBoxY: 363,
    secondBoxX: 114,
    maxChars: 34, // Count of boxes in Former Names field
  },
  {
    fieldName: "ssn",
    firstBoxX: 100,
    firstBoxY: 303,
    secondBoxX: 114,
    maxChars: 11, // XXX-XX-XXXX format (9 digits + 2 dashes)
  },
  {
    fieldName: "dateOfBirth",
    firstBoxX: 400,
    firstBoxY: 303,
    secondBoxX: 414,
    maxChars: 10, // mm/dd/yyyy format
  },
  {
    fieldName: "mailingAddress1",
    firstBoxX: 100,
    firstBoxY: 263,
    secondBoxX: 114,
    maxChars: 35, // First line of address
  },
  {
    fieldName: "mailingAddress2",
    firstBoxX: 100,
    firstBoxY: 223,
    secondBoxX: 114,
    maxChars: 35, // Second line of address
  },
  {
    fieldName: "city",
    firstBoxX: 100,
    firstBoxY: 183,
    secondBoxX: 114,
    maxChars: 22,
  },
  {
    fieldName: "state",
    firstBoxX: 470,
    firstBoxY: 183,
    secondBoxX: 484,
    maxChars: 2, // State abbreviation
  },
  {
    fieldName: "zipCode",
    firstBoxX: 540,
    firstBoxY: 183,
    secondBoxX: 554,
    maxChars: 10, // XXXXX-XXXX format
  },
  {
    fieldName: "phoneDay",
    firstBoxX: 100,
    firstBoxY: 143,
    secondBoxX: 114,
    maxChars: 12, // XXX-XXX-XXXX format
  },
  {
    fieldName: "phoneEvening",
    firstBoxX: 400,
    firstBoxY: 143,
    secondBoxX: 414,
    maxChars: 12, // XXX-XXX-XXXX format
  },
  {
    fieldName: "email",
    firstBoxX: 100,
    firstBoxY: 103,
    secondBoxX: 114,
    maxChars: 35,
  },
];

// ============================================================================
// Analysis and Code Generation
// ============================================================================

function analyzeCoordinates() {
  console.log("📊 PDF Coordinate Analysis\n");
  console.log("═".repeat(80) + "\n");

  const results: Array<{
    fieldName: string;
    startX: number;
    startY: number;
    charSpacing: number;
    totalWidth: number;
    maxChars: number;
  }> = [];

  for (const measurement of MEASUREMENTS) {
    const charSpacing = measurement.secondBoxX
      ? measurement.secondBoxX - measurement.firstBoxX
      : measurement.boxWidth || 12; // Default to 12 points if not specified

    const totalWidth = charSpacing * measurement.maxChars;

    results.push({
      fieldName: measurement.fieldName,
      startX: measurement.firstBoxX,
      startY: measurement.firstBoxY,
      charSpacing,
      totalWidth,
      maxChars: measurement.maxChars,
    });

    console.log(`Field: ${measurement.fieldName}`);
    console.log(
      `  Start position: (${measurement.firstBoxX}, ${measurement.firstBoxY})`
    );
    console.log(`  Character spacing: ${charSpacing.toFixed(1)} points`);
    console.log(`  Max characters: ${measurement.maxChars}`);
    console.log(`  Total field width: ${totalWidth.toFixed(1)} points`);
    console.log(
      `  Ends at X: ${(measurement.firstBoxX + totalWidth).toFixed(1)}`
    );
    console.log("");
  }

  console.log("═".repeat(80) + "\n");
  console.log("📝 Generated TypeScript Code for pdf-form-filler.ts:\n");
  console.log("// Copy and paste this into your FIELD_COORDINATES object:\n");

  for (const result of results) {
    console.log(`  ${result.fieldName}: {`);
    console.log(`    x: ${result.startX},`);
    console.log(`    y: ${result.startY},`);
    console.log(`    maxLength: ${result.maxChars},`);
    console.log(`    charSpacing: ${result.charSpacing.toFixed(1)},`);
    console.log(`  },`);
  }

  console.log("\n" + "═".repeat(80));
  console.log("\n💡 Tips for refining coordinates:");
  console.log("  1. Test with the test-pdf-form-filling.ts script");
  console.log(
    "  2. If characters are too far left, increase startX by 1-2 points"
  );
  console.log(
    "  3. If characters are too far right, decrease startX by 1-2 points"
  );
  console.log("  4. If characters are too high, decrease startY by 1-2 points");
  console.log("  5. If characters are too low, increase startY by 1-2 points");
  console.log(
    "  6. Adjust charSpacing if characters are too cramped or spread out"
  );
  console.log(
    "\n📌 Remember: PDF Y-axis is inverted (0 = bottom, 792 = top)\n"
  );

  // Generate a quick reference table
  console.log("\n📋 Quick Reference Table:\n");
  console.log(
    "Field Name".padEnd(20) +
      " | X".padEnd(8) +
      " | Y".padEnd(8) +
      " | Spacing | Max Chars"
  );
  console.log("-".repeat(70));
  for (const result of results) {
    console.log(
      result.fieldName.padEnd(20) +
        " | " +
        result.startX.toString().padEnd(6) +
        " | " +
        result.startY.toString().padEnd(6) +
        " | " +
        result.charSpacing.toFixed(1).padEnd(7) +
        " | " +
        result.maxChars
    );
  }
  console.log("");
}

// Run the analysis
analyzeCoordinates();
