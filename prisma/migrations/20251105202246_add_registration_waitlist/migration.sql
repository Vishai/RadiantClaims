-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('PENDING', 'CONTACTED', 'CONVERTED', 'DECLINED', 'INVALID');

-- CreateTable
CREATE TABLE "RegistrationWaitlist" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "claimType" "ClaimType",
    "source" TEXT,
    "referralCode" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "status" "WaitlistStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "submittedCount" INTEGER NOT NULL DEFAULT 1,
    "lastSubmitIp" TEXT,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "notificationSentAt" TIMESTAMP(3),
    "contactedAt" TIMESTAMP(3),
    "contactedBy" TEXT,
    "convertedToUserId" TEXT,
    "convertedAt" TIMESTAMP(3),
    "convertedBy" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationWaitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationWaitlist_email_key" ON "RegistrationWaitlist"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationWaitlist_convertedToUserId_key" ON "RegistrationWaitlist"("convertedToUserId");

-- CreateIndex
CREATE INDEX "RegistrationWaitlist_email_idx" ON "RegistrationWaitlist"("email");

-- CreateIndex
CREATE INDEX "RegistrationWaitlist_status_idx" ON "RegistrationWaitlist"("status");

-- CreateIndex
CREATE INDEX "RegistrationWaitlist_createdAt_idx" ON "RegistrationWaitlist"("createdAt");

-- CreateIndex
CREATE INDEX "RegistrationWaitlist_claimType_idx" ON "RegistrationWaitlist"("claimType");
