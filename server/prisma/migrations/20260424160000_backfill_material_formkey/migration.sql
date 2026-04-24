-- 기존 Material 항목의 formKey를 회사 MaterialTemplate에서 매칭해 backfill.
-- 매칭 키: (companyId, spaceGroup, itemName).

UPDATE "materials" AS m
SET "formKey" = t."formKey"
FROM "material_templates" AS t,
     "projects" AS p
WHERE m."formKey" IS NULL
  AND t."formKey" IS NOT NULL
  AND p."id" = m."projectId"
  AND t."companyId" = p."companyId"
  AND t."spaceGroup" = m."spaceGroup"
  AND t."itemName" = m."itemName";
