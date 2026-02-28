import { Module } from '@nestjs/common';
import { PersistenceModule } from '../../shared/infrastructure/persistence/persistence.module';
import { PaymentsModule } from '../../shared/infrastructure/payments/payments.module';
import { CreateTransactionUseCase } from './application/create-transaction.use-case';
import { GetTransactionStatusUseCase } from './application/get-transaction-status.use-case';
import { PayTransactionUseCase } from './application/pay-transaction.use-case';
import { TransactionsController } from './transactions.controller';

@Module({
  imports: [PersistenceModule, PaymentsModule],
  controllers: [TransactionsController],
  providers: [
    CreateTransactionUseCase,
    PayTransactionUseCase,
    GetTransactionStatusUseCase,
  ],
})
export class TransactionsModule {}
