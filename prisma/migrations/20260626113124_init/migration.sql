-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('free', 'pro', 'agency');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('queued', 'running', 'done', 'failed');

-- CreateEnum
CREATE TYPE "AuditCategory" AS ENUM ('onpage', 'perf', 'links', 'authority', 'keywords', 'traffic', 'geo', 'content');

-- CreateEnum
CREATE TYPE "GeoEngine" AS ENUM ('chatgpt', 'perplexity', 'gemini', 'google_aio');

-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('positive', 'neutral', 'negative');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firebaseUid" TEXT,
    "email" TEXT NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'free',
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "encryptedRefreshToken" TEXT NOT NULL,
    "scopes" TEXT[],
    "ga4PropertyId" TEXT,
    "gscSiteUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Audit" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" "AuditStatus" NOT NULL DEFAULT 'queued',
    "overallScore" INTEGER,
    "costCents" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditResult" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "category" "AuditCategory" NOT NULL,
    "score" INTEGER,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "estTraffic" INTEGER,
    "onPageIssues" JSONB,
    "perf" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Keyword" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "volume" INTEGER,
    "difficulty" INTEGER,
    "cpc" DOUBLE PRECISION,
    "position" INTEGER,
    "intent" TEXT,
    "cluster" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Keyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeoRun" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "engine" "GeoEngine" NOT NULL,
    "prompt" TEXT NOT NULL,
    "mentioned" BOOLEAN NOT NULL DEFAULT false,
    "cited" BOOLEAN NOT NULL DEFAULT false,
    "prominence" INTEGER,
    "sentiment" "Sentiment",
    "competitorsNamed" JSONB,
    "engineVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeoRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "auditId" TEXT,
    "vendor" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "units" INTEGER NOT NULL DEFAULT 1,
    "costCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_firebaseUid_key" ON "User"("firebaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_userId_domain_key" ON "Project"("userId", "domain");

-- CreateIndex
CREATE INDEX "GoogleConnection_userId_idx" ON "GoogleConnection"("userId");

-- CreateIndex
CREATE INDEX "Audit_projectId_idx" ON "Audit"("projectId");

-- CreateIndex
CREATE INDEX "Audit_status_idx" ON "Audit"("status");

-- CreateIndex
CREATE INDEX "AuditResult_auditId_idx" ON "AuditResult"("auditId");

-- CreateIndex
CREATE UNIQUE INDEX "AuditResult_auditId_category_key" ON "AuditResult"("auditId", "category");

-- CreateIndex
CREATE INDEX "Page_auditId_idx" ON "Page"("auditId");

-- CreateIndex
CREATE INDEX "Keyword_auditId_idx" ON "Keyword"("auditId");

-- CreateIndex
CREATE INDEX "Keyword_term_idx" ON "Keyword"("term");

-- CreateIndex
CREATE INDEX "GeoRun_auditId_idx" ON "GeoRun"("auditId");

-- CreateIndex
CREATE INDEX "GeoRun_engine_idx" ON "GeoRun"("engine");

-- CreateIndex
CREATE INDEX "UsageEvent_userId_idx" ON "UsageEvent"("userId");

-- CreateIndex
CREATE INDEX "UsageEvent_auditId_idx" ON "UsageEvent"("auditId");

-- CreateIndex
CREATE INDEX "UsageEvent_vendor_idx" ON "UsageEvent"("vendor");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleConnection" ADD CONSTRAINT "GoogleConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditResult" ADD CONSTRAINT "AuditResult_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Keyword" ADD CONSTRAINT "Keyword_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeoRun" ADD CONSTRAINT "GeoRun_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageEvent" ADD CONSTRAINT "UsageEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageEvent" ADD CONSTRAINT "UsageEvent_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
