-- CreateEnum
CREATE TYPE "BudgetSetupStatus" AS ENUM ('NOT_STARTED', 'STARTED');

-- AlterTable
ALTER TABLE "Budget"
ADD COLUMN "setupStatus" "BudgetSetupStatus" NOT NULL DEFAULT 'NOT_STARTED';

-- Backfill
UPDATE "Budget"
SET "setupStatus" = CASE
  WHEN "totalBudget" > 0 THEN 'STARTED'::"BudgetSetupStatus"
  ELSE 'NOT_STARTED'::"BudgetSetupStatus"
END;
