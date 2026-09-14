-- SPEC-003 pre-step 1a: extend IngredientCategory enum with the 10 real customer buckets.
-- This migration ONLY adds new enum values; the UPDATEs that use them are in the next migration
-- because PostgreSQL forbids using a newly-added enum value inside the same transaction.

ALTER TYPE "IngredientCategory" ADD VALUE IF NOT EXISTS 'MPC';
ALTER TYPE "IngredientCategory" ADD VALUE IF NOT EXISTS 'MPNC';
ALTER TYPE "IngredientCategory" ADD VALUE IF NOT EXISTS 'PROTEINA';
ALTER TYPE "IngredientCategory" ADD VALUE IF NOT EXISTS 'AGUA';
ALTER TYPE "IngredientCategory" ADD VALUE IF NOT EXISTS 'CONDIMENTO_ESPECIA';
ALTER TYPE "IngredientCategory" ADD VALUE IF NOT EXISTS 'CONSERVANTE';
ALTER TYPE "IngredientCategory" ADD VALUE IF NOT EXISTS 'REGULADOR_ACIDEZ';
ALTER TYPE "IngredientCategory" ADD VALUE IF NOT EXISTS 'SABORIZANTE';
ALTER TYPE "IngredientCategory" ADD VALUE IF NOT EXISTS 'COLORANTE';
ALTER TYPE "IngredientCategory" ADD VALUE IF NOT EXISTS 'MPC_PROTEINA';
