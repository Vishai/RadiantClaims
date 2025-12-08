/**
 * Database Restore Script
 *
 * Restores data from a backup created by backup-database.ts
 * Use this after running migrations to restore your data.
 *
 * Usage:
 *   npx tsx scripts/restore-database.ts [backup-directory]
 *
 * Examples:
 *   npx tsx scripts/restore-database.ts                              # Uses latest backup
 *   npx tsx scripts/restore-database.ts backups/backup-2024-12-04    # Uses specific backup
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

// Find the latest backup directory
function findLatestBackup(): string | null {
  const backupsDir = path.join(process.cwd(), "backups");

  if (!fs.existsSync(backupsDir)) {
    return null;
  }

  const backups = fs
    .readdirSync(backupsDir)
    .filter((dir) => dir.startsWith("backup-"))
    .sort()
    .reverse();

  return backups.length > 0 ? path.join(backupsDir, backups[0]) : null;
}

// Load data from JSON file
function loadFromFile(backupDir: string, tableName: string): any[] | null {
  const filePath = path.join(backupDir, `${tableName}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return data;
}

// Restore a table
async function restoreTable(
  backupDir: string,
  tableName: string,
  restoreFn: (data: any[]) => Promise<void>
) {
  try {
    const data = loadFromFile(backupDir, tableName);

    if (!data) {
      log(`  ○ ${tableName}: No backup file found`, "yellow");
      return { tableName, count: 0, success: true, skipped: true };
    }

    if (data.length === 0) {
      log(`  ○ ${tableName}: No data to restore`, "yellow");
      return { tableName, count: 0, success: true, skipped: true };
    }

    await restoreFn(data);
    log(`  ✓ Restored ${data.length} records to ${tableName}`, "green");

    return { tableName, count: data.length, success: true };
  } catch (error) {
    log(`  ✗ Error restoring ${tableName}: ${error}`, "red");
    return { tableName, count: 0, success: false, error: String(error) };
  }
}

async function main() {
  try {
    logSection("Database Restore Utility");

    // Determine backup directory
    let backupDir = process.argv[2];

    if (!backupDir) {
      backupDir = findLatestBackup() || "";
      if (!backupDir) {
        log("✗ No backup directory found!", "red");
        log("  Run: npx tsx scripts/backup-database.ts first", "yellow");
        process.exit(1);
      }
      log(`Using latest backup: ${backupDir}`, "cyan");
    } else {
      log(`Using specified backup: ${backupDir}`, "cyan");
    }

    // Verify backup directory exists
    if (!fs.existsSync(backupDir)) {
      log(`✗ Backup directory not found: ${backupDir}`, "red");
      process.exit(1);
    }

    // Load metadata
    const metadataPath = path.join(backupDir, "metadata.json");
    let metadata: any = null;

    if (fs.existsSync(metadataPath)) {
      metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
      log(`\nBackup Date: ${metadata.backupDate}`, "blue");
      log(`Total Records: ${metadata.totalRecords}`, "blue");
    }

    // Confirmation prompt
    log("\n⚠️  WARNING: This will restore data to your database!", "yellow");
    log("Make sure you've run migrations first.", "yellow");
    log("\nContinuing in 5 seconds... (Press Ctrl+C to cancel)", "yellow");

    await new Promise((resolve) => setTimeout(resolve, 5000));

    const results: Array<{
      tableName: string;
      count: number;
      success: boolean;
      skipped?: boolean;
      error?: string;
    }> = [];

    // Restore tables in correct order (respecting foreign keys)
    logSection("Restoring Core Tables");

    // Users first (no dependencies)
    results.push(
      await restoreTable(backupDir, "users", async (data) => {
        for (const record of data) {
          await prisma.user.upsert({
            where: { id: record.id },
            update: record,
            create: record,
          });
        }
      })
    );

    results.push(
      await restoreTable(backupDir, "accounts", async (data) => {
        for (const record of data) {
          await prisma.account.upsert({
            where: { id: record.id },
            update: record,
            create: record,
          });
        }
      })
    );

    results.push(
      await restoreTable(backupDir, "sessions", async (data) => {
        for (const record of data) {
          await prisma.session.upsert({
            where: { id: record.id },
            update: record,
            create: record,
          });
        }
      })
    );

    logSection("Restoring Reference Data");

    results.push(
      await restoreTable(backupDir, "referrals", async (data) => {
        for (const record of data) {
          await prisma.referral.upsert({
            where: { id: record.id },
            update: record,
            create: record,
          });
        }
      })
    );

    results.push(
      await restoreTable(backupDir, "lawFirms", async (data) => {
        for (const record of data) {
          await prisma.lawFirm.upsert({
            where: { id: record.id },
            update: record,
            create: record,
          });
        }
      })
    );

    results.push(
      await restoreTable(backupDir, "documentResources", async (data) => {
        for (const record of data) {
          await prisma.documentResource.upsert({
            where: { id: record.id },
            update: record,
            create: record,
          });
        }
      })
    );

    logSection("Restoring Promo Codes");

    results.push(
      await restoreTable(backupDir, "promoCodes", async (data) => {
        for (const record of data) {
          await prisma.promoCode.upsert({
            where: { id: record.id },
            update: record,
            create: record,
          });
        }
      })
    );

    results.push(
      await restoreTable(backupDir, "promoCodeTiers", async (data) => {
        for (const record of data) {
          await prisma.promoCodeTier.upsert({
            where: { id: record.id },
            update: record,
            create: record,
          });
        }
      })
    );

    logSection("Restoring Subscriptions & Payments");

    results.push(
      await restoreTable(backupDir, "serviceSubscriptions", async (data) => {
        for (const record of data) {
          await prisma.serviceSubscription.upsert({
            where: { id: record.id },
            update: record,
            create: record,
          });
        }
      })
    );

    results.push(
      await restoreTable(backupDir, "payments", async (data) => {
        for (const record of data) {
          await prisma.payment.upsert({
            where: { id: record.id },
            update: record,
            create: record,
          });
        }
      })
    );

    results.push(
      await restoreTable(backupDir, "promoCodeUsages", async (data) => {
        for (const record of data) {
          await prisma.promoCodeUsage.upsert({
            where: { id: record.id },
            update: record,
            create: record,
          });
        }
      })
    );

    logSection("Restoring Claimants & Claims");

    results.push(
      await restoreTable(backupDir, "claimants", async (data) => {
        for (const record of data) {
          await prisma.claimant.upsert({
            where: { id: record.id },
            update: record,
            create: record,
          });
        }
      })
    );

    results.push(
      await restoreTable(backupDir, "intakeSessions", async (data) => {
        for (const record of data) {
          await prisma.intakeSession.upsert({
            where: { id: record.id },
            update: record,
            create: record,
          });
        }
      })
    );

    results.push(
      await restoreTable(backupDir, "intakeResponses", async (data) => {
        for (const record of data) {
          // IntakeResponse has composite unique key
          const existing = await prisma.intakeResponse.findFirst({
            where: {
              intakeSessionId: record.intakeSessionId,
              questionKey: record.questionKey,
            },
          });

          if (existing) {
            await prisma.intakeResponse.update({
              where: { id: existing.id },
              data: record,
            });
          } else {
            await prisma.intakeResponse.create({ data: record });
          }
        }
      })
    );

    results.push(
      await restoreTable(backupDir, "documents", async (data) => {
        for (const record of data) {
          await prisma.document.upsert({
            where: { id: record.id },
            update: record,
            create: record,
          });
        }
      })
    );

    results.push(
      await restoreTable(backupDir, "uploadedFiles", async (data) => {
        for (const record of data) {
          await prisma.uploadedFile.upsert({
            where: { id: record.id },
            update: record,
            create: record,
          });
        }
      })
    );

    logSection("Restoring Claim Lifecycle Data");

    results.push(
      await restoreTable(backupDir, "claimLifecycles", async (data) => {
        for (const record of data) {
          await prisma.claimLifecycle.upsert({
            where: { id: record.id },
            update: record,
            create: record,
          });
        }
      })
    );

    results.push(
      await restoreTable(backupDir, "claimMilestoneEvents", async (data) => {
        for (const record of data) {
          await prisma.claimMilestoneEvent.upsert({
            where: { id: record.id },
            update: record,
            create: record,
          });
        }
      })
    );

    results.push(
      await restoreTable(backupDir, "claimQueuePositions", async (data) => {
        for (const record of data) {
          await prisma.claimQueuePosition.upsert({
            where: { id: record.id },
            update: record,
            create: record,
          });
        }
      })
    );

    logSection("Restoring Assignments");

    results.push(
      await restoreTable(backupDir, "claimantAssignments", async (data) => {
        for (const record of data) {
          await prisma.claimantAssignment.upsert({
            where: { id: record.id },
            update: record,
            create: record,
          });
        }
      })
    );

    // Summary
    logSection("Restore Summary");

    const totalRestored = results.reduce((sum, r) => sum + r.count, 0);
    const successCount = results.filter((r) => r.success && !r.skipped).length;
    const skippedCount = results.filter((r) => r.skipped).length;
    const failureCount = results.filter((r) => !r.success).length;

    log(`Backup Source: ${backupDir}`, "bold");
    log(`Total Tables Processed: ${results.length}`, "blue");
    log(`Total Records Restored: ${totalRestored}`, "green");
    log(`Successful: ${successCount}`, "green");
    log(`Skipped: ${skippedCount}`, "yellow");
    log(`Failed: ${failureCount}`, failureCount > 0 ? "red" : "green");

    if (failureCount > 0) {
      log("\nFailed Tables:", "red");
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          log(`  - ${r.tableName}: ${r.error}`, "red");
        });
    }

    log("\n✓ Restore complete!", "green");

    log("\nNext steps:", "cyan");
    log("1. Verify data integrity: Check your database", "blue");
    log("2. Test your application", "blue");
    log(
      "3. Create ClaimSubscription records for existing claims (if needed)",
      "blue"
    );
  } catch (error) {
    log(`\n✗ FATAL ERROR: ${error}`, "red");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
