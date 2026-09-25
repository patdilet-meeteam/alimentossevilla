-- SPEC-004: preserva la cantidad fuente para cálculos nutricionales trazables.
-- Nullable para no reinterpretar versiones históricas que solo tienen porcentaje.
ALTER TABLE "formulation_ingredients"
  ADD COLUMN "cantidadCanonica" DECIMAL(14,6);
