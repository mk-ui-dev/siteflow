# Database Migrations

SQL migration files for PostgreSQL schema.

## Naming Convention

```
001_init.sql              # Initial schema with all tables
002_seed_system.sql       # System seeds (permissions, roles)
003_seed_demo.sql         # Demo data (optional)
```

## Migration Runner

Migrations are executed by `apps/api` using a custom migrator that:
1. Reads SQL files in order
2. Tracks applied migrations in `schema_migrations` table
3. Ensures idempotency

## Coming in Phase 2

- 47 tables
- 12 ENUMs
- Foreign keys, indexes, constraints
- Partial indexes for soft-deleted records
