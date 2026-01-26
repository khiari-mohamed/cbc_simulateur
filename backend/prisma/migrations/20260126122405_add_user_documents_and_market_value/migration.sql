-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_quoteId_fkey";

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "userId" TEXT,
ALTER COLUMN "quoteId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "pricing_rules" ADD COLUMN     "maxMarketValue" DECIMAL(12,2),
ADD COLUMN     "minMarketValue" DECIMAL(12,2);

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
