-- DropForeignKey
ALTER TABLE "quote_items" DROP CONSTRAINT "quote_items_quoteId_fkey";

-- AlterTable: companies — 회사 정보 + 견적 기본 비율
ALTER TABLE "companies" ADD COLUMN     "bizNumber" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "rateDesign" DECIMAL(5,2) NOT NULL DEFAULT 2,
ADD COLUMN     "rateEmployment" DECIMAL(5,2) NOT NULL DEFAULT 1.39,
ADD COLUMN     "rateGeneralAdmin" DECIMAL(5,2) NOT NULL DEFAULT 5,
ADD COLUMN     "rateIndirectLabor" DECIMAL(5,2) NOT NULL DEFAULT 2,
ADD COLUMN     "rateIndirectMaterial" DECIMAL(5,2) NOT NULL DEFAULT 2,
ADD COLUMN     "rateIndustrialAcc" DECIMAL(5,2) NOT NULL DEFAULT 3.7,
ADD COLUMN     "rateMisc" DECIMAL(5,2) NOT NULL DEFAULT 5,
ADD COLUMN     "rateOtherExpense" DECIMAL(5,2) NOT NULL DEFAULT 2,
ADD COLUMN     "rateRetirement" DECIMAL(5,2) NOT NULL DEFAULT 2.3,
ADD COLUMN     "rateSafety" DECIMAL(5,2) NOT NULL DEFAULT 2.93,
ADD COLUMN     "rateSupervision" DECIMAL(5,2) NOT NULL DEFAULT 10,
ADD COLUMN     "rateVat" DECIMAL(5,2) NOT NULL DEFAULT 10,
ADD COLUMN     "representative" TEXT;

-- AlterTable: projects — 면적
ALTER TABLE "projects" ADD COLUMN     "area" DECIMAL(8,2);

-- AlterTable: quotes — v2 (1차 폐기 컬럼 제거 + v2 컬럼 추가)
ALTER TABLE "quotes" DROP COLUMN "designFee",
DROP COLUMN "indirectCost",
DROP COLUMN "managementFee",
ADD COLUMN     "amountInWords" TEXT,
ADD COLUMN     "applyDesign" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "applyEmployment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "applyGeneralAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "applyIndirectLabor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "applyIndirectMaterial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "applyIndustrialAcc" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "applyMisc" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "applyOtherExpense" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "applyRetirement" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "applySafety" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "applySupervision" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "area" DECIMAL(8,2),
ADD COLUMN     "rateDesign" DECIMAL(5,2) NOT NULL DEFAULT 2,
ADD COLUMN     "rateEmployment" DECIMAL(5,2) NOT NULL DEFAULT 1.39,
ADD COLUMN     "rateGeneralAdmin" DECIMAL(5,2) NOT NULL DEFAULT 5,
ADD COLUMN     "rateIndirectLabor" DECIMAL(5,2) NOT NULL DEFAULT 2,
ADD COLUMN     "rateIndirectMaterial" DECIMAL(5,2) NOT NULL DEFAULT 2,
ADD COLUMN     "rateIndustrialAcc" DECIMAL(5,2) NOT NULL DEFAULT 3.7,
ADD COLUMN     "rateMisc" DECIMAL(5,2) NOT NULL DEFAULT 5,
ADD COLUMN     "rateOtherExpense" DECIMAL(5,2) NOT NULL DEFAULT 2,
ADD COLUMN     "rateRetirement" DECIMAL(5,2) NOT NULL DEFAULT 2.3,
ADD COLUMN     "rateSafety" DECIMAL(5,2) NOT NULL DEFAULT 2.93,
ADD COLUMN     "rateSupervision" DECIMAL(5,2) NOT NULL DEFAULT 10,
ADD COLUMN     "rateVat" DECIMAL(5,2) NOT NULL DEFAULT 10,
ADD COLUMN     "terms" TEXT,
ADD COLUMN     "totalDesign" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalDirectExpense" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalDirectLabor" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalDirectMaterial" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalEmployment" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalExpense" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalFinal" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalGeneralAdmin" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalIndirectLabor" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalIndirectMaterial" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalIndustrialAcc" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalLabor" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalMaterial" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalMisc" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalOtherExpense" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalRetirement" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalRoundOff" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalSafety" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalSupervision" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalVat" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- DropTable: 1차 구현 quote_items 폐기
DROP TABLE "quote_items";

-- CreateTable: quote_line_items (공종별 세부 행)
CREATE TABLE "quote_line_items" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "workType" "WorkType" NOT NULL,
    "itemName" TEXT NOT NULL,
    "spec" TEXT,
    "unit" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "materialUnitPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "laborUnitPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "expenseUnitPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "materialCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "laborCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "expenseCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "quote_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable: quote_line_item_templates (회사 단위 마스터)
CREATE TABLE "quote_line_item_templates" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "workType" "WorkType" NOT NULL,
    "itemName" TEXT NOT NULL,
    "spec" TEXT,
    "unit" TEXT,
    "defaultQuantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "defaultMaterialPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "defaultLaborPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "defaultExpensePrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_line_item_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quote_line_items_quoteId_workType_orderIndex_idx" ON "quote_line_items"("quoteId", "workType", "orderIndex");

-- CreateIndex
CREATE INDEX "quote_line_item_templates_companyId_workType_orderIndex_idx" ON "quote_line_item_templates"("companyId", "workType", "orderIndex");

-- AddForeignKey
ALTER TABLE "quote_line_items" ADD CONSTRAINT "quote_line_items_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_line_item_templates" ADD CONSTRAINT "quote_line_item_templates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
