-- AlterTable: ProjectMemo에 tag 추가 (자유 문자열, null 허용 — 일반/회고/AS/피드백)
ALTER TABLE "project_memos" ADD COLUMN "tag" TEXT;

-- CreateIndex: tag 필터링 빠르게
CREATE INDEX "project_memos_projectId_tag_idx" ON "project_memos"("projectId", "tag");
