-- CreateTable
CREATE TABLE "EventPollVote" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "pollOptionId" TEXT NOT NULL,
    "byUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventPollVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventPollVote_pollId_idx" ON "EventPollVote"("pollId");

-- CreateIndex
CREATE INDEX "EventPollVote_pollOptionId_idx" ON "EventPollVote"("pollOptionId");

-- CreateIndex
CREATE INDEX "EventPollVote_byUserId_idx" ON "EventPollVote"("byUserId");

-- CreateIndex
CREATE INDEX "EventPollVote_pollId_byUserId_idx" ON "EventPollVote"("pollId", "byUserId");

-- CreateIndex
CREATE UNIQUE INDEX "EventPollVote_pollOptionId_byUserId_key" ON "EventPollVote"("pollOptionId", "byUserId");

-- AddForeignKey
ALTER TABLE "EventPollVote" ADD CONSTRAINT "EventPollVote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "EventPoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPollVote" ADD CONSTRAINT "EventPollVote_pollOptionId_fkey" FOREIGN KEY ("pollOptionId") REFERENCES "EventPollOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPollVote" ADD CONSTRAINT "EventPollVote_byUserId_fkey" FOREIGN KEY ("byUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
