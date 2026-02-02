-- AlterTable
ALTER TABLE "conventions" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "reductionDommagesCollision" DECIMAL(5,2) DEFAULT 1.0,
ADD COLUMN     "reductionIncendie" DECIMAL(5,2) DEFAULT 1.0,
ADD COLUMN     "reductionTousRisques" DECIMAL(5,2) DEFAULT 1.0,
ADD COLUMN     "reductionVol" DECIMAL(5,2) DEFAULT 1.0,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';
