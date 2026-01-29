/**
 * Location Types
 * Hierarchical project locations
 */

import type { BaseEntity, SoftDeletable, UserTracked } from './common.types';

/**
 * Location
 * DB: locations table
 */
export interface Location extends BaseEntity, SoftDeletable, UserTracked {
  projectId: string;
  parentId: string | null;
  name: string;
  path: string; // e.g., '/Building A/Floor 1/Unit 101'
}

/**
 * Location with children (tree structure)
 */
export interface LocationTree extends Location {
  children: LocationTree[];
}

/**
 * Location breadcrumb
 */
export interface LocationBreadcrumb {
  id: string;
  name: string;
  path: string;
}
