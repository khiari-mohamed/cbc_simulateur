-- CreateTable
CREATE TABLE "convention_organizations" (
    "id" TEXT NOT NULL,
    "conventionId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "convention_organizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "convention_organizations_conventionId_idx" ON "convention_organizations"("conventionId");

-- CreateIndex
CREATE INDEX "convention_organizations_organizationId_idx" ON "convention_organizations"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "convention_organizations_conventionId_organizationId_key" ON "convention_organizations"("conventionId", "organizationId");

-- AddForeignKey
ALTER TABLE "convention_organizations" ADD CONSTRAINT "convention_organizations_conventionId_fkey" FOREIGN KEY ("conventionId") REFERENCES "conventions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convention_organizations" ADD CONSTRAINT "convention_organizations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "client_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
