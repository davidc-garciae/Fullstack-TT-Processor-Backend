import { CreateTransactionUseCase } from './create-transaction.use-case';

describe('CreateTransactionUseCase', () => {
  it('creates a pending transaction', async () => {
    const useCase = new CreateTransactionUseCase(
      {
        findById: jest.fn().mockResolvedValue({
          id: 'p1',
          isActive: true,
          priceCents: 10000,
        }),
      } as any,
      {
        getByProductId: jest.fn().mockResolvedValue({
          productId: 'p1',
          availableUnits: 5,
        }),
      } as any,
      { create: jest.fn().mockResolvedValue({ id: 'c1' }) } as any,
      { create: jest.fn().mockResolvedValue({ id: 'd1' }) } as any,
      {
        findByIdempotencyKey: jest.fn().mockResolvedValue(null),
        createPending: jest.fn().mockResolvedValue({}),
      } as any,
    );

    const result = await useCase.execute({
      productId: 'p1',
      quantity: 1,
      idempotencyKey: 'idemp-1',
      customer: {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        phone: '3000000',
        documentType: 'CC',
        documentNumber: '123',
      },
      delivery: {
        addressLine1: 'Street 1',
        city: 'Medellin',
        region: 'Antioquia',
        country: 'CO',
        postalCode: '050001',
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('PENDING');
      expect(result.value.reference).toContain('TT-');
    }
  });

  it('fails when stock is not enough', async () => {
    const useCase = new CreateTransactionUseCase(
      {
        findById: jest
          .fn()
          .mockResolvedValue({ id: 'p1', isActive: true, priceCents: 100 }),
      } as any,
      {
        getByProductId: jest.fn().mockResolvedValue({ availableUnits: 0 }),
      } as any,
      {} as any,
      {} as any,
      { findByIdempotencyKey: jest.fn().mockResolvedValue(null) } as any,
    );

    const result = await useCase.execute({
      productId: 'p1',
      quantity: 1,
      idempotencyKey: 'idemp-1',
      customer: {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        phone: '3000000',
        documentType: 'CC',
        documentNumber: '123',
      },
      delivery: {
        addressLine1: 'Street 1',
        city: 'Medellin',
        region: 'Antioquia',
        country: 'CO',
        postalCode: '050001',
      },
    });
    expect(result.ok).toBe(false);
  });

  it('fails when product does not exist', async () => {
    const useCase = new CreateTransactionUseCase(
      { findById: jest.fn().mockResolvedValue(null) } as any,
      {} as any,
      {} as any,
      {} as any,
      { findByIdempotencyKey: jest.fn().mockResolvedValue(null) } as any,
    );
    const result = await useCase.execute({
      productId: 'missing',
      quantity: 1,
      idempotencyKey: 'idemp-1',
      customer: {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        phone: '3000000',
        documentType: 'CC',
        documentNumber: '123',
      },
      delivery: {
        addressLine1: 'Street 1',
        city: 'Medellin',
        region: 'Antioquia',
        country: 'CO',
        postalCode: '050001',
      },
    });
    expect(result.ok).toBe(false);
  });

  it('returns existing transaction for duplicated idempotency key', async () => {
    const useCase = new CreateTransactionUseCase(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {
        findByIdempotencyKey: jest.fn().mockResolvedValue({
          reference: 'TT-EXISTING',
          status: 'PENDING',
        }),
      } as any,
    );
    const result = await useCase.execute({
      productId: 'p1',
      quantity: 1,
      idempotencyKey: 'dup-key',
      customer: {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        phone: '3000000',
        documentType: 'CC',
        documentNumber: '123',
      },
      delivery: {
        addressLine1: 'Street 1',
        city: 'Medellin',
        region: 'Antioquia',
        country: 'CO',
        postalCode: '050001',
      },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.reference).toBe('TT-EXISTING');
    }
  });
});
