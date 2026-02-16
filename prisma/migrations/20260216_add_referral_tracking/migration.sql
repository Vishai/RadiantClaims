-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('NOT_REFERRED', 'CTA_CLICKED', 'CONSULTATION_BOOKED', 'CONSULTATION_COMPLETED', 'CLIENT_CONVERTED', 'DECLINED');

-- AlterTable
ALTER TABLE "FinancialEdDrip" ADD COLUMN "referralStatus" "ReferralStatus" NOT NULL DEFAULT 'NOT_REFERRED',
ADD COLUMN "referralClickSource" TEXT,
ADD COLUMN "consultationBookedAt" TIMESTAMP(3),
ADD COLUMN "consultationCompletedAt" TIMESTAMP(3),
ADD COLUMN "clientConvertedAt" TIMESTAMP(3),
ADD COLUMN "estimatedAUM" DOUBLE PRECISION,
ADD COLUMN "referralFeeEarned" DOUBLE PRECISION,
ADD COLUMN "referralNotes" TEXT;

-- CreateIndex
CREATE INDEX "FinancialEdDrip_referralStatus_idx" ON "FinancialEdDrip"("referralStatus");
