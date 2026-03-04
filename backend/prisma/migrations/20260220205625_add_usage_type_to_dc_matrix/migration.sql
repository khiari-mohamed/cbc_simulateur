/*
  Warnings:

  - A unique constraint covering the columns `[companyId,usageType,amount]` on the table `dc_matrix_capitals` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,usageType,minVv]` on the table `dc_matrix_vv_ranges` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `usageType` to the `dc_matrix_capitals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usageType` to the `dc_matrix_prices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usageType` to the `dc_matrix_vv_ranges` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "dc_matrix_capitals_companyId_amount_key";

-- DropIndex
DROP INDEX "dc_matrix_capitals_companyId_isActive_amount_order_idx";

-- DropIndex
DROP INDEX "dc_matrix_prices_companyId_vvRangeId_capitalId_idx";

-- DropIndex
DROP INDEX "dc_matrix_vv_ranges_companyId_isActive_minVv_maxVv_idx";

-- AlterTable: Add usageType with default value for existing rows
ALTER TABLE "dc_matrix_vv_ranges" ADD COLUMN "usageType" "UsageType";
UPDATE "dc_matrix_vv_ranges" SET "usageType" = 'PRIVATE_BUSINESS' WHERE "usageType" IS NULL;
ALTER TABLE "dc_matrix_vv_ranges" ALTER COLUMN "usageType" SET NOT NULL;

-- AlterTable: Add usageType with default value for existing rows
ALTER TABLE "dc_matrix_capitals" ADD COLUMN "usageType" "UsageType";
UPDATE "dc_matrix_capitals" SET "usageType" = 'PRIVATE_BUSINESS' WHERE "usageType" IS NULL;
ALTER TABLE "dc_matrix_capitals" ALTER COLUMN "usageType" SET NOT NULL;

-- AlterTable: Add usageType to prices, copying from linked vvRange
ALTER TABLE "dc_matrix_prices" ADD COLUMN "usageType" "UsageType";
UPDATE "dc_matrix_prices" p
SET "usageType" = r."usageType"
FROM "dc_matrix_vv_ranges" r
WHERE p."vvRangeId" = r.id;
ALTER TABLE "dc_matrix_prices" ALTER COLUMN "usageType" SET NOT NULL;

-- CreateIndex
CREATE INDEX "dc_matrix_capitals_companyId_usageType_isActive_order_idx" ON "dc_matrix_capitals"("companyId", "usageType", "isActive", "order");

-- CreateIndex
CREATE UNIQUE INDEX "dc_matrix_capitals_companyId_usageType_amount_key" ON "dc_matrix_capitals"("companyId", "usageType", "amount");

-- CreateIndex
CREATE INDEX "dc_matrix_prices_companyId_usageType_vvRangeId_capitalId_idx" ON "dc_matrix_prices"("companyId", "usageType", "vvRangeId", "capitalId");

-- CreateIndex
CREATE INDEX "dc_matrix_vv_ranges_companyId_usageType_isActive_minVv_maxV_idx" ON "dc_matrix_vv_ranges"("companyId", "usageType", "isActive", "minVv", "maxVv");

-- CreateIndex
CREATE UNIQUE INDEX "dc_matrix_vv_ranges_companyId_usageType_minVv_key" ON "dc_matrix_vv_ranges"("companyId", "usageType", "minVv");
