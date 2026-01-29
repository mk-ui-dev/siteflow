-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SITEFLOW DATABASE SCHEMA - PART 1 (CORE)
-- Migration: 001_init_part1.sql
-- Tables: 1-24 (Instance, Tenants, Users, Auth, Projects, Tasks)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1) EXTENSIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2) ENUMS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO $$ BEGIN
  CREATE TYPE project_role AS ENUM (
    'INVESTOR',
    'INSPECTOR',
    'GC',
    'SUB',
    'PROCUREMENT'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM (
    'NEW',
    'PLANNED',
    'IN_PROGRESS',
    'READY_FOR_REVIEW',
    'DONE',
    'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE inspection_status AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'IN_REVIEW',
    'APPROVED',
    'REJECTED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE issue_status AS ENUM (
    'OPEN',
    'ASSIGNED',
    'FIXED',
    'VERIFIED',
    'CLOSED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE delivery_status AS ENUM (
    'REQUESTED',
    'ORDERED',
    'IN_TRANSIT',
    'DELIVERED',
    'ACCEPTED',
    'REJECTED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE decision_status AS ENUM (
    'DRAFT',
    'PENDING_APPROVAL',
    'APPROVED',
    'REJECTED',
    'IMPLEMENTED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE entity_type AS ENUM (
    'TASK',
    'INSPECTION',
    'ISSUE',
    'DELIVERY',
    'DECISION',
    'LOCATION',
    'COMMENT',
    'FILE',
    'PROJECT'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE checklist_item_type AS ENUM (
    'BOOL',
    'TEXT',
    'NUMBER',
    'SELECT',
    'PHOTO'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM (
    'IN_APP',
    'EMAIL'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM (
    'QUEUED',
    'SENT',
    'FAILED',
    'CANCELED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE outbox_status AS ENUM (
    'NEW',
    'PROCESSING',
    'DONE',
    'FAILED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE membership_status AS ENUM (
    'ACTIVE',
    'INVITED',
    'SUSPENDED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE invite_status AS ENUM (
    'PENDING',
    'ACCEPTED',
    'EXPIRED',
    'REVOKED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3) TABLES (1-24: CORE)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Table 1: instance_settings
CREATE TABLE IF NOT EXISTS instance_settings (
  id SMALLINT PRIMARY KEY CHECK (id=1),
  public_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  secrets_encrypted BYTEA NOT NULL DEFAULT '\\x'::bytea,
  secrets_key_id TEXT NOT NULL DEFAULT 'v1',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL
);

COMMENT ON TABLE instance_settings IS 'Global instance configuration (SMTP, S3, policies, branding)';
COMMENT ON COLUMN instance_settings.secrets_encrypted IS 'AES-256-GCM encrypted JSON with SMTP/S3 credentials';

-- Table 2: tenants
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE tenants IS 'Multi-tenant isolation - construction companies';

-- Table 3: users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  membership_status membership_status NOT NULL DEFAULT 'ACTIVE',
  last_login_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ NULL,
  UNIQUE (tenant_id, email)
);

COMMENT ON TABLE users IS 'Users belong to a tenant (invite-only, no public registration)';
COMMENT ON COLUMN users.password_hash IS 'Argon2id hash';

-- Table 4: instance_admins
CREATE TABLE IF NOT EXISTS instance_admins (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE instance_admins IS 'Instance-level administrators (manage instance_settings)';

-- Table 5: permissions
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL
);

COMMENT ON TABLE permissions IS 'System-wide permission definitions (e.g., task.create, inspection.approve)';

-- Table 6: tenant_roles
CREATE TABLE IF NOT EXISTS tenant_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

COMMENT ON TABLE tenant_roles IS 'Custom roles within a tenant (e.g., Admin, Manager)';

-- Table 7: tenant_role_permissions
CREATE TABLE IF NOT EXISTS tenant_role_permissions (
  role_id UUID NOT NULL REFERENCES tenant_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE RESTRICT,
  PRIMARY KEY (role_id, permission_id)
);

COMMENT ON TABLE tenant_role_permissions IS 'Maps tenant roles to permissions';

-- Table 8: user_tenant_roles
CREATE TABLE IF NOT EXISTS user_tenant_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES tenant_roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

COMMENT ON TABLE user_tenant_roles IS 'Assigns tenant-level roles to users';

-- Table 9: invites
CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  status invite_status NOT NULL DEFAULT 'PENDING',
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email, status) DEFERRABLE INITIALLY IMMEDIATE
);

COMMENT ON TABLE invites IS 'Invite-only user registration flow';
COMMENT ON COLUMN invites.token_hash IS 'SHA-256 hash of invite token';

-- Table 10: refresh_tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ NULL,
  ip INET NULL,
  user_agent TEXT NULL
);

COMMENT ON TABLE refresh_tokens IS 'JWT refresh token storage with CSRF protection';
COMMENT ON COLUMN refresh_tokens.token_hash IS 'SHA-256 hash of refresh token';

-- Table 11: password_resets
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE password_resets IS 'Password reset tokens (hashed)';

-- Table 12: login_attempts
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  ip INET NULL,
  succeeded BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE login_attempts IS 'Login audit trail for security monitoring';

-- Table 13: projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL REFERENCES users(id),
  deleted_at TIMESTAMPTZ NULL,
  UNIQUE (tenant_id, name)
);

COMMENT ON TABLE projects IS 'Construction projects within a tenant';

-- Table 14: project_members
CREATE TABLE IF NOT EXISTS project_members (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role project_role NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

COMMENT ON TABLE project_members IS 'User membership in projects with roles (GC, SUB, INSPECTOR, etc.)';

-- Table 15: project_role_permissions
CREATE TABLE IF NOT EXISTS project_role_permissions (
  role project_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE RESTRICT,
  PRIMARY KEY (role, permission_id)
);

COMMENT ON TABLE project_role_permissions IS 'Maps project roles to permissions';

-- Table 16: locations
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id UUID NULL REFERENCES locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL REFERENCES users(id),
  deleted_at TIMESTAMPTZ NULL,
  UNIQUE (project_id, parent_id, name)
);

COMMENT ON TABLE locations IS 'Hierarchical location tree (e.g., Building > Floor > Room)';
COMMENT ON COLUMN locations.path IS 'Materialized path for tree queries';

-- Table 17: tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  location_id UUID NULL REFERENCES locations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status task_status NOT NULL DEFAULT 'NEW',
  priority INT NOT NULL DEFAULT 3,
  planned_date DATE NULL,
  due_date DATE NULL,
  requires_inspection BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL REFERENCES users(id),
  deleted_at TIMESTAMPTZ NULL,
  CHECK (priority BETWEEN 1 AND 5),
  CHECK (due_date IS NULL OR planned_date IS NULL OR due_date >= planned_date)
);

COMMENT ON TABLE tasks IS 'Core work unit - tasks can be blocked, have dependencies, require inspections';
COMMENT ON COLUMN tasks.requires_inspection IS 'INV-3: Cannot complete without APPROVED inspection';

-- Table 18: task_assignees
CREATE TABLE IF NOT EXISTS task_assignees (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, user_id)
);

COMMENT ON TABLE task_assignees IS 'M2M: Tasks can have multiple assignees (SUBs)';

-- Table 19: task_watchers
CREATE TABLE IF NOT EXISTS task_watchers (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, user_id)
);

COMMENT ON TABLE task_watchers IS 'M2M: Users watching task updates';

-- Table 20: task_dependencies
CREATE TABLE IF NOT EXISTS task_dependencies (
  blocked_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  blocker_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES users(id),
  PRIMARY KEY (blocked_task_id, blocker_task_id),
  CHECK (blocked_task_id <> blocker_task_id)
);

COMMENT ON TABLE task_dependencies IS 'Task-to-task dependencies (INV-10: blocker must be DONE)';

-- Table 21: task_blocks (⚡ WITH SCOPE COLUMN)
CREATE TABLE IF NOT EXISTS task_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'START',
  ref_entity_type entity_type NULL,
  ref_entity_id UUID NULL,
  message TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES users(id),
  CHECK (scope IN ('START', 'DONE'))
);

COMMENT ON TABLE task_blocks IS 'Source of truth for task blockages (DELIVERY, DECISION, DEPENDENCY, MANUAL)';
COMMENT ON COLUMN task_blocks.scope IS 'START = blocks task start, DONE = blocks task completion';
COMMENT ON COLUMN task_blocks.block_type IS 'DELIVERY | DECISION | DEPENDENCY | MANUAL';

-- Table 22: task_status_history
CREATE TABLE IF NOT EXISTS task_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  from_status task_status NULL,
  to_status task_status NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  changed_by UUID NULL REFERENCES users(id)
);

COMMENT ON TABLE task_status_history IS 'Audit trail for task status changes';

-- Table 23: tags
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NULL,
  UNIQUE (tenant_id, name)
);

COMMENT ON TABLE tags IS 'Tenant-wide tags for categorizing tasks';

-- Table 24: task_tags
CREATE TABLE IF NOT EXISTS task_tags (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

COMMENT ON TABLE task_tags IS 'M2M: Tasks to Tags';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4) INDEXES (Tables 1-24)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Users & Auth
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_tenant_active ON users(tenant_id) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX idx_invites_token_hash ON invites(token_hash);
CREATE INDEX idx_invites_tenant_status ON invites(tenant_id, status);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_password_resets_user ON password_resets(user_id) WHERE used_at IS NULL;
CREATE INDEX idx_login_attempts_email_created ON login_attempts(email, created_at DESC);

-- Projects
CREATE INDEX idx_projects_tenant ON projects(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_project_members_user ON project_members(user_id) WHERE is_active = true;
CREATE INDEX idx_project_members_project_role ON project_members(project_id, role) WHERE is_active = true;

-- Locations
CREATE INDEX idx_locations_project ON locations(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_locations_parent ON locations(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_locations_path ON locations(path) WHERE deleted_at IS NULL;

-- Tasks
CREATE INDEX idx_tasks_project ON tasks(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_location ON tasks(location_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_status ON tasks(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_planned_date ON tasks(planned_date) WHERE deleted_at IS NULL AND planned_date IS NOT NULL;
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE deleted_at IS NULL AND due_date IS NOT NULL;
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status) WHERE deleted_at IS NULL;

-- Task Relationships
CREATE INDEX idx_task_assignees_user ON task_assignees(user_id);
CREATE INDEX idx_task_watchers_user ON task_watchers(user_id);
CREATE INDEX idx_task_dependencies_blocker ON task_dependencies(blocker_task_id);
CREATE INDEX idx_task_dependencies_blocked ON task_dependencies(blocked_task_id);

-- Task Blocks (⚡ CRITICAL FOR PERFORMANCE)
CREATE INDEX idx_task_blocks_task_active ON task_blocks(task_id) WHERE is_active = true;
CREATE INDEX idx_task_blocks_task_scope ON task_blocks(task_id, scope) WHERE is_active = true;
CREATE INDEX idx_task_blocks_ref_entity ON task_blocks(ref_entity_type, ref_entity_id) WHERE is_active = true;
CREATE INDEX idx_task_blocks_type_active ON task_blocks(block_type) WHERE is_active = true;

-- Task History
CREATE INDEX idx_task_status_history_task ON task_status_history(task_id, changed_at DESC);

-- Tags
CREATE INDEX idx_tags_tenant ON tags(tenant_id);
CREATE INDEX idx_task_tags_tag ON task_tags(tag_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- END OF PART 1 (CORE SCHEMA)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
