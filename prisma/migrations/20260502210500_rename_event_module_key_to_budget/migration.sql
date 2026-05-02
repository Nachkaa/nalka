-- Manual: Postgres ALTER TYPE RENAME VALUE preserves FK references vs auto-generated DROP/CREATE.
ALTER TYPE "EventModuleKey" RENAME VALUE 'EXPENSES' TO 'BUDGET';
