# Safe additive data import

This operator utility is intended for a Prisma/PostgreSQL application whose schema matches the importer adapter. It is deliberately separate from source data. The private data payload must be provided to the operator through an authorized private channel and must never be committed to this public repository.

## Safety model

- Dry run is the default. It executes the complete plan in a serializable transaction and rolls the transaction back.
- `--apply` is required to commit. The complete operation uses one serializable transaction; any error rolls back all inserts.
- Existing records are matched by natural keys. Exact matches are counted and retained. A key collision with different values, multiple ambiguous matches, or unresolved dependency aborts; the importer never updates or deletes existing records.
- A custom-format `pg_dump` backup and its SHA-256 are mandatory before both dry run and apply. `pg_restore -l` verifies archive readability and the archived database name must match the confirmed target.
- The database URL host/database must match separate operator confirmations. The HTTPS application URL must also be explicitly confirmed.
- Required migration IDs are supplied by the private payload manifest. Missing migrations, schema mismatch, or tenant/organization columns fail closed.
- The report prints aggregate table counts only. Database URL credentials are never printed.

## Operator prerequisites

Run the tool from the repository root so it can load the generated Prisma Client. Provide Node.js, `DATABASE_URL`, and `pg_restore`. Keep the payload and backup outside the repository in access-controlled storage. Verify the application, database host, and database name through the administrator's trusted channel; do not infer the target from a copied URL.

Create and inspect a fresh custom-format backup before each invocation:

```sh
umask 077
docker compose exec -T db sh -lc 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > /secure/path/pre-import.dump
sha256sum /secure/path/pre-import.dump
pg_restore -l /secure/path/pre-import.dump | head
```

The backup must be stored safely off the production host before applying any write. The tool checks the supplied SHA-256 against the file and verifies the archive with `pg_restore`.

## Dry run, then apply

Supply the private payload path and the verified destination identifiers. Replace each placeholder; do not place credentials in command history or logs.

```sh
DATABASE_URL="$DATABASE_URL" node scripts/safe-data-import.cjs \
  --payload /secure/path/private-payload.json \
  --confirm-application https://app.example.com \
  --expect-host DB_HOST_CONFIRMED --expect-db DB_NAME_CONFIRMED \
  --backup /secure/path/pre-import.dump --backup-sha256 SHA256_FROM_SHA256SUM
```

Review the dry-run report and resolve every collision before proceeding. Create a new backup immediately before apply, then repeat the command with its new path and digest and add `--apply`:

```sh
DATABASE_URL="$DATABASE_URL" node scripts/safe-data-import.cjs \
  --payload /secure/path/private-payload.json \
  --confirm-application https://app.example.com \
  --expect-host DB_HOST_CONFIRMED --expect-db DB_NAME_CONFIRMED \
  --backup /secure/path/pre-apply.dump --backup-sha256 SHA256_FROM_SHA256SUM \
  --apply
```

A successful write prints `APPLIED`. A dry run prints `DRY_RUN_PASS`. Any failure prints `ABORTED_NO_COMMIT`; do not bypass a guard to force a load. Re-running after a successful apply requires a new backup and should create no duplicate rows.

## Adapter and payload contract

The current adapter targets the repository's Prisma models for ingredients, products, presentations, formulations, formulation versions, nutrients, nutritional profiles, nutrient values, and formulation components. It expects a JSON object with arrays named `requiredMigrations`, `nutrientCatalog`, `ingredients`, `products`, `presentations`, `formulations`, `formulationVersions`, `nutritionalProfiles`, and `formulationIngredients`. Map source data into that contract in the private payload; do not add source records or customer examples to this repository. The private payload's exclusions, provenance rules, and source-to-target mapping remain the responsibility of its data owner.

The importer does not decide which records are appropriate to migrate, repair ambiguous values, infer units, approve workflow records, or validate business-specific policy. Review the private payload and its exclusions separately before operating. The migration guard confirms schema version and tenant-shape compatibility; a successful local test does not prove the production destination is correct.
