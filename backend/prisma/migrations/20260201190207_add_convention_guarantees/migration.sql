-- CreateTable
CREATE TABLE "convention_guarantees" (
    "conventionId" TEXT NOT NULL,
    "guaranteeId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convention_guarantees_pkey" PRIMARY KEY ("conventionId","guaranteeId")
);

-- AddForeignKey
ALTER TABLE "convention_guarantees" ADD CONSTRAINT "convention_guarantees_conventionId_fkey" FOREIGN KEY ("conventionId") REFERENCES "conventions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convention_guarantees" ADD CONSTRAINT "convention_guarantees_guaranteeId_fkey" FOREIGN KEY ("guaranteeId") REFERENCES "guarantees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
