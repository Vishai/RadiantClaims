import { db } from "../src/lib/db";

async function main() {
  const email = "kevin.yazzie@example.com";
  const user = await db.user.findUnique({
    where: { email },
    include: { serviceSubscription: true },
  });

  console.log({
    userId: user?.id,
    email: user?.email,
    subscription: user?.serviceSubscription
      ? {
          id: user.serviceSubscription.id,
          tier: user.serviceSubscription.tier,
          status: user.serviceSubscription.status,
          setupFeePaid: (user.serviceSubscription as any).setupFeePaid,
          setupFeeWaived: (user.serviceSubscription as any).setupFeeWaived,
          isPilotAccount: (user.serviceSubscription as any).isPilotAccount,
        }
      : null,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
