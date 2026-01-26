-- AlterTable Company - Add missing fields
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "contractFees" DECIMAL(12,2);
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "fpac" DECIMAL(12,2) DEFAULT 0.5;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "fssr" DECIMAL(12,2) DEFAULT 0.3;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "fg" DECIMAL(12,2) DEFAULT 3.0;

-- Update existing companies
UPDATE "companies" SET "contractFees" = 30.00 WHERE "code" = 'LLOYD';
UPDATE "companies" SET "contractFees" = 20.00 WHERE "code" = 'AMANA';
