-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SITEFLOW SYSTEM SEEDS
-- Migration: 002_seed_system.sql
-- Purpose: Initialize permissions, role mappings, automation rules, instance settings
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1) PERMISSIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO permissions (id, code, description) VALUES
  -- Projects
  ('10000000-0000-0000-0000-000000000001', 'project.create', 'Create new projects'),
  ('10000000-0000-0000-0000-000000000002', 'project.update', 'Update project details'),
  ('10000000-0000-0000-0000-000000000003', 'project.delete', 'Delete projects'),
  ('10000000-0000-0000-0000-000000000004', 'project.view', 'View project details'),
  ('10000000-0000-0000-0000-000000000005', 'project.members.manage', 'Manage project members'),

  -- Tasks
  ('10000000-0000-0000-0000-000000000010', 'task.create', 'Create tasks'),
  ('10000000-0000-0000-0000-000000000011', 'task.update', 'Update tasks'),
  ('10000000-0000-0000-0000-000000000012', 'task.delete', 'Delete tasks'),
  ('10000000-0000-0000-0000-000000000013', 'task.view', 'View tasks'),
  ('10000000-0000-0000-0000-000000000014', 'task.plan', 'Plan tasks (set dates, assignees)'),
  ('10000000-0000-0000-0000-000000000015', 'task.start', 'Start tasks'),
  ('10000000-0000-0000-0000-000000000016', 'task.complete', 'Mark tasks as done'),
  ('10000000-0000-0000-0000-000000000017', 'task.assign', 'Assign tasks to users'),

  -- Inspections
  ('10000000-0000-0000-0000-000000000020', 'inspection.create', 'Create inspections'),
  ('10000000-0000-0000-0000-000000000021', 'inspection.view', 'View inspections'),
  ('10000000-0000-0000-0000-000000000022', 'inspection.submit', 'Submit inspections for review'),
  ('10000000-0000-0000-0000-000000000023', 'inspection.approve', 'Approve inspections'),
  ('10000000-0000-0000-0000-000000000024', 'inspection.reject', 'Reject inspections'),

  -- Issues
  ('10000000-0000-0000-0000-000000000030', 'issue.create', 'Create issues'),
  ('10000000-0000-0000-0000-000000000031', 'issue.view', 'View issues'),
  ('10000000-0000-0000-0000-000000000032', 'issue.assign', 'Assign issues'),
  ('10000000-0000-0000-0000-000000000033', 'issue.fix', 'Mark issues as fixed'),
  ('10000000-0000-0000-0000-000000000034', 'issue.verify', 'Verify fixed issues'),
  ('10000000-0000-0000-0000-000000000035', 'issue.close', 'Close issues'),

  -- Deliveries
  ('10000000-0000-0000-0000-000000000040', 'delivery.create', 'Create deliveries'),
  ('10000000-0000-0000-0000-000000000041', 'delivery.view', 'View deliveries'),
  ('10000000-0000-0000-0000-000000000042', 'delivery.update', 'Update delivery status'),
  ('10000000-0000-0000-0000-000000000043', 'delivery.accept', 'Accept deliveries'),
  ('10000000-0000-0000-0000-000000000044', 'delivery.reject', 'Reject deliveries'),

  -- Decisions
  ('10000000-0000-0000-0000-000000000050', 'decision.create', 'Create decisions'),
  ('10000000-0000-0000-0000-000000000051', 'decision.view', 'View decisions'),
  ('10000000-0000-0000-0000-000000000052', 'decision.approve', 'Approve decisions'),
  ('10000000-0000-0000-0000-000000000053', 'decision.reject', 'Reject decisions'),

  -- Files
  ('10000000-0000-0000-0000-000000000060', 'file.upload', 'Upload files'),
  ('10000000-0000-0000-0000-000000000061', 'file.view', 'View files'),
  ('10000000-0000-0000-0000-000000000062', 'file.delete', 'Delete files'),

  -- Comments
  ('10000000-0000-0000-0000-000000000070', 'comment.create', 'Add comments'),
  ('10000000-0000-0000-0000-000000000071', 'comment.view', 'View comments'),
  ('10000000-0000-0000-0000-000000000072', 'comment.delete', 'Delete comments'),

  -- Activity
  ('10000000-0000-0000-0000-000000000080', 'activity.view', 'View activity logs')
ON CONFLICT (id) DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2) PROJECT ROLE PERMISSIONS MAPPING
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- GC (General Contractor) - Full access except instance settings
INSERT INTO project_role_permissions (role, permission_id)
SELECT 'GC', id FROM permissions WHERE code IN (
  'project.view', 'project.update',
  'task.create', 'task.update', 'task.delete', 'task.view', 'task.plan', 'task.start', 'task.complete', 'task.assign',
  'inspection.create', 'inspection.view', 'inspection.submit',
  'issue.create', 'issue.view', 'issue.assign',
  'delivery.create', 'delivery.view', 'delivery.update',
  'decision.create', 'decision.view', 'decision.approve', 'decision.reject',
  'file.upload', 'file.view', 'file.delete',
  'comment.create', 'comment.view', 'comment.delete',
  'activity.view'
)
ON CONFLICT DO NOTHING;

-- INSPECTOR - Inspection approval, issue verification, view all
INSERT INTO project_role_permissions (role, permission_id)
SELECT 'INSPECTOR', id FROM permissions WHERE code IN (
  'project.view',
  'task.view',
  'inspection.view', 'inspection.approve', 'inspection.reject',
  'issue.view', 'issue.verify', 'issue.close',
  'delivery.view',
  'decision.view', 'decision.approve', 'decision.reject',
  'file.view', 'file.upload',
  'comment.create', 'comment.view',
  'activity.view'
)
ON CONFLICT DO NOTHING;

-- SUB (Subcontractor) - Limited to assigned tasks, can upload files, comment
INSERT INTO project_role_permissions (role, permission_id)
SELECT 'SUB', id FROM permissions WHERE code IN (
  'task.view', 'task.start', 'task.update',
  'inspection.view',
  'issue.view', 'issue.fix',
  'file.upload', 'file.view',
  'comment.create', 'comment.view'
)
ON CONFLICT DO NOTHING;

-- INVESTOR - Read-all, decision creation, approval
INSERT INTO project_role_permissions (role, permission_id)
SELECT 'INVESTOR', id FROM permissions WHERE code IN (
  'project.view',
  'task.view',
  'inspection.view',
  'issue.view',
  'delivery.view',
  'decision.create', 'decision.view', 'decision.approve', 'decision.reject',
  'file.view',
  'comment.create', 'comment.view',
  'activity.view'
)
ON CONFLICT DO NOTHING;

-- PROCUREMENT - Delivery management, task/location view
INSERT INTO project_role_permissions (role, permission_id)
SELECT 'PROCUREMENT', id FROM permissions WHERE code IN (
  'project.view',
  'task.view',
  'delivery.create', 'delivery.view', 'delivery.update', 'delivery.accept', 'delivery.reject',
  'file.upload', 'file.view',
  'comment.create', 'comment.view',
  'activity.view'
)
ON CONFLICT DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3) INSTANCE-LEVEL AUTOMATION RULES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO automation_rules (id, scope, scope_id, config, is_active)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  'INSTANCE',
  NULL,
  '{
    "reminder": {
      "enabled": true,
      "d_minus": [2, 0],
      "entity_types": ["ISSUE", "DECISION", "INSPECTION", "DELIVERY", "TASK"]
    },
    "escalation": {
      "enabled": true,
      "issue_overdue_notify_roles": ["GC", "INSPECTOR"],
      "inspection_review_hours": 48
    },
    "digest": {
      "enabled": true,
      "include": [
        "today_tasks",
        "pending_approvals",
        "overdue_issues",
        "expected_deliveries"
      ]
    }
  }'::jsonb,
  true
)
ON CONFLICT (id) DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4) INSTANCE SETTINGS INITIALIZATION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO instance_settings (id, public_json, secrets_encrypted, secrets_key_id)
VALUES (
  1,
  '{
    "smtp_configured": false,
    "s3_configured": false,
    "instance_name": "SiteFlow",
    "branding": {
      "logo_url": null,
      "primary_color": "#3b82f6"
    },
    "policies": {
      "password_min_length": 8,
      "session_timeout_minutes": 1440,
      "max_file_size_mb": 50,
      "allowed_file_types": ["image/*", "application/pdf", ".dwg", ".xlsx"]
    }
  }'::jsonb,
  '\\x'::bytea,
  'v1'
)
ON CONFLICT (id) DO UPDATE SET
  public_json = EXCLUDED.public_json,
  updated_at = now();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- END OF SYSTEM SEEDS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
