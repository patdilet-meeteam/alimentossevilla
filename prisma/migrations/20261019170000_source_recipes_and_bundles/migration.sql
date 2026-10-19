ALTER TABLE "formulation_versions" ADD COLUMN "sourceRecipeSnapshot" JSONB;
ALTER TABLE "formulation_ingredients" ALTER COLUMN "porcentajeParticipacion" TYPE DECIMAL(38,24), ALTER COLUMN "cantidadCanonica" TYPE DECIMAL(38,24);
CREATE TABLE "product_bundle_versions" (
 "id" TEXT PRIMARY KEY, "productId" TEXT NOT NULL REFERENCES "products"("id"), "sequence" INTEGER NOT NULL,
 "status" "FormulationVersionStatus" NOT NULL DEFAULT 'DRAFT', "sourceSha256" TEXT NOT NULL, "sourceSheet" TEXT NOT NULL,
 "declaredNetWeightGrams" DECIMAL(38,24), "sourceSnapshot" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "bundle_source_unique" ON "product_bundle_versions"("productId","sourceSha256","sourceSheet");
CREATE UNIQUE INDEX "product_bundle_versions_productId_sequence_key" ON "product_bundle_versions"("productId","sequence");
CREATE TABLE "product_bundle_components" (
 "id" TEXT PRIMARY KEY, "bundleVersionId" TEXT NOT NULL REFERENCES "product_bundle_versions"("id") ON DELETE CASCADE,
 "sourceCode" TEXT NOT NULL, "sourceName" TEXT NOT NULL, "unitCount" DECIMAL(38,24) NOT NULL,
 "netWeightGrams" DECIMAL(38,24), "memberProductId" TEXT REFERENCES "products"("id"), "sourceReference" TEXT
);
CREATE INDEX "product_bundle_components_bundleVersionId_idx" ON "product_bundle_components"("bundleVersionId");
