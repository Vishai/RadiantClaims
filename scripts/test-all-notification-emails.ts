/**
 * Master test script - Runs all notification email tests
 * Sends test emails to brandon@radiantclaims.com
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function runScript(scriptName: string, description: string) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚀 ${description}`);
  console.log("=".repeat(60));

  try {
    const { stdout, stderr } = await execAsync(`npx tsx ${scriptName}`);
    console.log(stdout);
    if (stderr) console.error(stderr);
    return true;
  } catch (error) {
    console.error(`❌ Failed: ${error}`);
    return false;
  }
}

async function main() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  RadiantClaims - Email Notification System Test Suite     ║");
  console.log("║  All emails will be sent to: brandon@radiantclaims.com     ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  const tests = [
    {
      script: "scripts/test-attorney-new-client-email.ts",
      description: "Testing Attorney New Client Notification",
    },
    {
      script: "scripts/test-attorney-activity-summary-email.ts",
      description: "Testing Attorney Activity Summary",
    },
    {
      script: "scripts/test-packet-ready-email.ts",
      description: "Testing Attorney Packet Ready Notification",
    },
    {
      script: "scripts/test-client-follow-up-email.ts",
      description: "Testing Client Document Follow-Up",
    },
  ];

  const results = [];

  for (const test of tests) {
    const success = await runScript(test.script, test.description);
    results.push({ ...test, success });

    // Wait 2 seconds between emails to avoid rate limiting
    if (test !== tests[tests.length - 1]) {
      console.log("\n⏳ Waiting 2 seconds before next test...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║                    Test Results Summary                    ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("");

  results.forEach((result, index) => {
    const status = result.success ? "✅ PASSED" : "❌ FAILED";
    console.log(`${index + 1}. ${status} - ${result.description}`);
  });

  const passCount = results.filter((r) => r.success).length;
  const totalCount = results.length;

  console.log("");
  console.log(`📊 Results: ${passCount}/${totalCount} tests passed`);
  console.log("");
  console.log("📬 Check brandon@radiantclaims.com for all test emails!");
  console.log("");

  if (passCount === totalCount) {
    console.log("🎉 All tests passed! Email notification system is working!");
  } else {
    console.log("⚠️  Some tests failed. Check the output above for details.");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Error running tests:", e);
  process.exit(1);
});
