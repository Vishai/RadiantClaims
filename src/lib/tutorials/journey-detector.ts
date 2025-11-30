import { DOJMilestone, IntakeStatus, IntakeStep } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ClientJourneyStage } from "./types";

export async function detectUserStage(
  userId: string
): Promise<ClientJourneyStage> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      claimants: {
        include: {
          documents: true,
          intakeSession: true,
          lifecycle: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!user || user.claimants.length === 0) {
    return ClientJourneyStage.NEW_USER;
  }

  const claimant = user.claimants[0];
  if (!claimant) {
    return ClientJourneyStage.NEW_USER;
  }

  const intake = claimant.intakeSession;
  const lifecycle = claimant.lifecycle;
  const documentsUploaded = claimant.documents.length;

  if (lifecycle) {
    const milestone = lifecycle.currentMilestone;
    if (
      milestone === DOJMilestone.PAYMENT_ISSUED ||
      milestone === DOJMilestone.CLAIM_APPROVED ||
      milestone === DOJMilestone.APPEAL_APPROVED
    ) {
      return ClientJourneyStage.COMPLETED;
    }

    if (
      milestone === DOJMilestone.APPROVED_PENDING_PAYMENT ||
      milestone === DOJMilestone.PAYMENT_PROCESSING ||
      milestone === DOJMilestone.FINAL_REVIEW
    ) {
      return ClientJourneyStage.APPROVED;
    }

    if (milestone !== DOJMilestone.NOT_SUBMITTED) {
      return ClientJourneyStage.UNDER_REVIEW;
    }
  }

  if (intake) {
    if (intake.status === IntakeStatus.SUBMITTED) {
      return ClientJourneyStage.SUBMITTED;
    }

    if (
      intake.status === IntakeStatus.UNDER_REVIEW ||
      intake.status === IntakeStatus.READY_FOR_REVIEW
    ) {
      return ClientJourneyStage.UNDER_REVIEW;
    }

    if (
      (intake.recaCompletionPercent ?? 0) > 10 ||
      intake.currentStep !== IntakeStep.SCREENING
    ) {
      return ClientJourneyStage.FORM_FILLING;
    }
  }

  if (documentsUploaded > 0) {
    return ClientJourneyStage.DOCUMENT_COLLECTION;
  }

  return ClientJourneyStage.ONBOARDING;
}
