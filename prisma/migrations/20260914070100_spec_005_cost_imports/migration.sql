-- SPEC-005: monthly cost imports, source-row traceability and review workflow.

CREATE TYPE "CostImportStatus" AS ENUM ('DRAFT', 'APPLIED', 'SUPERSEDED');
CREATE TYPE "CostImportItemStatus" AS ENUM ('MATCHED', 'CREATED_PENDING_REVIEW', 'INVALID', 'DUPLICATE_CONFLICT');
CREATE TYPE "CostCodeType" AS ENUM ('INSUMO', 'PRODUCTO_EN_PROCESO', 'PRODUCTO_TERMINADO');

ALTER TABLE "ingredients"
  ADD COLUMN "pendingReview" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "cost_imports" (
  "id" TEXT NOT NULL,
  "periodStart" DATE NOT NULL,
  "sourceFileName" TEXT NOT NULL,
  "sourceFileHash" TEXT NOT NULL,
  "status" "CostImportStatus" NOT NULL DEFAULT 'DRAFT',
  "rowCount" INTEGER NOT NULL,
  "validItemCount" INTEGER NOT NULL,
  "warningCount" INTEGER NOT NULL DEFAULT 0,
  "importedById" TEXT NOT NULL,
  "approvedById" TEXT,
  "appliedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "cost_imports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cost_import_items" (
  "id" TEXT NOT NULL,
  "costImportId" TEXT NOT NULL,
  "sourceRow" INTEGER NOT NULL,
  "sourceCode" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "unit" TEXT,
  "unitCost" DECIMAL(18,4) NOT NULL,
  "codeType" "CostCodeType",
  "status" "CostImportItemStatus" NOT NULL,
  "issues" JSONB,
  "ingredientId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cost_import_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cost_imports_sourceFileHash_key" ON "cost_imports"("sourceFileHash");
CREATE INDEX "cost_imports_periodStart_idx" ON "cost_imports"("periodStart");
CREATE INDEX "cost_imports_status_idx" ON "cost_imports"("status");
CREATE INDEX "cost_imports_createdAt_idx" ON "cost_imports"("createdAt");
CREATE UNIQUE INDEX "cost_import_items_costImportId_sourceRow_key" ON "cost_import_items"("costImportId", "sourceRow");
CREATE INDEX "cost_import_items_sourceCode_idx" ON "cost_import_items"("sourceCode");
CREATE INDEX "cost_import_items_ingredientId_idx" ON "cost_import_items"("ingredientId");
CREATE INDEX "cost_import_items_status_idx" ON "cost_import_items"("status");

ALTER TABLE "cost_imports"
  ADD CONSTRAINT "cost_imports_importedById_fkey"
  FOREIGN KEY ("importedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "cost_imports"
  ADD CONSTRAINT "cost_imports_approvedById_fkey"
  FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "cost_import_items"
  ADD CONSTRAINT "cost_import_items_costImportId_fkey"
  FOREIGN KEY ("costImportId") REFERENCES "cost_imports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cost_import_items"
  ADD CONSTRAINT "cost_import_items_ingredientId_fkey"
  FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
