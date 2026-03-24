-- CreateTable
CREATE TABLE "franchise_values" (
    "id" TEXT NOT NULL,
    "value" DECIMAL(5,2) NOT NULL,
    "label" TEXT,
    "description" TEXT,
    "isStandard" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "franchise_values_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "franchise_values_value_key" ON "franchise_values"("value");
