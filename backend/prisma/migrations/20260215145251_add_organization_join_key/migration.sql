/*
  Warnings:

  - Added the required column `joinKey` to the `client_organizations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "client_organizations" ADD COLUMN     "joinKey" TEXT NOT NULL;
