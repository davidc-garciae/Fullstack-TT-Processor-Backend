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
  const totalAmountCents =
    productAmountCents + ivaAmountCents + BASE_FEE_CENTS + DELIVERY_FEE_CENTS;
  return {
    productAmountCents,
    baseFeeCents: BASE_FEE_CENTS,
    deliveryFeeCents: DELIVERY_FEE_CENTS,
    totalAmountCents,
  };
}
