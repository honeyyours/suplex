-- 가전 규격 DB (글로벌, 회사 공유)
CREATE TABLE "appliance_specs" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "modelCode" TEXT NOT NULL,
    "modelAliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "productName" TEXT NOT NULL,
    "widthMm" INTEGER NOT NULL,
    "heightMm" INTEGER NOT NULL,
    "depthMm" INTEGER NOT NULL,
    "hingeOpenWidthMm" INTEGER,
    "ventTopMm" INTEGER,
    "ventSideMm" INTEGER,
    "ventBackMm" INTEGER,
    "doorType" TEXT,
    "capacityL" INTEGER,
    "builtIn" BOOLEAN NOT NULL DEFAULT false,
    "releaseYear" INTEGER,
    "discontinued" BOOLEAN NOT NULL DEFAULT false,
    "sources" JSONB NOT NULL DEFAULT '[]',
    "consensusCount" INTEGER NOT NULL DEFAULT 0,
    "verifyStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "lastVerifiedAt" TIMESTAMP(3),
    "correctedById" TEXT,
    "correctedAt" TIMESTAMP(3),
    "correctionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "appliance_specs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "appliance_specs_modelCode_key" ON "appliance_specs"("modelCode");
CREATE INDEX "appliance_specs_category_brand_idx" ON "appliance_specs"("category", "brand");
CREATE INDEX "appliance_specs_modelCode_idx" ON "appliance_specs"("modelCode");

ALTER TABLE "appliance_specs"
  ADD CONSTRAINT "appliance_specs_correctedById_fkey"
  FOREIGN KEY ("correctedById") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
