-- Material.sourceUrl 컬럼 추가
-- APPLIANCE 전용 — 사이즈를 발견한 출처 URL (제조사 공식 페이지 등)
-- 가전 검색 모달에서 자동 채움 시 spec.sources[0].url 저장

ALTER TABLE "materials" ADD COLUMN "sourceUrl" TEXT;
