/*
  Warnings:

  - The values [PRIVATE] on the enum `UsageType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('HOME_DELIVERY', 'AGENCY_PICKUP');

-- AlterEnum
BEGIN;
CREATE TYPE "UsageType_new" AS ENUM ('PRIVATE_BUSINESS', 'COMMERCIAL', 'TAXI', 'RENTAL');
ALTER TABLE "simulations" ALTER COLUMN "usage" TYPE "UsageType_new" USING ("usage"::text::"UsageType_new");
ALTER TABLE "pricing_rules" ALTER COLUMN "usageType" TYPE "UsageType_new" USING ("usageType"::text::"UsageType_new");
ALTER TYPE "UsageType" RENAME TO "UsageType_old";
ALTER TYPE "UsageType_new" RENAME TO "UsageType";
DROP TYPE "UsageType_old";
COMMIT;

-- AlterTable
ALTER TABLE "contracts" ADD COLUMN     "deliveryFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "deliveryType" "DeliveryType" NOT NULL DEFAULT 'AGENCY_PICKUP';

-- AlterTable
ALTER TABLE "quotes" ADD COLUMN     "modificationNote" TEXT,
ADD COLUMN     "rejectionReason" TEXT;

-- AlterTable
ALTER TABLE "simulations" ADD COLUMN     "bgLimit" INTEGER,
ADD COLUMN     "dcCapital" DECIMAL(12,2),
ADD COLUMN     "franchiseRate" DECIMAL(5,2);
