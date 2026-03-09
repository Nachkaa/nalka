-- CreateEnum
CREATE TYPE "EventRsvpStatus" AS ENUM ('PENDING', 'GOING', 'MAYBE', 'NOT_GOING');

-- AlterTable
ALTER TABLE "EventMember" ADD COLUMN     "rsvpRespondedAt" TIMESTAMP(3),
ADD COLUMN     "rsvpStatus" "EventRsvpStatus" NOT NULL DEFAULT 'PENDING';
