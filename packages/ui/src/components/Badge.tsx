import React from 'react';
import { clsx } from 'clsx';
import type { TaskStatus, IssueStatus, InspectionStatus } from '@siteflow/shared';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', size = 'md', className, children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center font-medium rounded-full';
    
    const variantClasses = {
      default: 'bg-gray-100 text-gray-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      info: 'bg-blue-100 text-blue-800',
    };

    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
    };

    return (
      <span
        ref={ref}
        className={clsx(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Status-specific badges
export const TaskStatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => {
  const variantMap: Record<TaskStatus, BadgeProps['variant']> = {
    NEW: 'default',
    PLANNED: 'info',
    IN_PROGRESS: 'warning',
    READY_FOR_REVIEW: 'info',
    DONE: 'success',
    CANCELLED: 'error',
  };

  return <Badge variant={variantMap[status]}>{status.replace('_', ' ')}</Badge>;
};

export const IssueStatusBadge: React.FC<{ status: IssueStatus }> = ({ status }) => {
  const variantMap: Record<IssueStatus, BadgeProps['variant']> = {
    OPEN: 'error',
    ASSIGNED: 'warning',
    FIXED: 'info',
    VERIFIED: 'info',
    CLOSED: 'success',
  };

  return <Badge variant={variantMap[status]}>{status}</Badge>;
};

export const InspectionStatusBadge: React.FC<{ status: InspectionStatus }> = ({ status }) => {
  const variantMap: Record<InspectionStatus, BadgeProps['variant']> = {
    DRAFT: 'default',
    SUBMITTED: 'info',
    IN_REVIEW: 'warning',
    APPROVED: 'success',
    REJECTED: 'error',
  };

  return <Badge variant={variantMap[status]}>{status.replace('_', ' ')}</Badge>;
};
