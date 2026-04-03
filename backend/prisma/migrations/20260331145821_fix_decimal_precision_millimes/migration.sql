/*
  Warnings:

  - You are about to alter the column `contractFees` on the `companies` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,0)` to `Decimal(15,3)`.
  - You are about to alter the column `fg` on the `companies` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(12,3)`.
  - You are about to alter the column `fpac` on the `companies` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(12,3)`.
  - You are about to alter the column `fssr` on the `companies` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(12,3)`.
  - You are about to alter the column `capital` on the `quote_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,0)` to `Decimal(15,3)`.
  - You are about to alter the column `prime` on the `quote_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,0)` to `Decimal(15,3)`.
  - You are about to alter the column `primeNette` on the `quotes` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,0)` to `Decimal(15,3)`.
  - You are about to alter the column `frais` on the `quotes` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,0)` to `Decimal(15,3)`.
  - You are about to alter the column `taxes` on the `quotes` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,0)` to `Decimal(15,3)`.
  - You are about to alter the column `fpac` on the `quotes` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,0)` to `Decimal(15,3)`.
  - You are about to alter the column `fssr` on the `quotes` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,0)` to `Decimal(15,3)`.
  - You are about to alter the column `fg` on the `quotes` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,0)` to `Decimal(15,3)`.
  - You are about to alter the column `totalAPayer` on the `quotes` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,0)` to `Decimal(15,3)`.
  - You are about to alter the column `contractFees` on the `usage_fee_configs` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,0)` to `Decimal(15,3)`.
  - You are about to alter the column `fpac` on the `usage_fee_configs` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(12,3)`.
  - You are about to alter the column `fssr` on the `usage_fee_configs` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(12,3)`.
  - You are about to alter the column `fg` on the `usage_fee_configs` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(12,3)`.

*/
-- AlterTable
ALTER TABLE "companies" ALTER COLUMN "contractFees" SET DATA TYPE DECIMAL(15,3),
ALTER COLUMN "fg" SET DATA TYPE DECIMAL(12,3),
ALTER COLUMN "fpac" SET DATA TYPE DECIMAL(12,3),
ALTER COLUMN "fssr" SET DATA TYPE DECIMAL(12,3);

-- AlterTable
ALTER TABLE "quote_items" ALTER COLUMN "capital" SET DATA TYPE DECIMAL(15,3),
ALTER COLUMN "prime" SET DATA TYPE DECIMAL(15,3);

-- AlterTable
ALTER TABLE "quotes" ALTER COLUMN "primeNette" SET DATA TYPE DECIMAL(15,3),
ALTER COLUMN "frais" SET DATA TYPE DECIMAL(15,3),
ALTER COLUMN "taxes" SET DATA TYPE DECIMAL(15,3),
ALTER COLUMN "fpac" SET DATA TYPE DECIMAL(15,3),
ALTER COLUMN "fssr" SET DATA TYPE DECIMAL(15,3),
ALTER COLUMN "fg" SET DATA TYPE DECIMAL(15,3),
ALTER COLUMN "totalAPayer" SET DATA TYPE DECIMAL(15,3);

-- AlterTable
ALTER TABLE "usage_fee_configs" ALTER COLUMN "contractFees" SET DATA TYPE DECIMAL(15,3),
ALTER COLUMN "fpac" SET DATA TYPE DECIMAL(12,3),
ALTER COLUMN "fssr" SET DATA TYPE DECIMAL(12,3),
ALTER COLUMN "fg" SET DATA TYPE DECIMAL(12,3);
