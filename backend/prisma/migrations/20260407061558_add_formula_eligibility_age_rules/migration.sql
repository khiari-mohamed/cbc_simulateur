-- CreateTable
CREATE TABLE "formula_eligibility_age_rules" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "usageId" TEXT NOT NULL,
    "formulaType" "FormulaType" NOT NULL,
    "maxAgeYears" INTEGER NOT NULL CHECK ("maxAgeYears" >= 1),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "formula_eligibility_age_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "formula_eligibility_age_rules_companyId_usageId_formulaType_idx" ON "formula_eligibility_age_rules"("companyId", "usageId", "formulaType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "formula_eligibility_age_rules_companyId_usageId_formulaType_key" ON "formula_eligibility_age_rules"("companyId", "usageId", "formulaType");

-- AddForeignKey
ALTER TABLE "formula_eligibility_age_rules" ADD CONSTRAINT "formula_eligibility_age_rules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula_eligibility_age_rules" ADD CONSTRAINT "formula_eligibility_age_rules_usageId_fkey" FOREIGN KEY ("usageId") REFERENCES "usage_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
