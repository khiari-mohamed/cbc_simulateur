/*
  Warnings:

  - You are about to alter the column `contractFees` on the `companies` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(15,0)`.
  - You are about to alter the column `deliveryFee` on the `contracts` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(15,0)`.
  - You are about to alter the column `minAmount` on the `dc_capital_tiers` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(15,0)`.
  - You are about to alter the column `maxAmount` on the `dc_capital_tiers` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(15,0)`.
  - You are about to alter the column `step` on the `dc_capital_tiers` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(15,0)`.
  - You are about to alter the column `minCapital` on the `dc_configs` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(15,0)`.
  - You are about to alter the column `maxCapitalAbsolute` on the `dc_configs` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(15,0)`.
  - You are about to alter the column `basePremium` on the `dc_configs` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(15,0)`.
  - You are about to alter the column `amount` on the `dc_matrix_capitals` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(15,0)`.
  - You are about to alter the column `prime` on the `dc_matrix_prices` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(15,0)`.
  - You are about to alter the column `minVv` on the `dc_matrix_vv_ranges` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(15,0)`.
  - You are about to alter the column `maxVv` on the `dc_matrix_vv_ranges` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(15,0)`.
  - You are about to alter the column `amount` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(15,0)`.
  - You are about to alter the column `fixedPremium` on the `pricing_rules` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(15,0)`.
  - You are about to alter the column `maxCapital` on the `pricing_rules` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(15,0)`.
  - You are about to alter the column `minCapital` on the `pricing_rules` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(15,0)`.
  - You are about to alter the column `basePremium` on the `pricing_rules` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(15,0)`.
  - You are about to alter the column `maxMarketValue` on the `pricing_rules` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(15,0)`.
  - You are about to alter the column `minMarketValue` on the `pricing_rules` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(15,0)`.
  - You are about to alter the column `capital` on the `quote_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(15,0)`.
  - You are about to alter the column `prime` on the `quote_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(15,0)`.
  - You are about to alter the column `primeNette` on the `quotes` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(15,0)`.
  - You are about to alter the column `frais` on the `quotes` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(15,0)`.
  - You are about to alter the column `taxes` on the `quotes` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(15,0)`.
  - You are about to alter the column `fpac` on the `quotes` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(15,0)`.
  - You are about to alter the column `fssr` on the `quotes` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(15,0)`.
  - You are about to alter the column `fg` on the `quotes` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(15,0)`.
  - You are about to alter the column `totalAPayer` on the `quotes` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(15,0)`.
  - You are about to alter the column `customValue` on the `simulation_guarantees` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(15,0)`.
  - You are about to alter the column `dcCapital` on the `simulations` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(15,0)`.
  - You are about to alter the column `newValue` on the `vehicles` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(15,0)`.
  - You are about to alter the column `marketValue` on the `vehicles` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(15,0)`.

*/
-- AlterTable
ALTER TABLE "companies" ALTER COLUMN "contractFees" SET DATA TYPE DECIMAL(15,0);

-- AlterTable
ALTER TABLE "contracts" ALTER COLUMN "deliveryFee" SET DATA TYPE DECIMAL(15,0);

-- AlterTable
ALTER TABLE "dc_capital_tiers" ALTER COLUMN "minAmount" SET DATA TYPE DECIMAL(15,0),
ALTER COLUMN "maxAmount" SET DATA TYPE DECIMAL(15,0),
ALTER COLUMN "step" SET DATA TYPE DECIMAL(15,0);

-- AlterTable
ALTER TABLE "dc_configs" ALTER COLUMN "minCapital" SET DATA TYPE DECIMAL(15,0),
ALTER COLUMN "maxCapitalAbsolute" SET DATA TYPE DECIMAL(15,0),
ALTER COLUMN "basePremium" SET DATA TYPE DECIMAL(15,0);

-- AlterTable
ALTER TABLE "dc_matrix_capitals" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(15,0);

-- AlterTable
ALTER TABLE "dc_matrix_prices" ALTER COLUMN "prime" SET DATA TYPE DECIMAL(15,0);

-- AlterTable
ALTER TABLE "dc_matrix_vv_ranges" ALTER COLUMN "minVv" SET DATA TYPE DECIMAL(15,0),
ALTER COLUMN "maxVv" SET DATA TYPE DECIMAL(15,0);

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(15,0);

-- AlterTable
ALTER TABLE "pricing_rules" ALTER COLUMN "fixedPremium" SET DATA TYPE DECIMAL(15,0),
ALTER COLUMN "maxCapital" SET DATA TYPE DECIMAL(15,0),
ALTER COLUMN "minCapital" SET DATA TYPE DECIMAL(15,0),
ALTER COLUMN "basePremium" SET DATA TYPE DECIMAL(15,0),
ALTER COLUMN "maxMarketValue" SET DATA TYPE DECIMAL(15,0),
ALTER COLUMN "minMarketValue" SET DATA TYPE DECIMAL(15,0);

-- AlterTable
ALTER TABLE "quote_items" ALTER COLUMN "capital" SET DATA TYPE DECIMAL(15,0),
ALTER COLUMN "prime" SET DATA TYPE DECIMAL(15,0);

-- AlterTable
ALTER TABLE "quotes" ALTER COLUMN "primeNette" SET DATA TYPE DECIMAL(15,0),
ALTER COLUMN "frais" SET DATA TYPE DECIMAL(15,0),
ALTER COLUMN "taxes" SET DATA TYPE DECIMAL(15,0),
ALTER COLUMN "fpac" SET DATA TYPE DECIMAL(15,0),
ALTER COLUMN "fssr" SET DATA TYPE DECIMAL(15,0),
ALTER COLUMN "fg" SET DATA TYPE DECIMAL(15,0),
ALTER COLUMN "totalAPayer" SET DATA TYPE DECIMAL(15,0);

-- AlterTable
ALTER TABLE "simulation_guarantees" ALTER COLUMN "customValue" SET DATA TYPE DECIMAL(15,0);

-- AlterTable
ALTER TABLE "simulations" ALTER COLUMN "dcCapital" SET DATA TYPE DECIMAL(15,0);

-- AlterTable
ALTER TABLE "vehicles" ALTER COLUMN "newValue" SET DATA TYPE DECIMAL(15,0),
ALTER COLUMN "marketValue" SET DATA TYPE DECIMAL(15,0);
