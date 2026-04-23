-- 이슈 탭 제거: 체크리스트와 기능이 겹쳐서 폐기
-- 이슈에 첨부된 사진까지 모두 삭제 (사용자 합의)

-- 1. 이슈에 연결된 사진 정리 (PhotoSource enum에서 ISSUE 제거 전 필수)
DELETE FROM "project_photos" WHERE "source" = 'ISSUE';

-- 2. issues 테이블 드롭
DROP TABLE "issues";

-- 3. 이슈 전용 enum 드롭
DROP TYPE "IssueType";
DROP TYPE "IssueUrgency";
DROP TYPE "IssueStatus";

-- 4. PhotoSource enum에서 ISSUE 값 제거 (Postgres는 enum 값 직접 삭제 불가 → 재생성)
ALTER TYPE "PhotoSource" RENAME TO "PhotoSource_old";
CREATE TYPE "PhotoSource" AS ENUM ('REPORT', 'MATERIAL_REQUEST');
ALTER TABLE "project_photos" ALTER COLUMN "source" TYPE "PhotoSource" USING "source"::text::"PhotoSource";
DROP TYPE "PhotoSource_old";
