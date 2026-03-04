/*
  Warnings:

  - You are about to drop the column `reductionRate` on the `dc_configs` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[companyId,usageType]` on the table `dc_configs` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `companyId` to the `dc_matrix_prices` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "dc_configs_companyId_key";

-- AlterTable
ALTER TABLE "dc_configs" DROP COLUMN "reductionRate",
ADD COLUMN     "discountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "dc_matrix_prices" ADD COLUMN     "companyId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "dc_configs_companyId_usageType_key" ON "dc_configs"("companyId", "usageType");

-- CreateIndex
CREATE INDEX "dc_matrix_prices_companyId_vvRangeId_capitalId_idx" ON "dc_matrix_prices"("companyId", "vvRangeId", "capitalId");
