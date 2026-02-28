import { GetTransactionStatusUseCase } from './get-transaction-status.use-case';

describe('GetTransactionStatusUseCase', () => {
  it('returns status payload when transaction exists', async () => {
    const now = new Date();
    const useCase = new GetTransactionStatusUseCase({
      findByReference: jest.fn().mockResolvedValue({
        reference: 'TT-1',
        status: 'PENDING',
        processorStatus: null,
        totalAmountCents: 1000,
        createdAt: now,
        updatedAt: now,
      }),
    } as any);

    const result = await useCase.execute('TT-1');
    expect(result?.status).toBe('PENDING');
  });

  it('returns null for unknown reference', async () => {
    const useCase = new GetTransactionStatusUseCase({
      findByReference: jest.fn().mockResolvedValue(null),
    } as any);
    const result = await useCase.execute('x');
    expect(result).toBeNull();
  });
});
