-- 간편 견적 라인에 그룹 헤더 표시용 컬럼 추가
-- isGroup=true 인 라인은 헤더 역할 (수량/단가/금액 무시, 합계 제외)
ALTER TABLE "simple_quote_lines" ADD COLUMN "isGroup" BOOLEAN NOT NULL DEFAULT false;
