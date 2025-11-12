-- CreateTable
CREATE TABLE "SecretSantaAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "giverId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "SecretSantaAssignment_eventId_idx" ON "SecretSantaAssignment"("eventId");

-- CreateIndex
CREATE INDEX "SecretSantaAssignment_eventId_receiverId_idx" ON "SecretSantaAssignment"("eventId", "receiverId");

-- CreateIndex
CREATE UNIQUE INDEX "SecretSantaAssignment_eventId_giverId_key" ON "SecretSantaAssignment"("eventId", "giverId");
