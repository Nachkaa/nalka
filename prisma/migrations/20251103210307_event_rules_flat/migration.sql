-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventOn" DATETIME NOT NULL,
    "location" TEXT,
    "colorHex" TEXT NOT NULL DEFAULT '#0ea5e9',
    "linkEnabled" BOOLEAN NOT NULL DEFAULT false,
    "joinCode" TEXT,
    "slug" TEXT NOT NULL,
    "budgetMode" TEXT NOT NULL DEFAULT 'NONE',
    "budgetCents" INTEGER,
    "isNoSpoil" BOOLEAN NOT NULL DEFAULT true,
    "isAnonReservations" BOOLEAN NOT NULL DEFAULT false,
    "isOneGiftPerPerson" BOOLEAN NOT NULL DEFAULT false,
    "isNoDuplicates" BOOLEAN NOT NULL DEFAULT true,
    "isGroupGiftAllowed" BOOLEAN NOT NULL DEFAULT true,
    "isWishlinkRequired" BOOLEAN NOT NULL DEFAULT false,
    "isSecondHandOk" BOOLEAN NOT NULL DEFAULT true,
    "isHandmadeOk" BOOLEAN NOT NULL DEFAULT true,
    "budgetCapCents" INTEGER,
    "priceMinCents" INTEGER,
    "priceMaxCents" INTEGER,
    "settings" JSONB,
    CONSTRAINT "Event_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("budgetCents", "budgetMode", "colorHex", "createdAt", "description", "eventOn", "id", "joinCode", "linkEnabled", "location", "ownerId", "settings", "slug", "title", "updatedAt") SELECT "budgetCents", "budgetMode", "colorHex", "createdAt", "description", "eventOn", "id", "joinCode", "linkEnabled", "location", "ownerId", "settings", "slug", "title", "updatedAt" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE UNIQUE INDEX "Event_joinCode_key" ON "Event"("joinCode");
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");
CREATE INDEX "Event_ownerId_eventOn_idx" ON "Event"("ownerId", "eventOn");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
