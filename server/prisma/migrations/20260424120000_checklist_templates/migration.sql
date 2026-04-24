-- 회사별 체크리스트 템플릿 + 자동 활성화 출처 추적

CREATE TABLE "checklist_templates" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "ChecklistCategory" NOT NULL DEFAULT 'GENERAL',
    "phase" TEXT,
    "requiresPhoto" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "checklist_templates_companyId_phase_active_idx"
  ON "checklist_templates"("companyId", "phase", "active");

ALTER TABLE "checklist_templates"
  ADD CONSTRAINT "checklist_templates_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "project_checklists"
  ADD COLUMN "sourceTemplateId" TEXT;

CREATE INDEX "project_checklists_projectId_sourceTemplateId_idx"
  ON "project_checklists"("projectId", "sourceTemplateId");

ALTER TABLE "project_checklists"
  ADD CONSTRAINT "project_checklists_sourceTemplateId_fkey"
  FOREIGN KEY ("sourceTemplateId") REFERENCES "checklist_templates"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
