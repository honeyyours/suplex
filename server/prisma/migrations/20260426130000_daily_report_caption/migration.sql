-- DailyReport에 한 줄 캡션 컬럼 추가 (카톡 보고 메시지에 사용).
-- 기존 memo / nextDayPlan은 deprecated이지만 데이터 호환성 위해 컬럼 유지.
ALTER TABLE "daily_reports" ADD COLUMN "caption" TEXT;
