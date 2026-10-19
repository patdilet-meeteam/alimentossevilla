-- Widen only: preserve existing values; never repair source data or round on import.
ALTER TABLE "nutrient_values" ALTER COLUMN "value" TYPE DECIMAL(38,24);
