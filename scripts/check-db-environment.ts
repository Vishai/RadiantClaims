#!/usr/bin/env tsx
/**
 * Database Environment Checker
 *
 * Verifies which database you're connected to and prevents accidental production access.
 * Run this before doing any database operations to be safe.
 *
 * Usage: tsx scripts/check-db-environment.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
};

async function checkEnvironment() {
  try {
    const dbUrl = process.env.DATABASE_URL || "";

    // Mask the password for display
    const maskedUrl = dbUrl.replace(/:([^@]+)@/, ":***@");

    // Determine environment
    const isProduction =
      dbUrl.includes("railway") ||
      dbUrl.includes("switchyard") ||
      dbUrl.includes(".internal");

    const isDevelopment =
      dbUrl.includes("localhost") ||
      dbUrl.includes("127.0.0.1") ||
      dbUrl.includes("radiantclaims_dev");

    console.log("\n" + "=".repeat(70));
    console.log("🔍 DATABASE ENVIRONMENT CHECK");
    console.log("=".repeat(70) + "\n");

    // Show connection info
    console.log(`📍 DATABASE_URL: ${COLORS.cyan}${maskedUrl}${COLORS.reset}\n`);

    // Connect and get DB info
    await prisma.$connect();

    const result = await prisma.$queryRaw<
      Array<{
        current_database: string;
        current_user: string;
      }>
    >`
      SELECT current_database(), current_user
    `;

    if (result && result[0]) {
      console.log("📊 Database Information:");
      console.log(
        `   Database: ${COLORS.white}${result[0].current_database}${COLORS.reset}`
      );
      console.log(
        `   User: ${COLORS.white}${result[0].current_user}${COLORS.reset}\n`
      );
    }

    // Environment determination
    if (isProduction) {
      console.log(
        `${COLORS.bgRed}${COLORS.white} ⚠️  PRODUCTION DATABASE ⚠️  ${COLORS.reset}`
      );
      console.log(
        `${COLORS.red}WARNING: You are connected to the LIVE PRODUCTION database!${COLORS.reset}`
      );
      console.log(
        `${COLORS.red}Any changes will affect REAL USER DATA.${COLORS.reset}\n`
      );

      // Count records to show impact
      const userCount = await prisma.user.count();
      const claimantCount = await prisma.claimant.count();
      const sessionCount = await prisma.intakeSession.count();

      console.log(`${COLORS.yellow}📈 Production Data:${COLORS.reset}`);
      console.log(`   ${COLORS.yellow}${userCount} users${COLORS.reset}`);
      console.log(
        `   ${COLORS.yellow}${claimantCount} claimants${COLORS.reset}`
      );
      console.log(
        `   ${COLORS.yellow}${sessionCount} intake sessions${COLORS.reset}\n`
      );

      console.log(
        `${COLORS.red}❌ ABORT any destructive operations!${COLORS.reset}\n`
      );
      process.exit(1);
    } else if (isDevelopment) {
      console.log(
        `${COLORS.bgGreen}${COLORS.white} ✅ DEVELOPMENT DATABASE ✅ ${COLORS.reset}`
      );
      console.log(
        `${COLORS.green}Safe to experiment, test, and modify data.${COLORS.reset}\n`
      );

      // Count records
      const userCount = await prisma.user.count();
      const claimantCount = await prisma.claimant.count();
      const sessionCount = await prisma.intakeSession.count();

      console.log(`${COLORS.cyan}📈 Development Data:${COLORS.reset}`);
      console.log(`   ${userCount} users`);
      console.log(`   ${claimantCount} claimants`);
      console.log(`   ${sessionCount} intake sessions\n`);

      console.log(
        `${COLORS.green}✅ Safe to proceed with development work!${COLORS.reset}\n`
      );
    } else {
      console.log(`${COLORS.yellow}❓ UNKNOWN ENVIRONMENT${COLORS.reset}`);
      console.log(
        `${COLORS.yellow}Could not determine if this is production or development.${COLORS.reset}`
      );
      console.log(
        `${COLORS.yellow}Proceed with extreme caution!${COLORS.reset}\n`
      );
      process.exit(1);
    }

    console.log("=".repeat(70) + "\n");
  } catch (error) {
    console.error(
      `\n${COLORS.red}❌ Database connection failed!${COLORS.reset}`
    );
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkEnvironment();
