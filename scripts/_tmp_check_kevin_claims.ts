import { db } from "../src/lib/db";

async function main() {
  const email = "kevin.yazzie@example.com";
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });
  const claimant = await db.claimant.findFirst({
    where: { email },
    include: { claimSubscription: true, intakeSession: true },
  });

  console.log({
    user,
    claimant: claimant
      ? {
          id: claimant.id,
          userId: claimant.userId,
          intakeSessionId: claimant.intakeSession?.id,
          intakeStatus: claimant.intakeSession?.status,
          recaWorkflowStage: claimant.intakeSession?.recaWorkflowStage,
          claimSubscription: claimant.claimSubscription
            ? {
                id: claimant.claimSubscription.id,
                tier: claimant.claimSubscription.tier,
                status: claimant.claimSubscription.status,
                setupFeePaid: (claimant.claimSubscription as any).setupFeePaid,
                createdAt: claimant.claimSubscription.createdAt,
              }
            : null,
        }
      : null,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
