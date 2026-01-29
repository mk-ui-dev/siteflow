/**
 * Delivery Status Enum
 * Defines the lifecycle states of a material/equipment delivery
 * 
 * DB: delivery_status ENUM
 */
export enum DeliveryStatus {
  REQUESTED = 'REQUESTED',
  ORDERED = 'ORDERED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export const DeliveryStatusLabels: Record<DeliveryStatus, string> = {
  [DeliveryStatus.REQUESTED]: 'Requested',
  [DeliveryStatus.ORDERED]: 'Ordered',
  [DeliveryStatus.IN_TRANSIT]: 'In Transit',
  [DeliveryStatus.DELIVERED]: 'Delivered',
  [DeliveryStatus.ACCEPTED]: 'Accepted',
  [DeliveryStatus.REJECTED]: 'Rejected',
};

export const DeliveryStatusColors: Record<DeliveryStatus, string> = {
  [DeliveryStatus.REQUESTED]: 'gray',
  [DeliveryStatus.ORDERED]: 'blue',
  [DeliveryStatus.IN_TRANSIT]: 'yellow',
  [DeliveryStatus.DELIVERED]: 'purple',
  [DeliveryStatus.ACCEPTED]: 'green',
  [DeliveryStatus.REJECTED]: 'red',
};
