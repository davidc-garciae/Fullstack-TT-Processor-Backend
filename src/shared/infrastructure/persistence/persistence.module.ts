import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaProductRepository } from './repositories/prisma-product.repository';
import { PrismaStockRepository } from './repositories/prisma-stock.repository';
import { PrismaCustomerRepository } from './repositories/prisma-customer.repository';
import { PrismaDeliveryRepository } from './repositories/prisma-delivery.repository';
import { PrismaTransactionRepository } from './repositories/prisma-transaction.repository';
import { TOKENS } from '../../application/ports';

@Module({
  providers: [
    PrismaService,
    PrismaProductRepository,
    PrismaStockRepository,
    PrismaCustomerRepository,
    PrismaDeliveryRepository,
    PrismaTransactionRepository,
    { provide: TOKENS.ProductRepository, useExisting: PrismaProductRepository },
    { provide: TOKENS.StockRepository, useExisting: PrismaStockRepository },
    {
      provide: TOKENS.CustomerRepository,
      useExisting: PrismaCustomerRepository,
    },
    {
      provide: TOKENS.DeliveryRepository,
      useExisting: PrismaDeliveryRepository,
    },
    {
      provide: TOKENS.TransactionRepository,
      useExisting: PrismaTransactionRepository,
    },
  ],
  exports: [
    PrismaService,
    TOKENS.ProductRepository,
    TOKENS.StockRepository,
    TOKENS.CustomerRepository,
    TOKENS.DeliveryRepository,
    TOKENS.TransactionRepository,
  ],
})
export class PersistenceModule {}
