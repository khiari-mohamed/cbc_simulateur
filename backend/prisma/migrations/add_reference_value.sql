-- Migration: Add referenceValue to PricingRule
-- Date: 2026-03-15
-- Description: Allow configuration of reference value (NEW_VALUE vs MARKET_VALUE) for each pricing rule

-- Step 1: Create enum for reference values
CREATE TYPE "ReferenceValue" AS ENUM ('NEW_VALUE', 'MARKET_VALUE');

-- Step 2: Add column to pricing_rules table
ALTER TABLE "pricing_rules" 
ADD COLUMN "reference_value" "ReferenceValue";

-- Step 3: Set default values based on guarantee type
-- VOL and INCENDIE use MARKET_VALUE by default
UPDATE "pricing_rules" pr
SET "reference_value" = 'MARKET_VALUE'
FROM "guarantees" g
WHERE pr."guarantee_id" = g."id"
AND g."code" IN ('VOL', 'INCENDIE', 'BG', 'INCENDIE_EMEUTES', 'DOMMAGES_EMEUTES');

-- TOUS_RISQUES_ZERO uses NEW_VALUE by default
UPDATE "pricing_rules" pr
SET "reference_value" = 'NEW_VALUE'
FROM "guarantees" g
WHERE pr."guarantee_id" = g."id"
AND g."code" IN ('TOUS_RISQUES_ZERO');

-- Step 4: Add index for better query performance
CREATE INDEX "idx_pricing_rules_reference_value" 
ON "pricing_rules"("reference_value") 
WHERE "reference_value" IS NOT NULL;

-- Step 5: Add comment
COMMENT ON COLUMN "pricing_rules"."reference_value" IS 
'Reference value used for calculation: NEW_VALUE (valeur à neuf) or MARKET_VALUE (valeur vénale)';
