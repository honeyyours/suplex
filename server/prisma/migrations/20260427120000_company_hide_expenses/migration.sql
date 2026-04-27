-- Suplex: 회사 단위 지출관리 숨김 토글
ALTER TABLE "companies" ADD COLUMN "hideExpenses" BOOLEAN NOT NULL DEFAULT false;
