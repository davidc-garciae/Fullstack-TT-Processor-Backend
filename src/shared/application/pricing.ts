export const BASE_FEE_CENTS = 1200;
export const DELIVERY_FEE_CENTS = 2000;

export function calculateTotals(
  unitPriceCents: number,
  quantity: number,
  ivaPercent: number,
) {
  const productAmountCents = unitPriceCents * quantity;
  const ivaPerUnitCents = Math.round((unitPriceCents * ivaPercent) / 100);
  const ivaAmountCents = ivaPerUnitCents * quantity;
  const rawTotalAmountCents =
    productAmountCents + ivaAmountCents + BASE_FEE_CENTS + DELIVERY_FEE_CENTS;

  // El medio de pago no acepta montos con "centavos" en COP.
  // Redondeamos hacia arriba al múltiplo de 100 para garantizar integridad del cobro.
  const totalAmountCents = Math.ceil(rawTotalAmountCents / 100) * 100;
  return {
    productAmountCents,
    baseFeeCents: BASE_FEE_CENTS,
    deliveryFeeCents: DELIVERY_FEE_CENTS,
    totalAmountCents,
  };
}
