/**
 * Database Backup Script
 *
 * Creates a complete backup of all database tables before migration.
 * Outputs JSON files that can be used to restore data after migration.
 *
 * Usage:
 *   npx tsx scripts/backup-database.ts
 *
 * Output:
 *   backups/backup-YYYY-MM-DD-HH-mm-ss/
 *     - users.json
 *     - claimants.json
 *     - serviceSubscriptions.json
 *     - payments.json
 *     - intakeSessions.json
 *     - ... (all other tables)
 *     - metadata.json (backup info)
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log("\n" + "=".repeat(60));
  log(title, "cyan");
  console.log("=".repeat(60) + "\n");
}

// Create backup directory
function createBackupDirectory(): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/:/g, "-")
    .replace(/\..+/, "");
  const backupDir = path.join(process.cwd(), "backups", `backup-${timestamp}`);

  if (!fs.existsSync(path.join(process.cwd(), "backups"))) {
    fs.mkdirSync(path.join(process.cwd(), "backups"));
  }

  fs.mkdirSync(backupDir);
  log(`✓ Created backup directory: ${backupDir}`, "green");

  return backupDir;
}

// Save data to JSON file
function saveToFile(
  backupDir: string,
  tableName: string,
  data: any[],
  count: number
) {
  const filePath = path.join(backupDir, `${tableName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  log(`  ✓ Saved ${count} records to ${tableName}.json`, "blue");
}

async function backupTable(
  backupDir: string,
  tableName: string,
  queryFn: () => Promise<any[]>
) {
  try {
    const data = await queryFn();
    const count = data.length;

    if (count > 0) {
      saveToFile(backupDir, tableName, data, count);
    } else {
      log(`  ○ ${tableName}: No data to backup`, "yellow");
    }

    return { tableName, count, success: true };
  } catch (error) {
    log(`  ✗ Error backing up ${tableName}: ${error}`, "red");
    return { tableName, count: 0, success: false, error: String(error) };
  }
}

async function main() {
  try {
    logSection("Database Backup Utility");

    log("Starting backup process...", "cyan");
    const backupDir = createBackupDirectory();

    const results: Array<{
      tableName: string;
      count: number;
      success: boolean;
      error?: string;
    }> = [];

    // Backup all tables
    logSection("Backing Up Core Tables");

    results.push(
      await backupTable(backupDir, "users", () => prisma.user.findMany())
    );
    results.push(
      await backupTable(backupDir, "accounts", () => prisma.account.findMany())
    );
    results.push(
      await backupTable(backupDir, "sessions", () => prisma.session.findMany())
    );
    results.push(
      await backupTable(backupDir, "claimants", () =>
        prisma.claimant.findMany()
      )
    );

    logSection("Backing Up Subscription & Payment Tables");

    results.push(
      await backupTable(backupDir, "serviceSubscriptions", () =>
        prisma.serviceSubscription.findMany()
      )
    );
    results.push(
      await backupTable(backupDir, "payments", () => prisma.payment.findMany())
    );
    results.push(
      await backupTable(backupDir, "promoCodes", () =>
        prisma.promoCode.findMany()
      )
    );
    results.push(
      await backupTable(backupDir, "promoCodeTiers", () =>
        prisma.promoCodeTier.findMany()
      )
    );
    results.push(
      await backupTable(backupDir, "promoCodeUsages", () =>
        prisma.promoCodeUsage.findMany()
      )
    );

    logSection("Backing Up Intake & Document Tables");

    results.push(
      await backupTable(backupDir, "intakeSessions", () =>
        prisma.intakeSession.findMany()
      )
    );
    results.push(
      await backupTable(backupDir, "intakeResponses", () =>
        prisma.intakeResponse.findMany()
      )
    );
    results.push(
      await backupTable(backupDir, "documents", () =>
        prisma.document.findMany()
      )
    );
    results.push(
      await backupTable(backupDir, "uploadedFiles", () =>
        prisma.uploadedFile.findMany()
      )
    );

    logSection("Backing Up Claim Lifecycle Tables");

    results.push(
      await backupTable(backupDir, "claimLifecycles", () =>
        prisma.claimLifecycle.findMany()
      )
    );
    results.push(
      await backupTable(backupDir, "claimMilestoneEvents", () =>
        prisma.claimMilestoneEvent.findMany()
      )
    );
    results.push(
      await backupTable(backupDir, "claimQueuePositions", () =>
        prisma.claimQueuePosition.findMany()
      )
    );

    logSection("Backing Up Law Firm & Assignment Tables");

    results.push(
      await backupTable(backupDir, "lawFirms", () => prisma.lawFirm.findMany())
    );
    results.push(
      await backupTable(backupDir, "claimantAssignments", () =>
        prisma.claimantAssignment.findMany()
      )
    );

    logSection("Backing Up Reference Data");

    results.push(
      await backupTable(backupDir, "referrals", () =>
        prisma.referral.findMany()
      )
    );
    results.push(
      await backupTable(backupDir, "documentResources", () =>
        prisma.documentResource.findMany()
      )
    );

    // Create metadata file
    logSection("Creating Backup Metadata");

    const metadata = {
      backupDate: new Date().toISOString(),
      databaseUrl: process.env.DATABASE_URL?.replace(/:[^:]*@/, ":***@"), // Hide password
      nodeVersion: process.version,
      tables: results,
      totalRecords: results.reduce((sum, r) => sum + r.count, 0),
      successCount: results.filter((r) => r.success).length,
      failureCount: results.filter((r) => !r.success).length,
    };

    fs.writeFileSync(
      path.join(backupDir, "metadata.json"),
      JSON.stringify(metadata, null, 2)
    );

    log(`✓ Created metadata.json`, "green");

    // Summary
    logSection("Backup Summary");

    log(`Backup Location: ${backupDir}`, "bold");
    log(`Total Tables: ${results.length}`, "blue");
    log(`Total Records: ${metadata.totalRecords}`, "blue");
    log(`Successful: ${metadata.successCount}`, "green");
    log(
      `Failed: ${metadata.failureCount}`,
      metadata.failureCount > 0 ? "red" : "green"
    );

    if (metadata.failureCount > 0) {
      log("\nFailed Tables:", "red");
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          log(`  - ${r.tableName}: ${r.error}`, "red");
        });
    }

    log("\n✓ Backup complete!", "green");
    log("\nNext steps:", "cyan");
    log(
      "1. Run migration: npx prisma migrate dev --name add_claim_subscriptions",
      "blue"
    );
    log("2. Restore data: npx tsx scripts/restore-database.ts", "blue");

    // Create a .gitignore in backups directory
    const gitignorePath = path.join(process.cwd(), "backups", ".gitignore");
    if (!fs.existsSync(gitignorePath)) {
      fs.writeFileSync(gitignorePath, "*\n!.gitignore\n");
      log(
        "\n✓ Created backups/.gitignore (backups won't be committed)",
        "yellow"
      );
    }
  } catch (error) {
    log(`\n✗ FATAL ERROR: ${error}`, "red");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
