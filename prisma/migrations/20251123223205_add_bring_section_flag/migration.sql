-- CreateEnum
CREATE TYPE "BringCategory" AS ENUM ('DRINKS', 'FOOD', 'GEAR', 'OTHER');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "hasBringSection" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "EventBringItem" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" "BringCategory",
    "note" TEXT,
    "eventId" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventBringItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventBringParticipation" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventBringParticipation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EventBringItem" ADD CONSTRAINT "EventBringItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBringItem" ADD CONSTRAINT "EventBringItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBringParticipation" ADD CONSTRAINT "EventBringParticipation_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "EventBringItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBringParticipation" ADD CONSTRAINT "EventBringParticipation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
