-- 체크리스트 항목에 사진 첨부 필수 옵션 + 사진 소스에 CHECKLIST 추가
-- 사진 필수 항목은 사진 1장 이상 업로드 전에는 완료 처리 불가 (서버 검증)

-- 1. ProjectChecklist에 requiresPhoto 컬럼 추가
ALTER TABLE "project_checklists" ADD COLUMN "requiresPhoto" BOOLEAN NOT NULL DEFAULT false;

-- 2. PhotoSource enum에 CHECKLIST 값 추가 (Postgres 10+)
ALTER TYPE "PhotoSource" ADD VALUE 'CHECKLIST';
