import { db } from "../src/lib/db";

async function main() {
  const email = "kevin.yazzie@example.com";
  const claimants = await db.claimant.findMany({
    where: { email },
    include: { intakeSession: true, user: true, claimSubscription: true },
  });
  console.log(
    claimants.map((c) => ({
      id: c.id,
      userId: c.userId,
      userEmail: c.user?.email,
      intakeSessionId: c.intakeSession?.id,
      intakeStatus: c.intakeSession?.status,
      recaWorkflowStage: c.intakeSession?.recaWorkflowStage,
      claimSubscriptionId: c.claimSubscription?.id,
      claimSubscriptionStatus: c.claimSubscription?.status,
      claimSubscriptionTier: c.claimSubscription?.tier,
    }))
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
