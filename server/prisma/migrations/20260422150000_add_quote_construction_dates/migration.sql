-- AlterTable: Quote에 착공/준공일 별도 필드 추가 (견적서 PDF 명시용)
-- Project의 startDate/expectedEndDate는 "캘린더 시작/마감" 의미로 재정의되며,
-- 견적서에 명시할 정식 착공/준공일은 Quote 단위로 별도 입력받음
ALTER TABLE "quotes" ADD COLUMN "constructionStartDate" DATE;
ALTER TABLE "quotes" ADD COLUMN "constructionEndDate" DATE;
