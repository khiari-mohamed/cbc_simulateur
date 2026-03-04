/*
  Warnings:

  - The values [TOUS_RISQUES_1,TOUS_RISQUES_2,TOUS_RISQUES_4] on the enum `FormulaType` will be removed. If these variants are still used in the database, this will fail.
  - The `status` column on the `conventions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `franchiseRate` on the `simulations` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `Integer`.

*/
-- CreateEnum
CREATE TYPE "ConventionStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED');

-- AlterEnum
BEGIN;
CREATE TYPE "FormulaType_new" AS ENUM ('STANDARD', 'DOMMAGES_COLLISIONS', 'TOUS_RISQUES_0');
ALTER TABLE "convention_reduction_rules" ALTER COLUMN "formulaType" TYPE "FormulaType_new" USING ("formulaType"::text::"FormulaType_new");
ALTER TABLE "simulations" ALTER COLUMN "formulaType" TYPE "FormulaType_new" USING ("formulaType"::text::"FormulaType_new");
ALTER TABLE "pricing_rules" ALTER COLUMN "formulaType" TYPE "FormulaType_new" USING ("formulaType"::text::"FormulaType_new");
ALTER TYPE "FormulaType" RENAME TO "FormulaType_old";
ALTER TYPE "FormulaType_new" RENAME TO "FormulaType";
DROP TYPE "FormulaType_old";
COMMIT;

-- AlterTable
ALTER TABLE "conventions" DROP COLUMN "status",
ADD COLUMN     "status" "ConventionStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "simulations" ALTER COLUMN "franchiseRate" SET DATA TYPE INTEGER;

-- CreateIndex
CREATE INDEX "convention_reduction_rules_conventionId_companyId_guarantee_idx" ON "convention_reduction_rules"("conventionId", "companyId", "guaranteeId", "formulaType", "usageType", "metric", "isActive", "validFrom", "validTo");

-- CreateIndex
CREATE INDEX "convention_reduction_rules_conventionId_priority_createdAt_idx" ON "convention_reduction_rules"("conventionId", "priority", "createdAt");
