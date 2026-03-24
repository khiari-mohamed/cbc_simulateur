/*
  Warnings:

  - You are about to drop the column `usageType` on the `convention_reduction_rules` table. All the data in the column will be lost.
  - You are about to drop the column `usageType` on the `dc_capital_tiers` table. All the data in the column will be lost.
  - You are about to drop the column `usageType` on the `dc_configs` table. All the data in the column will be lost.
  - You are about to drop the column `usageType` on the `dc_matrix_capitals` table. All the data in the column will be lost.
  - You are about to drop the column `usageType` on the `dc_matrix_prices` table. All the data in the column will be lost.
  - You are about to drop the column `usageType` on the `dc_matrix_vv_ranges` table. All the data in the column will be lost.
  - You are about to drop the column `usageType` on the `dc_progressive_tiers` table. All the data in the column will be lost.
  - You are about to drop the column `usageType` on the `pricing_rules` table. All the data in the column will be lost.
  - You are about to drop the column `usage` on the `simulations` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[companyId,usageId,minAmount]` on the table `dc_capital_tiers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,usageId]` on the table `dc_configs` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,usageId,amount]` on the table `dc_matrix_capitals` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,usageId,minVv]` on the table `dc_matrix_vv_ranges` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,usageId,tierNumber]` on the table `dc_progressive_tiers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `usageId` to the `dc_capital_tiers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usageId` to the `dc_configs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usageId` to the `dc_matrix_capitals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usageId` to the `dc_matrix_prices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usageId` to the `dc_matrix_vv_ranges` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usageId` to the `dc_progressive_tiers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usageId` to the `simulations` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReferenceValue" AS ENUM ('NEW_VALUE', 'MARKET_VALUE');

-- DropIndex
DROP INDEX "convention_reduction_rules_conventionId_companyId_guarantee_idx";

-- DropIndex
DROP INDEX "dc_capital_tiers_companyId_usageType_isActive_minAmount_idx";

-- DropIndex
DROP INDEX "dc_capital_tiers_companyId_usageType_minAmount_key";

-- DropIndex
DROP INDEX "dc_configs_companyId_usageType_isActive_idx";

-- DropIndex
DROP INDEX "dc_configs_companyId_usageType_key";

-- DropIndex
DROP INDEX "dc_matrix_capitals_companyId_usageType_amount_key";

-- DropIndex
DROP INDEX "dc_matrix_capitals_companyId_usageType_isActive_order_idx";

-- DropIndex
DROP INDEX "dc_matrix_prices_companyId_usageType_vvRangeId_capitalId_idx";

-- DropIndex
DROP INDEX "dc_matrix_vv_ranges_companyId_usageType_isActive_minVv_maxV_idx";

-- DropIndex
DROP INDEX "dc_matrix_vv_ranges_companyId_usageType_minVv_key";

-- DropIndex
DROP INDEX "dc_progressive_tiers_companyId_usageType_isActive_tierNumbe_idx";

-- DropIndex
DROP INDEX "dc_progressive_tiers_companyId_usageType_tierNumber_key";

-- AlterTable
ALTER TABLE "convention_reduction_rules" DROP COLUMN "usageType",
ADD COLUMN     "usageId" TEXT;

-- AlterTable
ALTER TABLE "dc_capital_tiers" DROP COLUMN "usageType",
ADD COLUMN     "usageId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "dc_configs" DROP COLUMN "usageType",
ADD COLUMN     "usageId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "dc_matrix_capitals" DROP COLUMN "usageType",
ADD COLUMN     "usageId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "dc_matrix_prices" DROP COLUMN "usageType",
ADD COLUMN     "usageId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "dc_matrix_vv_ranges" DROP COLUMN "usageType",
ADD COLUMN     "usageId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "dc_progressive_tiers" DROP COLUMN "usageType",
ADD COLUMN     "usageId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "pricing_rules" DROP COLUMN "usageType",
ADD COLUMN     "referenceValue" "ReferenceValue",
ADD COLUMN     "usageId" TEXT;

-- AlterTable
ALTER TABLE "simulations" DROP COLUMN "usage",
ADD COLUMN     "usageId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "UsageType";

-- CreateTable
CREATE TABLE "usage_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "nameAr" TEXT,
    "nameEn" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usage_types_code_key" ON "usage_types"("code");

-- CreateIndex
CREATE INDEX "convention_reduction_rules_conventionId_companyId_guarantee_idx" ON "convention_reduction_rules"("conventionId", "companyId", "guaranteeId", "formulaType", "usageId", "metric", "isActive", "validFrom", "validTo");

-- CreateIndex
CREATE INDEX "dc_capital_tiers_companyId_usageId_isActive_minAmount_idx" ON "dc_capital_tiers"("companyId", "usageId", "isActive", "minAmount");

-- CreateIndex
CREATE UNIQUE INDEX "dc_capital_tiers_companyId_usageId_minAmount_key" ON "dc_capital_tiers"("companyId", "usageId", "minAmount");

-- CreateIndex
CREATE INDEX "dc_configs_companyId_usageId_isActive_idx" ON "dc_configs"("companyId", "usageId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "dc_configs_companyId_usageId_key" ON "dc_configs"("companyId", "usageId");

-- CreateIndex
CREATE INDEX "dc_matrix_capitals_companyId_usageId_isActive_order_idx" ON "dc_matrix_capitals"("companyId", "usageId", "isActive", "order");

-- CreateIndex
CREATE UNIQUE INDEX "dc_matrix_capitals_companyId_usageId_amount_key" ON "dc_matrix_capitals"("companyId", "usageId", "amount");

-- CreateIndex
CREATE INDEX "dc_matrix_prices_companyId_usageId_vvRangeId_capitalId_idx" ON "dc_matrix_prices"("companyId", "usageId", "vvRangeId", "capitalId");

-- CreateIndex
CREATE INDEX "dc_matrix_vv_ranges_companyId_usageId_isActive_minVv_maxVv_idx" ON "dc_matrix_vv_ranges"("companyId", "usageId", "isActive", "minVv", "maxVv");

-- CreateIndex
CREATE UNIQUE INDEX "dc_matrix_vv_ranges_companyId_usageId_minVv_key" ON "dc_matrix_vv_ranges"("companyId", "usageId", "minVv");

-- CreateIndex
CREATE INDEX "dc_progressive_tiers_companyId_usageId_isActive_tierNumber_idx" ON "dc_progressive_tiers"("companyId", "usageId", "isActive", "tierNumber");

-- CreateIndex
CREATE UNIQUE INDEX "dc_progressive_tiers_companyId_usageId_tierNumber_key" ON "dc_progressive_tiers"("companyId", "usageId", "tierNumber");

-- AddForeignKey
ALTER TABLE "convention_reduction_rules" ADD CONSTRAINT "convention_reduction_rules_usageId_fkey" FOREIGN KEY ("usageId") REFERENCES "usage_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_usageId_fkey" FOREIGN KEY ("usageId") REFERENCES "usage_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_usageId_fkey" FOREIGN KEY ("usageId") REFERENCES "usage_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dc_capital_tiers" ADD CONSTRAINT "dc_capital_tiers_usageId_fkey" FOREIGN KEY ("usageId") REFERENCES "usage_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dc_progressive_tiers" ADD CONSTRAINT "dc_progressive_tiers_usageId_fkey" FOREIGN KEY ("usageId") REFERENCES "usage_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dc_matrix_vv_ranges" ADD CONSTRAINT "dc_matrix_vv_ranges_usageId_fkey" FOREIGN KEY ("usageId") REFERENCES "usage_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dc_matrix_capitals" ADD CONSTRAINT "dc_matrix_capitals_usageId_fkey" FOREIGN KEY ("usageId") REFERENCES "usage_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dc_matrix_prices" ADD CONSTRAINT "dc_matrix_prices_usageId_fkey" FOREIGN KEY ("usageId") REFERENCES "usage_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dc_configs" ADD CONSTRAINT "dc_configs_usageId_fkey" FOREIGN KEY ("usageId") REFERENCES "usage_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
