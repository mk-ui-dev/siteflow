export enum DeliveryStatus {
  REQUESTED = 'REQUESTED',
  SCHEDULED = 'SCHEDULED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CONFIRMED = 'CONFIRMED',
}

export interface Delivery {
  id: string;
  projectId: string;
  supplier: string;
  status: DeliveryStatus;
  
  // Dates
  expectedDeliveryDate: Date;
  actualDeliveryDate?: Date;
  
  // Confirmation
  confirmedAt?: Date;
  confirmedBy?: string;
  confirmNotes?: string;
  
  // Notes
  notes?: string;
  
  // Audit
  requestedBy: string;
  createdAt: Date;
  deletedAt?: Date;
  
  // Relations
  items: DeliveryItem[];
}

export interface DeliveryItem {
  id: string;
  deliveryId: string;
  description: string;
  quantity: number;
  unit: string;
  createdAt: Date;
}
