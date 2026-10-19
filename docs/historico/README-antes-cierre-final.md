> HISTÓRICO. No usar como instrucciones vigentes. Consulte docs/ESTADO-VIGENTE-ENTREGA.md.

> Estado vigente: consulte `docs/ESTADO-VIGENTE-ENTREGA.md`. Junio (1).xlsx fue confirmado como último archivo; no se solicita otro historial general. Prueba final: 182 tests, 13 migraciones y navegador PASS.

# Sevilla: revisión consolidada pendiente de publicación

La base publicada sigue siendo `e891300`, rama `codex/sevilla-review-code`. Este checkout contiene un candidato posterior **local, sin push, despliegue ni carga productiva**. Revisar el diff antes de otra publicación.

La [consolidación de resultados y límites](../../docs/CONSOLIDACION-2026-10-19.md) prevalece para el estado actual. Contiene66 perfiles sustentados, una migración adicional de precisión nutricional y correcciones de escritura/edición decimal. Los documentos anteriores se conservan como evidencia histórica, no como instrucciones para desplegar esta revisión sin validación del destino.

Ejecutar una sola verificación local en un directorio de salida vacío:

```sh
node scripts/review/run-consolidated-local.cjs \
  deliverables/sevilla-review/materiales /ruta/escribible/salida-vacia
```

Crea y elimina PostgreSQL temporal; nunca usa la base desplegada. Requiere dependencias y la imagen Docker local `postgres:16-alpine`. El resultado registrado está en `materiales/ensayo_consolidado_revision/result.json`, con logs y comparaciones completas. Guía: [validación de importación](../../docs/SOURCE_REVIEW_IMPORT_VALIDATION.md).

Las33 recetas recuperadas y4 conjuntos siguenDRAFT; ninguna aprobación o vigencia se deduce de fecha, V1/V2 o posición. La matriz `materiales/consolidacion_resoluciones_y_limites.json` distingue lo resuelto, lo ambiguo y lo no verificable. Las65 identidades candidatas sin perfil no equivalen a faltantes del catálogo vigente.

La autorización pública anterior abarcó recetas/costos/documentos originales. Antes de otro push corresponde revisar el alcance de los nuevos mapeos, planes, evidencia y diff. No se agregan credenciales, entornos reales, backups, claves ni más historial Git. Los4XLSX originales mantienen sus hashes. La Library v10 anterior y la rama remota no contienen estos cambios locales.

El team lead debe validar respaldo restaurado, contenido/esquema del destino, colisiones, imágenes Docker y adaptador operativo antes de migrar o cargar datos reales. Esta entrega no certifica esos elementos ni habilita un importador productivo.

El cierre posterior por fila está en `materiales/ensayo_consolidado_filas/`:172 pruebas/36 archivos,18 casos PostgreSQL. Se mantienen66 perfiles globales, con5 correspondencias nutricionales específicas documentadas y11 filas aisladas para evitar cruces por código. Los606 registros fuente se conservan:586 enlaces y20 identidades pendientes. Prevalece la sección «Cierre posterior por aparición de origen» de la consolidación; los informes anteriores son históricos. El candidato sigue local y sin aprobación de carga productiva.
