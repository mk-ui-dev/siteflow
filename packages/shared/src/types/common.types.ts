/**
 * Common Types
 * Shared utility types used across the application
 */

/**
 * Base entity with timestamps
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Entity with soft delete
 */
export interface SoftDeletable {
  deletedAt: Date | null;
}

/**
 * Entity with user tracking
 */
export interface UserTracked {
  createdBy: string;
  updatedBy: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  perPage?: number;
  cursor?: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
    total?: number;
  };
}

/**
 * Sort parameters
 */
export interface SortParams {
  field: string;
  direction: 'ASC' | 'DESC';
}

/**
 * Filter operator
 */
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like';

/**
 * Generic filter
 */
export interface Filter {
  field: string;
  operator: FilterOperator;
  value: any;
}
