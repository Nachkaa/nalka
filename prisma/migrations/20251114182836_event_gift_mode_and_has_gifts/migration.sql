/*
  Warnings:

  - You are about to drop the column `isSecretSanta` on the `Event` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "EventGiftMode" AS ENUM ('HOST_LIST', 'SECRET_SANTA', 'PERSONAL_LISTS');

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "isSecretSanta",
ADD COLUMN     "giftMode" "EventGiftMode" NOT NULL DEFAULT 'PERSONAL_LISTS';
