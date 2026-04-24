-- 회사별 키워드 → 공종 매핑 룰

CREATE TABLE "phase_keyword_rules" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "phase_keyword_rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "phase_keyword_rules_companyId_keyword_key"
  ON "phase_keyword_rules"("companyId", "keyword");

CREATE INDEX "phase_keyword_rules_companyId_active_idx"
  ON "phase_keyword_rules"("companyId", "active");

ALTER TABLE "phase_keyword_rules"
  ADD CONSTRAINT "phase_keyword_rules_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
