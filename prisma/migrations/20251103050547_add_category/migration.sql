-- AlterTable
ALTER TABLE "UploadedFile" ADD COLUMN     "categoryLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "categoryLockedAt" TIMESTAMP(3),
ADD COLUMN     "categoryLockedBy" TEXT;
