/*
  Warnings:

  - A unique constraint covering the columns `[finalizedOptionId]` on the table `EventPoll` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "EventPollClosedReason" AS ENUM ('FINAL_SET', 'HOST_CLOSED', 'REPLACED');

-- DropIndex
DROP INDEX "public"."EventPoll_eventId_type_key";

-- AlterTable
ALTER TABLE "EventPoll" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "closedReason" "EventPollClosedReason",
ADD COLUMN     "finalizedOptionId" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "EventPoll_finalizedOptionId_key" ON "EventPoll"("finalizedOptionId");

-- CreateIndex
CREATE INDEX "EventPoll_eventId_type_isActive_idx" ON "EventPoll"("eventId", "type", "isActive");

-- AddForeignKey
ALTER TABLE "EventPoll" ADD CONSTRAINT "EventPoll_finalizedOptionId_fkey" FOREIGN KEY ("finalizedOptionId") REFERENCES "EventPollOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
