-- CreateEnum
CREATE TYPE "LawFirmNotificationEvent" AS ENUM ('NEW_CLIENT_ASSIGNED', 'PACKET_UPDATED', 'PACKET_READY');

-- CreateTable
CREATE TABLE "LawFirmNotificationSetting" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "event" "LawFirmNotificationEvent" NOT NULL,
    "recipientEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notifyPrimaryContact" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LawFirmNotificationSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LawFirmNotificationSetting_firmId_idx" ON "LawFirmNotificationSetting"("firmId");

-- CreateIndex
CREATE UNIQUE INDEX "LawFirmNotificationSetting_firmId_event_key" ON "LawFirmNotificationSetting"("firmId", "event");

-- AddForeignKey
ALTER TABLE "LawFirmNotificationSetting" ADD CONSTRAINT "LawFirmNotificationSetting_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "LawFirm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
