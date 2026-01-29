/**
 * Application Limits
 */

export const LIMITS = {
  // Files
  MAX_FILE_SIZE_MB: 50,
  MAX_FILES_PER_UPLOAD: 10,
  ALLOWED_FILE_TYPES: ['image/*', 'application/pdf', '.dwg', '.xlsx', '.docx'],

  // Tasks
  MAX_TASK_ASSIGNEES: 10,
  MAX_TASK_TAGS: 5,
  MAX_TASK_DEPENDENCIES: 20,

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Strings
  MAX_TASK_TITLE_LENGTH: 500,
  MAX_TASK_DESCRIPTION_LENGTH: 5000,
  MAX_COMMENT_LENGTH: 2000,

  // Checklists
  MAX_CHECKLIST_ITEMS: 100,

  // Passwords
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 72, // Argon2 limit

  // Session
  SESSION_TIMEOUT_MINUTES: 1440, // 24 hours
  REFRESH_TOKEN_DAYS: 30,
} as const;
