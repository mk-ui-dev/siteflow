/**
 * Delivery Types
 * Material and equipment delivery management
 */

import type { DeliveryStatus } from '../enums';
import type { BaseEntity, UserTracked } from './common.types';

/**
 * Delivery
 * DB: deliveries table
 */
export interface Delivery extends BaseEntity, UserTracked {
  projectId: string;
  taskId: string | null;
  locationId: string | null;
  supplierName: string;
  status: DeliveryStatus;
  statusReason: string | null;
  blocksWork: boolean; // INV-8: If true + status < DELIVERED → creates task_blocks
  expectedDate: Date | null;
  deliveredAt: Date | null;
}

/**
 * Delivery Item
 * DB: delivery_items table
 */
export interface DeliveryItem extends BaseEntity {
  deliveryId: string;
  itemName: string;
  quantityOrdered: number;
  quantityDelivered: number | null;
  unit: string;
  isDamaged: boolean;
  notes: string | null;
}

/**
 * Delivery with items (enriched)
 */
export interface DeliveryWithItems extends Delivery {
  items: DeliveryItem[];
  totalItems: number;
  totalReceived: number;
  totalDamaged: number;
}
