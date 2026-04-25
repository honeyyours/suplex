-- 간편 견적 부가세 기본값을 10 → 0으로
-- (기본은 "부가세 별도" 안내문 + 부가세 미적용. 사용자가 필요 시 입력)
ALTER TABLE "simple_quotes" ALTER COLUMN "vatRate" SET DEFAULT 0;
