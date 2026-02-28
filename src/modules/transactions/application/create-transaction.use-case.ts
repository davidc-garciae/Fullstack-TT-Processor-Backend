import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from '../../../shared/application/ports';
import { calculateTotals } from '../../../shared/application/pricing';
import { Fail, Ok, Result } from '../../../shared/application/result';
import type {
  CustomerRepositoryPort,
  DeliveryRepositoryPort,
  ProductRepositoryPort,
  StockRepositoryPort,
  TransactionRepositoryPort,
} from '../../../shared/domain/ports';

type CreateTransactionError = 'PRODUCT_NOT_FOUND' | 'OUT_OF_STOCK';

@Injectable()
export class CreateTransactionUseCase {
  constructor(
    @Inject(TOKENS.ProductRepository)
    private readonly productRepository: ProductRepositoryPort,
    @Inject(TOKENS.StockRepository)
    private readonly stockRepository: StockRepositoryPort,
    @Inject(TOKENS.CustomerRepository)
    private readonly customerRepository: CustomerRepositoryPort,
    @Inject(TOKENS.DeliveryRepository)
    private readonly deliveryRepository: DeliveryRepositoryPort,
    @Inject(TOKENS.TransactionRepository)
    private readonly transactionRepository: TransactionRepositoryPort,
  ) {}

  async execute(input: {
    productId: string;
    quantity: number;
    idempotencyKey: string;
    customer: {
      fullName: string;
      email: string;
      phone: string;
      documentType: string;
      documentNumber: string;
    };
    delivery: {
      addressLine1: string;
      addressLine2?: string;
      city: string;
      region: string;
      country: string;
      postalCode: string;
      instructions?: string;
    };
  }): Promise<
    Result<{ reference: string; status: string }, CreateTransactionError>
  > {
    const existingByIdempotency =
      await this.transactionRepository.findByIdempotencyKey(input.idempotencyKey);
    if (existingByIdempotency) {
      return Ok({
        reference: existingByIdempotency.reference,
        status: existingByIdempotency.status,
      });
    }

    const product = await this.productRepository.findById(input.productId);
    if (!product || !product.isActive) {
      return Fail('PRODUCT_NOT_FOUND', 'Product is not available');
    }

    const stock = await this.stockRepository.getByProductId(input.productId);
    if (!stock || stock.availableUnits < input.quantity) {
      return Fail('OUT_OF_STOCK', 'Not enough stock for requested quantity');
    }

    const customer = await this.customerRepository.create(input.customer);
    const delivery = await this.deliveryRepository.create({
      customerId: customer.id,
      ...input.delivery,
    });
    const totals = calculateTotals(product.priceCents, input.quantity);
    const reference = `TT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    try {
      await this.transactionRepository.createPending({
        reference,
        productId: input.productId,
        customerId: customer.id,
        deliveryId: delivery.id,
        quantity: input.quantity,
        idempotencyKey: input.idempotencyKey,
        ...totals,
      });
    } catch {
      const existingAfterRace =
        await this.transactionRepository.findByIdempotencyKey(
          input.idempotencyKey,
        );
      if (existingAfterRace) {
        return Ok({
          reference: existingAfterRace.reference,
          status: existingAfterRace.status,
        });
      }
      throw new Error('Unable to create transaction');
    }

    return Ok({ reference, status: 'PENDING' });
  }
}
