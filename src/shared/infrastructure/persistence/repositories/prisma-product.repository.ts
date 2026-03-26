import { Injectable } from '@nestjs/common';
import { ProductRepositoryPort } from '../../../domain/ports';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaProductRepository implements ProductRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAllActiveWithStock() {
    const rows = await this.prisma.product.findMany({
      where: { isActive: true },
      include: { stockItem: true },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      priceCents: row.priceCents,
      currency: row.currency,
      ivaPercent: row.ivaPercent,
      isActive: row.isActive,
      stock: row.stockItem
        ? {
            id: row.stockItem.id,
            productId: row.stockItem.productId,
            availableUnits: row.stockItem.availableUnits,
            reservedUnits: row.stockItem.reservedUnits,
          }
        : null,
    }));
  }

  async findById(id: string) {
    const row = await this.prisma.product.findUnique({ where: { id } });
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      priceCents: row.priceCents,
      currency: row.currency,
      ivaPercent: row.ivaPercent,
      isActive: row.isActive,
    };
  }
}
