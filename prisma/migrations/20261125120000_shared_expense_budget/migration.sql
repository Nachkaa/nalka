-- CreateTable
CREATE TABLE "SharedBudgetParticipant" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT,
    "relativeId" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedBudgetParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedExpense" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "payerId" TEXT NOT NULL,
    "description" VARCHAR(160) NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedExpenseShare" (
    "expenseId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,

    CONSTRAINT "SharedExpenseShare_pkey" PRIMARY KEY ("expenseId","participantId")
);

-- CreateTable
CREATE TABLE "SharedRepayment" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedRepayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedBudgetParticipant_id_eventId_key" ON "SharedBudgetParticipant"("id", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "SharedBudgetParticipant_eventId_userId_key" ON "SharedBudgetParticipant"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SharedBudgetParticipant_eventId_relativeId_key" ON "SharedBudgetParticipant"("eventId", "relativeId");

-- CreateIndex
CREATE INDEX "SharedExpense_eventId_createdAt_idx" ON "SharedExpense"("eventId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SharedExpense_id_eventId_key" ON "SharedExpense"("id", "eventId");

-- CreateIndex
CREATE INDEX "SharedExpenseShare_participantId_eventId_idx" ON "SharedExpenseShare"("participantId", "eventId");

-- CreateIndex
CREATE INDEX "SharedRepayment_eventId_createdAt_idx" ON "SharedRepayment"("eventId", "createdAt");

-- AddForeignKey
ALTER TABLE "SharedBudgetParticipant" ADD CONSTRAINT "SharedBudgetParticipant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedBudgetParticipant" ADD CONSTRAINT "SharedBudgetParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedBudgetParticipant" ADD CONSTRAINT "SharedBudgetParticipant_relativeId_fkey" FOREIGN KEY ("relativeId") REFERENCES "EventRelative"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedExpense" ADD CONSTRAINT "SharedExpense_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedExpense" ADD CONSTRAINT "SharedExpense_payerId_eventId_fkey" FOREIGN KEY ("payerId", "eventId") REFERENCES "SharedBudgetParticipant"("id", "eventId") ON DELETE NO ACTION ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- AddForeignKey
ALTER TABLE "SharedExpenseShare" ADD CONSTRAINT "SharedExpenseShare_expenseId_eventId_fkey" FOREIGN KEY ("expenseId", "eventId") REFERENCES "SharedExpense"("id", "eventId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedExpenseShare" ADD CONSTRAINT "SharedExpenseShare_participantId_eventId_fkey" FOREIGN KEY ("participantId", "eventId") REFERENCES "SharedBudgetParticipant"("id", "eventId") ON DELETE NO ACTION ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- AddForeignKey
ALTER TABLE "SharedRepayment" ADD CONSTRAINT "SharedRepayment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedRepayment" ADD CONSTRAINT "SharedRepayment_fromId_eventId_fkey" FOREIGN KEY ("fromId", "eventId") REFERENCES "SharedBudgetParticipant"("id", "eventId") ON DELETE NO ACTION ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- AddForeignKey
ALTER TABLE "SharedRepayment" ADD CONSTRAINT "SharedRepayment_toId_eventId_fkey" FOREIGN KEY ("toId", "eventId") REFERENCES "SharedBudgetParticipant"("id", "eventId") ON DELETE NO ACTION ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- Keep monetary invariants enforceable outside the application as well.
ALTER TABLE "SharedExpense" ADD CONSTRAINT "SharedExpense_amount_check" CHECK ("amountCents" > 0 AND "amountCents" <= 100000000);
ALTER TABLE "SharedExpense" ADD CONSTRAINT "SharedExpense_description_check" CHECK (length(btrim("description")) > 0);
ALTER TABLE "SharedExpenseShare" ADD CONSTRAINT "SharedExpenseShare_amount_check" CHECK ("amountCents" >= 0);
ALTER TABLE "SharedRepayment" ADD CONSTRAINT "SharedRepayment_amount_check" CHECK ("amountCents" > 0 AND "amountCents" <= 100000000);
ALTER TABLE "SharedRepayment" ADD CONSTRAINT "SharedRepayment_parties_check" CHECK ("fromId" <> "toId");
ALTER TABLE "SharedBudgetParticipant" ADD CONSTRAINT "SharedBudgetParticipant_identity_check" CHECK ("userId" IS NULL OR "relativeId" IS NULL);
