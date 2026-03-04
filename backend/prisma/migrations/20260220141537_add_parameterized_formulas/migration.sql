-- CreateTable
CREATE TABLE "dc_capital_tiers" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "minAmount" DECIMAL(12,2) NOT NULL,
    "maxAmount" DECIMAL(12,2),
    "step" DECIMAL(12,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dc_capital_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dc_progressive_tiers" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tierNumber" INTEGER NOT NULL,
    "tierRate" DECIMAL(12,6) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dc_progressive_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dc_matrix_vv_ranges" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "minVv" DECIMAL(12,2) NOT NULL,
    "maxVv" DECIMAL(12,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dc_matrix_vv_ranges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dc_matrix_capitals" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dc_matrix_capitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dc_matrix_prices" (
    "id" TEXT NOT NULL,
    "vvRangeId" TEXT NOT NULL,
    "capitalId" TEXT NOT NULL,
    "prime" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dc_matrix_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dc_configs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "usageType" "UsageType" NOT NULL,
    "useMatrix" BOOLEAN NOT NULL DEFAULT false,
    "franchise" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "minCapital" DECIMAL(12,2) NOT NULL DEFAULT 1000,
    "maxCapitalPercent" DECIMAL(5,2) NOT NULL DEFAULT 50,
    "maxCapitalAbsolute" DECIMAL(12,2) NOT NULL DEFAULT 100000,
    "basePremium" DECIMAL(12,2) NOT NULL DEFAULT 10,
    "reductionRate" DECIMAL(5,2) NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dc_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dc_progressive_tiers_companyId_tierNumber_key" ON "dc_progressive_tiers"("companyId", "tierNumber");

-- CreateIndex
CREATE UNIQUE INDEX "dc_matrix_capitals_companyId_amount_key" ON "dc_matrix_capitals"("companyId", "amount");

-- CreateIndex
CREATE UNIQUE INDEX "dc_matrix_prices_vvRangeId_capitalId_key" ON "dc_matrix_prices"("vvRangeId", "capitalId");

-- CreateIndex
CREATE UNIQUE INDEX "dc_configs_companyId_key" ON "dc_configs"("companyId");

-- AddForeignKey
ALTER TABLE "dc_capital_tiers" ADD CONSTRAINT "dc_capital_tiers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dc_progressive_tiers" ADD CONSTRAINT "dc_progressive_tiers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dc_matrix_vv_ranges" ADD CONSTRAINT "dc_matrix_vv_ranges_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dc_matrix_capitals" ADD CONSTRAINT "dc_matrix_capitals_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dc_matrix_prices" ADD CONSTRAINT "dc_matrix_prices_vvRangeId_fkey" FOREIGN KEY ("vvRangeId") REFERENCES "dc_matrix_vv_ranges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dc_matrix_prices" ADD CONSTRAINT "dc_matrix_prices_capitalId_fkey" FOREIGN KEY ("capitalId") REFERENCES "dc_matrix_capitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dc_configs" ADD CONSTRAINT "dc_configs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
