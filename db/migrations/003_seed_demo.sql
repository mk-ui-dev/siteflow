-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SITEFLOW DEMO DATA
-- Migration: 003_seed_demo.sql
-- Purpose: Demonstrable data showcasing workflows, blocks, and RBAC
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1) DEMO TENANT
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO tenants (id, name, slug)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Demo Construction',
  'demo'
)
ON CONFLICT (id) DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2) DEMO USERS
-- Password for all: "demo1234" (Argon2id hash)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO users (id, tenant_id, email, name, password_hash, is_active)
VALUES
  -- GC user
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '11111111-1111-1111-1111-111111111111',
   'gc@demo.local',
   'John GC',
   '$argon2id$v=19$m=65536,t=3,p=4$fakesaltfakesalt$fakehashfakehashfakehashfakehashfakehash',
   true),

  -- Inspector user
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   '11111111-1111-1111-1111-111111111111',
   'inspector@demo.local',
   'Sarah Inspector',
   '$argon2id$v=19$m=65536,t=3,p=4$fakesaltfakesalt$fakehashfakehashfakehashfakehashfakehash',
   true),

  -- SUB user 1
  ('cccccccc-cccc-cccc-cccc-cccccccccccc',
   '11111111-1111-1111-1111-111111111111',
   'sub1@demo.local',
   'Mike Subcontractor',
   '$argon2id$v=19$m=65536,t=3,p=4$fakesaltfakesalt$fakehashfakehashfakehashfakehashfakehash',
   true),

  -- SUB user 2
  ('dddddddd-dddd-dddd-dddd-dddddddddddd',
   '11111111-1111-1111-1111-111111111111',
   'sub2@demo.local',
   'Anna Electrician',
   '$argon2id$v=19$m=65536,t=3,p=4$fakesaltfakesalt$fakehashfakehashfakehashfakehashfakehash',
   true),

  -- Procurement user
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
   '11111111-1111-1111-1111-111111111111',
   'procurement@demo.local',
   'Tom Procurement',
   '$argon2id$v=19$m=65536,t=3,p=4$fakesaltfakesalt$fakehashfakehashfakehashfakehashfakehash',
   true)
ON CONFLICT (id) DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3) DEMO PROJECT
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO projects (id, tenant_id, name, code, created_by, updated_by)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Residential Building Alpha',
  'RBA',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
)
ON CONFLICT (id) DO NOTHING;

-- Project members
INSERT INTO project_members (project_id, user_id, role)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'GC'),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'INSPECTOR'),
  ('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'SUB'),
  ('22222222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'SUB'),
  ('22222222-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'PROCUREMENT')
ON CONFLICT DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4) LOCATIONS (Hierarchical)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO locations (id, project_id, parent_id, name, path, created_by, updated_by)
VALUES
  -- Building root
  ('33333301-0000-0000-0000-000000000000',
   '22222222-2222-2222-2222-222222222222',
   NULL,
   'Building A',
   '/Building A',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),

  -- Floor 1
  ('33333302-0000-0000-0000-000000000000',
   '22222222-2222-2222-2222-222222222222',
   '33333301-0000-0000-0000-000000000000',
   'Floor 1',
   '/Building A/Floor 1',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),

  -- Unit 101
  ('33333303-0000-0000-0000-000000000000',
   '22222222-2222-2222-2222-222222222222',
   '33333302-0000-0000-0000-000000000000',
   'Unit 101',
   '/Building A/Floor 1/Unit 101',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
ON CONFLICT (id) DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 5) TASKS (Demonstrating Blocks)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO tasks (id, project_id, location_id, title, description, status, planned_date, requires_inspection, created_by, updated_by)
VALUES
  -- Task 1: DONE (foundation)
  ('44444401-0000-0000-0000-000000000000',
   '22222222-2222-2222-2222-222222222222',
   '33333302-0000-0000-0000-000000000000',
   'Foundation Work',
   'Complete foundation excavation and concrete pour',
   'DONE',
   '2026-01-20',
   false,
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),

  -- Task 2: PLANNED, blocked by DELIVERY (INV-8)
  ('44444402-0000-0000-0000-000000000000',
   '22222222-2222-2222-2222-222222222222',
   '33333302-0000-0000-0000-000000000000',
   'Concrete Slab Pour',
   'Cannot start until concrete delivery arrives',
   'PLANNED',
   '2026-02-05',
   false,
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),

  -- Task 3: PLANNED, blocked by DECISION (INV-9)
  ('44444403-0000-0000-0000-000000000000',
   '22222222-2222-2222-2222-222222222222',
   '33333303-0000-0000-0000-000000000000',
   'Install HVAC System',
   'Awaiting decision on HVAC brand selection',
   'PLANNED',
   '2026-02-10',
   false,
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),

  -- Task 4: PLANNED, blocked by DEPENDENCY (INV-10)
  ('44444404-0000-0000-0000-000000000000',
   '22222222-2222-2222-2222-222222222222',
   '33333302-0000-0000-0000-000000000000',
   'Framing',
   'Depends on slab pour completion',
   'PLANNED',
   '2026-02-12',
   true,
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),

  -- Task 5: IN_PROGRESS
  ('44444405-0000-0000-0000-000000000000',
   '22222222-2222-2222-2222-222222222222',
   '33333303-0000-0000-0000-000000000000',
   'Electrical Rough-In',
   'Installing conduit and boxes',
   'IN_PROGRESS',
   '2026-02-01',
   true,
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
ON CONFLICT (id) DO NOTHING;

-- Task assignees
INSERT INTO task_assignees (task_id, user_id)
VALUES
  ('44444402-0000-0000-0000-000000000000', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  ('44444403-0000-0000-0000-000000000000', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  ('44444404-0000-0000-0000-000000000000', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  ('44444405-0000-0000-0000-000000000000', 'dddddddd-dddd-dddd-dddd-dddddddddddd')
ON CONFLICT DO NOTHING;

-- Task dependency (Task 4 depends on Task 2)
INSERT INTO task_dependencies (blocked_task_id, blocker_task_id, created_by)
VALUES (
  '44444404-0000-0000-0000-000000000000',
  '44444402-0000-0000-0000-000000000000',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
)
ON CONFLICT DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 6) DELIVERIES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO deliveries (id, project_id, task_id, supplier_name, status, blocks_work, expected_date, created_by, updated_by)
VALUES (
  '55555501-0000-0000-0000-000000000000',
  '22222222-2222-2222-2222-222222222222',
  '44444402-0000-0000-0000-000000000000',
  'ABC Concrete Supply',
  'ORDERED',
  true,
  '2026-02-04',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO delivery_items (delivery_id, item_name, quantity_ordered, unit)
VALUES (
  '55555501-0000-0000-0000-000000000000',
  'Ready-Mix Concrete',
  15.0,
  'cubic meters'
)
ON CONFLICT (id) DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 7) DECISIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO decisions (id, project_id, related_type, related_id, subject, problem, status, blocks_work, decision_owner_id, due_date, created_by, updated_by)
VALUES (
  '66666601-0000-0000-0000-000000000000',
  '22222222-2222-2222-2222-222222222222',
  'TASK',
  '44444403-0000-0000-0000-000000000000',
  'HVAC Brand Selection',
  'Need to choose between Brand A (cheaper) vs Brand B (more efficient)',
  'PENDING_APPROVAL',
  true,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '2026-02-08',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO decision_options (decision_id, title, description, estimated_cost, position)
VALUES
  ('66666601-0000-0000-0000-000000000000', 'Brand A - Budget Option', 'Lower upfront cost', 25000, 1),
  ('66666601-0000-0000-0000-000000000000', 'Brand B - Premium Option', 'Better energy efficiency, 5yr warranty', 32000, 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO decision_approvals (decision_id, approver_id, approved)
VALUES (
  '66666601-0000-0000-0000-000000000000',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  NULL  -- pending approval
)
ON CONFLICT DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 8) TASK BLOCKS (⚡ SOURCE OF TRUTH)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO task_blocks (id, task_id, block_type, scope, ref_entity_type, ref_entity_id, message, is_active, created_by)
VALUES
  -- Task 2: Blocked by DELIVERY (INV-8)
  ('77777701-0000-0000-0000-000000000000',
   '44444402-0000-0000-0000-000000000000',
   'DELIVERY',
   'START',
   'DELIVERY',
   '55555501-0000-0000-0000-000000000000',
   'Waiting for concrete delivery from ABC Concrete Supply',
   true,
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),

  -- Task 3: Blocked by DECISION (INV-9)
  ('77777702-0000-0000-0000-000000000000',
   '44444403-0000-0000-0000-000000000000',
   'DECISION',
   'START',
   'DECISION',
   '66666601-0000-0000-0000-000000000000',
   'Waiting for HVAC brand selection decision',
   true,
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),

  -- Task 4: Blocked by DEPENDENCY (INV-10)
  ('77777703-0000-0000-0000-000000000000',
   '44444404-0000-0000-0000-000000000000',
   'DEPENDENCY',
   'START',
   'TASK',
   '44444402-0000-0000-0000-000000000000',
   'Blocked by task: Concrete Slab Pour',
   true,
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
ON CONFLICT (id) DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 9) ISSUES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO issues (id, project_id, task_id, title, description, status, severity, assignee_id, due_date, created_by, updated_by)
VALUES (
  '88888801-0000-0000-0000-000000000000',
  '22222222-2222-2222-2222-222222222222',
  '44444405-0000-0000-0000-000000000000',
  'Electrical box misalignment',
  'Box installed 50mm off-center from blueprint',
  'ASSIGNED',
  'MEDIUM',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '2026-02-03',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
)
ON CONFLICT (id) DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 10) USER NOTIFICATION SETTINGS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO user_notification_settings (user_id, in_app_enabled, email_enabled, digest_enabled, digest_time, timezone)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true, true, true, '07:00', 'Europe/Warsaw'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', true, true, true, '07:00', 'Europe/Warsaw'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', true, false, true, '07:00', 'Europe/Warsaw'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', true, false, true, '07:00', 'Europe/Warsaw'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', true, true, false, '08:00', 'Europe/Warsaw')
ON CONFLICT (user_id) DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- END OF DEMO DATA
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Demo showcases:
-- ✅ INV-8: Task 2 blocked by Delivery (status=ORDERED)
-- ✅ INV-9: Task 3 blocked by Decision (status=PENDING_APPROVAL)
-- ✅ INV-10: Task 4 blocked by Dependency (Task 2 not DONE)
-- ✅ Flow F1: Planner with tasks for week 2026-02-01 to 2026-02-12
-- ✅ Flow F4: Delivery blocking (Task 2)
-- ✅ Flow F5: Decision blocking (Task 3)
-- ✅ RBAC: 5 users with different roles (GC, INSPECTOR, SUB x2, PROCUREMENT)
