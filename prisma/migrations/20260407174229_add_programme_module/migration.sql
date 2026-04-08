-- CreateEnum
CREATE TYPE "EventTimelineMomentKind" AS ENUM ('ceremony', 'reception', 'meal', 'party', 'transport', 'other');

-- CreateTable
CREATE TABLE "EventTimelineMoment" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" "EventTimelineMomentKind" NOT NULL DEFAULT 'other',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "locationName" TEXT,
    "locationAddress" TEXT,
    "note" TEXT,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventTimelineMoment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventTimelineMoment_eventId_startsAt_idx" ON "EventTimelineMoment"("eventId", "startsAt");

-- CreateIndex
CREATE INDEX "EventTimelineMoment_eventId_position_idx" ON "EventTimelineMoment"("eventId", "position");

-- AddForeignKey
ALTER TABLE "EventTimelineMoment" ADD CONSTRAINT "EventTimelineMoment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
