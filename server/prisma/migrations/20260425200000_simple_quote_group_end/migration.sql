-- 그룹 종료 마커 컬럼
-- isGroup=true & isGroupEnd=true → 가는 구분선으로 표시 (그룹 영역 종료)
-- isGroup=true & isGroupEnd=false → 일반 그룹 시작 헤더
-- isGroup=false → 일반 라인
ALTER TABLE "simple_quote_lines" ADD COLUMN "isGroupEnd" BOOLEAN NOT NULL DEFAULT false;
