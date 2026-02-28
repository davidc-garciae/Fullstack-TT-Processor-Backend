export const TOKENS = {
  ProductRepository: Symbol('ProductRepository'),
  StockRepository: Symbol('StockRepository'),
  CustomerRepository: Symbol('CustomerRepository'),
  DeliveryRepository: Symbol('DeliveryRepository'),
  TransactionRepository: Symbol('TransactionRepository'),
  PaymentGateway: Symbol('PaymentGateway'),
} as const;
