import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from '../../../shared/application/ports';
import type { TransactionRepositoryPort } from '../../../shared/domain/ports';

@Injectable()
export class GetTransactionStatusUseCase {
  constructor(
    @Inject(TOKENS.TransactionRepository)
    private readonly transactionRepository: TransactionRepositoryPort,
  ) {}

  async execute(reference: string) {
    const transaction =
      await this.transactionRepository.findByReference(reference);
    if (!transaction) {
      return null;
    }
    return {
      reference: transaction.reference,
      status: transaction.status,
      processorStatus: transaction.processorStatus,
      totalAmountCents: transaction.totalAmountCents,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }
}
