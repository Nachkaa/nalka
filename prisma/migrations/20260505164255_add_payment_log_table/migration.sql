-- CreateEnum
CREATE TYPE "PaymentLogAction" AS ENUM ('MARKED_PAID', 'MARKED_UNPAID', 'AMOUNT_CHANGED');

-- CreateTable
CREATE TABLE "PaymentLog" (
    "id" TEXT NOT NULL,
    "paymentEntryId" TEXT NOT NULL,
    "userId" TEXT,
    "action" "PaymentLogAction" NOT NULL,
    "previousPaidAt" TIMESTAMP(3),
    "newPaidAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentLog_paymentEntryId_idx" ON "PaymentLog"("paymentEntryId");

-- CreateIndex
CREATE INDEX "PaymentLog_userId_idx" ON "PaymentLog"("userId");

-- CreateIndex
CREATE INDEX "PaymentLog_createdAt_idx" ON "PaymentLog"("createdAt");

-- AddForeignKey
ALTER TABLE "PaymentLog" ADD CONSTRAINT "PaymentLog_paymentEntryId_fkey" FOREIGN KEY ("paymentEntryId") REFERENCES "PaymentEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentLog" ADD CONSTRAINT "PaymentLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
