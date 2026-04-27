-- Material.modelCode 컬럼 추가
-- APPLIANCE 전용 — 모델 품번 (예: "RF85R9013S8")
-- 분리 이전: brand 필드 한 곳에 "모델명 / 품번" 합쳐서 저장
-- 분리 이후: brand = 모델명, modelCode = 품번
-- 기존 데이터는 그대로 두고 (legacy), 신규 입력부터 분리 적용

ALTER TABLE "materials" ADD COLUMN "modelCode" TEXT;
