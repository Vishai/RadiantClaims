-- Add new file category for church records
ALTER TYPE "FileCategory" ADD VALUE 'LDS_CHURCH_RECORDS';

-- Allow pending state while payment completes
ALTER TYPE "SubscriptionStatus" ADD VALUE 'PENDING';

-- Track medical facilities used for record requests
CREATE TABLE "MedicalRecordSource" (
    "id" TEXT NOT NULL,
    "claimantId" TEXT NOT NULL,
    "facilityName" TEXT NOT NULL,
    "streetAddress" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "phoneNumber" TEXT,
    "yearOpened" INTEGER,
    "yearClosed" INTEGER,
    "stillOperating" BOOLEAN NOT NULL DEFAULT true,
    "treatmentYear" INTEGER,
    "treatmentType" TEXT,
    "source" TEXT NOT NULL DEFAULT 'USER_ENTERED',
    "webSearchResult" BOOLEAN NOT NULL DEFAULT false,
    "requestGenerated" BOOLEAN NOT NULL DEFAULT false,
    "requestedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalRecordSource_pkey" PRIMARY KEY ("id")
);

-- Indexes for lookup performance
CREATE INDEX "MedicalRecordSource_claimantId_idx" ON "MedicalRecordSource"("claimantId");
CREATE INDEX "MedicalRecordSource_treatmentYear_idx" ON "MedicalRecordSource"("treatmentYear");
CREATE INDEX "MedicalRecordSource_requestGenerated_idx" ON "MedicalRecordSource"("requestGenerated");

-- Relationships
ALTER TABLE "MedicalRecordSource"
  ADD CONSTRAINT "MedicalRecordSource_claimantId_fkey"
  FOREIGN KEY ("claimantId") REFERENCES "Claimant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
