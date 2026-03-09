/*
  Warnings:

  - The values [SECRET_SANTA,NONE] on the enum `EventGiftMode` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EventGiftMode_new" AS ENUM ('HOST_LIST', 'PERSONAL_LISTS');
ALTER TABLE "public"."Event" ALTER COLUMN "giftMode" DROP DEFAULT;
ALTER TABLE "Event" ALTER COLUMN "giftMode" TYPE "EventGiftMode_new" USING ("giftMode"::text::"EventGiftMode_new");
ALTER TYPE "EventGiftMode" RENAME TO "EventGiftMode_old";
ALTER TYPE "EventGiftMode_new" RENAME TO "EventGiftMode";
DROP TYPE "public"."EventGiftMode_old";
ALTER TABLE "Event" ALTER COLUMN "giftMode" SET DEFAULT 'HOST_LIST';
COMMIT;

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "giftMode" SET DEFAULT 'HOST_LIST';
