/**
 * Task Status Enum
 * Defines the lifecycle states of a task
 * 
 * DB: task_status ENUM
 */
export enum TaskStatus {
  NEW = 'NEW',
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  READY_FOR_REVIEW = 'READY_FOR_REVIEW',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export const TaskStatusLabels: Record<TaskStatus, string> = {
  [TaskStatus.NEW]: 'New',
  [TaskStatus.PLANNED]: 'Planned',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.READY_FOR_REVIEW]: 'Ready for Review',
  [TaskStatus.DONE]: 'Done',
  [TaskStatus.CANCELLED]: 'Cancelled',
};

export const TaskStatusColors: Record<TaskStatus, string> = {
  [TaskStatus.NEW]: 'gray',
  [TaskStatus.PLANNED]: 'blue',
  [TaskStatus.IN_PROGRESS]: 'yellow',
  [TaskStatus.READY_FOR_REVIEW]: 'purple',
  [TaskStatus.DONE]: 'green',
  [TaskStatus.CANCELLED]: 'red',
};
