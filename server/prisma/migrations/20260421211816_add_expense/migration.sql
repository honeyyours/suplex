-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('MATERIAL', 'LABOR', 'EQUIPMENT', 'TRANSPORT', 'SUBCONTRACT', 'PERMIT', 'RENT', 'MISC');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'BANK_TRANSFER', 'OTHER');

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT,
    "date" DATE NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "vendor" TEXT,
    "category" "ExpenseCategory" NOT NULL DEFAULT 'MISC',
    "description" TEXT,
    "paymentMethod" "PaymentMethod",
    "receiptUrl" TEXT,
    "purchaseOrderId" TEXT,
    "importedFrom" TEXT,
    "rawText" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "expenses_companyId_date_idx" ON "expenses"("companyId", "date");

-- CreateIndex
CREATE INDEX "expenses_projectId_date_idx" ON "expenses"("projectId", "date");

-- CreateIndex
CREATE INDEX "expenses_category_idx" ON "expenses"("category");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
