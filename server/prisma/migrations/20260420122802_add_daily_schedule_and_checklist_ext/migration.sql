/*
  Warnings:

  - Added the required column `updatedAt` to the `project_checklists` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ChecklistCategory" AS ENUM ('GENERAL', 'CLIENT_REQUEST', 'DESIGN_TO_FIELD', 'TOUCH_UP', 'URGENT');

-- CreateEnum
CREATE TYPE "ScheduleChangeAction" AS ENUM ('ADD', 'UPDATE', 'DELETE', 'CONFIRM', 'UNCONFIRM');

-- DropIndex
DROP INDEX "project_checklists_projectId_phase_idx";

-- AlterTable
ALTER TABLE "project_checklists" ADD COLUMN     "category" "ChecklistCategory" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "completedById" TEXT,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "phase" DROP NOT NULL;

-- CreateTable
CREATE TABLE "daily_schedule_entries" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "category" TEXT,
    "content" TEXT NOT NULL,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" TIMESTAMP(3),
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_schedule_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_changes" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "entryId" TEXT,
    "action" "ScheduleChangeAction" NOT NULL,
    "oldContent" TEXT,
    "newContent" TEXT,
    "oldCategory" TEXT,
    "newCategory" TEXT,
    "changedById" TEXT NOT NULL,
    "changedByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_changes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_schedule_entries_projectId_date_idx" ON "daily_schedule_entries"("projectId", "date");

-- CreateIndex
CREATE INDEX "daily_schedule_entries_category_idx" ON "daily_schedule_entries"("category");

-- CreateIndex
CREATE INDEX "schedule_changes_projectId_createdAt_idx" ON "schedule_changes"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "project_checklists_projectId_isDone_idx" ON "project_checklists"("projectId", "isDone");

-- AddForeignKey
ALTER TABLE "project_checklists" ADD CONSTRAINT "project_checklists_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_checklists" ADD CONSTRAINT "project_checklists_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_schedule_entries" ADD CONSTRAINT "daily_schedule_entries_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_schedule_entries" ADD CONSTRAINT "daily_schedule_entries_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_schedule_entries" ADD CONSTRAINT "daily_schedule_entries_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_changes" ADD CONSTRAINT "schedule_changes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_changes" ADD CONSTRAINT "schedule_changes_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
