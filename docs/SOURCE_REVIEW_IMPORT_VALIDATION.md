# Validación vigente de fuentes y flujos

Entrada reproducible: `node scripts/review/run-consolidated-local.cjs deliverables/sevilla-review/materiales RUTA_NUEVA_DE_EVIDENCIA`. Crea PostgreSQL efímero en loopback, aplica migraciones y valida fuentes/precisión/atomicidad, pruebas, tipos, lint, build y navegador aislado. Solo elimina sus fixtures y contenedor propios.

La prueba de integración `source-working-review.test.ts` verifica el recorrido positivo con vectores sintéticos explícitos: copia conciliada, envío I+D, aprobación Director, nutrientes exactos, tres ramas del criterio de especie y documento inmutable; verifica también bloqueos por ausencia de nutrientes, clasificación incompleta y agrupación. No aprueba recetas reales.

El navegador prueba conciliación, persistencia, roles, cálculo, guardado, impresión/PDF preliminar, vista móvil y conciliación/aprobación de agrupaciones. Las capturas y resultados del ensayo final se incluyen en `materiales/ensayo_cierre_final`. El PDF es exclusivamente un fixture sintético y no es una emisión oficial.

606 filas fuente conservadas:586 vinculadas y20 con identidad pendiente en la recuperación bruta. Cinco apariciones tienen85 valores documentados por fila, no perfiles globales.66 perfiles globales conciliados;13 identidades anteriores siguen sin nutrición acreditada. Los informes previos son históricos.

Los originales permanecen intactos. La confirmación de última base no aprueba internamente recetas ni convierte sus contradicciones en valores ciertos. No se realiza importación de producción.
