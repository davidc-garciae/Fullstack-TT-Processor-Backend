import { PayTransactionUseCase } from './pay-transaction.use-case';
import type {
  PaymentGatewayPort,
  TransactionRepositoryPort,
} from '../../../shared/domain/ports';

describe('PayTransactionUseCase', () => {
  const pendingTx = {
    id: 't1',
    reference: 'TT-1',
    productId: 'p1',
    quantity: 2,
    totalAmountCents: 20000,
    status: 'PENDING',
  };

  it('approves and finalizes payment+stock atomically', async () => {
    const transactionRepository = {
      findByReference: jest.fn().mockResolvedValue(pendingTx),
      finalizeApprovedWithStock: jest.fn().mockResolvedValue({
        ...pendingTx,
        status: 'APPROVED',
        processorStatus: 'APPROVED',
      }),
    };
    const gateway = {
      pay: jest.fn().mockResolvedValue({
        status: 'APPROVED',
        externalId: 'gw-1',
        externalStatus: 'APPROVED',
      }),
    };
    const useCase = new PayTransactionUseCase(
      transactionRepository as TransactionRepositoryPort,
      gateway as PaymentGatewayPort,
    );

    const result = await useCase.execute({
      reference: 'TT-1',
      cardNumber: '4111111111111111',
      cvc: '123',
      expMonth: '12',
      expYear: '2028',
      cardHolder: 'Jane Doe',
      installments: 1,
      email: 'jane@example.com',
    });

    expect(result.ok).toBe(true);
    expect(transactionRepository.finalizeApprovedWithStock).toHaveBeenCalled();
  });

  it('fails when transaction does not exist', async () => {
    const useCase = new PayTransactionUseCase(
      {
        findByReference: jest.fn().mockResolvedValue(null),
      } as TransactionRepositoryPort,
      {} as PaymentGatewayPort,
    );
    const result = await useCase.execute({
      reference: 'x',
      cardNumber: '4111111111111111',
      cvc: '123',
      expMonth: '12',
      expYear: '2028',
      cardHolder: 'Jane Doe',
      installments: 1,
      email: 'jane@example.com',
    });
    expect(result.ok).toBe(false);
  });

  it('returns existing status when transaction is not pending', async () => {
    const useCase = new PayTransactionUseCase(
      {
        findByReference: jest
          .fn()
          .mockResolvedValue({ ...pendingTx, status: 'APPROVED' }),
      } as TransactionRepositoryPort,
      { pay: jest.fn() } as PaymentGatewayPort,
    );
    const result = await useCase.execute({
      reference: 'TT-1',
      cardNumber: '4111111111111111',
      cvc: '123',
      expMonth: '12',
      expYear: '2028',
      cardHolder: 'Jane Doe',
      installments: 1,
      email: 'jane@example.com',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('APPROVED');
    }
  });

  it('returns payment error when gateway fails', async () => {
    const useCase = new PayTransactionUseCase(
      {
        findByReference: jest.fn().mockResolvedValue(pendingTx),
        updateStatus: jest
          .fn()
          .mockResolvedValue({ ...pendingTx, status: 'ERROR' }),
        createEvent: jest.fn().mockResolvedValue(undefined),
      } as TransactionRepositoryPort,
      {
        pay: jest.fn().mockResolvedValue({
          status: 'ERROR',
          message: 'Gateway unavailable',
        }),
      } as PaymentGatewayPort,
    );
    const result = await useCase.execute({
      reference: 'TT-1',
      cardNumber: '4111111111111111',
      cvc: '123',
      expMonth: '12',
      expYear: '2028',
      cardHolder: 'Jane Doe',
      installments: 1,
      email: 'jane@example.com',
    });
    expect(result.ok).toBe(false);
  });

  it('returns payment error when stock finalization fails', async () => {
    const useCase = new PayTransactionUseCase(
      {
        findByReference: jest.fn().mockResolvedValue(pendingTx),
        finalizeApprovedWithStock: jest
          .fn()
          .mockRejectedValue(
            new Error('INSUFFICIENT_STOCK_DURING_FINALIZATION'),
          ),
        updateStatus: jest
          .fn()
          .mockResolvedValue({ ...pendingTx, status: 'ERROR' }),
        createEvent: jest.fn().mockResolvedValue(undefined),
      } as TransactionRepositoryPort,
      {
        pay: jest.fn().mockResolvedValue({
          status: 'APPROVED',
          externalId: 'gw-1',
          externalStatus: 'APPROVED',
        }),
      } as PaymentGatewayPort,
    );
    const result = await useCase.execute({
      reference: 'TT-1',
      cardNumber: '4111111111111111',
      cvc: '123',
      expMonth: '12',
      expYear: '2028',
      cardHolder: 'Jane Doe',
      installments: 1,
      email: 'jane@example.com',
    });
    expect(result.ok).toBe(false);
  });
});
