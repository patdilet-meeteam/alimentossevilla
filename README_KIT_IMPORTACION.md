# Entrega para el operador: paquete de importación

El ZIP incluido contiene el payload empresarial seleccionado y el importador seguro. Su SHA-256 esperado es:

`4a1b77a2a43196e3ba41fc41133030492cae9c5ea77222ea8c4c36a2c5ff3ecf`

## Pasos de operación

1. Descargar y verificar el ZIP. Extraerlo en una ruta protegida, fuera del checkout:

```sh
sha256sum deliverables/alimentos_sevilla_admin_migration_kit_2026-10-09.zip
unzip deliverables/alimentos_sevilla_admin_migration_kit_2026-10-09.zip -d /secure/path
```

2. En el servidor correcto, hacer un respaldo nuevo antes del dry run. Guardarlo fuera del contenedor y conservarlo de forma segura:

```sh
umask 077
docker compose -f docker-compose.prod.yml --env-file .env.production exec -T db \
  sh -lc 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
  > /secure/path/pre-import.dump
sha256sum /secure/path/pre-import.dump
pg_restore -l /secure/path/pre-import.dump | head
```

3. Ejecutar el importador desde un entorno que tenga acceso autorizado a esa base, Prisma Client generado y `pg_restore`. `DATABASE_URL` debe estar configurada sin mostrarla en logs. Confirma host, base y URL de aplicación con el administrador:

```sh
DATABASE_URL="$DATABASE_URL" node /secure/path/alimentos_sevilla_admin_migration_kit_2026-10-09/tools/import-safe.cjs \
  --confirm-application https://nutricional.alimentossevilla.digital \
  --expect-host HOST_CONFIRMADO --expect-db BASE_CONFIRMADA \
  --backup /secure/path/pre-import.dump --backup-sha256 SHA256_DEL_BACKUP
```

El modo predeterminado es dry run: no deja cambios. Revisa el informe completo y resuelve cualquier colisión o discrepancia. El importador aborta si un código existente tiene datos distintos; no sobrescribe registros.

4. Solo después de revisar un dry run limpio, genera otro respaldo fresco, verifica su SHA y repite el comando con ese nuevo respaldo y `--apply`:

```sh
DATABASE_URL="$DATABASE_URL" node /secure/path/alimentos_sevilla_admin_migration_kit_2026-10-09/tools/import-safe.cjs \
  --confirm-application https://nutricional.alimentossevilla.digital \
  --expect-host HOST_CONFIRMADO --expect-db BASE_CONFIRMADA \
  --backup /secure/path/pre-apply.dump --backup-sha256 SHA256_DEL_BACKUP \
  --apply
```

5. Verifica `APPLIED`, los conteos informados y el resultado de un nuevo dry run con un respaldo renovado. Una reejecución limpia debe mostrar cero filas nuevas y coincidencias idénticas.

## Límites

No ejecutes si host, base, esquema o backup no coinciden; no eludas guardas ante conflictos. Las versiones de formulación se importan como borradores, sin nuevas aprobaciones. Este paquete no aplica costos históricos ni cambia parámetros regulatorios. No se hizo una carga en producción; las pruebas se hicieron en una base temporal aislada. Los pasos no autorizan borrar o reemplazar datos existentes.
