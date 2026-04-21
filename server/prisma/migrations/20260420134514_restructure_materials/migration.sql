/*
  Warnings:

  - You are about to drop the column `category` on the `materials` table. All the data in the column will be lost.
  - You are about to drop the column `space` on the `materials` table. All the data in the column will be lost.
  - You are about to drop the column `specCode` on the `materials` table. All the data in the column will be lost.
  - Added the required column `spaceGroup` to the `materials` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MaterialKind" AS ENUM ('FINISH', 'APPLIANCE');

-- DropIndex
DROP INDEX "materials_projectId_space_idx";

-- AlterTable
ALTER TABLE "materials" DROP COLUMN "category",
DROP COLUMN "space",
DROP COLUMN "specCode",
ADD COLUMN     "checked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "installed" BOOLEAN,
ADD COLUMN     "kind" "MaterialKind" NOT NULL DEFAULT 'FINISH',
ADD COLUMN     "orderIndex" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "productName" TEXT,
ADD COLUMN     "purchaseSource" TEXT,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "siteNotes" TEXT,
ADD COLUMN     "size" TEXT,
ADD COLUMN     "spaceGroup" TEXT NOT NULL,
ADD COLUMN     "spec" TEXT;

-- CreateTable
CREATE TABLE "material_templates" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "kind" "MaterialKind" NOT NULL DEFAULT 'FINISH',
    "spaceGroup" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "defaultSiteNotes" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "material_templates_companyId_kind_orderIndex_idx" ON "material_templates"("companyId", "kind", "orderIndex");

-- CreateIndex
CREATE INDEX "materials_projectId_kind_spaceGroup_idx" ON "materials"("projectId", "kind", "spaceGroup");

-- AddForeignKey
ALTER TABLE "material_templates" ADD CONSTRAINT "material_templates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
