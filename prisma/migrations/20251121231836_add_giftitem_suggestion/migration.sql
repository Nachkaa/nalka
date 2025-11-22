-- AlterTable
ALTER TABLE "GiftItem" ADD COLUMN     "isSuggestion" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "suggestedByUserId" TEXT;

-- CreateIndex
CREATE INDEX "GiftItem_suggestedByUserId_idx" ON "GiftItem"("suggestedByUserId");

-- AddForeignKey
ALTER TABLE "GiftItem" ADD CONSTRAINT "GiftItem_suggestedByUserId_fkey" FOREIGN KEY ("suggestedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
