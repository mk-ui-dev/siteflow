/**
 * Tenant Types
 * Multi-tenant isolation and configuration
 */

import type { BaseEntity } from './common.types';

/**
 * Tenant
 * DB: tenants table
 */
export interface Tenant extends BaseEntity {
  name: string;
  slug: string;
}

/**
 * Instance Settings
 * DB: instance_settings table (singleton)
 */
export interface InstanceSettings {
  id: number; // Always 1
  publicJson: {
    smtpConfigured: boolean;
    s3Configured: boolean;
    instanceName: string;
    branding: {
      logoUrl: string | null;
      primaryColor: string;
    };
    policies: {
      passwordMinLength: number;
      sessionTimeoutMinutes: number;
      maxFileSizeMb: number;
      allowedFileTypes: string[];
    };
  };
  secretsEncrypted: Buffer;
  secretsKeyId: string;
  updatedAt: Date;
}
