-- 회사별 D-N 룰 + 공정 어드바이스
CREATE TABLE "phase_deadline_rules" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "daysBefore" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "phase_deadline_rules_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "phase_deadline_rules_companyId_phase_key" ON "phase_deadline_rules"("companyId", "phase");
ALTER TABLE "phase_deadline_rules" ADD CONSTRAINT "phase_deadline_rules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "phase_advices" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "daysBefore" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "phase_advices_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "phase_advices_companyId_phase_idx" ON "phase_advices"("companyId", "phase");
ALTER TABLE "phase_advices" ADD CONSTRAINT "phase_advices_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
