export type TransactionStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';

export interface Product {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  ivaPercent: number;
  isActive: boolean;
}

export interface StockItem {
  id: string;
  productId: string;
  availableUnits: number;
  reservedUnits: number;
}

export interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  documentType: string;
  documentNumber: string;
}

export interface Delivery {
  id: string;
  customerId: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  region: string;
  country: string;
  postalCode: string;
  instructions?: string | null;
}

export interface Transaction {
  id: string;
  reference: string;
  productId: string;
  customerId: string;
  deliveryId: string;
  quantity: number;
  productAmountCents: number;
  baseFeeCents: number;
  deliveryFeeCents: number;
  totalAmountCents: number;
  status: TransactionStatus;
  processorTransactionId?: string | null;
  processorStatus?: string | null;
  failureReason?: string | null;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionEvent {
  id: string;
  transactionId: string;
  eventType: string;
  payloadJson: Record<string, unknown>;
  createdAt: Date;
}
