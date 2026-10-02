CREATE TABLE "regulatory_parameter_versions" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "sodiumMgPer100g" DECIMAL(12,4) NOT NULL,
    "energyPercentageThreshold" DECIMAL(8,4) NOT NULL,
    "fatTransPercentageThreshold" DECIMAL(8,4) NOT NULL,
    "createdById" TEXT,
    "createdByEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regulatory_parameter_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "regulatory_parameter_versions_version_key"
ON "regulatory_parameter_versions"("version");

CREATE INDEX "regulatory_parameter_versions_effectiveAt_idx"
ON "regulatory_parameter_versions"("effectiveAt");

-- Base version matches the thresholds already used by the preliminary evaluator.
INSERT INTO "regulatory_parameter_versions" (
    "id", "version", "sodiumMgPer100g", "energyPercentageThreshold",
    "fatTransPercentageThreshold", "createdByEmail"
) VALUES (
    'regulatory-parameters-v1', 1, 300, 10, 1, 'Sistema · línea base existente'
);
