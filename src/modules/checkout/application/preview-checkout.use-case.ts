import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from '../../../shared/application/ports';
import { calculateTotals } from '../../../shared/application/pricing';
import { Fail, Ok, Result } from '../../../shared/application/result';
import type {
  ProductRepositoryPort,
  StockRepositoryPort,
} from '../../../shared/domain/ports';

type PreviewError = 'PRODUCT_NOT_FOUND' | 'OUT_OF_STOCK';

@Injectable()
export class PreviewCheckoutUseCase {
  constructor(
    @Inject(TOKENS.ProductRepository)
    private readonly productRepository: ProductRepositoryPort,
    @Inject(TOKENS.StockRepository)
    private readonly stockRepository: StockRepositoryPort,
  ) {}

  async execute(input: { productId: string; quantity: number }): Promise<
    Result<
      {
        productId: string;
        quantity: number;
        currency: string;
        productAmountCents: number;
        baseFeeCents: number;
        deliveryFeeCents: number;
        totalAmountCents: number;
      },
      PreviewError
    >
  > {
    const product = await this.productRepository.findById(input.productId);
    if (!product || !product.isActive) {
      return Fail('PRODUCT_NOT_FOUND', 'Product is not available');
    }

    const stock = await this.stockRepository.getByProductId(product.id);
    if (!stock || stock.availableUnits < input.quantity) {
      return Fail('OUT_OF_STOCK', 'Not enough stock for requested quantity');
    }

    const totals = calculateTotals(
      product.priceCents,
      input.quantity,
      product.ivaPercent,
    );
    return Ok({
      productId: product.id,
      quantity: input.quantity,
      currency: product.currency,
      ...totals,
    });
  }
}
