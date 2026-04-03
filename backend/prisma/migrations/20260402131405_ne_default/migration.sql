/*
  Warnings:

  - You are about to drop the column `isDefault` on the `dc_capital_tiers` table. All the data in the column will be lost.
  - Made the column `companyId` on table `dc_capital_tiers` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "dc_capital_tiers_usageId_isDefault_isActive_idx";

-- AlterTable
ALTER TABLE "dc_capital_tiers" DROP COLUMN "isDefault",
ALTER COLUMN "companyId" SET NOT NULL;
