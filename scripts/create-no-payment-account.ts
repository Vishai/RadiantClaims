/**
 * Create No-Payment Required Account
 *
 * This script creates a TRULY FREE account that:
 * - Bypasses Stripe entirely (no payment details required)
 * - Gives full access to the platform
 * - Sets a special flag for "payment-free" accounts
 * - Perfect for friends/advisors you want to give immediate access
 *
 * Usage:
 *   npx tsx scripts/create-no-payment-account.ts user@example.com "John Doe"
 *   npx tsx scripts/create-no-payment-account.ts brandon@friend.com "Brandon's Friend" --expires-in=365
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const email = args[0];
  const name = args[1];
  const expiresInDaysArg = args.find((arg) => arg.startsWith("--expires-in="));
  const expiresInDays = expiresInDaysArg
    ? parseInt(expiresInDaysArg.split("=")[1])
    : null;

  if (!email || !name) {
    console.error("Please provide email and name.");
    console.log(
      "Usage: npx tsx scripts/create-no-payment-account.ts EMAIL NAME [--expires-in=DAYS]"
    );
    console.log("\nExamples:");
    console.log(
      '  npx tsx scripts/create-no-payment-account.ts user@example.com "John Doe"'
    );
    console.log(
      '  npx tsx scripts/create-no-payment-account.ts friend@example.com "VIP Friend" --expires-in=365'
    );
    process.exit(1);
  }

  // Generate a random temporary password
  const tempPassword = Math.random().toString(36).slice(-12) + "!A1";
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  console.log(`\n🎁 Creating no-payment account...`);
  console.log(`   Email: ${email}`);
  console.log(`   Name: ${name}`);
  console.log(
    `   Access: Lifetime${expiresInDays ? ` (${expiresInDays} days)` : " (Forever)"}`
  );

  // Check if user already exists
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existing) {
    console.error(`\n❌ Error: User with email "${email}" already exists!`);
    process.exit(1);
  }

  // Create user and subscription in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create user
    const user = await tx.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role: "CUSTOMER",
      },
    });

    // Calculate expiration date
    const pilotExpiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    // Create subscription WITHOUT Stripe
    const subscription = await tx.serviceSubscription.create({
      data: {
        userId: user.id,
        tier: "DIY_PREP",
        status: "ACTIVE",
        setupFeePaid: true, // Mark as paid (waived)
        setupFeeWaived: true,
        setupFeeAmount: 0,
        setupFeePaidAt: new Date(),
        monthlyFeeAmount: 0, // $0/month forever
        isPilotAccount: true, // Flag as special account
        pilotExpiresAt,
        // NO Stripe IDs - completely bypassing payment collection
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        stripeCouponId: null,
      },
    });

    // Create audit log
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "USER_CREATED",
        resourceType: "User",
        resourceId: user.id,
        ipAddress: "script",
        metadata: JSON.stringify({
          method: "no-payment-script",
          setupFeeWaived: true,
          isPilotAccount: true,
          pilotExpiresAt,
          note: "Created via create-no-payment-account.ts script",
        }),
      },
    });

    return { user, subscription };
  });

  console.log(`\n✅ No-payment account created successfully!`);
  console.log(`\n📋 User Details:`);
  console.log(`   Email: ${result.user.email}`);
  console.log(`   Name: ${result.user.name}`);
  console.log(`   Role: ${result.user.role}`);
  console.log(`   User ID: ${result.user.id}`);

  console.log(`\n💳 Subscription Details:`);
  console.log(`   Tier: ${result.subscription.tier}`);
  console.log(`   Status: ${result.subscription.status}`);
  console.log(`   Setup Fee: Waived ($0)`);
  console.log(`   Monthly Fee: $0 (lifetime free)`);
  console.log(
    `   Expires: ${result.subscription.pilotExpiresAt?.toLocaleDateString() || "Never"}`
  );
  console.log(`   Stripe Integration: None (payment-free)`);

  console.log(`\n🔐 Temporary Login Credentials:`);
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${tempPassword}`);

  console.log(`\n📧 Next Steps:`);
  console.log(`   1. Share login credentials with the user securely`);
  console.log(`   2. User should change their password after first login`);
  console.log(`   3. User has full access - no payment details required!`);

  console.log(`\n⚠️  Important Notes:`);
  console.log(
    `   • No Stripe customer created - user will NEVER be asked for payment`
  );
  console.log(`   • Account is marked as "pilot account" for tracking`);
  console.log(
    `   • To revoke access, manually update subscription status in database`
  );
  console.log(
    `   • This user bypasses all payment flows - use only for trusted VIPs\n`
  );
}

main()
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
