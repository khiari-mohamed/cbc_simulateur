/*
  Warnings:

  - A unique constraint covering the columns `[systemRole]` on the table `guarantees` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('MANDATORY_RC', 'MANDATORY_VOL', 'MANDATORY_INCENDIE', 'MANDATORY_CAS', 'MANDATORY_PERSONNES_TRANSPORTEES', 'MANDATORY_ASSISTANCE', 'OPTIONAL_TOUS_RISQUES', 'OPTIONAL_DOMMAGES_COLLISIONS', 'OPTIONAL_BRIS_GLACES', 'OPTIONAL_CATASTROPHES_NATURELLES', 'OPTIONAL_DOMMAGES_EMEUTES', 'OPTIONAL_INCENDIE_EMEUTES', 'OPTIONAL_DEFENSE_RECOURS', 'OPTIONAL_ASSURANCE_CONDUCTEUR');

-- AlterTable
ALTER TABLE "guarantees" ADD COLUMN     "systemRole" "SystemRole";

-- CreateIndex
CREATE UNIQUE INDEX "guarantees_systemRole_key" ON "guarantees"("systemRole");
