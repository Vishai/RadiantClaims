-- AlterTable
ALTER TABLE "ServiceSubscription" ADD COLUMN     "installmentCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "installmentPaymentCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isInstallmentPlan" BOOLEAN NOT NULL DEFAULT false;
