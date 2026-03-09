/*
  Warnings:

  - You are about to drop the column `hasGifts` on the `Event` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[ownerId,eventId]` on the table `GiftList` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "EventGiftMode" ADD VALUE 'NONE';

-- DropIndex
DROP INDEX "public"."GiftList_eventId_ownerId_eventRelativeId_key";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "hasGifts";

-- CreateIndex
CREATE INDEX "GiftList_ownerId_idx" ON "GiftList"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "GiftList_ownerId_eventId_key" ON "GiftList"("ownerId", "eventId");
