-- 항목별 폼 매핑 + 맞춤 spec JSON + 공용부 동일 inherit + status 확장

-- MaterialStatus enum 확장 (Postgres ALTER TYPE ADD VALUE)
ALTER TYPE "MaterialStatus" ADD VALUE 'REUSED';
ALTER TYPE "MaterialStatus" ADD VALUE 'NOT_APPLICABLE';

-- Material 테이블
ALTER TABLE "materials" ADD COLUMN "formKey" TEXT;
ALTER TABLE "materials" ADD COLUMN "customSpec" JSONB;
ALTER TABLE "materials" ADD COLUMN "inheritFromMaterialId" TEXT;

CREATE INDEX "materials_inheritFromMaterialId_idx"
  ON "materials"("inheritFromMaterialId");

ALTER TABLE "materials"
  ADD CONSTRAINT "materials_inheritFromMaterialId_fkey"
  FOREIGN KEY ("inheritFromMaterialId") REFERENCES "materials"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- MaterialTemplate 테이블
ALTER TABLE "material_templates" ADD COLUMN "formKey" TEXT;
