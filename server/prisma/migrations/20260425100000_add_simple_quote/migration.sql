-- CreateEnum
CREATE TYPE "SimpleQuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'SUPERSEDED');

-- CreateTable
CREATE TABLE "simple_quotes" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "SimpleQuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "quoteDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supplierName" TEXT NOT NULL,
    "supplierRegNo" TEXT,
    "supplierOwner" TEXT,
    "supplierAddress" TEXT,
    "supplierTel" TEXT,
    "supplierEmail" TEXT,
    "supplierLogoUrl" TEXT,
    "clientName" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "designFeeRate" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "roundAdjustment" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "templateKey" TEXT NOT NULL DEFAULT 'classic',
    "footerNotes" TEXT,
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "designFeeAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "vatAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "simple_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simple_quote_lines" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "itemName" TEXT NOT NULL,
    "spec" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit" TEXT,
    "unitPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "simple_quote_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "simple_quotes_projectId_createdAt_idx" ON "simple_quotes"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "simple_quote_lines_quoteId_orderIndex_idx" ON "simple_quote_lines"("quoteId", "orderIndex");

-- AddForeignKey
ALTER TABLE "simple_quotes" ADD CONSTRAINT "simple_quotes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simple_quote_lines" ADD CONSTRAINT "simple_quote_lines_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "simple_quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
