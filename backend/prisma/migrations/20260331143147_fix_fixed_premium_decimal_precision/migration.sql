/*
  Warnings:

  - You are about to alter the column `fixedPremium` on the `pricing_rules` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,0)` to `Decimal(15,2)`.

*/
-- AlterTable
ALTER TABLE "pricing_rules" ALTER COLUMN "fixedPremium" SET DATA TYPE DECIMAL(15,2);
