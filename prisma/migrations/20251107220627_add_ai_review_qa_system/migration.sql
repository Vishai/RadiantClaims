-- CreateEnum
CREATE TYPE "AIReviewQAStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'COMPLETED', 'SKIPPED');

-- CreateTable
CREATE TABLE "AIReviewQA" (
    "id" TEXT NOT NULL,
    "claimReadinessId" TEXT NOT NULL,
    "sampledForReview" BOOLEAN NOT NULL DEFAULT false,
    "sampledAt" TIMESTAMP(3),
    "reviewerId" TEXT,
    "reviewStatus" "AIReviewQAStatus" NOT NULL DEFAULT 'PENDING',
    "aiAccuracyScore" DOUBLE PRECISION,
    "readinessScoreMatch" BOOLEAN,
    "correctReadiness" DOUBLE PRECISION,
    "completenessAccurate" BOOLEAN,
    "criticalBlockersAccurate" BOOLEAN,
    "warningsAccurate" BOOLEAN,
    "nameConsistencyAccurate" BOOLEAN,
    "datesConsistencyAccurate" BOOLEAN,
    "claimTypeAccurate" BOOLEAN,
    "reviewerNotes" TEXT,
    "aiStrengths" TEXT,
    "aiWeaknesses" TEXT,
    "improvementSuggestions" TEXT,
    "falsePositives" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "falseNegatives" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "correctedAssessment" JSONB,
    "reviewStartedAt" TIMESTAMP(3),
    "reviewCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIReviewQA_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AIReviewQA_claimReadinessId_key" ON "AIReviewQA"("claimReadinessId");

-- CreateIndex
CREATE INDEX "AIReviewQA_claimReadinessId_idx" ON "AIReviewQA"("claimReadinessId");

-- CreateIndex
CREATE INDEX "AIReviewQA_reviewStatus_idx" ON "AIReviewQA"("reviewStatus");

-- CreateIndex
CREATE INDEX "AIReviewQA_sampledForReview_idx" ON "AIReviewQA"("sampledForReview");

-- CreateIndex
CREATE INDEX "AIReviewQA_reviewerId_idx" ON "AIReviewQA"("reviewerId");

-- CreateIndex
CREATE INDEX "AIReviewQA_aiAccuracyScore_idx" ON "AIReviewQA"("aiAccuracyScore");

-- CreateIndex
CREATE INDEX "AIReviewQA_createdAt_idx" ON "AIReviewQA"("createdAt");

-- AddForeignKey
ALTER TABLE "AIReviewQA" ADD CONSTRAINT "AIReviewQA_claimReadinessId_fkey" FOREIGN KEY ("claimReadinessId") REFERENCES "ClaimReadiness"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIReviewQA" ADD CONSTRAINT "AIReviewQA_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
