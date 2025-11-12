/*
  Warnings:

  - Added the required column `updatedAt` to the `EventInvite` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `EventMember` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EventInvite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "eventId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "invitedById" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "EventInvite_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EventInvite" ("email", "eventId", "expiresAt", "id", "invitedById", "role", "status", "token") SELECT "email", "eventId", "expiresAt", "id", "invitedById", "role", "status", "token" FROM "EventInvite";
DROP TABLE "EventInvite";
ALTER TABLE "new_EventInvite" RENAME TO "EventInvite";
CREATE UNIQUE INDEX "EventInvite_token_key" ON "EventInvite"("token");
CREATE INDEX "EventInvite_eventId_status_idx" ON "EventInvite"("eventId", "status");
CREATE INDEX "EventInvite_email_idx" ON "EventInvite"("email");
CREATE TABLE "new_EventMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    CONSTRAINT "EventMember_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EventMember" ("eventId", "id", "role", "userId") SELECT "eventId", "id", "role", "userId" FROM "EventMember";
DROP TABLE "EventMember";
ALTER TABLE "new_EventMember" RENAME TO "EventMember";
CREATE INDEX "EventMember_userId_idx" ON "EventMember"("userId");
CREATE INDEX "EventMember_eventId_idx" ON "EventMember"("eventId");
CREATE UNIQUE INDEX "EventMember_userId_eventId_key" ON "EventMember"("userId", "eventId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
