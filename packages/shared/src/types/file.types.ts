/**
 * File Types
 * File storage and attachment management
 */

import type { EntityType } from '../enums';
import type { BaseEntity, UserTracked } from './common.types';

/**
 * File
 * DB: files table
 */
export interface File extends BaseEntity {
  projectId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string; // MinIO path
  uploadedAt: Date;
  uploadedBy: string;
}

/**
 * Attachment Link
 * DB: attachment_links table
 */
export interface AttachmentLink extends BaseEntity, UserTracked {
  fileId: string;
  entityType: EntityType;
  entityId: string;
  kind: 'BEFORE' | 'AFTER' | 'PROOF' | 'GENERAL';
  meta: {
    checklistItemId?: string; // INV-4: Maps photo to checklist item
    [key: string]: any;
  };
}

/**
 * Comment
 * DB: comments table
 */
export interface Comment extends BaseEntity, UserTracked, SoftDeletable {
  projectId: string;
  entityType: EntityType;
  entityId: string;
  body: string;
}

import type { SoftDeletable } from './common.types';

/**
 * File with URL (enriched)
 */
export interface FileWithUrl extends File {
  downloadUrl: string;
  thumbnailUrl?: string; // For images
}

/**
 * Comment with author (enriched)
 */
export interface CommentWithAuthor extends Comment {
  author: {
    id: string;
    name: string;
    email: string;
  };
}
