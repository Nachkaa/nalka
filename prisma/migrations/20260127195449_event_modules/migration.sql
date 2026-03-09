/*
  Warnings:

  - You are about to drop the column `budgetCapCents` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `hasBringSection` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `isAnonReservations` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `isHandmadeOk` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `isNoSpoil` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `isSecondHandOk` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `settings` on the `Event` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "EventModuleKey" AS ENUM ('OVERVIEW', 'GIFTS', 'SECRET_SANTA', 'POTLUCK', 'TIMELINE', 'EXPENSES', 'POLLS', 'CHAT');

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "budgetCapCents",
DROP COLUMN "hasBringSection",
DROP COLUMN "isAnonReservations",
DROP COLUMN "isHandmadeOk",
DROP COLUMN "isNoSpoil",
DROP COLUMN "isSecondHandOk",
DROP COLUMN "settings";

-- CreateTable
CREATE TABLE "EventModule" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eventId" TEXT NOT NULL,
    "key" "EventModuleKey" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL,

    CONSTRAINT "EventModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventGiftsSettings" (
    "id" TEXT NOT NULL,
    "eventModuleId" TEXT NOT NULL,
    "isNoSpoil" BOOLEAN NOT NULL DEFAULT true,
    "isAnonReservations" BOOLEAN NOT NULL DEFAULT true,
    "isSecondHandOk" BOOLEAN NOT NULL DEFAULT false,
    "isHandmadeOk" BOOLEAN NOT NULL DEFAULT false,
    "budgetCapCents" INTEGER,

    CONSTRAINT "EventGiftsSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSecretSantaSettings" (
    "id" TEXT NOT NULL,
    "eventModuleId" TEXT NOT NULL,

    CONSTRAINT "EventSecretSantaSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventPotluckSettings" (
    "id" TEXT NOT NULL,
    "eventModuleId" TEXT NOT NULL,

    CONSTRAINT "EventPotluckSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventTimelineSettings" (
    "id" TEXT NOT NULL,
    "eventModuleId" TEXT NOT NULL,

    CONSTRAINT "EventTimelineSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventExpensesSettings" (
    "id" TEXT NOT NULL,
    "eventModuleId" TEXT NOT NULL,

    CONSTRAINT "EventExpensesSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventPollsSettings" (
    "id" TEXT NOT NULL,
    "eventModuleId" TEXT NOT NULL,

    CONSTRAINT "EventPollsSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventChatSettings" (
    "id" TEXT NOT NULL,
    "eventModuleId" TEXT NOT NULL,

    CONSTRAINT "EventChatSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventOverviewSettings" (
    "id" TEXT NOT NULL,
    "eventModuleId" TEXT NOT NULL,
    "rsvpRequired" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EventOverviewSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventModule_eventId_enabled_idx" ON "EventModule"("eventId", "enabled");

-- CreateIndex
CREATE INDEX "EventModule_eventId_position_idx" ON "EventModule"("eventId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "EventModule_eventId_key_key" ON "EventModule"("eventId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "EventGiftsSettings_eventModuleId_key" ON "EventGiftsSettings"("eventModuleId");

-- CreateIndex
CREATE UNIQUE INDEX "EventSecretSantaSettings_eventModuleId_key" ON "EventSecretSantaSettings"("eventModuleId");

-- CreateIndex
CREATE UNIQUE INDEX "EventPotluckSettings_eventModuleId_key" ON "EventPotluckSettings"("eventModuleId");

-- CreateIndex
CREATE UNIQUE INDEX "EventTimelineSettings_eventModuleId_key" ON "EventTimelineSettings"("eventModuleId");

-- CreateIndex
CREATE UNIQUE INDEX "EventExpensesSettings_eventModuleId_key" ON "EventExpensesSettings"("eventModuleId");

-- CreateIndex
CREATE UNIQUE INDEX "EventPollsSettings_eventModuleId_key" ON "EventPollsSettings"("eventModuleId");

-- CreateIndex
CREATE UNIQUE INDEX "EventChatSettings_eventModuleId_key" ON "EventChatSettings"("eventModuleId");

-- CreateIndex
CREATE UNIQUE INDEX "EventOverviewSettings_eventModuleId_key" ON "EventOverviewSettings"("eventModuleId");

-- AddForeignKey
ALTER TABLE "EventModule" ADD CONSTRAINT "EventModule_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventGiftsSettings" ADD CONSTRAINT "EventGiftsSettings_eventModuleId_fkey" FOREIGN KEY ("eventModuleId") REFERENCES "EventModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSecretSantaSettings" ADD CONSTRAINT "EventSecretSantaSettings_eventModuleId_fkey" FOREIGN KEY ("eventModuleId") REFERENCES "EventModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPotluckSettings" ADD CONSTRAINT "EventPotluckSettings_eventModuleId_fkey" FOREIGN KEY ("eventModuleId") REFERENCES "EventModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTimelineSettings" ADD CONSTRAINT "EventTimelineSettings_eventModuleId_fkey" FOREIGN KEY ("eventModuleId") REFERENCES "EventModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventExpensesSettings" ADD CONSTRAINT "EventExpensesSettings_eventModuleId_fkey" FOREIGN KEY ("eventModuleId") REFERENCES "EventModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPollsSettings" ADD CONSTRAINT "EventPollsSettings_eventModuleId_fkey" FOREIGN KEY ("eventModuleId") REFERENCES "EventModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventChatSettings" ADD CONSTRAINT "EventChatSettings_eventModuleId_fkey" FOREIGN KEY ("eventModuleId") REFERENCES "EventModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventOverviewSettings" ADD CONSTRAINT "EventOverviewSettings_eventModuleId_fkey" FOREIGN KEY ("eventModuleId") REFERENCES "EventModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
