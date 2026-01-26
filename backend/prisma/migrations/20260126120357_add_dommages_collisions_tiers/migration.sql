-- AlterTable
ALTER TABLE "pricing_rules" ADD COLUMN     "basePremium" DECIMAL(12,2),
ADD COLUMN     "tierLevel" INTEGER,
ADD COLUMN     "tierRate" DECIMAL(12,6);
