CREATE TABLE "EventDraft" (
    "id" TEXT NOT NULL,
    "tokenHash" VARCHAR(64) NOT NULL,
    "payload" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "claimedEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventDraft_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EventDraft_tokenHash_key" ON "EventDraft"("tokenHash");
CREATE UNIQUE INDEX "EventDraft_claimedEventId_key" ON "EventDraft"("claimedEventId");
CREATE INDEX "EventDraft_expiresAt_idx" ON "EventDraft"("expiresAt");
