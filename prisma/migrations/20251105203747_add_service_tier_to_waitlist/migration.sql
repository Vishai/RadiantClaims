-- AlterTable
ALTER TABLE "RegistrationWaitlist" ADD COLUMN     "firmPreference" TEXT,
ADD COLUMN     "interestedTier" "ServiceTier",
ADD COLUMN     "phone" TEXT;

-- CreateIndex
CREATE INDEX "RegistrationWaitlist_interestedTier_idx" ON "RegistrationWaitlist"("interestedTier");
