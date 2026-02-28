import { Inject, Injectable, Logger } from '@nestjs/common';
import { TOKENS } from '../../../shared/application/ports';
import { Fail, Ok, Result } from '../../../shared/application/result';
import type {
  PaymentGatewayPort,
  TransactionRepositoryPort,
} from '../../../shared/domain/ports';
import type { Transaction } from '../../../shared/domain/models';

type PayTransactionError = 'TRANSACTION_NOT_FOUND' | 'PAYMENT_ERROR';

const sanitizePaymentEventPayload = (input: {
  status: 'APPROVED' | 'DECLINED' | 'ERROR';
  externalId?: string;
  externalStatus?: string;
  message?: string;
}) => ({
  gateway: 'PROCESSOR',
  status: input.status,
  externalId: input.externalId,
  externalStatus: input.externalStatus,
  message: input.message,
});

@Injectable()
export class PayTransactionUseCase {
  private readonly logger = new Logger(PayTransactionUseCase.name);

  constructor(
    @Inject(TOKENS.TransactionRepository)
    private readonly transactionRepository: TransactionRepositoryPort,
    @Inject(TOKENS.PaymentGateway)
    private readonly paymentGateway: PaymentGatewayPort,
  ) {}

  async execute(input: {
    reference: string;
    cardNumber: string;
    cvc: string;
    expMonth: string;
    expYear: string;
    cardHolder: string;
    installments: number;
    email: string;
  }): Promise<
    Result<
      { reference: string; status: string; processorStatus?: string },
      PayTransactionError
    >
  > {
    const transaction = await this.transactionRepository.findByReference(
      input.reference,
    );
    if (!transaction) {
      this.logger.warn(
        `Pay failed: transaction not found reference=${input.reference}`,
      );
      return Fail('TRANSACTION_NOT_FOUND', 'Transaction does not exist');
    }

    if (transaction.status !== 'PENDING') {
      this.logger.log(
        `Pay skipped: transaction already ${transaction.status} reference=${input.reference}`,
      );
      return Ok({
        reference: transaction.reference,
        status: transaction.status,
        processorStatus: transaction.processorStatus ?? undefined,
      });
    }

    const paymentResult = await this.paymentGateway.pay({
      amountInCents: transaction.totalAmountCents,
      currency: 'COP',
      cardNumber: input.cardNumber,
      cvc: input.cvc,
      expMonth: input.expMonth,
      expYear: input.expYear,
      cardHolder: input.cardHolder,
      installments: input.installments,
      reference: transaction.reference,
      email: input.email,
    });

    const gatewayMessage =
      paymentResult.status === 'APPROVED'
        ? ''
        : ` message=${paymentResult.message ?? 'n/a'}`;
    this.logger.log(
      `Payment gateway result: status=${paymentResult.status} reference=${input.reference}${gatewayMessage}`,
    );

    let updated: Transaction;
    if (paymentResult.status === 'APPROVED') {
      try {
        updated = await this.transactionRepository.finalizeApprovedWithStock(
          transaction.reference,
          {
            productId: transaction.productId,
            quantity: transaction.quantity,
            processorTransactionId: paymentResult.externalId,
            processorStatus: paymentResult.externalStatus,
            eventPayload: sanitizePaymentEventPayload(paymentResult),
          },
        );
      } catch (error) {
        const errMsg =
          error instanceof Error ? error.message : 'Stock finalization failure';
        this.logger.error(
          `Stock finalization failed reference=${transaction.reference} error=${errMsg}`,
        );
        const fallback: Transaction =
          await this.transactionRepository.updateStatus(transaction.reference, {
            status: 'ERROR',
            processorTransactionId: paymentResult.externalId,
            processorStatus: paymentResult.externalStatus,
            failureReason:
              error instanceof Error
                ? error.message
                : 'Stock finalization failure',
          });
        await this.transactionRepository.createEvent(
          fallback.id,
          'PAYMENT_RESULT',
          sanitizePaymentEventPayload({
            ...paymentResult,
            status: 'ERROR',
            message: 'Approved payment could not finalize stock atomically',
          }),
        );
        return Fail(
          'PAYMENT_ERROR',
          'Approved payment could not finalize stock atomically',
        );
      }
    } else {
      updated = await this.transactionRepository.updateStatus(
        transaction.reference,
        {
          status: paymentResult.status,
          processorTransactionId: paymentResult.externalId,
          processorStatus: paymentResult.externalStatus,
          failureReason: paymentResult.message,
        },
      );
      await this.transactionRepository.createEvent(
        updated.id,
        'PAYMENT_RESULT',
        sanitizePaymentEventPayload(paymentResult),
      );
    }

    if (paymentResult.status === 'ERROR') {
      this.logger.warn(
        `Pay failed: gateway error reference=${input.reference} message=${paymentResult.message ?? 'n/a'}`,
      );
      return Fail('PAYMENT_ERROR', paymentResult.message ?? 'Payment failed');
    }

    return Ok({
      reference: updated.reference,
      status: updated.status,
      processorStatus: updated.processorStatus ?? undefined,
    });
  }
}
