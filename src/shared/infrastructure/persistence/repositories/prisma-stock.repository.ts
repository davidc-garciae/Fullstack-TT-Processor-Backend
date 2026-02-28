import { Injectable } from '@nestjs/common';
import { StockRepositoryPort } from '../../../domain/ports';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaStockRepository implements StockRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async getByProductId(productId: string) {
    const row = await this.prisma.stockItem.findUnique({
      where: { productId },
    });
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      productId: row.productId,
      availableUnits: row.availableUnits,
      reservedUnits: row.reservedUnits,
    };
  }

  async decrementAvailable(productId: string, quantity: number) {
    await this.prisma.stockItem.updateMany({
      where: { productId, availableUnits: { gte: quantity } },
      data: { availableUnits: { decrement: quantity } },
    });
  }
}
