# SiteFlow (BuildOps Lite)

**Production-ready construction operations management system** with multi-tenant architecture, role-based access control, and automated workflows.

## 🎯 Overview

SiteFlow is a self-hosted web application designed for construction site operations management. It provides:

- **Multi-tenant architecture** with invite-only user management
- **Project-based organization** with hierarchical locations
- **Task planning & execution** with dependency management and blocking logic
- **Quality control** through inspections with customizable checklists
- **Issue tracking** (punch-list) with SLA enforcement
- **Delivery management** with work-blocking capabilities
- **Decision workflows** with approval chains
- **Automated notifications** and daily digests
- **RBAC** with object-level access control
- **File management** with MinIO S3-compatible storage

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite for bundling
- TanStack Router (type-safe routing)
- TanStack Query (server state management)
- React Hook Form + Zod (forms & validation)
- Tailwind CSS (styling)
- dnd-kit (drag & drop planner)

**Backend:**
- Fastify + TypeScript
- PostgreSQL (normalized schema, 47+ tables)
- Redis (caching & queues)
- BullMQ (job processing)
- MinIO (S3-compatible file storage)
- Kysely (type-safe SQL query builder)

**Infrastructure:**
- Docker + Docker Compose
- Nginx (reverse proxy)
- Ubuntu 22.04/24.04 LTS
- pnpm workspaces (monorepo)

### Monorepo Structure

```
siteflow/
├── apps/
│   ├── api/          # Fastify backend API
│   ├── worker/       # BullMQ background jobs
│   └── web/          # React frontend
├── packages/
│   ├── shared/       # Shared types, schemas, constants
│   └── ui/           # Reusable UI components
├── db/
│   ├── migrations/   # SQL migrations
│   └── seed/         # Seed data scripts
├── infra/
│   ├── nginx/        # Nginx configs
│   └── scripts/      # Deployment & maintenance scripts
├── docker/           # Dockerfiles
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── Makefile
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20 LTS
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL 15+ (via Docker)
- Redis 7+ (via Docker)
- MinIO (via Docker)

### Development Setup

```bash
# Clone repository
git clone https://github.com/mk-ui-dev/siteflow.git
cd siteflow

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env
# Edit .env with your configuration

# Start development environment (Docker services + apps)
make dev

# Run migrations
make migrate

# Seed demo data
make seed

# Access the application
# Frontend: http://localhost:5173
# API: http://localhost:3000
# API Docs: http://localhost:3000/api/docs
```

### Production Deployment

```bash
# On VPS (Ubuntu 22.04+)
# 1. Run VPS setup script
sudo ./infra/scripts/install_vps.sh

# 2. Configure environment
cp .env.example .env.production
# Edit .env.production with production values

# 3. Build and start services
make prod-up

# 4. Run migrations
make prod-migrate

# 5. Create initial instance admin
make create-admin
```

## 📚 Key Concepts

### Domain Model

- **Tenant**: Organization owning multiple projects
- **Project**: Construction project with locations, tasks, and team members
- **Location**: Hierarchical tree structure (Site → Building → Floor → Unit)
- **Task**: Work unit with assignees, dependencies, and blocking logic
- **Inspection**: Quality control checkpoint with checklist (can approve/reject work)
- **Issue**: Defect/punch-list item with SLA tracking
- **Delivery**: Material/equipment delivery (can block task start)
- **Decision**: Approval workflow (can block task start)
- **Block**: System that prevents tasks from starting or completing

### Business Rules (Invariants)

1. **INV-1**: Task cannot be PLANNED without planned_date and ≥1 assignee
2. **INV-2**: Task cannot start (IN_PROGRESS) if active START blocks exist
3. **INV-3**: Task requiring inspection cannot be DONE without APPROVED inspection
4. **INV-4**: Inspection cannot be SUBMITTED without filled required checklist items + required photos
5. **INV-5**: REJECTED inspection must create ≥1 Issue
6. **INV-6**: FIXED issue requires proof (attachment kind=AFTER OR comment)
7. **INV-7**: Only INSPECTOR/GC can VERIFY/CLOSE issues
8. **INV-8**: Delivery with blocks_work=true creates task_blocks(scope=START)
9. **INV-9**: Decision with blocks_work=true + PENDING_APPROVAL creates task_blocks(scope=START)
10. **INV-10**: Task with dependency cannot start until blocker task is DONE
11. **INV-11**: Every status change records in *_status_history + activity_log + outbox

### RBAC Roles

**Instance Level:**
- `InstanceAdmin`: Manages instance settings (SMTP, S3, policies)

**Tenant Level:**
- `TenantAdmin`: Manages users, roles, templates

**Project Level:**
- `INVESTOR`: Read-only + create decisions, comment
- `GC` (General Contractor): Full project management
- `INSPECTOR`: Approve/reject inspections, verify/close issues
- `SUB` (Subcontractor): Limited to assigned tasks & related entities
- `PROCUREMENT`: Manage deliveries

### Workflows

**Task Lifecycle:**
```
NEW → PLANNED → IN_PROGRESS → READY_FOR_REVIEW → DONE
                     ↓
                (optional) CANCELLED
```

**Inspection Flow:**
```
DRAFT → SUBMITTED → IN_REVIEW → APPROVED/REJECTED
                                      ↓
                              (if REJECTED) → Issues created
```

**Issue Flow:**
```
OPEN → ASSIGNED → FIXED → VERIFIED → CLOSED
```

## 🔐 Security

- **Authentication**: JWT access tokens (15min) + HttpOnly refresh cookie
- **CSRF Protection**: Double-submit cookie pattern for refresh flow
- **Password Hashing**: Argon2id
- **Secrets Encryption**: AES-256-GCM for instance settings (SMTP/S3 credentials)
- **Rate Limiting**: Configurable per-endpoint limits
- **Helmet.js**: Security headers (CSP, HSTS, etc.)
- **Input Validation**: Zod schemas on all API inputs
- **Object-Level Access**: Row-level security in queries

## 🔄 Automations

**Background Jobs (BullMQ):**

- `overdue_scan` (daily 06:30): Mark overdue issues, create notifications
- `inspection_review_timeout` (every 30min): Escalate long-pending reviews
- `reminders_daily` (07:00): Send daily digests
- `reminders_dminus` (08:00): D-2 and D-0 reminders for due dates
- `outbox_processor` (continuous): Process domain events → notifications

## 📖 API Documentation

Interactive API documentation available at:
- **Dev**: http://localhost:3000/api/docs
- **Prod**: https://your-domain.com/api/docs

### Key Endpoints

```
POST   /api/auth/login
POST   /api/auth/refresh
GET    /api/me

GET    /api/projects
GET    /api/projects/:id/tasks
POST   /api/tasks/:id/start
POST   /api/tasks/:id/complete

GET    /api/projects/:id/planner
PATCH  /api/tasks/:id/planned-date

POST   /api/inspections/:id/submit
POST   /api/inspections/:id/approve

POST   /api/issues/:id/fix
POST   /api/issues/:id/verify

POST   /api/files/presign
GET    /api/files/:id/signed
```

## 🧪 Testing

```bash
# Run all tests
make test

# Run API integration tests
pnpm --filter api test

# Run worker tests
pnpm --filter worker test

# Smoke tests (production)
make smoke
```

## 🛠️ Available Commands

```bash
make dev              # Start development environment
make dev-logs         # View dev logs
make dev-down         # Stop dev environment

make migrate          # Run database migrations (dev)
make seed             # Seed demo data
make test             # Run all tests

make prod-build       # Build production Docker images
make prod-up          # Start production environment
make prod-down        # Stop production environment
make prod-migrate     # Run migrations (production)
make prod-logs        # View production logs

make backup           # Backup database + files
make restore          # Restore from backup
make smoke            # Run smoke tests
```

## 📦 Database Schema

**47 tables** organized into:

- **Auth & Users**: users, instance_admins, refresh_tokens, invites, password_resets
- **Tenancy**: tenants, tenant_roles, permissions
- **Projects**: projects, project_members, locations
- **Tasks**: tasks, task_assignees, task_dependencies, task_blocks, task_status_history
- **Inspections**: inspections, checklist_templates, checklist_runs, checklist_run_answers
- **Issues**: issues, issue_status_history
- **Deliveries**: deliveries, delivery_items
- **Decisions**: decisions, decision_options, decision_approvals
- **Files**: files, attachment_links
- **Activity**: comments, activity_log
- **Notifications**: notifications, outbox_events, user_notification_settings
- **System**: instance_settings, automation_rules, email_delivery_log

## 🔧 Configuration

### Environment Variables

**Required (minimum):**
```bash
INSTANCE_MASTER_KEY=<32-char-hex>  # For secrets encryption
DOMAIN=siteflow.example.com
BOOTSTRAP_ADMIN_TOKEN=<secure-token>
```

**Database (Docker Compose provides defaults):**
```bash
DATABASE_URL=postgresql://user:pass@postgres:5432/siteflow
REDIS_URL=redis://redis:6379
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

**Optional (configured via UI):**
- SMTP settings (email notifications)
- S3 settings (if using external S3)
- Automation policies
- Branding

### Instance Settings (UI)

InstanceAdmin can configure via `/admin/settings`:
- SMTP credentials (encrypted in DB)
- S3/MinIO credentials
- Automation policies (reminder timings, escalations)
- Branding (logo, colors)
- Security policies

## 🐳 Docker Services

**Development (`docker-compose.dev.yml`):**
- `postgres` - PostgreSQL 15
- `redis` - Redis 7
- `minio` - MinIO (S3)
- Apps run on host with hot-reload

**Production (`docker-compose.prod.yml`):**
- `postgres` - PostgreSQL 15 (with volume)
- `redis` - Redis 7
- `minio` - MinIO (with volume)
- `api` - Fastify backend
- `worker` - BullMQ worker
- `web` - Nginx serving React build
- `nginx` - Reverse proxy

## 📝 License

MIT

## 🤝 Contributing

This is a demonstration project. For production use, review security settings and customize for your needs.

## 📞 Support

For issues and questions, please use GitHub Issues.

---

**Built with ❤️ for construction teams**
