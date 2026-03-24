-- CreateTable
CREATE TABLE "bg_capital_limits" (
    "id" TEXT NOT NULL,
    "value" DECIMAL(15,0) NOT NULL,
    "label" TEXT,
    "description" TEXT,
    "isStandard" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bg_capital_limits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bg_capital_limits_value_key" ON "bg_capital_limits"("value");
