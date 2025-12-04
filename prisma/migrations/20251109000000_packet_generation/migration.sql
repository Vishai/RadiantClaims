-- Extend PacketStatus enum
DO $$ BEGIN
  ALTER TYPE "PacketStatus" ADD VALUE IF NOT EXISTS 'PENDING';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "PacketStatus" ADD VALUE IF NOT EXISTS 'OUTDATED';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add packet archive fields
ALTER TABLE "PacketSubmission"
  ADD COLUMN "readyAt" TIMESTAMPTZ,
  ADD COLUMN "archiveKey" TEXT,
  ADD COLUMN "archiveFileName" TEXT,
  ADD COLUMN "archiveSizeBytes" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "archiveChecksum" TEXT,
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "warnings" JSONB,
  ADD COLUMN "lastDownloadedAt" TIMESTAMPTZ,
  ADD COLUMN "downloadCount" INTEGER NOT NULL DEFAULT 0;

-- Create packet generation history table
CREATE TABLE "PacketGeneration" (
  "id" TEXT NOT NULL,
  "packetSubmissionId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "status" "PacketStatus" NOT NULL DEFAULT 'GENERATING',
  "archiveKey" TEXT,
  "archiveSizeBytes" INTEGER,
  "warnings" JSONB,
  "generatedBy" TEXT,
  "generatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PacketGeneration_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PacketGeneration_packetSubmissionId_fkey"
    FOREIGN KEY ("packetSubmissionId") REFERENCES "PacketSubmission"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "PacketGeneration_packetSubmissionId_idx"
  ON "PacketGeneration"("packetSubmissionId");
CREATE INDEX "PacketGeneration_version_idx"
  ON "PacketGeneration"("version");
CREATE INDEX "PacketGeneration_status_idx"
  ON "PacketGeneration"("status");
