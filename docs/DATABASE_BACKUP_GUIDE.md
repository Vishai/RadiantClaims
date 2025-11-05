# Database Backup Guide

Use this workflow to snapshot the current Postgres data set before running destructive operations (e.g., reseeding).

## Create a Backup

```bash
pnpm exec ./scripts/backup-db.sh
```

The script reads `DATABASE_URL` (from the environment or `.env`), runs `pg_dump`, and writes a timestamped SQL file under `./backups`.

## Restore From a Backup File

1. Create an empty database (or drop/re-create an existing one):
   ```bash
   createdb radiantclaims_backup
   ```
2. Restore the dump:
   ```bash
   psql radiantclaims_backup < backups/radiantclaims-backup-YYYYMMDD-HHMMSS.sql
   ```

## Clone the Database Directly (optional)

If you only need a quick copy on the same Postgres instance:

```bash
createdb radiantclaims_clone --template=radiantclaims
```

> This requires no active connections to `radiantclaims` during the copy.

## After Reseeding

Once your reseed/migration is complete and verified, you can delete older dump files from `./backups` to free space.
