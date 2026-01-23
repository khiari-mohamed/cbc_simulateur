/*
  Warnings:

  - You are about to drop the column `contractId` on the `payments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[orderId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orderId` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quoteId` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_contractId_fkey";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "contractId",
ADD COLUMN     "orderId" TEXT NOT NULL,
ADD COLUMN     "quoteId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "payments_orderId_key" ON "payments"("orderId");
