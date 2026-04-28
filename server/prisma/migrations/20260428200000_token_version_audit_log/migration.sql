-- 토큰 무효화 + 감사 로그 (베타 7-A)
-- User.tokenVersion: JWT 강제 만료용. 멤버 제거/비번 변경 시 ++로 즉시 모든 세션 종료
-- AuditLog: 어드민·OWNER 주요 액션 추적

ALTER TABLE "users" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "audit_logs" (
  "id"         TEXT NOT NULL,
  "actorId"    TEXT NOT NULL,
  "actorType"  TEXT NOT NULL,
  "companyId"  TEXT,
  "action"     TEXT NOT NULL,
  "targetType" TEXT,
  "targetId"   TEXT,
  "metadata"   JSONB,
  "ip"         TEXT,
  "userAgent"  TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");
CREATE INDEX "audit_logs_companyId_idx" ON "audit_logs"("companyId");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
