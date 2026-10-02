CREATE TABLE "technical_document_snapshots" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "documentVersion" INTEGER NOT NULL,
    "sourceFormulationVersionId" TEXT NOT NULL,
    "sourceFormulationVersionNumber" INTEGER NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdByEmail" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "technical_document_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "technical_document_snapshots_productId_documentVersion_key"
ON "technical_document_snapshots"("productId", "documentVersion");

CREATE INDEX "technical_document_snapshots_productId_createdAt_idx"
ON "technical_document_snapshots"("productId", "createdAt");

ALTER TABLE "technical_document_snapshots"
ADD CONSTRAINT "technical_document_snapshots_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
