-- 사용자 마지막 접속 시각 (베타 7-A 어드민 모니터링)
-- 인증된 모든 요청에서 1분 throttle로 자동 갱신.

ALTER TABLE "users" ADD COLUMN "lastSeenAt" TIMESTAMP(3);
