-- CreateEnum
CREATE TYPE "PromoCodeType" AS ENUM ('PERCENT_OFF', 'AMOUNT_OFF', 'FREE_TRIAL', 'PILOT_ACCOUNT', 'WAIVE_SETUP');

-- AlterTable
ALTER TABLE "ServiceSubscription" ADD COLUMN     "discountAmount" DOUBLE PRECISION,
ADD COLUMN     "discountPercent" INTEGER,
ADD COLUMN     "isPilotAccount" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pilotExpiresAt" TIMESTAMP(3),
ADD COLUMN     "promoCodeId" TEXT,
ADD COLUMN     "setupFeeWaived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeCouponId" TEXT;

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "PromoCodeType" NOT NULL,
    "description" TEXT,
    "percentOff" INTEGER,
    "amountOff" DOUBLE PRECISION,
    "freeTrialDays" INTEGER,
    "maxUses" INTEGER,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "stripeCouponId" TEXT,
    "createdBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_stripeCouponId_key" ON "PromoCode"("stripeCouponId");

-- CreateIndex
CREATE INDEX "PromoCode_code_idx" ON "PromoCode"("code");

-- CreateIndex
CREATE INDEX "PromoCode_isActive_idx" ON "PromoCode"("isActive");

-- CreateIndex
CREATE INDEX "PromoCode_expiresAt_idx" ON "PromoCode"("expiresAt");

-- CreateIndex
CREATE INDEX "ServiceSubscription_promoCodeId_idx" ON "ServiceSubscription"("promoCodeId");

-- CreateIndex
CREATE INDEX "ServiceSubscription_isPilotAccount_idx" ON "ServiceSubscription"("isPilotAccount");

-- AddForeignKey
ALTER TABLE "ServiceSubscription" ADD CONSTRAINT "ServiceSubscription_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
