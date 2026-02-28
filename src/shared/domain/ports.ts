import {
  Customer,
  Delivery,
  Product,
  StockItem,
  Transaction,
  TransactionStatus,
} from './models';

export interface ProductRepositoryPort {
  findAllActiveWithStock(): Promise<
    Array<Product & { stock: StockItem | null }>
  >;
  findById(id: string): Promise<Product | null>;
}

export interface StockRepositoryPort {
  getByProductId(productId: string): Promise<StockItem | null>;
  decrementAvailable(productId: string, quantity: number): Promise<void>;
}

export interface CustomerRepositoryPort {
  create(input: Omit<Customer, 'id'>): Promise<Customer>;
}

export interface DeliveryRepositoryPort {
  create(input: Omit<Delivery, 'id'>): Promise<Delivery>;
}

export interface TransactionCreateInput {
  reference: string;
  productId: string;
  customerId: string;
  deliveryId: string;
  quantity: number;
  productAmountCents: number;
  baseFeeCents: number;
  deliveryFeeCents: number;
  totalAmountCents: number;
  idempotencyKey: string;
}

export interface TransactionRepositoryPort {
  createPending(input: TransactionCreateInput): Promise<Transaction>;
  findByReference(reference: string): Promise<Transaction | null>;
  findByIdempotencyKey(idempotencyKey: string): Promise<Transaction | null>;
  updateStatus(
    reference: string,
    input: {
      status: TransactionStatus;
      processorTransactionId?: string | null;
      processorStatus?: string | null;
      failureReason?: string | null;
    },
  ): Promise<Transaction>;
  finalizeApprovedWithStock(
    reference: string,
    input: {
      productId: string;
      quantity: number;
      processorTransactionId?: string | null;
      processorStatus?: string | null;
      eventPayload: Record<string, unknown>;
    },
  ): Promise<Transaction>;
  createEvent(
    transactionId: string,
    eventType: string,
    payloadJson: unknown,
  ): Promise<void>;
}

export interface PaymentGatewayResponse {
  status: 'APPROVED' | 'DECLINED' | 'ERROR';
  externalId?: string;
  externalStatus?: string;
  message?: string;
  raw?: Record<string, unknown>;
}

export interface PaymentGatewayPort {
  pay(input: {
    amountInCents: number;
    currency: string;
    cardNumber: string;
    cvc: string;
    expMonth: string;
    expYear: string;
    cardHolder: string;
    installments: number;
    reference: string;
    email: string;
  }): Promise<PaymentGatewayResponse>;
}
