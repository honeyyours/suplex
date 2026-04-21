-- 회계 시스템 재설계: ExpenseCategory enum 폐기 → AccountCode 마스터, ExpenseType 추가, 자동분류 룰 신규.
-- 기존 Expense 데이터는 사용자 동의 하에 전부 삭제 (테스트 데이터)

-- 0. 기존 Expense 모두 삭제 (사용자 합의)
DELETE FROM "expenses";

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('EXPENSE', 'INCOME', 'TRANSFER');

-- DropIndex
DROP INDEX "expenses_category_idx";

-- AlterTable
ALTER TABLE "expenses" DROP COLUMN "category",
ADD COLUMN     "accountCodeId" TEXT,
ADD COLUMN     "type" "ExpenseType" NOT NULL DEFAULT 'EXPENSE',
ADD COLUMN     "workCategory" TEXT;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "siteCode" TEXT;

-- DropEnum
DROP TYPE "ExpenseCategory";

-- CreateTable
CREATE TABLE "account_codes" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "groupName" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_category_rules" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "accountCodeId" TEXT,
    "siteCode" TEXT,
    "workCategory" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_category_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "account_codes_companyId_groupName_idx" ON "account_codes"("companyId", "groupName");

-- CreateIndex
CREATE UNIQUE INDEX "account_codes_companyId_code_key" ON "account_codes"("companyId", "code");

-- CreateIndex
CREATE INDEX "expense_category_rules_companyId_active_idx" ON "expense_category_rules"("companyId", "active");

-- CreateIndex
CREATE INDEX "expenses_accountCodeId_idx" ON "expenses"("accountCodeId");

-- CreateIndex
CREATE INDEX "expenses_type_idx" ON "expenses"("type");

-- CreateIndex
CREATE UNIQUE INDEX "projects_companyId_siteCode_key" ON "projects"("companyId", "siteCode");

-- AddForeignKey
ALTER TABLE "account_codes" ADD CONSTRAINT "account_codes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_codes" ADD CONSTRAINT "account_codes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_category_rules" ADD CONSTRAINT "expense_category_rules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_category_rules" ADD CONSTRAINT "expense_category_rules_accountCodeId_fkey" FOREIGN KEY ("accountCodeId") REFERENCES "account_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_category_rules" ADD CONSTRAINT "expense_category_rules_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_accountCodeId_fkey" FOREIGN KEY ("accountCodeId") REFERENCES "account_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
