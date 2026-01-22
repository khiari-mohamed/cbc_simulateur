/*
  Warnings:

  - The values [DOMMAGES_COLLISION] on the enum `FormulaType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `createdBy` on the `contracts` table. All the data in the column will be lost.
  - The `status` column on the `payments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `validatedBy` on the `quotes` table. All the data in the column will be lost.
  - Added the required column `createdById` to the `contracts` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- AlterEnum
BEGIN;
CREATE TYPE "FormulaType_new" AS ENUM ('STANDARD', 'DOMMAGES_COLLISIONS', 'TOUS_RISQUES_0');
ALTER TABLE "simulations" ALTER COLUMN "formulaType" TYPE "FormulaType_new" USING ("formulaType"::text::"FormulaType_new");
ALTER TABLE "pricing_rules" ALTER COLUMN "formulaType" TYPE "FormulaType_new" USING ("formulaType"::text::"FormulaType_new");
ALTER TYPE "FormulaType" RENAME TO "FormulaType_old";
ALTER TYPE "FormulaType_new" RENAME TO "FormulaType";
DROP TYPE "FormulaType_old";
COMMIT;

-- AlterTable
ALTER TABLE "contracts" DROP COLUMN "createdBy",
ADD COLUMN     "createdById" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "status",
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "pricing_rules" ADD COLUMN     "conventionId" TEXT;

-- AlterTable
ALTER TABLE "quotes" DROP COLUMN "validatedBy",
ADD COLUMN     "comparisonGroupId" TEXT,
ADD COLUMN     "pricingSnapshot" JSONB,
ADD COLUMN     "validatedById" TEXT,
ADD COLUMN     "validationRole" "Role";

-- AlterTable
ALTER TABLE "simulations" ADD COLUMN     "comparisonGroupId" TEXT;

-- CreateTable
CREATE TABLE "driver_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "licenseDate" TIMESTAMP(3) NOT NULL,
    "experienceYears" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_comparisons" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quote_comparisons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "driver_profiles_userId_key" ON "driver_profiles"("userId");

-- AddForeignKey
ALTER TABLE "driver_profiles" ADD CONSTRAINT "driver_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_comparisonGroupId_fkey" FOREIGN KEY ("comparisonGroupId") REFERENCES "quote_comparisons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_comparisonGroupId_fkey" FOREIGN KEY ("comparisonGroupId") REFERENCES "quote_comparisons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_conventionId_fkey" FOREIGN KEY ("conventionId") REFERENCES "conventions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_comparisons" ADD CONSTRAINT "quote_comparisons_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
