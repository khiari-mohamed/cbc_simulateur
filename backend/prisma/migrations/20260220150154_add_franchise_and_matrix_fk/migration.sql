-- AlterTable
ALTER TABLE "dc_configs" ADD COLUMN     "franchise" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "dc_matrix_prices" ADD CONSTRAINT "dc_matrix_prices_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
