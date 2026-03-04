/*
  Warnings:

  - A unique constraint covering the columns `[companyId,usageType,minAmount]` on the table `dc_capital_tiers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,usageType,tierNumber]` on the table `dc_progressive_tiers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `usageType` to the `dc_capital_tiers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usageType` to the `dc_progressive_tiers` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "dc_progressive_tiers_companyId_tierNumber_key";

-- AlterTable
ALTER TABLE "dc_capital_tiers" ADD COLUMN     "usageType" "UsageType" NOT NULL;

-- AlterTable
ALTER TABLE "dc_progressive_tiers" ADD COLUMN     "usageType" "UsageType" NOT NULL;

-- CreateIndex
CREATE INDEX "dc_capital_tiers_companyId_usageType_isActive_minAmount_idx" ON "dc_capital_tiers"("companyId", "usageType", "isActive", "minAmount");

-- CreateIndex
CREATE UNIQUE INDEX "dc_capital_tiers_companyId_usageType_minAmount_key" ON "dc_capital_tiers"("companyId", "usageType", "minAmount");

-- CreateIndex
CREATE INDEX "dc_configs_companyId_usageType_isActive_idx" ON "dc_configs"("companyId", "usageType", "isActive");

-- CreateIndex
CREATE INDEX "dc_matrix_capitals_companyId_isActive_amount_order_idx" ON "dc_matrix_capitals"("companyId", "isActive", "amount", "order");

-- CreateIndex
CREATE INDEX "dc_matrix_vv_ranges_companyId_isActive_minVv_maxVv_idx" ON "dc_matrix_vv_ranges"("companyId", "isActive", "minVv", "maxVv");

-- CreateIndex
CREATE INDEX "dc_progressive_tiers_companyId_usageType_isActive_tierNumbe_idx" ON "dc_progressive_tiers"("companyId", "usageType", "isActive", "tierNumber");

-- CreateIndex
CREATE UNIQUE INDEX "dc_progressive_tiers_companyId_usageType_tierNumber_key" ON "dc_progressive_tiers"("companyId", "usageType", "tierNumber");
