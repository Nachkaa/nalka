-- Replaces the non-unique index on (eventId, name) with a UNIQUE constraint.
-- Prevents silent vendor merging (A10) and race-condition duplicates.
DROP INDEX "Vendor_eventId_name_idx";

-- CreateUniqueIndex
CREATE UNIQUE INDEX "Vendor_eventId_name_key" ON "Vendor"("eventId", "name");
