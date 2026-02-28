import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from '../../shared/application/ports';
import type { ProductRepositoryPort } from '../../shared/domain/ports';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(TOKENS.ProductRepository)
    private readonly productRepository: ProductRepositoryPort,
  ) {}

  async findAll() {
    const products = await this.productRepository.findAllActiveWithStock();
    return products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      priceCents: product.priceCents,
      currency: product.currency,
      stockAvailable: product.stock?.availableUnits ?? 0,
    }));
  }

  async findOne(id: string) {
    return this.productRepository.findById(id);
  }
}
