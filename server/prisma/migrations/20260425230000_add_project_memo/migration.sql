-- 프로젝트 메모 (Google Keep 패턴 다중 메모)
CREATE TABLE "project_memos" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_memos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "project_memos_projectId_orderIndex_idx" ON "project_memos"("projectId", "orderIndex");

ALTER TABLE "project_memos" ADD CONSTRAINT "project_memos_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
