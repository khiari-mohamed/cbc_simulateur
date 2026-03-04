/*
  Warnings:

  - You are about to drop the column `companyId` on the `conventions` table. All the data in the column will be lost.
  - You are about to drop the column `reductionDommagesCollision` on the `conventions` table. All the data in the column will be lost.
  - You are about to drop the column `reductionIncendie` on the `conventions` table. All the data in the column will be lost.
  - You are about to drop the column `reductionTousRisques` on the `conventions` table. All the data in the column will be lost.
  - You are about to drop the column `reductionVol` on the `conventions` table. All the data in the column will be lost.
  - You are about to drop the `convention_guarantees` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_conventions` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `organizationId` to the `conventions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FormulaType" ADD VALUE 'TOUS_RISQUES_1';
ALTER TYPE "FormulaType" ADD VALUE 'TOUS_RISQUES_2';
ALTER TYPE "FormulaType" ADD VALUE 'TOUS_RISQUES_4';

-- DropForeignKey
ALTER TABLE "convention_guarantees" DROP CONSTRAINT "convention_guarantees_conventionId_fkey";

-- DropForeignKey
ALTER TABLE "convention_guarantees" DROP CONSTRAINT "convention_guarantees_guaranteeId_fkey";

-- DropForeignKey
ALTER TABLE "conventions" DROP CONSTRAINT "conventions_companyId_fkey";

-- DropForeignKey
ALTER TABLE "user_conventions" DROP CONSTRAINT "user_conventions_conventionId_fkey";

-- DropForeignKey
ALTER TABLE "user_conventions" DROP CONSTRAINT "user_conventions_userId_fkey";

-- AlterTable
ALTER TABLE "conventions" DROP COLUMN "companyId",
DROP COLUMN "reductionDommagesCollision",
DROP COLUMN "reductionIncendie",
DROP COLUMN "reductionTousRisques",
DROP COLUMN "reductionVol",
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "organizationId" TEXT;

-- DropTable
DROP TABLE "convention_guarantees";

-- DropTable
DROP TABLE "user_conventions";

-- CreateTable
CREATE TABLE "client_organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convention_companies" (
    "conventionId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convention_companies_pkey" PRIMARY KEY ("conventionId","companyId")
);

-- CreateTable
CREATE TABLE "convention_reduction_rules" (
    "id" TEXT NOT NULL,
    "conventionId" TEXT NOT NULL,
    "companyId" TEXT,
    "guaranteeCode" TEXT NOT NULL,
    "formulaType" "FormulaType",
    "metric" TEXT NOT NULL,
    "minValue" DECIMAL(12,2),
    "maxValue" DECIMAL(12,2),
    "minInclusive" BOOLEAN NOT NULL DEFAULT true,
    "maxInclusive" BOOLEAN NOT NULL DEFAULT false,
    "discountPercent" DECIMAL(5,2) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "convention_reduction_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_organizations_name_key" ON "client_organizations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "client_organizations_code_key" ON "client_organizations"("code");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "client_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conventions" ADD CONSTRAINT "conventions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "client_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convention_companies" ADD CONSTRAINT "convention_companies_conventionId_fkey" FOREIGN KEY ("conventionId") REFERENCES "conventions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convention_companies" ADD CONSTRAINT "convention_companies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convention_reduction_rules" ADD CONSTRAINT "convention_reduction_rules_conventionId_fkey" FOREIGN KEY ("conventionId") REFERENCES "conventions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convention_reduction_rules" ADD CONSTRAINT "convention_reduction_rules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
