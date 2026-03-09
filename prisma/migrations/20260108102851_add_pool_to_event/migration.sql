-- CreateEnum
CREATE TYPE "EventScheduleMode" AS ENUM ('TBD', 'EXACT', 'POLL');

-- CreateEnum
CREATE TYPE "EventLocationMode" AS ENUM ('TBD', 'EXACT', 'POLL');

-- CreateEnum
CREATE TYPE "EventPollType" AS ENUM ('SCHEDULE', 'LOCATION');

-- CreateEnum
CREATE TYPE "EventPollStatus" AS ENUM ('OPEN', 'CLOSED');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "locationMode" "EventLocationMode" NOT NULL DEFAULT 'TBD',
ADD COLUMN     "scheduleMode" "EventScheduleMode" NOT NULL DEFAULT 'TBD',
ALTER COLUMN "giftMode" SET DEFAULT 'NONE';

-- CreateTable
CREATE TABLE "EventPoll" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" "EventPollType" NOT NULL,
    "status" "EventPollStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventPoll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventPollOption" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "dateValue" TIMESTAMP(3),
    "textValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventPollOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventPoll_eventId_type_idx" ON "EventPoll"("eventId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "EventPoll_eventId_type_key" ON "EventPoll"("eventId", "type");

-- CreateIndex
CREATE INDEX "EventPollOption_pollId_idx" ON "EventPollOption"("pollId");

-- CreateIndex
CREATE UNIQUE INDEX "EventPollOption_pollId_sort_key" ON "EventPollOption"("pollId", "sort");

-- AddForeignKey
ALTER TABLE "EventPoll" ADD CONSTRAINT "EventPoll_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPollOption" ADD CONSTRAINT "EventPollOption_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "EventPoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;
