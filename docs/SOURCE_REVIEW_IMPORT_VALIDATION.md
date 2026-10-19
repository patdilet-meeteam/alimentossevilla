# Importación revisable de fuentes: validación adicional

## Qué faltaba y qué se corrigió

El ensayo anterior probaba contenido y repetición, pero cada receta tenía su propia transacción y los conjuntos se escribían fuera de ella. No demostraba rollback del lote completo ni detectaba toda modificación de componentes/conjuntos previamente cargados. Tampoco equivalía a un importador productivo con respaldo y destino verificados.

Ahora `scripts/lib/atomic-source-review.cjs` procesa las33recetas y4conjuntos en **una transacción Serializable**, con bloqueo asesor transaccional para impedir dos importadores concurrentes. No actualiza ni elimina registros existentes. Comprueba filas, encabezados, cantidades/porcentajes, componentes, conjuntos y estados para aceptar una reejecución; ante discrepancia aborta en vez de sobrescribir. Compara todas las filas preexistentes de las11entidades de negocio implicadas, incluidos timestamps. Rechaza decimales que no caben exactamente enDecimal(38,24); no redondea ni normaliza.

El CLI `scripts/review/recover-june-sources.cjs` mantiene la guarda de127.0.0.1 y base`sevilla_ready_dataset`. **Dry-run es el modo predeterminado** y revierte todo el lote. Solo`--apply-local` confirma una escritura de ensayo. `--apply` y flags contradictorios se rechazan. Requiere elXLSX original y comprueba suSHA256 contra el plan. No se ha habilitado ejecución contra producción ni eliminado ninguna guarda.

## Evidencia real aislada

`atomic_import_results.json`:16casos correctos con PostgreSQL16 temporal. Incluye:

- Dry-run de33+4sin persistencia; error intencional en el último conjunto tras procesar33recetas/3conjuntos, con rollback de todas las filas.
- Backup custom`pg_dump`, restauración a otro PostgreSQL tmpfs y huellas idénticas de las filas restauradas. No se publica el dump.
-33borradores/597componentes,4conjuntos/14miembros;606filas fuente conservadas y9identidades pendientes. Versiones existentes preservadas; una versión7de prueba obliga a anexar nuevas versiones desde8sin reemplazarla.
- Segunda aplicación idéntica, incluidos IDs/timestamps y ausencia de nuevas altas. Cambios de encabezados, componentes, miembros o estado provocan aborto sin sobrescritura.
- Rechazo de concurrencia, destino no local, libro conSHA equivocado y precisión fuera del almacenamiento exacto.
- Un registroAPROBADO **sintético** previo se conserva durante la prueba; no representa aprobación de negocio. Se elimina al cerrar. Cierre:0usuarios,0sesiones,0aprobaciones; perfiles y valores nutricionales nunca se modifican por este importador.

La suite general posterior pasa154pruebas/30archivos. Las16comprobaciones PostgreSQL son un programa adicional, no se suman como si fueran pruebas deVitest. La aplicación sigue siendo la revisión visual ya comprobada con15checks/8capturas; este cambio afecta utilidades de ensayo, no permisos ni interfaz.

## Procedimiento ejecutable de ensayo

Desde el checkout, con Node/pnpm y dependencias instaladas, las11migraciones y PostgreSQL16 en una base **dedicada** accesible por127.0.0.1. Los datos del proyecto están separados del código; en la entrega pública se ubican bajo`deliverables/sevilla-review/materiales`, y en elZIP de entrega están en raíz.

```sh
export ENTREGA=/ruta/de/materiales
export TEST_DATABASE_URL='postgresql://postgres@127.0.0.1:PUERTO_EFIMERO/sevilla_ready_dataset'
# El valor real lo proporciona el operador de su base de pruebas; no usar laDB de producción.
node -e 'const u=new URL(process.env.TEST_DATABASE_URL);if(u.hostname!=="127.0.0.1"||u.pathname!=="/sevilla_ready_dataset")throw Error("Solo ensayo local")'
DATABASE_URL="$TEST_DATABASE_URL" pnpm exec prisma migrate deploy
# Solo enDB de ensayo vacía; este paso crea el fixture y prueba53perfiles revisados.
node --import tsx scripts/review/simulate-bank-plan.cjs \
  "$ENTREGA/dataset_auditoria_payload.json" "$ENTREGA/plan_53_perfiles_respaldados.json" "$ENTREGA/ensayo-perfiles.json"
# Dry-run: no persiste recetas ni conjuntos.
node --import tsx scripts/review/recover-june-sources.cjs \
  "$ENTREGA/fuentes/junio_original.xlsx" "$ENTREGA/plan_recuperacion_junio_21_productos.json" "$ENTREGA/dry-run-recetas.json"
# Solo si la salida esDRY_RUN_PASS y se está en la base local dedicada.
node --import tsx scripts/review/recover-june-sources.cjs \
  "$ENTREGA/fuentes/junio_original.xlsx" "$ENTREGA/plan_recuperacion_junio_21_productos.json" "$ENTREGA/apply-recetas.json" --apply-local
node --import tsx scripts/review/recover-june-sources.cjs \
  "$ENTREGA/fuentes/junio_original.xlsx" "$ENTREGA/plan_recuperacion_junio_21_productos.json" "$ENTREGA/repeticion-recetas.json" --apply-local
node --import tsx scripts/review/verify-june-recovery.cjs \
  "$ENTREGA/plan_recuperacion_junio_21_productos.json" "$ENTREGA/verificacion-recetas.json"
```

Exigir0altas en la repetición y preservación de registros. No ejecutar el seed de fixture sobre una copia de producción. Para repetir los16casos, usar **otra DB dedicada limpia**, inicializada solo con el fixture53; el programa aplica/revierte alteraciones deliberadas de prueba y necesita Docker local con la imagen oficial`postgres:16-alpine` ya disponible:

```sh
export SOURCE_DB_CONTAINER=sevilla-atomic-import
TEST_DATABASE_URL="$TEST_DATABASE_URL" node --import tsx scripts/review/test-atomic-source-review.cjs \
  "$ENTREGA/fuentes/junio_original.xlsx" "$ENTREGA/plan_recuperacion_junio_21_productos.json" "$ENTREGA/atomic_import_results.json"
```

El contenedor indicado debe ser el de esa base efímera; se comprueba que su puerto coincide. El programa no funciona sobre una base con recetas ya importadas: utiliza una instalación de fixtures nueva y elimina sus centinelas sintéticos. Espera al servidor TCP definitivo al restaurar, evitando el servidor temporal del arranque dePostgres.

## Qué sigue pendiente del team lead

Este resultado cierra la validación **local/aislada** del lote, su atomicidad y su repetición. No acredita el esquema/contenido actual de laDB desplegada, un respaldo de producción ni su recuperación. El team lead debe restaurar un respaldo autorizado del destino, comprobar correspondencias/colisiones y validar un adaptador operativo para ese destino antes de una carga real. No conectar directamente el núcleo interno a producción como atajo ni quitar la guarda local del CLI.

Las33versiones y4conjuntos siguenDRAFT, sin vigencia/aprobación inferida. Los53perfiles no se activan/reemplazan mediante este importador. Las ambigüedades documentadas permanecen visibles y bloqueadas; no se inventaron códigos, proporciones, unidades ni equivalencias.
