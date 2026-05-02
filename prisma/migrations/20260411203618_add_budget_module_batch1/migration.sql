-- CreateEnum
CREATE TYPE "BudgetLineCategory" AS ENUM ('VENUE', 'FOOD_BEVERAGE', 'DESIGN_DECORATION', 'ENTERTAINMENT', 'LOGISTICS', 'GUEST_EXPERIENCE', 'COMMUNICATION', 'MISCELLANEOUS');

-- CreateEnum
CREATE TYPE "BudgetLineSourcingStatus" AS ENUM ('DRAFT', 'SOURCING', 'QUOTES_RECEIVED', 'SELECTED', 'BOOKED');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('AWAITING_RESPONSE', 'RECEIVED', 'SELECTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaymentEntryType" AS ENUM ('DEPOSIT', 'BALANCE', 'OTHER');

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "totalBudget" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetLine" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "category" "BudgetLineCategory" NOT NULL,
    "label" TEXT NOT NULL,
    "targetAmount" DECIMAL(12,2) NOT NULL,
    "estimatedAmount" DECIMAL(12,2),
    "sourcingStatus" "BudgetLineSourcingStatus" NOT NULL DEFAULT 'DRAFT',
    "internalNote" TEXT,
    "selectedQuoteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vendorType" TEXT,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "budgetLineId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'AWAITING_RESPONSE',
    "amount" DECIMAL(12,2),
    "scope" TEXT,
    "requestedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "internalNote" TEXT,
    "decisionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteAttachment" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentEntry" (
    "id" TEXT NOT NULL,
    "budgetLineId" TEXT NOT NULL,
    "quoteId" TEXT,
    "label" TEXT NOT NULL,
    "entryType" "PaymentEntryType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Budget_eventId_key" ON "Budget"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetLine_selectedQuoteId_key" ON "BudgetLine"("selectedQuoteId");

-- CreateIndex
CREATE INDEX "BudgetLine_budgetId_category_idx" ON "BudgetLine"("budgetId", "category");

-- CreateIndex
CREATE INDEX "BudgetLine_budgetId_sourcingStatus_idx" ON "BudgetLine"("budgetId", "sourcingStatus");

-- CreateIndex
CREATE INDEX "Vendor_eventId_name_idx" ON "Vendor"("eventId", "name");

-- CreateIndex
CREATE INDEX "Quote_budgetLineId_status_idx" ON "Quote"("budgetLineId", "status");

-- CreateIndex
CREATE INDEX "Quote_vendorId_status_idx" ON "Quote"("vendorId", "status");

-- CreateIndex
CREATE INDEX "QuoteAttachment_quoteId_idx" ON "QuoteAttachment"("quoteId");

-- CreateIndex
CREATE INDEX "PaymentEntry_budgetLineId_dueDate_idx" ON "PaymentEntry"("budgetLineId", "dueDate");

-- CreateIndex
CREATE INDEX "PaymentEntry_quoteId_idx" ON "PaymentEntry"("quoteId");

-- CreateIndex
CREATE INDEX "PaymentEntry_paidAt_idx" ON "PaymentEntry"("paidAt");

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLine" ADD CONSTRAINT "BudgetLine_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLine" ADD CONSTRAINT "BudgetLine_selectedQuoteId_fkey" FOREIGN KEY ("selectedQuoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_budgetLineId_fkey" FOREIGN KEY ("budgetLineId") REFERENCES "BudgetLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteAttachment" ADD CONSTRAINT "QuoteAttachment_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEntry" ADD CONSTRAINT "PaymentEntry_budgetLineId_fkey" FOREIGN KEY ("budgetLineId") REFERENCES "BudgetLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEntry" ADD CONSTRAINT "PaymentEntry_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
