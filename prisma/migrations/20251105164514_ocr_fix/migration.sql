/*
  Warnings:

  - The values [SUBSCRIPTION_TRIAL_ENDING] on the enum `AuditAction` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "CustomerFileStatus" AS ENUM ('PROCESSING', 'VERIFIED', 'NEEDS_REVIEW', 'ERROR');

-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('PENDING', 'PROCESSING', 'VERIFIED', 'NEEDS_REVIEW', 'STAFF_APPROVED', 'REJECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "ClaimReviewStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'NEEDS_INFO', 'READY', 'APPROVED', 'REJECTED', 'SUBMITTED_TO_DOJ', 'DOJ_APPROVED', 'DOJ_DENIED');

-- CreateEnum
CREATE TYPE "AgentExecutionStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'TIMEOUT');

-- CreateEnum
CREATE TYPE "StaffActionType" AS ENUM ('VIEWED_CLAIM', 'STARTED_REVIEW', 'REQUESTED_DOCUMENTS', 'ADDED_NOTE', 'OVERRODE_AI', 'APPROVED_DOCUMENT', 'REJECTED_DOCUMENT', 'APPROVED_CLAIM', 'REJECTED_CLAIM', 'ASSIGNED_CLAIM', 'CONTACTED_CLAIMANT');

-- AlterEnum
BEGIN;
CREATE TYPE "AuditAction_new" AS ENUM ('USER_LOGIN', 'USER_LOGOUT', 'USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'PASSWORD_CHANGED', 'PASSWORD_RESET_REQUESTED', 'PASSWORD_RESET_COMPLETED', 'MFA_ENABLED', 'MFA_DISABLED', 'SESSION_CREATED', 'SESSION_TERMINATED', 'CLAIMANT_VIEWED', 'CLAIMANT_CREATED', 'CLAIMANT_UPDATED', 'CLAIMANT_DELETED', 'DOCUMENT_UPLOADED', 'DOCUMENT_VIEWED', 'DOCUMENT_DOWNLOADED', 'DOCUMENT_DELETED', 'INTAKE_STARTED', 'INTAKE_COMPLETED', 'PACKET_GENERATED', 'UNAUTHORIZED_ACCESS_ATTEMPT', 'PERMISSION_DENIED', 'FIRM_CREATED', 'FIRM_UPDATED', 'FIRM_SUSPENDED', 'ATTORNEY_INVITED', 'ATTORNEY_REMOVED', 'CLAIMANT_ASSIGNED', 'CLAIMANT_UNASSIGNED', 'POLICY_ACCEPTED', 'COMMENT_ADDED', 'COMMENT_DELETED', 'REVIEW_APPROVED', 'REVIEW_REJECTED', 'REVISION_REQUESTED', 'NOTIFICATION_SENT', 'WORKFLOW_STATUS_CHANGED', 'SUBSCRIPTION_CREATED', 'SUBSCRIPTION_UPGRADED', 'SUBSCRIPTION_DOWNGRADED', 'SUBSCRIPTION_CANCELED', 'SUBSCRIPTION_REACTIVATED', 'PAYMENT_SUCCEEDED', 'PAYMENT_FAILED', 'REFUND_REQUESTED', 'REFUND_PROCESSED', 'FIRM_SERVICE_FEE_PAID', 'PDF_DOWNLOADED');
ALTER TABLE "AuditLog" ALTER COLUMN "action" TYPE "AuditAction_new" USING ("action"::text::"AuditAction_new");
ALTER TYPE "AuditAction" RENAME TO "AuditAction_old";
ALTER TYPE "AuditAction_new" RENAME TO "AuditAction";
DROP TYPE "AuditAction_old";
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'STAFF_REVIEWER';
ALTER TYPE "UserRole" ADD VALUE 'SENIOR_REVIEWER';

-- AlterTable
ALTER TABLE "UploadedFile" ADD COLUMN     "customerStatus" "CustomerFileStatus" NOT NULL DEFAULT 'PROCESSING',
ADD COLUMN     "extractedDataSummary" JSONB,
ADD COLUMN     "userConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "userNotes" TEXT,
ADD COLUMN     "userReportedIssue" TEXT;

-- CreateTable
CREATE TABLE "DocumentValidation" (
    "id" TEXT NOT NULL,
    "uploadedFileId" TEXT NOT NULL,
    "classifierResult" JSONB,
    "identityResult" JSONB,
    "medicalResult" JSONB,
    "residenceResult" JSONB,
    "employmentResult" JSONB,
    "extractedData" JSONB,
    "status" "ValidationStatus" NOT NULL DEFAULT 'PENDING',
    "overallConfidence" DOUBLE PRECISION,
    "criticalIssues" JSONB[],
    "warnings" JSONB[],
    "suggestions" JSONB[],
    "processingStartedAt" TIMESTAMP(3),
    "processingCompletedAt" TIMESTAMP(3),
    "processingTimeMs" INTEGER,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "staffOverride" JSONB,
    "staffNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentValidation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimReadiness" (
    "id" TEXT NOT NULL,
    "intakeSessionId" TEXT NOT NULL,
    "readinessScore" DOUBLE PRECISION NOT NULL,
    "isReadyForSubmission" BOOLEAN NOT NULL DEFAULT false,
    "completeness" JSONB NOT NULL,
    "criticalBlockers" JSONB[],
    "warnings" JSONB[],
    "nameConsistent" BOOLEAN NOT NULL DEFAULT true,
    "datesConsistent" BOOLEAN NOT NULL DEFAULT true,
    "claimTypeConfidence" DOUBLE PRECISION,
    "detectedClaimType" "ClaimType",
    "lastAssessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assessmentVersion" TEXT NOT NULL DEFAULT '1.0',
    "staffReviewStatus" "ClaimReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "staffDecision" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClaimReadiness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentExecutionLog" (
    "id" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "agentVersion" TEXT NOT NULL,
    "uploadedFileId" TEXT,
    "intakeSessionId" TEXT,
    "status" "AgentExecutionStatus" NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "executionTimeMs" INTEGER,
    "modelUsed" TEXT,
    "tokensUsed" INTEGER,
    "estimatedCost" DOUBLE PRECISION,

    CONSTRAINT "AgentExecutionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffAction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "intakeSessionId" TEXT NOT NULL,
    "actionType" "StaffActionType" NOT NULL,
    "actionData" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentValidation_uploadedFileId_key" ON "DocumentValidation"("uploadedFileId");

-- CreateIndex
CREATE INDEX "DocumentValidation_status_idx" ON "DocumentValidation"("status");

-- CreateIndex
CREATE INDEX "DocumentValidation_uploadedFileId_idx" ON "DocumentValidation"("uploadedFileId");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimReadiness_intakeSessionId_key" ON "ClaimReadiness"("intakeSessionId");

-- CreateIndex
CREATE INDEX "ClaimReadiness_readinessScore_idx" ON "ClaimReadiness"("readinessScore");

-- CreateIndex
CREATE INDEX "ClaimReadiness_isReadyForSubmission_idx" ON "ClaimReadiness"("isReadyForSubmission");

-- CreateIndex
CREATE INDEX "ClaimReadiness_staffReviewStatus_idx" ON "ClaimReadiness"("staffReviewStatus");

-- CreateIndex
CREATE INDEX "AgentExecutionLog_agentName_idx" ON "AgentExecutionLog"("agentName");

-- CreateIndex
CREATE INDEX "AgentExecutionLog_status_idx" ON "AgentExecutionLog"("status");

-- CreateIndex
CREATE INDEX "AgentExecutionLog_uploadedFileId_idx" ON "AgentExecutionLog"("uploadedFileId");

-- CreateIndex
CREATE INDEX "AgentExecutionLog_intakeSessionId_idx" ON "AgentExecutionLog"("intakeSessionId");

-- CreateIndex
CREATE INDEX "AgentExecutionLog_startedAt_idx" ON "AgentExecutionLog"("startedAt");

-- CreateIndex
CREATE INDEX "StaffAction_userId_idx" ON "StaffAction"("userId");

-- CreateIndex
CREATE INDEX "StaffAction_intakeSessionId_idx" ON "StaffAction"("intakeSessionId");

-- CreateIndex
CREATE INDEX "StaffAction_actionType_idx" ON "StaffAction"("actionType");

-- CreateIndex
CREATE INDEX "StaffAction_createdAt_idx" ON "StaffAction"("createdAt");

-- CreateIndex
CREATE INDEX "UploadedFile_customerStatus_idx" ON "UploadedFile"("customerStatus");

-- AddForeignKey
ALTER TABLE "DocumentValidation" ADD CONSTRAINT "DocumentValidation_uploadedFileId_fkey" FOREIGN KEY ("uploadedFileId") REFERENCES "UploadedFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimReadiness" ADD CONSTRAINT "ClaimReadiness_intakeSessionId_fkey" FOREIGN KEY ("intakeSessionId") REFERENCES "IntakeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentExecutionLog" ADD CONSTRAINT "AgentExecutionLog_uploadedFileId_fkey" FOREIGN KEY ("uploadedFileId") REFERENCES "UploadedFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentExecutionLog" ADD CONSTRAINT "AgentExecutionLog_intakeSessionId_fkey" FOREIGN KEY ("intakeSessionId") REFERENCES "IntakeSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAction" ADD CONSTRAINT "StaffAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAction" ADD CONSTRAINT "StaffAction_intakeSessionId_fkey" FOREIGN KEY ("intakeSessionId") REFERENCES "IntakeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
