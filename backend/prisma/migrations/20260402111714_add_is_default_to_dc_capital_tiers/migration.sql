-- AlterTable
ALTER TABLE "dc_capital_tiers" ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "companyId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "dc_capital_tiers_usageId_isDefault_isActive_idx" ON "dc_capital_tiers"("usageId", "isDefault", "isActive");
