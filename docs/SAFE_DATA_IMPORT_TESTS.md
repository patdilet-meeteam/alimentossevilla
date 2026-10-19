# Safe import utility test evidence

The importer was exercised against a disposable PostgreSQL database migrated from the repository's migration files. The database was isolated from the normal development database and production, then removed after testing. No source dataset, credentials, record names, or business values are included in this report.

- Offline payload preflight passed.
- Default dry run passed and rolled back all planned inserts.
- Explicit apply passed with a verified custom-format backup.
- Reapply passed idempotently: it created no duplicate rows.
- A deliberately conflicting natural key was rejected without overwriting the existing row.
- A late transaction conflict rolled back earlier inserts.
- Missing backup and digest were rejected before database access.
- Backup readability and database identity were checked with `pg_restore -l`.

These tests verify importer behavior on a matching isolated schema. They do not verify production connectivity, production identity, or the content of any private payload.
