-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SITEFLOW DATABASE SEEDS - SYSTEM DATA
-- Migration: 002_seed_system.sql
-- Contents: Permissions, Role Mappings, Automation Rules, Instance Settings
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1) PERMISSIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO permissions (code, description) VALUES
  -- Instance Admin
  ('instance.manage', 'Manage instance settings (SMTP, S3, policies)'),
  
  -- Projects
  ('project.create', 'Create new projects'),
  ('project.read', 'View project details'),
  ('project.update', 'Edit project details'),
  ('project.delete', 'Delete projects'),
  ('project.members.manage', 'Manage project members'),
  
  -- Tasks
  ('task.create', 'Create tasks'),
  ('task.read', 'View tasks'),
  ('task.read.all', 'View all tasks (not just assigned)'),
  ('task.update', 'Edit tasks'),
  ('task.delete', 'Delete tasks'),
  ('task.plan', 'Plan tasks (set dates, assignees)'),
  ('task.start', 'Start tasks'),
  ('task.complete', 'Mark tasks complete'),
  ('task.dependencies.manage', 'Manage task dependencies'),
  ('task.blocks.manage', 'Manage task blocks'),
  
  -- Inspections
  ('inspection.create', 'Create inspections'),
  ('inspection.read', 'View inspections'),
  ('inspection.update', 'Edit inspections'),
  ('inspection.submit', 'Submit inspections for review'),
  ('inspection.approve', 'Approve inspections'),
  ('inspection.reject', 'Reject inspections'),
  
  -- Issues
  ('issue.create', 'Create issues'),
  ('issue.read', 'View issues'),
  ('issue.read.all', 'View all issues (not just assigned)'),
  ('issue.update', 'Edit issues'),
  ('issue.assign', 'Assign issues'),
  ('issue.fix', 'Mark issues as fixed'),
  ('issue.verify', 'Verify fixed issues'),
  ('issue.close', 'Close issues'),
  
  -- Deliveries
  ('delivery.create', 'Create deliveries'),
  ('delivery.read', 'View deliveries'),
  ('delivery.update', 'Update delivery status'),
  ('delivery.accept', 'Accept deliveries'),
  ('delivery.reject', 'Reject deliveries'),
  
  -- Decisions
  ('decision.create', 'Create decisions'),
  ('decision.read', 'View decisions'),
  ('decision.update', 'Edit decisions'),
  ('decision.approve', 'Approve decisions'),
  
  -- Files & Comments
  ('file.upload', 'Upload files'),
  ('file.read', 'View files'),
  ('file.delete', 'Delete files'),
  ('comment.create', 'Add comments'),
  ('comment.read', 'View comments'),
  ('comment.delete', 'Delete comments')
ON CONFLICT (code) DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2) PROJECT ROLE PERMISSIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- GC (General Contractor) - Full access to project operations
INSERT INTO project_role_permissions (role, permission_id)
SELECT 'GC', id FROM permissions WHERE code IN (
  'project.read', 'project.update', 'project.members.manage',
  'task.create', 'task.read.all', 'task.update', 'task.delete', 
  'task.plan', 'task.start', 'task.complete', 'task.dependencies.manage', 'task.blocks.manage',
  'inspection.create', 'inspection.read', 'inspection.update', 'inspection.submit',
  'issue.create', 'issue.read.all', 'issue.update', 'issue.assign',
  'delivery.create', 'delivery.read', 'delivery.update', 'delivery.accept', 'delivery.reject',
  'decision.create', 'decision.read', 'decision.update', 'decision.approve',
  'file.upload', 'file.read', 'file.delete',
  'comment.create', 'comment.read', 'comment.delete'
)
ON CONFLICT DO NOTHING;

-- SUB (Subcontractor) - Limited to assigned tasks and related entities
INSERT INTO project_role_permissions (role, permission_id)
SELECT 'SUB', id FROM permissions WHERE code IN (
  'project.read',
  'task.read', 'task.start', 'task.update',
  'inspection.read', 'inspection.update',
  'issue.read', 'issue.fix',
  'delivery.read',
  'decision.read',
  'file.upload', 'file.read',
  'comment.create', 'comment.read'
)
ON CONFLICT DO NOTHING;

-- INSPECTOR - Approve/reject inspections, verify/close issues
INSERT INTO project_role_permissions (role, permission_id)
SELECT 'INSPECTOR', id FROM permissions WHERE code IN (
  'project.read',
  'task.read.all',
  'inspection.create', 'inspection.read', 'inspection.update', 'inspection.submit', 
  'inspection.approve', 'inspection.reject',
  'issue.create', 'issue.read.all', 'issue.update', 'issue.verify', 'issue.close',
  'file.upload', 'file.read',
  'comment.create', 'comment.read'
)
ON CONFLICT DO NOTHING;

-- INVESTOR - Read everything, approve decisions
INSERT INTO project_role_permissions (role, permission_id)
SELECT 'INVESTOR', id FROM permissions WHERE code IN (
  'project.read',
  'task.read.all',
  'inspection.read',
  'issue.read.all',
  'delivery.read',
  'decision.create', 'decision.read', 'decision.approve',
  'file.read',
  'comment.create', 'comment.read'
)
ON CONFLICT DO NOTHING;

-- PROCUREMENT - Manage deliveries
INSERT INTO project_role_permissions (role, permission_id)
SELECT 'PROCUREMENT', id FROM permissions WHERE code IN (
  'project.read',
  'task.read.all',
  'delivery.create', 'delivery.read', 'delivery.update', 'delivery.accept', 'delivery.reject',
  'file.upload', 'file.read',
  'comment.create', 'comment.read'
)
ON CONFLICT DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3) DEFAULT AUTOMATION RULES (INSTANCE SCOPE)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO automation_rules (scope, scope_id, rule_type, config, is_active) VALUES
  ('INSTANCE', NULL, 'REMINDER', '{
    "d_minus": [2, 0],
    "entity_types": ["ISSUE", "DECISION", "INSPECTION", "DELIVERY", "TASK"]
  }'::jsonb, true),
  
  ('INSTANCE', NULL, 'ESCALATION', '{
    "issue_overdue_notify_roles": ["GC", "INSPECTOR"],
    "inspection_review_hours": 48
  }'::jsonb, true),
  
  ('INSTANCE', NULL, 'DIGEST', '{
    "include": ["today_tasks", "pending_approvals", "overdue_issues", "expected_deliveries"]
  }'::jsonb, true)
ON CONFLICT DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4) INSTANCE SETTINGS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO instance_settings (id, public_json, secrets_encrypted, secrets_key_id) VALUES
  (1, '{
    "smtp_configured": false,
    "s3_configured": false,
    "branding": {
      "app_name": "SiteFlow",
      "logo_url": null
    },
    "policies": {
      "task_proof_required": true,
      "inspection_timeout_hours": 48,
      "issue_auto_escalate": true
    }
  }'::jsonb, '\\x'::bytea, 'v1')
ON CONFLICT (id) DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- END OF SYSTEM SEEDS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
