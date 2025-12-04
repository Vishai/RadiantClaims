-- CreateEnum
CREATE TYPE "AttorneyActivityType" AS ENUM ('NEW_CLIENT_SIGNUP', 'DOCUMENT_UPLOADED', 'PACKET_GENERATED', 'PACKET_DOWNLOADED', 'CLAIMANT_RESPONDED', 'MILESTONE_REACHED', 'DOCUMENT_VALIDATED', 'CONTACT_INFO_UPDATED', 'FOLLOW_UP_COMPLETED', 'SIGNIFICANT_PROGRESS');

-- CreateEnum
CREATE TYPE "AttorneyNotificationType" AS ENUM ('IMMEDIATE_NEW_CLIENT', 'IMMEDIATE_PACKET_READY', 'SCHEDULED_SUMMARY');

-- CreateEnum
CREATE TYPE "FollowUpType" AS ENUM ('WELCOME_CHECKLIST', 'DOCUMENT_SPECIFIC', 'PROGRESS_MILESTONE', 'RE_ENGAGEMENT', 'GENERAL_CHECK_IN');

-- CreateEnum
CREATE TYPE "FollowUpPhase" AS ENUM ('ACTIVE_SUPPORT', 'MAINTENANCE', 'PAUSED');

-- CreateEnum
CREATE TYPE "FollowUpResponseType" AS ENUM ('CONTACTED_OFFICE', 'NEED_HELP', 'ALREADY_HAVE', 'CANT_OBTAIN', 'WORKING_ON_IT', 'QUESTIONS');

-- CreateEnum
CREATE TYPE "DocumentAssistanceLevel" AS ENUM ('RESOURCE_PROVISION', 'GUIDED_SUPPORT', 'DIRECT_ASSISTANCE');

-- CreateEnum
CREATE TYPE "StaffAssistanceStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EmailType" ADD VALUE 'ATTORNEY_NEW_CLIENT';
ALTER TYPE "EmailType" ADD VALUE 'ATTORNEY_ACTIVITY_SUMMARY';
ALTER TYPE "EmailType" ADD VALUE 'ATTORNEY_PACKET_READY';
ALTER TYPE "EmailType" ADD VALUE 'CLIENT_DOCUMENT_FOLLOW_UP';
ALTER TYPE "EmailType" ADD VALUE 'CLIENT_PROGRESS_MILESTONE';
ALTER TYPE "EmailType" ADD VALUE 'CLIENT_REENGAGEMENT';
ALTER TYPE "EmailType" ADD VALUE 'CLIENT_DOCUMENT_ASSISTANCE';

-- CreateTable
CREATE TABLE "LawFirmNotificationSchedule" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "summaryEmailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "summaryEmailTimes" TEXT[] DEFAULT ARRAY['06:00', '14:00']::TEXT[],
    "timezone" TEXT NOT NULL DEFAULT 'America/Denver',
    "immediateNewClient" BOOLEAN NOT NULL DEFAULT true,
    "immediatePacketReady" BOOLEAN NOT NULL DEFAULT true,
    "minimumActivities" INTEGER NOT NULL DEFAULT 1,
    "suppressIfNoActivity" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LawFirmNotificationSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttorneyActivityLog" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "sessionId" TEXT,
    "claimantId" TEXT,
    "activityType" "AttorneyActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "includedInSummary" BOOLEAN NOT NULL DEFAULT false,
    "summaryEmailId" TEXT,

    CONSTRAINT "AttorneyActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttorneyNotificationLog" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "notificationType" "AttorneyNotificationType" NOT NULL,
    "recipients" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "subject" TEXT NOT NULL,
    "sessionId" TEXT,
    "activityIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "suppressedReason" TEXT,

    CONSTRAINT "AttorneyNotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimantFollowUp" (
    "id" TEXT NOT NULL,
    "claimantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "followUpType" "FollowUpType" NOT NULL,
    "documentType" TEXT,
    "phase" "FollowUpPhase" NOT NULL DEFAULT 'ACTIVE_SUPPORT',
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "responseType" "FollowUpResponseType",
    "respondedAt" TIMESTAMP(3),
    "responseMetadata" JSONB,
    "nextFollowUpId" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClaimantFollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentRequestAssistance" (
    "id" TEXT NOT NULL,
    "claimantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "assistanceLevel" "DocumentAssistanceLevel" NOT NULL DEFAULT 'RESOURCE_PROVISION',
    "providerName" TEXT,
    "providerContact" JSONB,
    "estimatedCost" TEXT,
    "estimatedTime" TEXT,
    "formTemplateUrl" TEXT,
    "formPrefilledData" JSONB,
    "staffAssistanceRequested" BOOLEAN NOT NULL DEFAULT false,
    "assignedStaffId" TEXT,
    "staffStatus" "StaffAssistanceStatus",
    "viewedResources" BOOLEAN NOT NULL DEFAULT false,
    "downloadedForm" BOOLEAN NOT NULL DEFAULT false,
    "requestedHelp" BOOLEAN NOT NULL DEFAULT false,
    "confirmedSubmission" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentRequestAssistance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUpPriorityQueue" (
    "id" TEXT NOT NULL,
    "claimantId" TEXT NOT NULL,
    "priorityScore" INTEGER NOT NULL DEFAULT 50,
    "recentActivity" BOOLEAN NOT NULL DEFAULT false,
    "highCompletionRate" BOOLEAN NOT NULL DEFAULT false,
    "respondedToLastEmail" BOOLEAN NOT NULL DEFAULT false,
    "uploadedRecently" BOOLEAN NOT NULL DEFAULT false,
    "nearingCompletion" BOOLEAN NOT NULL DEFAULT false,
    "unresponsiveCount" INTEGER NOT NULL DEFAULT 0,
    "bouncedEmail" BOOLEAN NOT NULL DEFAULT false,
    "requestedPause" BOOLEAN NOT NULL DEFAULT false,
    "daysInactive" INTEGER NOT NULL DEFAULT 0,
    "missingCriticalDocs" BOOLEAN NOT NULL DEFAULT false,
    "attorneyWaiting" BOOLEAN NOT NULL DEFAULT false,
    "nextFollowUpAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowUpPriorityQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LawFirmNotificationSchedule_firmId_key" ON "LawFirmNotificationSchedule"("firmId");

-- CreateIndex
CREATE INDEX "LawFirmNotificationSchedule_firmId_idx" ON "LawFirmNotificationSchedule"("firmId");

-- CreateIndex
CREATE INDEX "AttorneyActivityLog_firmId_createdAt_idx" ON "AttorneyActivityLog"("firmId", "createdAt");

-- CreateIndex
CREATE INDEX "AttorneyActivityLog_sessionId_idx" ON "AttorneyActivityLog"("sessionId");

-- CreateIndex
CREATE INDEX "AttorneyActivityLog_activityType_idx" ON "AttorneyActivityLog"("activityType");

-- CreateIndex
CREATE INDEX "AttorneyNotificationLog_firmId_sentAt_idx" ON "AttorneyNotificationLog"("firmId", "sentAt");

-- CreateIndex
CREATE INDEX "AttorneyNotificationLog_notificationType_idx" ON "AttorneyNotificationLog"("notificationType");

-- CreateIndex
CREATE INDEX "ClaimantFollowUp_claimantId_scheduledFor_idx" ON "ClaimantFollowUp"("claimantId", "scheduledFor");

-- CreateIndex
CREATE INDEX "ClaimantFollowUp_sessionId_idx" ON "ClaimantFollowUp"("sessionId");

-- CreateIndex
CREATE INDEX "ClaimantFollowUp_followUpType_idx" ON "ClaimantFollowUp"("followUpType");

-- CreateIndex
CREATE INDEX "DocumentRequestAssistance_claimantId_idx" ON "DocumentRequestAssistance"("claimantId");

-- CreateIndex
CREATE INDEX "DocumentRequestAssistance_sessionId_idx" ON "DocumentRequestAssistance"("sessionId");

-- CreateIndex
CREATE INDEX "DocumentRequestAssistance_documentType_idx" ON "DocumentRequestAssistance"("documentType");

-- CreateIndex
CREATE UNIQUE INDEX "FollowUpPriorityQueue_claimantId_key" ON "FollowUpPriorityQueue"("claimantId");

-- CreateIndex
CREATE INDEX "FollowUpPriorityQueue_priorityScore_nextFollowUpAt_idx" ON "FollowUpPriorityQueue"("priorityScore", "nextFollowUpAt");

-- CreateIndex
CREATE INDEX "FollowUpPriorityQueue_nextFollowUpAt_idx" ON "FollowUpPriorityQueue"("nextFollowUpAt");

-- AddForeignKey
ALTER TABLE "LawFirmNotificationSchedule" ADD CONSTRAINT "LawFirmNotificationSchedule_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "LawFirm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttorneyActivityLog" ADD CONSTRAINT "AttorneyActivityLog_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "LawFirm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttorneyActivityLog" ADD CONSTRAINT "AttorneyActivityLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "IntakeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttorneyActivityLog" ADD CONSTRAINT "AttorneyActivityLog_claimantId_fkey" FOREIGN KEY ("claimantId") REFERENCES "Claimant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttorneyActivityLog" ADD CONSTRAINT "AttorneyActivityLog_summaryEmailId_fkey" FOREIGN KEY ("summaryEmailId") REFERENCES "AttorneyNotificationLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttorneyNotificationLog" ADD CONSTRAINT "AttorneyNotificationLog_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "LawFirm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttorneyNotificationLog" ADD CONSTRAINT "AttorneyNotificationLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "IntakeSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimantFollowUp" ADD CONSTRAINT "ClaimantFollowUp_claimantId_fkey" FOREIGN KEY ("claimantId") REFERENCES "Claimant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimantFollowUp" ADD CONSTRAINT "ClaimantFollowUp_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "IntakeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRequestAssistance" ADD CONSTRAINT "DocumentRequestAssistance_claimantId_fkey" FOREIGN KEY ("claimantId") REFERENCES "Claimant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRequestAssistance" ADD CONSTRAINT "DocumentRequestAssistance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "IntakeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRequestAssistance" ADD CONSTRAINT "DocumentRequestAssistance_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpPriorityQueue" ADD CONSTRAINT "FollowUpPriorityQueue_claimantId_fkey" FOREIGN KEY ("claimantId") REFERENCES "Claimant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

