\set ON_ERROR_STOP on
BEGIN TRANSACTION READ ONLY;
SELECT 'ingredients' AS entidad, count(*) AS total FROM ingredients
UNION ALL SELECT 'products', count(*) FROM products
UNION ALL SELECT 'presentations', count(*) FROM presentations
UNION ALL SELECT 'formulations', count(*) FROM formulations
UNION ALL SELECT 'formulation_versions', count(*) FROM formulation_versions
UNION ALL SELECT 'formulation_ingredients', count(*) FROM formulation_ingredients
UNION ALL SELECT 'nutritional_profiles', count(*) FROM nutritional_profiles
UNION ALL SELECT 'active_profiles', count(*) FROM nutritional_profiles WHERE "isActive"
UNION ALL SELECT 'nutrient_values', count(*) FROM nutrient_values;
SELECT estado, count(*) FROM formulation_versions GROUP BY estado ORDER BY estado;
SELECT "ingredientId", count(*) AS perfiles_activos FROM nutritional_profiles WHERE "isActive"
GROUP BY "ingredientId" HAVING count(*) > 1;
SELECT count(*) AS ingredientes_codigo_cero FROM ingredients WHERE "siesaCode"='0';
SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations ORDER BY started_at;
-- Las tablas y columna siguientes se consultan solo si la migración nueva existe.
SELECT CASE WHEN to_regclass('public.product_bundle_versions') IS NOT NULL THEN 'true' ELSE 'false' END AS tiene_conjuntos \gset
\if :tiene_conjuntos
SELECT status, count(*) FROM product_bundle_versions GROUP BY status;
SELECT count(*) AS miembros_conjunto FROM product_bundle_components;
SELECT "productId","sourceSha256","sourceSheet",count(*) FROM product_bundle_versions
GROUP BY "productId","sourceSha256","sourceSheet" HAVING count(*)>1;
SELECT count(*) AS nuevas_aprobaciones_fuente FROM formulation_versions
WHERE "sourceRecipeSnapshot"->>'sourceSha256'='664f546cfe4a0c339481a642395c2f0212ec095957731fc18c9c86c9e7ee9f27'
AND (estado<>'DRAFT' OR "validFrom" IS NOT NULL OR "aprobadaPorId" IS NOT NULL OR "aprobadaEn" IS NOT NULL);
SELECT "formulationId", "sourceRecipeSnapshot"->>'sourceSheet' AS hoja,count(*)
FROM formulation_versions
WHERE "sourceRecipeSnapshot"->>'sourceSha256'='664f546cfe4a0c339481a642395c2f0212ec095957731fc18c9c86c9e7ee9f27'
GROUP BY "formulationId", "sourceRecipeSnapshot"->>'sourceSheet' HAVING count(*)>1;
\endif
COMMIT;
