# Database Migrations

This directory contains SQL migrations for the SiteFlow database schema.

## Migration Files

### Part 1: Core Schema (FAZA 2A)
- **001_init_part1.sql** - Extensions, ENUMs, and core tables (1-24)
  - Instance settings & tenants
  - Users, authentication, and RBAC
  - Projects and locations
  - Tasks, dependencies, and blocks

### Part 2: Domain Schema (FAZA 2B)
- **001_init_part2.sql** - Domain tables (25-47) - *Coming in FAZA 2B*
  - Checklists and templates
  - Inspections and issues
  - Deliveries and decisions
  - Files, comments, activity log
  - Notifications and automations

- **002_seed_system.sql** - System data - *Coming in FAZA 2B*
  - Permissions
  - Project role permissions
  - Instance automation rules
  - Default instance settings

- **003_seed_demo.sql** - Demo data - *Coming in FAZA 2B*
  - Demo tenant, users, project
  - Sample tasks with blocks
  - Examples of all workflows

## Execution Order

**Development:**
```bash
# Run all migrations
make migrate

# Or manually with psql:
psql $DATABASE_URL < db/migrations/001_init_part1.sql
psql $DATABASE_URL < db/migrations/001_init_part2.sql
psql $DATABASE_URL < db/migrations/002_seed_system.sql
psql $DATABASE_URL < db/migrations/003_seed_demo.sql
```

**Production:**
```bash
# Migrations are run automatically on container startup (apps/api)
# Or manually:
make migrate-prod
```

## Schema Overview

### Core Tables (Part 1)

| # | Table | Purpose | Key Constraints |
|---|-------|---------|----------------|
| 1 | instance_settings | Global config (SMTP/S3) | Singleton (id=1) |
| 2 | tenants | Multi-tenant isolation | Unique slug |
| 3 | users | User accounts | Unique (tenant_id, email) |
| 4 | instance_admins | Instance admin users | FK to users |
| 5 | permissions | System permissions | Unique code |
| 6 | tenant_roles | Custom tenant roles | Unique (tenant_id, name) |
| 7 | tenant_role_permissions | Role→Permission mapping | M2M |
| 8 | user_tenant_roles | User→Role mapping | M2M |
| 9 | invites | Invite-only registration | Token hash, expiry |
| 10 | refresh_tokens | JWT refresh tokens | Token hash, revoke |
| 11 | password_resets | Password reset tokens | Token hash, expiry |
| 12 | login_attempts | Login audit trail | IP tracking |
| 13 | projects | Construction projects | Unique (tenant_id, name) |
| 14 | project_members | Project membership | M2M with project_role |
| 15 | project_role_permissions | Role→Permission (project) | M2M |
| 16 | locations | Hierarchical locations | Tree structure (path) |
| 17 | tasks | Core work units | Status, dates, inspection flag |
| 18 | task_assignees | Task→User assignments | M2M |
| 19 | task_watchers | Task→User watchers | M2M |
| 20 | task_dependencies | Task→Task dependencies | Acyclic |
| 21 | **task_blocks** | **Blockage source of truth** | **scope: START/DONE** |
| 22 | task_status_history | Task status audit | Immutable log |
| 23 | tags | Tenant-wide tags | Unique (tenant_id, name) |
| 24 | task_tags | Task→Tag mapping | M2M |

### Domain Tables (Part 2) - *Coming Soon*

| # | Table | Purpose |
|---|-------|---------|
| 25-28 | Checklists | Templates, runs, items, answers |
| 29-30 | Inspections | Inspections + status history |
| 31-32 | Issues | Punch-list items + history |
| 33-34 | Deliveries | Deliveries + items |
| 35-37 | Decisions | Decisions + options + approvals |
| 38-40 | Files & Comments | Attachments + links + comments |
| 41-45 | Activity & Notifications | Logs + outbox + notifications |
| 46-47 | Automations | Rules + job runs |

## Key Database Invariants

The schema enforces these business rules at the database level:

### Task Blocks (INV-2, INV-8, INV-9, INV-10)
- **Source of truth:** `task_blocks` table
- **Scope column:** `'START'` (blocks task start) or `'DONE'` (blocks completion)
- **Types:**
  - `DELIVERY` - Created when delivery has `blocks_work=true` and `status < DELIVERED`
  - `DECISION` - Created when decision has `blocks_work=true` and `status=PENDING_APPROVAL`
  - `DEPENDENCY` - Created when blocker task `status != DONE`
  - `MANUAL` - Manually created blocks

### Task Status Transitions
- **INV-1:** Cannot go to `PLANNED` without `planned_date` and assignees
- **INV-2:** Cannot go to `IN_PROGRESS` if active blocks with `scope='START'` exist
- **INV-3:** Cannot go to `DONE` if `requires_inspection=true` without `APPROVED` inspection

### Data Integrity
- All secrets (SMTP, S3, tokens) are hashed/encrypted
- Password hashes use Argon2id
- Refresh tokens and invite tokens use SHA-256 hashing
- Soft deletes on users, projects, tasks, locations
- Immutable audit logs (status_history, activity_log)

## Indexes

### Performance-Critical Indexes
- `idx_task_blocks_task_active` - Fast lookup of active blocks for a task
- `idx_task_blocks_task_scope` - Scope-specific block queries (START vs DONE)
- `idx_tasks_project_status` - Dashboard queries
- `idx_tasks_planned_date` - Planner view

### Partial Indexes
- `WHERE deleted_at IS NULL` - Ignore soft-deleted records
- `WHERE is_active = true` - Active records only
- `WHERE revoked_at IS NULL` - Valid tokens

## Enum Types

```sql
project_role: INVESTOR | INSPECTOR | GC | SUB | PROCUREMENT
task_status: NEW | PLANNED | IN_PROGRESS | READY_FOR_REVIEW | DONE | CANCELLED
inspection_status: DRAFT | SUBMITTED | IN_REVIEW | APPROVED | REJECTED
issue_status: OPEN | ASSIGNED | FIXED | VERIFIED | CLOSED
delivery_status: REQUESTED | ORDERED | IN_TRANSIT | DELIVERED | ACCEPTED | REJECTED
decision_status: DRAFT | PENDING_APPROVAL | APPROVED | REJECTED | IMPLEMENTED
```

## Migration Management

### Adding New Migrations
1. Create `00X_description.sql` with incremental number
2. Use `IF NOT EXISTS` for idempotency
3. Test rollback scenarios
4. Document in this README

### Rollback Strategy
- Production migrations are **forward-only**
- Use new migrations to fix issues (never rollback)
- Test thoroughly in dev environment first

## Development Workflow

```bash
# Start dev environment with fresh DB
make dev-fresh

# Run migrations
make migrate

# Seed demo data
make seed

# Reset database (drops all tables)
make db-reset
```

## Production Deployment

```bash
# Migrations run automatically on API container startup
# Check migration status
make migrate-status

# Manual migration (if needed)
make migrate-prod
```

---

**Last updated:** FAZA 2A - Core schema implementation  
**Next:** FAZA 2B - Domain tables and seeds
