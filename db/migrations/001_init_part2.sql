-- ════════════════════════════════════════════════════════════════
-- SITEFLOW DATABASE SCHEMA - PART 2 (DOMAIN)
-- Migration: 001_init_part2.sql
-- Tables: 25-47 (Checklists, Inspections, Issues, Deliveries, Decisions, Files, Notifications, Automations)
-- ════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════
-- CHECKLISTS (Tables 25-28)
-- ════════════════════════════════════════

-- Table 25: checklist_templates
CREATE TABLE IF NOT EXISTS checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  discipline TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES users(id),
  UNIQUE (tenant_id, name, version)
);

COMMENT ON TABLE checklist_templates IS 'Reusable checklist templates for inspections (e.g., Concrete Pour, Electrical Rough-In)';
COMMENT ON COLUMN checklist_templates.discipline IS 'Construction discipline (e.g., Structural, MEP, Finishes)';

-- Table 26: checklist_template_items
CREATE TABLE IF NOT EXISTS checklist_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  item_type checklist_item_type NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  position INT NOT NULL,
  select_options TEXT[] NULL,
  requires_photo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (template_id, position)
);

COMMENT ON TABLE checklist_template_items IS 'Individual checklist items within a template';
COMMENT ON COLUMN checklist_template_items.requires_photo IS 'INV-4: If true, inspection cannot be submitted without photo in attachment_links.meta';

-- Table 27: checklist_runs
CREATE TABLE IF NOT EXISTS checklist_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE RESTRICT,
  completion_required INT NOT NULL DEFAULT 0,
  completion_done INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES users(id)
);

COMMENT ON TABLE checklist_runs IS 'Execution instance of a checklist template';
COMMENT ON COLUMN checklist_runs.completion_required IS 'Number of required items';
COMMENT ON COLUMN checklist_runs.completion_done IS 'Number of completed required items';

-- Table 28: checklist_run_answers
CREATE TABLE IF NOT EXISTS checklist_run_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES checklist_runs(id) ON DELETE CASCADE,
  template_item_id UUID NOT NULL REFERENCES checklist_template_items(id) ON DELETE RESTRICT,
  value_bool BOOLEAN NULL,
  value_text TEXT NULL,
  value_number NUMERIC NULL,
  value_select TEXT NULL,
  is_filled BOOLEAN NOT NULL DEFAULT FALSE,
  answered_at TIMESTAMPTZ NULL,
  answered_by UUID NULL REFERENCES users(id),
  UNIQUE (run_id, template_item_id)
);

COMMENT ON TABLE checklist_run_answers IS 'User answers to checklist items during execution';

-- ════════════════════════════════════════
-- INSPECTIONS (Tables 29-30)
-- ════════════════════════════════════════

-- Table 29: inspections
CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID NULL REFERENCES tasks(id) ON DELETE SET NULL,
  location_id UUID NULL REFERENCES locations(id) ON DELETE SET NULL,
  checklist_run_id UUID NOT NULL REFERENCES checklist_runs(id) ON DELETE RESTRICT,
  status inspection_status NOT NULL DEFAULT 'DRAFT',
  submitted_at TIMESTAMPTZ NULL,
  reviewed_at TIMESTAMPTZ NULL,
  decision_at TIMESTAMPTZ NULL,
  decision_reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL REFERENCES users(id)
);

COMMENT ON TABLE inspections IS 'Formal inspections with checklists - can approve/reject tasks (INV-3, INV-4, INV-5)';
COMMENT ON COLUMN inspections.decision_reason IS 'Reason for APPROVED/REJECTED decision';

-- Table 30: inspection_status_history
CREATE TABLE IF NOT EXISTS inspection_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  from_status inspection_status NULL,
  to_status inspection_status NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  changed_by UUID NULL REFERENCES users(id)
);

COMMENT ON TABLE inspection_status_history IS 'Immutable audit trail for inspection status changes';

-- ════════════════════════════════════════
-- ISSUES (Tables 31-32)
-- ════════════════════════════════════════

-- Table 31: issues
CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID NULL REFERENCES tasks(id) ON DELETE SET NULL,
  inspection_id UUID NULL REFERENCES inspections(id) ON DELETE SET NULL,
  location_id UUID NULL REFERENCES locations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status issue_status NOT NULL DEFAULT 'OPEN',
  severity TEXT NOT NULL DEFAULT 'MEDIUM',
  assignee_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  due_date DATE NULL,
  overdue BOOLEAN NOT NULL DEFAULT FALSE,
  fixed_at TIMESTAMPTZ NULL,
  verified_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL REFERENCES users(id),
  CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))
);

COMMENT ON TABLE issues IS 'Punch-list items from rejected inspections or standalone defects (INV-5, INV-6, INV-7)';
COMMENT ON COLUMN issues.overdue IS 'Auto-set by worker job when due_date < today';

-- Table 32: issue_status_history
CREATE TABLE IF NOT EXISTS issue_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  from_status issue_status NULL,
  to_status issue_status NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  changed_by UUID NULL REFERENCES users(id)
);

COMMENT ON TABLE issue_status_history IS 'Immutable audit trail for issue status changes';

-- ════════════════════════════════════════
-- DELIVERIES (Tables 33-34)
-- ════════════════════════════════════════

-- Table 33: deliveries
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID NULL REFERENCES tasks(id) ON DELETE SET NULL,
  location_id UUID NULL REFERENCES locations(id) ON DELETE SET NULL,
  supplier_name TEXT NOT NULL,
  status delivery_status NOT NULL DEFAULT 'REQUESTED',
  status_reason TEXT NULL,
  blocks_work BOOLEAN NOT NULL DEFAULT FALSE,
  expected_date DATE NULL,
  delivered_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL REFERENCES users(id)
);

COMMENT ON TABLE deliveries IS 'Material/equipment deliveries - can block task start if blocks_work=true (INV-8)';
COMMENT ON COLUMN deliveries.blocks_work IS 'If true and status < DELIVERED, creates task_blocks(scope=START)';

-- Table 34: delivery_items
CREATE TABLE IF NOT EXISTS delivery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity_ordered NUMERIC NOT NULL,
  quantity_delivered NUMERIC NULL,
  unit TEXT NOT NULL,
  is_damaged BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT NULL
);

COMMENT ON TABLE delivery_items IS 'Individual items within a delivery';

-- ════════════════════════════════════════
-- DECISIONS (Tables 35-37)
-- ════════════════════════════════════════

-- Table 35: decisions
CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  related_type entity_type NULL,
  related_id UUID NULL,
  subject TEXT NOT NULL,
  problem TEXT NOT NULL,
  status decision_status NOT NULL DEFAULT 'DRAFT',
  blocks_work BOOLEAN NOT NULL DEFAULT FALSE,
  decision_owner_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  due_date DATE NULL,
  approval_reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL REFERENCES users(id)
);

COMMENT ON TABLE decisions IS 'Decisions requiring approval - can block tasks if blocks_work=true (INV-9)';
COMMENT ON COLUMN decisions.blocks_work IS 'If true and status=PENDING_APPROVAL, creates task_blocks(scope=START)';

-- Table 36: decision_options
CREATE TABLE IF NOT EXISTS decision_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NULL,
  pros TEXT NULL,
  cons TEXT NULL,
  estimated_cost NUMERIC NULL,
  estimated_days INT NULL,
  position INT NOT NULL
);

COMMENT ON TABLE decision_options IS 'Possible options for a decision';

-- Table 37: decision_approvals
CREATE TABLE IF NOT EXISTS decision_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  approved BOOLEAN NULL,
  comment TEXT NULL,
  decided_at TIMESTAMPTZ NULL,
  UNIQUE (decision_id, approver_id)
);

COMMENT ON TABLE decision_approvals IS 'Individual approvals for decisions (any reject = decision rejected)';

-- ════════════════════════════════════════
-- FILES & ATTACHMENTS (Tables 38-39)
-- ════════════════════════════════════════

-- Table 38: files
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_by UUID NOT NULL REFERENCES users(id)
);

COMMENT ON TABLE files IS 'Files stored in MinIO S3 - linked via attachment_links';
COMMENT ON COLUMN files.storage_path IS 'Path in MinIO bucket';

-- Table 39: attachment_links (⚡ WITH meta JSONB FOR CHECKLIST PHOTOS)
CREATE TABLE IF NOT EXISTS attachment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  entity_type entity_type NOT NULL,
  entity_id UUID NOT NULL,
  kind TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES users(id),
  CHECK (kind IN ('BEFORE', 'AFTER', 'PROOF', 'GENERAL'))
);

COMMENT ON TABLE attachment_links IS 'Links files to entities (tasks, inspections, issues, etc.)';
COMMENT ON COLUMN attachment_links.meta IS 'JSONB for checklist photos: {"checklistItemId": "uuid"} (INV-4)';
COMMENT ON COLUMN attachment_links.kind IS 'BEFORE (pre-work), AFTER (post-work), PROOF (evidence), GENERAL';

-- ════════════════════════════════════════
-- COMMENTS (Table 40)
-- ════════════════════════════════════════

-- Table 40: comments
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  entity_type entity_type NOT NULL,
  entity_id UUID NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_at TIMESTAMPTZ NULL,
  updated_by UUID NULL REFERENCES users(id),
  deleted_at TIMESTAMPTZ NULL
);

COMMENT ON TABLE comments IS 'Comments on any entity (tasks, inspections, issues, etc.)';

-- ════════════════════════════════════════
-- ACTIVITY LOG (Table 41)
-- ════════════════════════════════════════

-- Table 41: activity_log
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NULL REFERENCES projects(id) ON DELETE CASCADE,
  entity_type entity_type NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  diff JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL REFERENCES users(id)
);

COMMENT ON TABLE activity_log IS 'Immutable audit trail for all entity changes (INV-11)';
COMMENT ON COLUMN activity_log.diff IS 'JSON diff of changes: {"before": {...}, "after": {...}}';

-- ════════════════════════════════════════
-- OUTBOX & NOTIFICATIONS (Tables 42-45)
-- ════════════════════════════════════════

-- Table 42: outbox_events
CREATE TABLE IF NOT EXISTS outbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status outbox_status NOT NULL DEFAULT 'NEW',
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT NULL,
  processed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE outbox_events IS 'Transactional outbox pattern for reliable async processing (INV-11)';
COMMENT ON COLUMN outbox_events.event_type IS 'e.g., TASK_DONE, INSPECTION_REJECTED, ISSUE_OVERDUE';

-- Table 43: notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NULL REFERENCES projects(id) ON DELETE CASCADE,
  channel notification_channel NOT NULL,
  status notification_status NOT NULL DEFAULT 'QUEUED',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link_entity_type entity_type NULL,
  link_entity_id UUID NULL,
  read_at TIMESTAMPTZ NULL,
  sent_at TIMESTAMPTZ NULL,
  failed_at TIMESTAMPTZ NULL,
  error TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE notifications IS 'User notifications (in-app always, email if SMTP configured)';

-- Table 44: user_notification_settings
CREATE TABLE IF NOT EXISTS user_notification_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  digest_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  digest_time TIME NOT NULL DEFAULT '07:00',
  timezone TEXT NOT NULL DEFAULT 'Europe/Warsaw',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE user_notification_settings IS 'Per-user notification preferences';

-- Table 45: email_delivery_log
CREATE TABLE IF NOT EXISTS email_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NULL REFERENCES notifications(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_at TIMESTAMPTZ NULL,
  failed_at TIMESTAMPTZ NULL,
  error TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE email_delivery_log IS 'Email delivery audit trail';

-- ════════════════════════════════════════
-- AUTOMATIONS (Tables 46-47)
-- ════════════════════════════════════════

-- Table 46: automation_rules
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL,
  scope_id UUID NULL,
  config JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (scope IN ('INSTANCE', 'TENANT', 'PROJECT'))
);

COMMENT ON TABLE automation_rules IS 'Automation policies (reminders, escalations, digests) at instance/tenant/project level';
COMMENT ON COLUMN automation_rules.config IS 'JSONB config: {"reminder": {"d_minus": [2,0]}, "escalation": {...}}';

-- Table 47: job_runs
CREATE TABLE IF NOT EXISTS job_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ NULL,
  status TEXT NOT NULL,
  records_processed INT NULL,
  error TEXT NULL,
  CHECK (status IN ('RUNNING', 'SUCCESS', 'FAILED'))
);

COMMENT ON TABLE job_runs IS 'Worker job execution logs (overdue_scan, reminders, etc.)';

-- ════════════════════════════════════════
-- INDEXES (Tables 25-47)
-- ════════════════════════════════════════

-- Checklists
CREATE INDEX idx_checklist_templates_tenant ON checklist_templates(tenant_id) WHERE is_active = true;
CREATE INDEX idx_checklist_template_items_template ON checklist_template_items(template_id, position);
CREATE INDEX idx_checklist_runs_project ON checklist_runs(project_id);
CREATE INDEX idx_checklist_run_answers_run ON checklist_run_answers(run_id);

-- Inspections
CREATE INDEX idx_inspections_project ON inspections(project_id);
CREATE INDEX idx_inspections_task ON inspections(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX idx_inspections_status ON inspections(status);
CREATE INDEX idx_inspections_checklist_run ON inspections(checklist_run_id);
CREATE INDEX idx_inspection_status_history_inspection ON inspection_status_history(inspection_id, changed_at DESC);

-- Issues
CREATE INDEX idx_issues_project ON issues(project_id);
CREATE INDEX idx_issues_task ON issues(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX idx_issues_inspection ON issues(inspection_id) WHERE inspection_id IS NOT NULL;
CREATE INDEX idx_issues_assignee ON issues(assignee_id) WHERE assignee_id IS NOT NULL;
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_overdue ON issues(overdue) WHERE overdue = true;
CREATE INDEX idx_issues_due_date ON issues(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_issue_status_history_issue ON issue_status_history(issue_id, changed_at DESC);

-- Deliveries
CREATE INDEX idx_deliveries_project ON deliveries(project_id);
CREATE INDEX idx_deliveries_task ON deliveries(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_blocks_work ON deliveries(blocks_work) WHERE blocks_work = true;
CREATE INDEX idx_delivery_items_delivery ON delivery_items(delivery_id);

-- Decisions
CREATE INDEX idx_decisions_project ON decisions(project_id);
CREATE INDEX idx_decisions_status ON decisions(status);
CREATE INDEX idx_decisions_blocks_work ON decisions(blocks_work) WHERE blocks_work = true;
CREATE INDEX idx_decisions_related ON decisions(related_type, related_id) WHERE related_type IS NOT NULL;
CREATE INDEX idx_decision_options_decision ON decision_options(decision_id, position);
CREATE INDEX idx_decision_approvals_decision ON decision_approvals(decision_id);
CREATE INDEX idx_decision_approvals_approver ON decision_approvals(approver_id);

-- Files & Attachments
CREATE INDEX idx_files_project ON files(project_id);
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX idx_attachment_links_entity ON attachment_links(entity_type, entity_id);
CREATE INDEX idx_attachment_links_file ON attachment_links(file_id);
CREATE INDEX idx_attachment_links_kind ON attachment_links(kind);
CREATE INDEX idx_attachment_links_meta_checklist ON attachment_links USING GIN(meta) WHERE meta ? 'checklistItemId';

-- Comments
CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_project ON comments(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_created_by ON comments(created_by);

-- Activity Log
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_activity_log_project ON activity_log(project_id, created_at DESC) WHERE project_id IS NOT NULL;
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);

-- Outbox & Notifications
CREATE INDEX idx_outbox_events_status ON outbox_events(status, available_at) WHERE status = 'NEW';
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_email_delivery_log_notification ON email_delivery_log(notification_id);

-- Automations
CREATE INDEX idx_automation_rules_scope ON automation_rules(scope, scope_id) WHERE is_active = true;
CREATE INDEX idx_job_runs_job_name ON job_runs(job_name, started_at DESC);

-- ════════════════════════════════════════
-- END OF PART 2 (DOMAIN SCHEMA)
-- ════════════════════════════════════════
