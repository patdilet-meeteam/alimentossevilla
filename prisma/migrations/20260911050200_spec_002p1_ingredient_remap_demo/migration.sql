-- SPEC-003 pre-step 1b: remap the 12 demo ingredients from legacy categories to the closest
-- real customer bucket. This runs in a separate transaction so the new enum values are
-- committed and usable in UPDATE statements.

UPDATE "ingredients" SET "category" = 'MPC'          WHERE "category" = 'CARNE';
UPDATE "ingredients" SET "category" = 'MPNC'         WHERE "category" = 'MATERIA_SECA';
UPDATE "ingredients" SET "category" = 'MPNC'         WHERE "category" = 'EMPAQUE';
UPDATE "ingredients" SET "category" = 'CONSERVANTE'  WHERE "category" = 'ADITIVO';
-- 'OTRO' stays as 'OTRO'.
