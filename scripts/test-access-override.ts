/**
 * Test script for Promo Code Access Override (Soft Open) functionality
 *
 * This tests the beta testing / soft open feature that allows:
 * - Creating promo codes with limited seats
 * - Granting specific emails access
 * - Enforcing seat limits
 * - Checking access eligibility
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Test configuration
const TEST_PROMO_CODE = "BETA2025";
const TEST_SEATS = 5;
const TEST_EMAILS = [
  "beta1@test.com",
  "beta2@test.com",
  "beta3@test.com",
  "beta4@test.com",
  "beta5@test.com",
  "beta6@test.com", // This should fail - exceeds seat limit
];

async function cleanup() {
  console.log("🧹 Cleaning up test data...");

  // Delete test promo code and related data (cascade will handle grants)
  await prisma.promoCode.deleteMany({
    where: { code: TEST_PROMO_CODE },
  });

  console.log("✅ Cleanup complete\n");
}

async function testCreateAccessOverridePromoCode() {
  console.log("📝 Test 1: Create promo code with access override");
  console.log("━".repeat(60));

  const promoCode = await prisma.promoCode.create({
    data: {
      code: TEST_PROMO_CODE,
      type: "PERCENT_OFF",
      percentOff: 100, // Free access for beta testers
      isActive: true,
      accessOverrideEnabled: true,
      accessSeatsTotal: TEST_SEATS,
      accessSeatsUsed: 0,
      campaignName: "Beta Launch 2025",
      notes: "Soft open for beta testers",
    },
  });

  console.log("✅ Created promo code:");
  console.log(`   Code: ${promoCode.code}`);
  console.log(`   Access Override: ${promoCode.accessOverrideEnabled}`);
  console.log(`   Total Seats: ${promoCode.accessSeatsTotal}`);
  console.log(`   Used Seats: ${promoCode.accessSeatsUsed}`);
  console.log("");

  return promoCode;
}

async function testGrantAccess(
  promoCodeId: string,
  email: string,
  shouldSucceed: boolean
) {
  const testNum = TEST_EMAILS.indexOf(email) + 2;
  console.log(`📝 Test ${testNum}: Grant access to ${email}`);
  console.log("━".repeat(60));

  try {
    // Check current seat usage
    const promoCode = await prisma.promoCode.findUnique({
      where: { id: promoCodeId },
      select: { accessSeatsUsed: true, accessSeatsTotal: true },
    });

    if (!promoCode) {
      throw new Error("Promo code not found");
    }

    // Check if seats are available
    if (
      promoCode.accessSeatsTotal &&
      promoCode.accessSeatsUsed >= promoCode.accessSeatsTotal
    ) {
      console.log(
        `❌ No seats available (${promoCode.accessSeatsUsed}/${promoCode.accessSeatsTotal})`
      );

      if (shouldSucceed) {
        throw new Error("Expected to succeed but no seats available");
      } else {
        console.log("✅ Correctly rejected - seat limit reached");
        console.log("");
        return null;
      }
    }

    // Grant access
    const grant = await prisma.promoCodeAccessGrant.create({
      data: {
        promoCodeId,
        email,
      },
    });

    // Increment seat counter
    await prisma.promoCode.update({
      where: { id: promoCodeId },
      data: {
        accessSeatsUsed: {
          increment: 1,
        },
      },
    });

    const updatedCode = await prisma.promoCode.findUnique({
      where: { id: promoCodeId },
      select: { accessSeatsUsed: true, accessSeatsTotal: true },
    });

    console.log("✅ Access granted:");
    console.log(`   Email: ${email}`);
    console.log(`   Grant ID: ${grant.id}`);
    console.log(
      `   Seats used: ${updatedCode?.accessSeatsUsed}/${updatedCode?.accessSeatsTotal}`
    );
    console.log("");

    if (!shouldSucceed) {
      throw new Error("Expected to fail but succeeded");
    }

    return grant;
  } catch (error: any) {
    if (shouldSucceed) {
      console.log("❌ Failed unexpectedly:", error.message);
      throw error;
    } else {
      console.log("✅ Correctly failed as expected");
      console.log("");
      return null;
    }
  }
}

async function testCheckAccess(
  promoCodeId: string,
  email: string,
  shouldHaveAccess: boolean
) {
  console.log(`📝 Test: Check access for ${email}`);
  console.log("━".repeat(60));

  // Check if email has been granted access
  const grant = await prisma.promoCodeAccessGrant.findFirst({
    where: {
      promoCodeId,
      email,
    },
    include: {
      promoCode: {
        select: {
          code: true,
          accessOverrideEnabled: true,
          accessSeatsTotal: true,
          accessSeatsUsed: true,
        },
      },
    },
  });

  const hasAccess = !!grant;

  if (hasAccess === shouldHaveAccess) {
    console.log(
      `✅ Correct: ${email} ${hasAccess ? "HAS" : "DOES NOT HAVE"} access`
    );
    if (grant) {
      console.log(`   Via promo code: ${grant.promoCode.code}`);
      console.log(`   Granted at: ${grant.grantedAt.toISOString()}`);
    }
  } else {
    console.log(
      `❌ Incorrect: ${email} should ${shouldHaveAccess ? "HAVE" : "NOT HAVE"} access`
    );
    throw new Error("Access check failed");
  }
  console.log("");
}

async function testQueryAccessGrants(promoCodeId: string) {
  console.log("📝 Test: Query all access grants");
  console.log("━".repeat(60));

  const grants = await prisma.promoCodeAccessGrant.findMany({
    where: { promoCodeId },
    include: {
      promoCode: {
        select: {
          code: true,
          accessSeatsTotal: true,
          accessSeatsUsed: true,
        },
      },
    },
    orderBy: { grantedAt: "asc" },
  });

  console.log(`✅ Found ${grants.length} access grants:`);
  grants.forEach((grant, index) => {
    console.log(
      `   ${index + 1}. ${grant.email} (granted: ${grant.grantedAt.toISOString()})`
    );
  });

  const promoCode = grants[0]?.promoCode;
  if (promoCode) {
    console.log(`\n   Promo Code: ${promoCode.code}`);
    console.log(
      `   Seats: ${promoCode.accessSeatsUsed}/${promoCode.accessSeatsTotal}`
    );
  }
  console.log("");
}

async function testDuplicateGrant(promoCodeId: string, email: string) {
  console.log("📝 Test: Attempt duplicate grant");
  console.log("━".repeat(60));

  try {
    await prisma.promoCodeAccessGrant.create({
      data: {
        promoCodeId,
        email,
      },
    });

    console.log(
      "❌ Should have failed but succeeded - duplicate grant created"
    );
    throw new Error("Duplicate grant was allowed");
  } catch (error: any) {
    if (error.code === "P2002") {
      console.log("✅ Correctly prevented duplicate grant");
      console.log(`   Email ${email} already has access`);
    } else {
      console.log("❌ Failed with unexpected error:", error.message);
      throw error;
    }
  }
  console.log("");
}

async function runTests() {
  console.log("\n🧪 Testing Promo Code Access Override Functionality\n");
  console.log("═".repeat(60));
  console.log("");

  try {
    // Cleanup any existing test data
    await cleanup();

    // Test 1: Create promo code with access override
    const promoCode = await testCreateAccessOverridePromoCode();

    // Test 2-6: Grant access to emails (first 5 should succeed)
    for (let i = 0; i < TEST_EMAILS.length; i++) {
      const email = TEST_EMAILS[i];
      const shouldSucceed = i < TEST_SEATS; // First 5 should succeed, 6th should fail
      await testGrantAccess(promoCode.id, email, shouldSucceed);
    }

    // Test: Check access for granted emails
    await testCheckAccess(promoCode.id, TEST_EMAILS[0], true);
    await testCheckAccess(promoCode.id, TEST_EMAILS[4], true);
    await testCheckAccess(promoCode.id, TEST_EMAILS[5], false); // Should not have access
    await testCheckAccess(promoCode.id, "notgranted@test.com", false);

    // Test: Query all grants
    await testQueryAccessGrants(promoCode.id);

    // Test: Prevent duplicate grants
    await testDuplicateGrant(promoCode.id, TEST_EMAILS[0]);

    console.log("═".repeat(60));
    console.log("🎉 All tests passed!");
    console.log("═".repeat(60));
  } catch (error) {
    console.error("\n❌ Test suite failed:", error);
    process.exit(1);
  } finally {
    // Cleanup test data
    await cleanup();
    await prisma.$disconnect();
  }
}

// Run the tests
runTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
