-- CreateEnum
CREATE TYPE "ComparisonStatus" AS ENUM ('queued', 'running', 'done', 'failed');

-- AlterTable
ALTER TABLE "Audit" ADD COLUMN     "comparisonGroupId" TEXT,
ADD COLUMN     "subjectDomain" TEXT;

-- CreateTable
CREATE TABLE "Competitor" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Competitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComparisonGroup" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "primaryAuditId" TEXT,
    "sharedPrompts" JSONB,
    "status" "ComparisonStatus" NOT NULL DEFAULT 'queued',
    "resultPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComparisonGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Competitor_projectId_idx" ON "Competitor"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Competitor_projectId_domain_key" ON "Competitor"("projectId", "domain");

-- CreateIndex
CREATE INDEX "ComparisonGroup_projectId_idx" ON "ComparisonGroup"("projectId");

-- CreateIndex
CREATE INDEX "Audit_comparisonGroupId_idx" ON "Audit"("comparisonGroupId");

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_comparisonGroupId_fkey" FOREIGN KEY ("comparisonGroupId") REFERENCES "ComparisonGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competitor" ADD CONSTRAINT "Competitor_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonGroup" ADD CONSTRAINT "ComparisonGroup_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
