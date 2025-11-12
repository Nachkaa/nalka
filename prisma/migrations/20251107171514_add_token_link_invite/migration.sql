-- DropIndex
DROP INDEX "SecretSantaAssignment_eventId_receiverId_idx";

-- DropIndex
DROP INDEX "SecretSantaAssignment_eventId_idx";

-- CreateTable
CREATE TABLE "InviteToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "remainingUses" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" DATETIME,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InviteToken_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "isAnonReservations" BOOLEAN NOT NULL DEFAULT true,
    "isSecondHandOk" BOOLEAN NOT NULL DEFAULT false,
    "isHandmadeOk" BOOLEAN NOT NULL DEFAULT false,
    "isSecretSanta" BOOLEAN NOT NULL DEFAULT false,
    "budgetCapCents" INTEGER,
    "settings" JSONB,
    "memberLimit" INTEGER NOT NULL DEFAULT 50,
    CONSTRAINT "Event_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("budgetCapCents", "budgetCents", "budgetMode", "colorHex", "createdAt", "description", "eventOn", "id", "isAnonReservations", "isHandmadeOk", "isNoSpoil", "isSecondHandOk", "isSecretSanta", "joinCode", "linkEnabled", "location", "ownerId", "settings", "slug", "title", "updatedAt") SELECT "budgetCapCents", "budgetCents", "budgetMode", "colorHex", "createdAt", "description", "eventOn", "id", "isAnonReservations", "isHandmadeOk", "isNoSpoil", "isSecondHandOk", "isSecretSanta", "joinCode", "linkEnabled", "location", "ownerId", "settings", "slug", "title", "updatedAt" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE UNIQUE INDEX "Event_joinCode_key" ON "Event"("joinCode");
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");
CREATE INDEX "Event_ownerId_eventOn_idx" ON "Event"("ownerId", "eventOn");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "InviteToken_code_key" ON "InviteToken"("code");
