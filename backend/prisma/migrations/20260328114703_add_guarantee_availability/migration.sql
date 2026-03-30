-- CreateEnum
CREATE TYPE "GuaranteeAvailabilityStatus" AS ENUM ('GRATUIT', 'NON_ACCORDEE', 'DEFAULT');

-- CreateTable
CREATE TABLE "guarantee_availabilities" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "guaranteeId" TEXT NOT NULL,
    "formulaType" "FormulaType",
    "status" "GuaranteeAvailabilityStatus" NOT NULL DEFAULT 'DEFAULT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guarantee_availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "guarantee_availabilities_companyId_guaranteeId_isActive_idx" ON "guarantee_availabilities"("companyId", "guaranteeId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "guarantee_availabilities_companyId_guaranteeId_formulaType_key" ON "guarantee_availabilities"("companyId", "guaranteeId", "formulaType");

-- AddForeignKey
ALTER TABLE "guarantee_availabilities" ADD CONSTRAINT "guarantee_availabilities_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guarantee_availabilities" ADD CONSTRAINT "guarantee_availabilities_guaranteeId_fkey" FOREIGN KEY ("guaranteeId") REFERENCES "guarantees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
