# Entrega para el operador: paquete de importación

El ZIP incluido contiene el payload empresarial seleccionado y el importador seguro. Su SHA-256 esperado es:

`41b6f376fc9dbd79bf26fe2cd837931abac8870f03af6c943c8d4199d0ed7671`

## Pasos de operación

El importador del kit acepta `--confirm-application` como URL HTTPS completa o como hostname sin protocolo. En ambos casos valida el destino exacto `nutricional.alimentossevilla.digital`; usa el comando mostrado aquí tal cual.

1. Descargar y verificar el ZIP. Extraerlo en una ruta protegida, fuera del checkout:

```sh
sha256sum deliverables/alimentos_sevilla_admin_migration_kit_2026-10-09.zip
unzip deliverables/alimentos_sevilla_admin_migration_kit_2026-10-09.zip -d /secure/path
```

2. Antes de ejecutar, quien opera debe confirmar por el canal administrativo la ruta real del proyecto (se mencionó `/opt/nutricional`), el archivo Compose, el archivo de entorno, el nombre del servicio PostgreSQL y el nombre de la base. No asumir que el servicio se llama `db` ni que el servidor usa el Compose de este checkout. El respaldo debe guardarse de forma protegida y copiarse fuera del servidor antes de cualquier escritura:

```sh
umask 077
# Define estos tres valores usando la configuración confirmada; no asumas nombres del ejemplo.
COMPOSE_FILE=/ruta/confirmada/docker-compose.yml
ENV_FILE=/ruta/confirmada/.env
DB_SERVICE=servicio_postgres_confirmado
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" config --services
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T "$DB_SERVICE" \
  sh -lc 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
  > /secure/path/pre-import.dump
sha256sum /secure/path/pre-import.dump
pg_restore -l /secure/path/pre-import.dump | head
```

La redirección `>` guarda el respaldo en la máquina donde corre el shell. Si el comando se ejecuta dentro de una sesión SSH en el servidor, copia luego el dump a almacenamiento protegido fuera del servidor antes de cualquier `--apply`.

3. Ejecutar el importador desde un entorno que tenga acceso autorizado a esa base, Prisma Client generado y `pg_restore`. `DATABASE_URL` debe estar configurada sin mostrarla en logs. Confirma host, base y URL de aplicación con el administrador:

```sh
DATABASE_URL="$DATABASE_URL" node /secure/path/alimentos_sevilla_admin_migration_kit_2026-10-09/tools/import-safe.cjs \
  --confirm-application https://nutricional.alimentossevilla.digital \
  --expect-host HOST_CONFIRMADO --expect-db BASE_CONFIRMADA \
  --backup /secure/path/pre-import.dump --backup-sha256 SHA256_DEL_BACKUP
```

El modo predeterminado es dry run: no deja cambios. Revisa el informe completo y resuelve cualquier colisión o discrepancia. El importador aborta si un código existente tiene datos distintos; no sobrescribe registros.

4. No añadas `--apply` hasta que el dry run actual termine con `DRY_RUN_PASS`, el dueño de la carga lo autorice, se nombre a quien validará el resultado y exista una ventana confirmada de 30 minutos sin usuarios. Entonces genera otro respaldo, cópialo fuera del servidor y verifica su SHA antes de aplicar:

```sh
DATABASE_URL="$DATABASE_URL" node /secure/path/alimentos_sevilla_admin_migration_kit_2026-10-09/tools/import-safe.cjs \
  --confirm-application https://nutricional.alimentossevilla.digital \
  --expect-host HOST_CONFIRMADO --expect-db BASE_CONFIRMADA \
  --backup /secure/path/pre-apply.dump --backup-sha256 SHA256_DEL_BACKUP \
  --apply
```

5. Verifica `APPLIED`, los conteos informados y el resultado de un nuevo dry run con un respaldo renovado. Una reejecución limpia debe mostrar cero filas nuevas y coincidencias idénticas.

## Límites

No ejecutes si host, base, esquema o backup no coinciden; no eludas guardas ante conflictos. El catálogo de nutrientes del paquete se limita a las claves canónicas utilizadas por sus valores nutricionales y conserva las reglas del catálogo del repositorio (`ZINC` no obligatorio). Si el destino discrepa, el importador aborta sin sobrescribirlo. Las versiones de formulación se importan como borradores, sin nuevas aprobaciones. Este paquete no aplica costos históricos ni cambia parámetros regulatorios. No se hizo una carga en producción. La integración con PostgreSQL para esta revisión del kit no pudo repetirse por falta de espacio en Docker; el dry run actual contra el destino correcto es obligatorio antes de `--apply`. Los pasos no autorizan borrar o reemplazar datos existentes.
