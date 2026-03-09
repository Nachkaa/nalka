-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PLANNING', 'ACTIVE');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "status" "EventStatus" NOT NULL DEFAULT 'PLANNING',
ALTER COLUMN "eventOn" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Event_ownerId_status_idx" ON "Event"("ownerId", "status");
