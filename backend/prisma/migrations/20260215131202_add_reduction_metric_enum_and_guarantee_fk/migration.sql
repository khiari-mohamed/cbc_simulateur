/*
  Warnings:

  - You are about to drop the column `guaranteeCode` on the `convention_reduction_rules` table. All the data in the column will be lost.
  - Added the required column `guaranteeId` to the `convention_reduction_rules` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `metric` on the `convention_reduction_rules` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ReductionMetric" AS ENUM ('NEW_VALUE', 'MARKET_VALUE', 'DC_CAPITAL', 'CAPITAL_OVER_VV_PERCENT');

-- AlterTable
ALTER TABLE "convention_reduction_rules" DROP COLUMN "guaranteeCode",
ADD COLUMN     "guaranteeId" TEXT NOT NULL,
ADD COLUMN     "usageType" "UsageType",
DROP COLUMN "metric",
ADD COLUMN     "metric" "ReductionMetric" NOT NULL;

-- AddForeignKey
ALTER TABLE "convention_reduction_rules" ADD CONSTRAINT "convention_reduction_rules_guaranteeId_fkey" FOREIGN KEY ("guaranteeId") REFERENCES "guarantees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
