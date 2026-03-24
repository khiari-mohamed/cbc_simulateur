/*
  Warnings:

  - The values [CAPITAL_OVER_VV_PERCENT] on the enum `ReductionMetric` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ReductionMetric_new" AS ENUM ('NEW_VALUE', 'MARKET_VALUE', 'DC_CAPITAL');
ALTER TABLE "convention_reduction_rules" ALTER COLUMN "metric" TYPE "ReductionMetric_new" USING ("metric"::text::"ReductionMetric_new");
ALTER TYPE "ReductionMetric" RENAME TO "ReductionMetric_old";
ALTER TYPE "ReductionMetric_new" RENAME TO "ReductionMetric";
DROP TYPE "ReductionMetric_old";
COMMIT;
