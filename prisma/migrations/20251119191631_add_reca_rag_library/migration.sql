/*
  Warnings:

  - You are about to drop the `Tutorial` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TutorialAnalytics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TutorialPreference` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TutorialProgress` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[promoCodeId,email]` on the table `PromoCodeAccessGrant` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "ResourceSource" AS ENUM ('DATABASE', 'WEB_SEARCH', 'AI_SUGGESTED', 'USER_SUBMITTED', 'STAFF_VERIFIED');

-- CreateEnum
CREATE TYPE "ResourceVerificationStatus" AS ENUM ('UNVERIFIED', 'VERIFIED', 'NEEDS_UPDATE', 'DEPRECATED', 'DUPLICATE');

-- CreateEnum
CREATE TYPE "ResourceFeedbackType" AS ENUM ('WAS_HELPFUL', 'NOT_HELPFUL', 'CONTACTED', 'DOCUMENT_OBTAINED', 'INCORRECT_INFO', 'NO_RESPONSE', 'ALREADY_CLOSED', 'WRONG_RESOURCE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EmailType" ADD VALUE 'RESOURCE_FOLLOW_UP';
ALTER TYPE "EmailType" ADD VALUE 'RESOURCE_ALTERNATIVES';
ALTER TYPE "EmailType" ADD VALUE 'RESOURCE_SUCCESS';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FileCategory" ADD VALUE 'DEATH_CERTIFICATE';
ALTER TYPE "FileCategory" ADD VALUE 'BIRTH_CERTIFICATE';
ALTER TYPE "FileCategory" ADD VALUE 'MARRIAGE_CERTIFICATE';

-- DropForeignKey
ALTER TABLE "TutorialAnalytics" DROP CONSTRAINT "TutorialAnalytics_tutorialId_fkey";

-- DropForeignKey
ALTER TABLE "TutorialPreference" DROP CONSTRAINT "TutorialPreference_userId_fkey";

-- DropForeignKey
ALTER TABLE "TutorialProgress" DROP CONSTRAINT "TutorialProgress_tutorialId_fkey";

-- DropForeignKey
ALTER TABLE "TutorialProgress" DROP CONSTRAINT "TutorialProgress_userId_fkey";

-- AlterTable
ALTER TABLE "DocumentResource" ADD COLUMN     "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "searchCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "selectionCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "source" "ResourceSource" NOT NULL DEFAULT 'DATABASE',
ADD COLUMN     "verificationStatus" "ResourceVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedBy" TEXT;

-- AlterTable
ALTER TABLE "PacketGeneration" ALTER COLUMN "generatedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PacketSubmission" ALTER COLUMN "readyAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "lastDownloadedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PromoCodeAccessGrant" ALTER COLUMN "grantedAt" SET DATA TYPE TIMESTAMP(3);

-- DropTable
DROP TABLE "Tutorial";

-- DropTable
DROP TABLE "TutorialAnalytics";

-- DropTable
DROP TABLE "TutorialPreference";

-- DropTable
DROP TABLE "TutorialProgress";

-- DropEnum
DROP TYPE "HelpIntensity";

-- DropEnum
DROP TYPE "TutorialStatus";

-- CreateTable
CREATE TABLE "ExternalUploadToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "intakeSessionId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "targetCategory" TEXT,
    "guestData" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalUploadToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceInteraction" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "email" TEXT,
    "documentType" TEXT NOT NULL,
    "shownVia" TEXT NOT NULL DEFAULT 'chat_bot',
    "searchQuery" TEXT,
    "immediatelyHelpful" BOOLEAN,
    "immediateFeedbackAt" TIMESTAMP(3),
    "immediateComments" TEXT,
    "followUpScheduledFor" TIMESTAMP(3) NOT NULL,
    "followUpSentAt" TIMESTAMP(3),
    "followUpMethod" TEXT,
    "followUpCompletedAt" TIMESTAMP(3),
    "followUpReminderSent" BOOLEAN NOT NULL DEFAULT false,
    "feedbackId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceFeedback" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "email" TEXT,
    "feedbackType" "ResourceFeedbackType" NOT NULL,
    "rating" INTEGER,
    "wasHelpful" BOOLEAN,
    "documentType" TEXT,
    "comments" TEXT,
    "contactedAt" TIMESTAMP(3),
    "responseTime" TEXT,
    "successfullyObtained" BOOLEAN,
    "actualCost" DOUBLE PRECISION,
    "actualProcessingDays" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceStats" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "totalSearches" INTEGER NOT NULL DEFAULT 0,
    "totalSelections" INTEGER NOT NULL DEFAULT 0,
    "totalFeedback" INTEGER NOT NULL DEFAULT 0,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "notHelpfulCount" INTEGER NOT NULL DEFAULT 0,
    "contactedCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "avgRating" DOUBLE PRECISION,
    "avgActualCost" DOUBLE PRECISION,
    "avgProcessingDays" DOUBLE PRECISION,
    "avgResponseTime" TEXT,
    "helpfulnessRate" DOUBLE PRECISION,
    "successRate" DOUBLE PRECISION,
    "lastFeedbackAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecaLibrary" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sourceDocument" TEXT NOT NULL,
    "pageNumber" INTEGER,
    "section" TEXT,
    "embedding" vector(1536) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecaLibrary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExternalUploadToken_token_key" ON "ExternalUploadToken"("token");

-- CreateIndex
CREATE INDEX "ExternalUploadToken_token_idx" ON "ExternalUploadToken"("token");

-- CreateIndex
CREATE INDEX "ExternalUploadToken_intakeSessionId_idx" ON "ExternalUploadToken"("intakeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceInteraction_feedbackId_key" ON "ResourceInteraction"("feedbackId");

-- CreateIndex
CREATE INDEX "ResourceInteraction_resourceId_idx" ON "ResourceInteraction"("resourceId");

-- CreateIndex
CREATE INDEX "ResourceInteraction_userId_idx" ON "ResourceInteraction"("userId");

-- CreateIndex
CREATE INDEX "ResourceInteraction_followUpScheduledFor_followUpSentAt_idx" ON "ResourceInteraction"("followUpScheduledFor", "followUpSentAt");

-- CreateIndex
CREATE INDEX "ResourceInteraction_followUpCompletedAt_idx" ON "ResourceInteraction"("followUpCompletedAt");

-- CreateIndex
CREATE INDEX "ResourceInteraction_createdAt_idx" ON "ResourceInteraction"("createdAt");

-- CreateIndex
CREATE INDEX "ResourceFeedback_resourceId_idx" ON "ResourceFeedback"("resourceId");

-- CreateIndex
CREATE INDEX "ResourceFeedback_feedbackType_idx" ON "ResourceFeedback"("feedbackType");

-- CreateIndex
CREATE INDEX "ResourceFeedback_wasHelpful_idx" ON "ResourceFeedback"("wasHelpful");

-- CreateIndex
CREATE INDEX "ResourceFeedback_userId_idx" ON "ResourceFeedback"("userId");

-- CreateIndex
CREATE INDEX "ResourceFeedback_createdAt_idx" ON "ResourceFeedback"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceStats_resourceId_key" ON "ResourceStats"("resourceId");

-- CreateIndex
CREATE INDEX "ResourceStats_helpfulnessRate_idx" ON "ResourceStats"("helpfulnessRate");

-- CreateIndex
CREATE INDEX "ResourceStats_successRate_idx" ON "ResourceStats"("successRate");

-- CreateIndex
CREATE INDEX "ResourceStats_totalSearches_idx" ON "ResourceStats"("totalSearches");

-- CreateIndex
CREATE INDEX "RecaLibrary_embedding_idx" ON "RecaLibrary"("embedding");

-- CreateIndex
CREATE INDEX "DocumentResource_source_idx" ON "DocumentResource"("source");

-- CreateIndex
CREATE INDEX "DocumentResource_verificationStatus_idx" ON "DocumentResource"("verificationStatus");

-- CreateIndex
CREATE INDEX "DocumentResource_searchCount_idx" ON "DocumentResource"("searchCount");

-- CreateIndex
CREATE INDEX "DocumentResource_selectionCount_idx" ON "DocumentResource"("selectionCount");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCodeAccessGrant_promoCodeId_email_key" ON "PromoCodeAccessGrant"("promoCodeId", "email");

-- AddForeignKey
ALTER TABLE "ExternalUploadToken" ADD CONSTRAINT "ExternalUploadToken_intakeSessionId_fkey" FOREIGN KEY ("intakeSessionId") REFERENCES "IntakeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceInteraction" ADD CONSTRAINT "ResourceInteraction_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "DocumentResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceInteraction" ADD CONSTRAINT "ResourceInteraction_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "ResourceFeedback"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceFeedback" ADD CONSTRAINT "ResourceFeedback_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "DocumentResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
