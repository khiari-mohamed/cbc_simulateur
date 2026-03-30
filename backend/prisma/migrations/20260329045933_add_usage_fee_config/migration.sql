-- CreateTable
CREATE TABLE "usage_fee_configs" (
    "id" TEXT NOT NULL,
    "usageId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contractFees" DECIMAL(15,0) NOT NULL,
    "fpac" DECIMAL(12,2) NOT NULL,
    "fssr" DECIMAL(12,2) NOT NULL,
    "fg" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_fee_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "usage_fee_configs_usageId_idx" ON "usage_fee_configs"("usageId");

-- CreateIndex
CREATE INDEX "usage_fee_configs_companyId_idx" ON "usage_fee_configs"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "usage_fee_configs_usageId_companyId_key" ON "usage_fee_configs"("usageId", "companyId");

-- AddForeignKey
ALTER TABLE "usage_fee_configs" ADD CONSTRAINT "usage_fee_configs_usageId_fkey" FOREIGN KEY ("usageId") REFERENCES "usage_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_fee_configs" ADD CONSTRAINT "usage_fee_configs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
