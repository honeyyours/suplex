-- ChecklistTemplate 폐기 + PhaseAdvice로 통합 (2026-04-26).
-- 사용 회사 0개, 데이터 손실 없음.

-- 1) PhaseAdvice에 requiresPhoto 추가 (옛 ChecklistTemplate.requiresPhoto 흡수)
ALTER TABLE "phase_advices" ADD COLUMN "requiresPhoto" BOOLEAN NOT NULL DEFAULT false;

-- 2) ProjectChecklist의 sourceTemplateId 컬럼·인덱스·FK 제거
ALTER TABLE "project_checklists" DROP CONSTRAINT IF EXISTS "project_checklists_sourceTemplateId_fkey";
DROP INDEX IF EXISTS "project_checklists_projectId_sourceTemplateId_idx";
ALTER TABLE "project_checklists" DROP COLUMN IF EXISTS "sourceTemplateId";

-- 3) ChecklistTemplate 테이블 자체 제거
DROP TABLE IF EXISTS "checklist_templates";
