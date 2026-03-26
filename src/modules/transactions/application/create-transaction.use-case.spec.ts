import { CreateTransactionUseCase } from './create-transaction.use-case';
import type {
  CustomerRepositoryPort,
  DeliveryRepositoryPort,
  ProductRepositoryPort,
  StockRepositoryPort,
  TransactionRepositoryPort,
} from '../../../shared/domain/ports';

describe('CreateTransactionUseCase', () => {
  it('creates a pending transaction', async () => {
    const useCase = new CreateTransactionUseCase(
      {
        findById: jest.fn().mockResolvedValue({
          id: 'p1',
          isActive: true,
          priceCents: 10000,
          ivaPercent: 19,
        }),
      } as ProductRepositoryPort,
      {
        getByProductId: jest.fn().mockResolvedValue({
          productId: 'p1',
          availableUnits: 5,
        }),
      } as StockRepositoryPort,
      {
        create: jest.fn().mockResolvedValue({ id: 'c1' }),
      } as CustomerRepositoryPort,
      {
        create: jest.fn().mockResolvedValue({ id: 'd1' }),
      } as DeliveryRepositoryPort,
      {
        findByIdempotencyKey: jest.fn().mockResolvedValue(null),
        createPending: jest.fn().mockResolvedValue({}),
      } as TransactionRepositoryPort,
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
          .mockResolvedValue({ id: 'p1', isActive: true, priceCents: 100, ivaPercent: 19 }),
      } as ProductRepositoryPort,
      {
        getByProductId: jest.fn().mockResolvedValue({ availableUnits: 0 }),
      } as StockRepositoryPort,
      {} as CustomerRepositoryPort,
      {} as DeliveryRepositoryPort,
      {
        findByIdempotencyKey: jest.fn().mockResolvedValue(null),
      } as TransactionRepositoryPort,
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
      { findById: jest.fn().mockResolvedValue(null) } as ProductRepositoryPort,
      {} as StockRepositoryPort,
      {} as CustomerRepositoryPort,
      {} as DeliveryRepositoryPort,
      {
        findByIdempotencyKey: jest.fn().mockResolvedValue(null),
      } as TransactionRepositoryPort,
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
      {} as ProductRepositoryPort,
      {} as StockRepositoryPort,
      {} as CustomerRepositoryPort,
      {} as DeliveryRepositoryPort,
      {
        findByIdempotencyKey: jest.fn().mockResolvedValue({
          reference: 'TT-EXISTING',
          status: 'PENDING',
        }),
      } as TransactionRepositoryPort,
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
