-- AlterEnum
ALTER TYPE "EmailType" ADD VALUE 'FINANCIAL_ED_CELEBRATION';
ALTER TYPE "EmailType" ADD VALUE 'FINANCIAL_ED_CALCULATOR';
ALTER TYPE "EmailType" ADD VALUE 'FINANCIAL_ED_TIPS';
ALTER TYPE "EmailType" ADD VALUE 'FINANCIAL_ED_ADVISOR';

-- CreateTable
CREATE TABLE "FinancialEdDrip" (
    "id" TEXT NOT NULL,
    "claimantId" TEXT NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email1SentAt" TIMESTAMP(3),
    "email2SentAt" TIMESTAMP(3),
    "email3SentAt" TIMESTAMP(3),
    "email4SentAt" TIMESTAMP(3),
    "calculatorVisitedAt" TIMESTAMP(3),
    "advisorCTAClickedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialEdDrip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FinancialEdDrip_claimantId_key" ON "FinancialEdDrip"("claimantId");

-- CreateIndex
CREATE INDEX "FinancialEdDrip_triggeredAt_idx" ON "FinancialEdDrip"("triggeredAt");

-- AddForeignKey
ALTER TABLE "FinancialEdDrip" ADD CONSTRAINT "FinancialEdDrip_claimantId_fkey" FOREIGN KEY ("claimantId") REFERENCES "Claimant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
