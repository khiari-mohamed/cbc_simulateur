-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "contractFees" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "pricing_rules" ADD COLUMN     "franchiseRate" INTEGER,
ADD COLUMN     "maxCapital" DECIMAL(12,2),
ADD COLUMN     "minCapital" DECIMAL(12,2),
ADD COLUMN     "ratePercentage" DECIMAL(12,6);
