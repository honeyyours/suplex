-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'FINAL');

-- CreateEnum
CREATE TYPE "WorkType" AS ENUM ('START', 'DEMOLITION', 'PLUMBING', 'GAS', 'ELECTRIC', 'FIRE', 'CARPENTRY', 'TILE', 'BATHROOM', 'PAINTING', 'FILM', 'WALLPAPER', 'FURNITURE', 'FLOORING', 'FINISHING');

-- CreateTable
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "siteAddress" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "validUntil" DATE,
    "notes" TEXT,
    "indirectCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "managementFee" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "designFee" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalDirect" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalSupply" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_items" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "workType" "WorkType" NOT NULL,
    "materialCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "laborCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "quote_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quotes_projectId_createdAt_idx" ON "quotes"("projectId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "quote_items_quoteId_workType_key" ON "quote_items"("quoteId", "workType");

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
