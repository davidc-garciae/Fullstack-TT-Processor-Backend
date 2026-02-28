import { PreviewCheckoutUseCase } from './preview-checkout.use-case';
import type {
  ProductRepositoryPort,
  StockRepositoryPort,
} from '../../../shared/domain/ports';

describe('PreviewCheckoutUseCase', () => {
  it('returns totals when stock is enough', async () => {
    const useCase = new PreviewCheckoutUseCase(
      {
        findById: jest.fn().mockResolvedValue({
          id: 'p1',
          isActive: true,
          priceCents: 10000,
          currency: 'COP',
        }),
      } as ProductRepositoryPort,
      {
        getByProductId: jest.fn().mockResolvedValue({
          productId: 'p1',
          availableUnits: 2,
        }),
      } as StockRepositoryPort,
    );

    const result = await useCase.execute({ productId: 'p1', quantity: 2 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.totalAmountCents).toBe(23200);
    }
  });

  it('fails when product does not exist', async () => {
    const useCase = new PreviewCheckoutUseCase(
      { findById: jest.fn().mockResolvedValue(null) } as ProductRepositoryPort,
      { getByProductId: jest.fn() } as StockRepositoryPort,
    );
    const result = await useCase.execute({ productId: 'x', quantity: 1 });
    expect(result.ok).toBe(false);
  });

  it('fails when stock is insufficient', async () => {
    const useCase = new PreviewCheckoutUseCase(
      {
        findById: jest.fn().mockResolvedValue({
          id: 'p1',
          isActive: true,
          priceCents: 10000,
          currency: 'COP',
        }),
      } as ProductRepositoryPort,
      {
        getByProductId: jest.fn().mockResolvedValue({ availableUnits: 0 }),
      } as StockRepositoryPort,
    );
    const result = await useCase.execute({ productId: 'p1', quantity: 1 });
    expect(result.ok).toBe(false);
  });
});
