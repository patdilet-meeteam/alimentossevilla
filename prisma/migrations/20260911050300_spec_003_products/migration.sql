-- SPEC-003 step 2: Products, Presentations, Formulations, FormulationVersions and FormulationIngredients.
-- 5 new enums + 5 new tables + 1 back-relation on users + 1 back-relation on audit_events.

-- Enums
CREATE TYPE "ProductCategory" AS ENUM (
  'SALCHICHA',
  'CHORIZO',
  'JAMON',
  'MORTADELA',
  'TOCINETA',
  'PERRO_CALIENTE',
  'OTRO'
);

CREATE TYPE "FormulationVersionStatus" AS ENUM (
  'DRAFT',
  'IN_REVIEW',
  'APPROVED',
  'OBSOLETE'
);

-- Products
CREATE TABLE "products" (
  "id" TEXT NOT NULL,
  "codigoInterno" TEXT NOT NULL,
  "nombreComercial" TEXT NOT NULL,
  "categoriaProducto" "ProductCategory" NOT NULL,
  "descripcion" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdById" TEXT,
  CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "products_codigoInterno_key" ON "products"("codigoInterno");
CREATE INDEX "products_categoriaProducto_idx" ON "products"("categoriaProducto");
CREATE INDEX "products_isActive_idx" ON "products"("isActive");

ALTER TABLE "products"
  ADD CONSTRAINT "products_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Presentations
CREATE TABLE "presentations" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "gramajeNeto" DECIMAL(12,3) NOT NULL,
  "unidadesPorEmpaque" INTEGER,
  "porcionDeclarada" DECIMAL(12,3),
  "porcionPorEnvase" DECIMAL(12,4),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "presentations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "presentations_productId_idx" ON "presentations"("productId");
CREATE INDEX "presentations_isActive_idx" ON "presentations"("isActive");

ALTER TABLE "presentations"
  ADD CONSTRAINT "presentations_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Formulations (1:1 with Product per OQ-002)
CREATE TABLE "formulations" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "baseCalculo" DECIMAL(12,4) NOT NULL DEFAULT 100,
  "rendimientoEsperado" DECIMAL(6,4),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "formulations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "formulations_productId_key" ON "formulations"("productId");
CREATE INDEX "formulations_productId_idx" ON "formulations"("productId");

ALTER TABLE "formulations"
  ADD CONSTRAINT "formulations_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Formulation Versions (immutable after APPROVED)
CREATE TABLE "formulation_versions" (
  "id" TEXT NOT NULL,
  "formulationId" TEXT NOT NULL,
  "numeroSecuencial" INTEGER NOT NULL,
  "estado" "FormulationVersionStatus" NOT NULL DEFAULT 'DRAFT',
  "rendimientoEsperado" DECIMAL(6,4),
  "validFrom" TIMESTAMP(3),
  "aprobadaPorId" TEXT,
  "aprobadaEn" TIMESTAMP(3),
  "auditTrailId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "formulation_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "formulation_versions_formulationId_numeroSecuencial_key"
  ON "formulation_versions"("formulationId", "numeroSecuencial");
CREATE INDEX "formulation_versions_estado_idx" ON "formulation_versions"("estado");
CREATE INDEX "formulation_versions_formulationId_idx" ON "formulation_versions"("formulationId");

ALTER TABLE "formulation_versions"
  ADD CONSTRAINT "formulation_versions_formulationId_fkey"
  FOREIGN KEY ("formulationId") REFERENCES "formulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "formulation_versions"
  ADD CONSTRAINT "formulation_versions_aprobadaPorId_fkey"
  FOREIGN KEY ("aprobadaPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "formulation_versions"
  ADD CONSTRAINT "formulation_versions_auditTrailId_fkey"
  FOREIGN KEY ("auditTrailId") REFERENCES "audit_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Formulation Ingredients
CREATE TABLE "formulation_ingredients" (
  "id" TEXT NOT NULL,
  "formulationVersionId" TEXT NOT NULL,
  "ingredientId" TEXT NOT NULL,
  "porcentajeParticipacion" DECIMAL(7,4) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "formulation_ingredients_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "formulation_ingredients_formulationVersionId_ingredientId_key"
  ON "formulation_ingredients"("formulationVersionId", "ingredientId");
CREATE INDEX "formulation_ingredients_ingredientId_idx" ON "formulation_ingredients"("ingredientId");

ALTER TABLE "formulation_ingredients"
  ADD CONSTRAINT "formulation_ingredients_formulationVersionId_fkey"
  FOREIGN KEY ("formulationVersionId") REFERENCES "formulation_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "formulation_ingredients"
  ADD CONSTRAINT "formulation_ingredients_ingredientId_fkey"
  FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
