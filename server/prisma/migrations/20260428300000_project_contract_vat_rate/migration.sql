-- 프로젝트 계약 부가세율 — 견적 확정 시 자동 채움
-- null 또는 0 = 부가세 별도, 10 = 10% 포함 (공급가액·부가세 분리 표시)

ALTER TABLE "projects" ADD COLUMN "contractVatRate" DECIMAL(5,2);
