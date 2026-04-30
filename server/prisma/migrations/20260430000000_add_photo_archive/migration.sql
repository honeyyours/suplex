-- 사진 외부 보관(Partial Archive) 지원
-- 프로젝트 사진을 외부로 export 후 클라우드에서 영구 제거하는 기능을 위한 컬럼.
-- - projects.photosArchivedAt: 마지막 보관 실행 시각 (UI 배지용)
-- - project_photos.publicId / task_photos.publicId: Cloudinary 삭제 시 안정적으로 사용
--   (기존 행은 NULL — purge 시 URL 파싱 fallback)

ALTER TABLE "projects" ADD COLUMN "photosArchivedAt" TIMESTAMP(3);
ALTER TABLE "project_photos" ADD COLUMN "publicId" TEXT;
ALTER TABLE "task_photos" ADD COLUMN "publicId" TEXT;
