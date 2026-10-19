# Sevilla — entrega para revisión del team lead

Código, migración y materiales empresariales de recetas/costos/documentación publicados con autorización expresa del propietario para este repositorio público. No se incluyen secretos, archivos de entorno reales, backups ni un historial adicional sensible. No se ha desplegado ni cargado nada en el servicio productivo.

## Código y comprobaciones

Rama: `codex/sevilla-review-code`. El código de aplicación corresponde al candidato visual044b782; las utilidades de ensayo se reforzaron posteriormente para importar atómicamente y hacer dry-run por defecto. Ver commit actual con`git rev-parse HEAD`.

-154pruebas/30archivos de la suite general, TypeScript/lint correctos.
-16casos adicionales reales de PostgreSQL para33recetas+4conjuntos: rollback tardío, idempotencia exacta, preservación de versiones, concurrencia y restauración de un backup de fixture. Evidencia:`materiales/atomic_import_results.json`.
- Revisión visual local previa:15checks/8capturas de escritorio y móvil. Galería:`materiales/visual_final/galeria.html`. Son dos variantesBrakel y un fixture de aprobación; no acreditan visualmente todos los productos ni la app remota.

## Obtener y construir

```sh
git clone --branch codex/sevilla-review-code --single-branch https://github.com/patdilet-meeteam/alimentossevilla.git sevilla-review
cd sevilla-review
export RELEASE_SRC="$PWD"
export ENTREGA="$RELEASE_SRC/deliverables/sevilla-review/materiales"
export REV="$(git rev-parse --short HEAD)"
docker build --target herramientas -t "alimentossevilla-herramientas:$REV" "$RELEASE_SRC"
docker build --target runtime -t "alimentossevilla-web:$REV" "$RELEASE_SRC"
```

Los builds Docker deben verificarse por el team lead. El build local comprobado fue webpack standalone; no se certifica la imagen del servidor. El Dockerfile fijaNode22/pnpm9.15.9 y lockfile. Configuración/secrets del servidor se conservan mediante su mecanismo existente; no ejecutar seed,bootstrap o cambios de cuentas/permisos.

## Antes de migrar o desplegar

Destino confirmado:`https://nutricional.alimentossevilla.digital`. Confirmar con el operador ruta,Compose,servicios y base reales; no asumir que el Compose de este checkout coincide con el servidor. El team lead es responsable del despliegue.

1. Generar`pg_dump -Fc`, guardarSHA y copia protegida fuera del servidor. **Restaurarlo en una base independiente y comprobar conteos**, no limitarse a listar el archivo.
2. Registrar imagen anterior y conteos antes/después con`materiales/verificar_conteos.sql` (solo lectura). Detener la operación si hay un cambio de negocio inesperado.
3. Aplicar la migración nueva`20261019170000_source_recipes_and_bundles`:snapshotJSON nullable,Decimal(38,24),tablas/FK de conjuntos. Hay11migraciones; verificar cuáles faltan realmente. La migración no carga recetas ni cambia estados.
4. Con un override de Compose que use las imágenes construidas y nombres de servicio confirmados:

```sh
# COMPOSE_FILE,ENV_FILE y MIGRATION_SERVICE/WEB_SERVICE son valores confirmados por el operador.
docker compose -f "$COMPOSE_FILE" -f "$RELEASE_OVERRIDE" --env-file "$ENV_FILE" \
  run --rm --no-build --no-deps "$MIGRATION_SERVICE" pnpm exec prisma migrate status
docker compose -f "$COMPOSE_FILE" -f "$RELEASE_OVERRIDE" --env-file "$ENV_FILE" \
  run --rm --no-build --no-deps "$MIGRATION_SERVICE" pnpm db:deploy
docker compose -f "$COMPOSE_FILE" -f "$RELEASE_OVERRIDE" --env-file "$ENV_FILE" \
  up -d --no-build --no-deps "$WEB_SERVICE"
```

El override solo fija las imágenes de web y migrador; no cambia credenciales,redes o roles. Si no existe un servicio migrador confirmado, preparar ese job con el operador antes de ejecutar. No usar`db push`. Publicar código/migración debe conservar todos los conteos de negocio y aprobaciones.

Reversión: volver a la imagen anterior si solo cambió el código y conservar el esquema aditivo; no borrar snapshots ni reducir precisión. Si hubo datos nuevos o incompatibilidad, detener y restaurar el backup probado en destino limpio según el procedimiento del operador. No restaurar encima de producción automáticamente.

## Datos y carga revisable

`materiales/fuentes/` contiene los4XLSX originales y sus hashes. Los JSON/CSV son datos y evidencia del proyecto; `materiales/SHA256SUMS.json` y`INVENTARIO_PUBLICACION.json` permiten verificarlos. El Dockerfile excluye`deliverables/`: estos archivos no se incorporan al runtime ni se sirven como archivos públicos deNext.

**33versiones recuperadas y4conjuntos sonDRAFT, sin vigencia ni aprobación acreditada.**606filas fuente incluyen9identidades pendientes y597componentes vinculados. No elegir la última variante por su posición ni normalizar porcentajes.78/84son uniones de códigos candidatos, no faltantes vigentes confirmados. El kit antiguo está en`materiales/legado/`; no representa una autorización de carga actual.

La carga atómica está comprobada en ensayo dedicado. El CLI continúa limitado a127.0.0.1/base`sevilla_ready_dataset` y dry-run por defecto; `--apply-local` solo confirma ese ensayo. Procedimiento completo y16casos en[`docs/SOURCE_REVIEW_IMPORT_VALIDATION.md`](../../docs/SOURCE_REVIEW_IMPORT_VALIDATION.md). Los53perfiles revisados no se activan ni reemplazan mediante el importador de recetas.

**No hay una carga productiva nueva ejecutada o certificada.** Antes de ella el team lead debe validar esquema,colisiones y adaptador operativo sobre una copia restaurada de laDB desplegada y exigir backup recuperable. No levantar la guarda local ni llamar directamente al núcleo interno como atajo.

Los informes anteriores se conservan por trazabilidad. Para sumas/vigencia prevalece`materiales/CONCILIACION-VIGENCIA-2026-10-19.md`; para atomicidad y modo CLI prevalece la guía nueva. Ningún documento histórico sustituye la validación del destino actual.
