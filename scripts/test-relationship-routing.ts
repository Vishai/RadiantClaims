#!/usr/bin/env tsx
/**
 * Test script to verify relationship-based routing logic
 * Ensures that the correct parts (4-7) are shown based on Part 3 selection
 */

import {
  shouldSkipSection,
  getNextSection,
  getSectionSequence,
} from "../src/lib/reca/workflow";
import { RelationshipType } from "../src/lib/reca/types";

// Test data for different relationships
const testCases: Array<{
  relationship: RelationshipType;
  expectedPart: string;
  shouldSkip: {
    part_4: boolean;
    part_5: boolean;
    part_6: boolean;
    part_7: boolean;
  };
}> = [
  {
    relationship: "Self",
    expectedPart: "part_4",
    shouldSkip: { part_4: false, part_5: true, part_6: true, part_7: true },
  },
  {
    relationship: "Spouse",
    expectedPart: "part_5",
    shouldSkip: { part_4: true, part_5: false, part_6: true, part_7: true },
  },
  {
    relationship: "Child",
    expectedPart: "part_6",
    shouldSkip: { part_4: true, part_5: true, part_6: false, part_7: true },
  },
  {
    relationship: "Parent",
    expectedPart: "part_7",
    shouldSkip: { part_4: true, part_5: true, part_6: true, part_7: false },
  },
  {
    relationship: "Grandchild",
    expectedPart: "part_7",
    shouldSkip: { part_4: true, part_5: true, part_6: true, part_7: false },
  },
  {
    relationship: "Grandparent",
    expectedPart: "part_7",
    shouldSkip: { part_4: true, part_5: true, part_6: true, part_7: false },
  },
];

console.log("🧪 Testing Relationship-Based Routing Logic\n");
console.log("=".repeat(60));

let allTestsPassed = true;

// Test each relationship scenario
testCases.forEach((testCase) => {
  console.log(`\n📋 Testing Relationship: ${testCase.relationship}`);
  console.log("-".repeat(40));

  const formData = {
    part_3: { relationship: testCase.relationship },
  };

  // Test shouldSkipSection for each part
  const skipResults = {
    part_4: shouldSkipSection("part_4", formData),
    part_5: shouldSkipSection("part_5", formData),
    part_6: shouldSkipSection("part_6", formData),
    part_7: shouldSkipSection("part_7", formData),
  };

  // Verify skip logic
  let testPassed = true;
  Object.entries(skipResults).forEach(([part, shouldSkip]) => {
    const expected =
      testCase.shouldSkip[part as keyof typeof testCase.shouldSkip];
    const status = shouldSkip === expected ? "✅" : "❌";

    console.log(
      `  ${status} ${part}: ${shouldSkip ? "SKIP" : "SHOW"} (expected: ${expected ? "SKIP" : "SHOW"})`
    );

    if (shouldSkip !== expected) {
      testPassed = false;
      allTestsPassed = false;
    }
  });

  // Test getNextSection from part_3
  const nextSection = getNextSection("part_3", testCase.relationship, formData);
  const nextSectionCorrect = nextSection === testCase.expectedPart;
  const nextStatus = nextSectionCorrect ? "✅" : "❌";

  console.log(
    `\n  ${nextStatus} Next section after Part 3: ${nextSection} (expected: ${testCase.expectedPart})`
  );

  if (!nextSectionCorrect) {
    testPassed = false;
    allTestsPassed = false;
  }

  // Verify that only one part (4-7) is included in the sequence
  const sequence = getSectionSequence(testCase.relationship);
  const relationshipParts = sequence.filter((s) =>
    ["part_4", "part_5", "part_6", "part_7"].includes(s)
  );
  const onlyOnePartIncluded =
    relationshipParts.length === 1 &&
    relationshipParts[0] === testCase.expectedPart;
  const sequenceStatus = onlyOnePartIncluded ? "✅" : "❌";

  console.log(
    `  ${sequenceStatus} Sequence includes only ${testCase.expectedPart}: ${onlyOnePartIncluded}`
  );

  if (!onlyOnePartIncluded) {
    console.log(`     Found parts: ${relationshipParts.join(", ")}`);
    testPassed = false;
    allTestsPassed = false;
  }

  // Summary for this test case
  if (testPassed) {
    console.log(`\n  ✨ All checks passed for ${testCase.relationship}`);
  } else {
    console.log(`\n  ⚠️  Some checks failed for ${testCase.relationship}`);
  }
});

// Test mutual exclusivity
console.log("\n" + "=".repeat(60));
console.log("🔒 Testing Mutual Exclusivity");
console.log("-".repeat(40));

// For each relationship, verify that exactly one of parts 4-7 is shown
let exclusivityPassed = true;
testCases.forEach((testCase) => {
  const formData = { part_3: { relationship: testCase.relationship } };
  const parts = ["part_4", "part_5", "part_6", "part_7"] as const;
  const shownParts = parts.filter((part) => !shouldSkipSection(part, formData));

  if (shownParts.length === 1) {
    console.log(
      `  ✅ ${testCase.relationship}: Exactly 1 part shown (${shownParts[0]})`
    );
  } else {
    console.log(
      `  ❌ ${testCase.relationship}: ${shownParts.length} parts shown (${shownParts.join(", ")})`
    );
    exclusivityPassed = false;
    allTestsPassed = false;
  }
});

// Final summary
console.log("\n" + "=".repeat(60));
if (allTestsPassed) {
  console.log(
    "✅ All tests passed! The relationship-based routing logic is working correctly."
  );
  console.log("\n🎉 The form correctly ensures:");
  console.log("  • Self → Part 4 only");
  console.log("  • Spouse → Part 5 only");
  console.log("  • Child → Part 6 only");
  console.log("  • Parent/Grandchild/Grandparent → Part 7 only");
  console.log("  • No leaking between sections");
  process.exit(0);
} else {
  console.log("❌ Some tests failed. Please review the logic implementation.");
  process.exit(1);
}
