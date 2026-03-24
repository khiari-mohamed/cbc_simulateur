-- CreateTable
CREATE TABLE "guarantee_bundlings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "parentGuaranteeId" TEXT NOT NULL,
    "includedGuaranteeId" TEXT NOT NULL,
    "formulaType" "FormulaType",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guarantee_bundlings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "guarantee_bundlings_companyId_parentGuaranteeId_isActive_idx" ON "guarantee_bundlings"("companyId", "parentGuaranteeId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "guarantee_bundlings_companyId_parentGuaranteeId_includedGua_key" ON "guarantee_bundlings"("companyId", "parentGuaranteeId", "includedGuaranteeId", "formulaType");

-- AddForeignKey
ALTER TABLE "guarantee_bundlings" ADD CONSTRAINT "guarantee_bundlings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guarantee_bundlings" ADD CONSTRAINT "guarantee_bundlings_parentGuaranteeId_fkey" FOREIGN KEY ("parentGuaranteeId") REFERENCES "guarantees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guarantee_bundlings" ADD CONSTRAINT "guarantee_bundlings_includedGuaranteeId_fkey" FOREIGN KEY ("includedGuaranteeId") REFERENCES "guarantees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
