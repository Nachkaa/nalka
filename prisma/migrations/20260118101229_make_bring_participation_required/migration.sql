/*
  Warnings:

  - A unique constraint covering the columns `[userId,itemId]` on the table `EventBringParticipation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "EventBringItem_eventId_idx" ON "EventBringItem"("eventId");

-- CreateIndex
CREATE INDEX "EventBringItem_createdById_idx" ON "EventBringItem"("createdById");

-- CreateIndex
CREATE INDEX "EventBringParticipation_itemId_idx" ON "EventBringParticipation"("itemId");

-- CreateIndex
CREATE INDEX "EventBringParticipation_userId_idx" ON "EventBringParticipation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EventBringParticipation_userId_itemId_key" ON "EventBringParticipation"("userId", "itemId");
