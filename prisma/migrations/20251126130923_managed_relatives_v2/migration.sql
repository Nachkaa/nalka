/*
  Warnings:

  - A unique constraint covering the columns `[eventRelativeId]` on the table `GiftList` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[eventId,ownerId,eventRelativeId]` on the table `GiftList` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ParticipantKind" AS ENUM ('USER', 'MANAGED');

-- DropIndex
DROP INDEX "public"."GiftList_ownerId_eventId_key";

-- AlterTable
ALTER TABLE "GiftList" ADD COLUMN     "eventRelativeId" TEXT,
ALTER COLUMN "ownerId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ManagedProfile" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "birthYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ManagedProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRelative" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "managedProfileId" TEXT,
    "firstName" TEXT NOT NULL,
    "birthYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventRelative_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventRelative_eventId_idx" ON "EventRelative"("eventId");

-- CreateIndex
CREATE INDEX "EventRelative_managedProfileId_idx" ON "EventRelative"("managedProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "GiftList_eventRelativeId_key" ON "GiftList"("eventRelativeId");

-- CreateIndex
CREATE INDEX "GiftList_eventRelativeId_idx" ON "GiftList"("eventRelativeId");

-- CreateIndex
CREATE UNIQUE INDEX "GiftList_eventId_ownerId_eventRelativeId_key" ON "GiftList"("eventId", "ownerId", "eventRelativeId");

-- AddForeignKey
ALTER TABLE "GiftList" ADD CONSTRAINT "GiftList_eventRelativeId_fkey" FOREIGN KEY ("eventRelativeId") REFERENCES "EventRelative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagedProfile" ADD CONSTRAINT "ManagedProfile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRelative" ADD CONSTRAINT "EventRelative_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRelative" ADD CONSTRAINT "EventRelative_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRelative" ADD CONSTRAINT "EventRelative_managedProfileId_fkey" FOREIGN KEY ("managedProfileId") REFERENCES "ManagedProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
