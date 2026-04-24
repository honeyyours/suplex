-- 마감재 템플릿/항목에 세부 그룹(subgroup) + 필수/옵션(essential) 추가

ALTER TABLE "material_templates" ADD COLUMN "subgroup" TEXT;
ALTER TABLE "material_templates" ADD COLUMN "essential" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "materials" ADD COLUMN "subgroup" TEXT;
ALTER TABLE "materials" ADD COLUMN "essential" BOOLEAN NOT NULL DEFAULT false;
