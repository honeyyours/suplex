-- 슈퍼 어드민 플래그 추가 (베타 7번)
-- SaaS 운영자가 모든 회사·사용자 메타 관리 가능. 회사 무관.
-- 정책: 일반 가입 흐름으로 부여 X. server/scripts/seed-super-admin.js로 1회 시드.

ALTER TABLE "users" ADD COLUMN "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false;
