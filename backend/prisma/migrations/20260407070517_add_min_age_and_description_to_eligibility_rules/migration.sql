-- AlterTable
ALTER TABLE "formula_eligibility_age_rules" ADD COLUMN     "description" TEXT,
ADD COLUMN     "minAgeYears" INTEGER,
ALTER COLUMN "maxAgeYears" DROP NOT NULL;
