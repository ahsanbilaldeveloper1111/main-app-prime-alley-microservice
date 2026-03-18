export function formatAedMargin(params: Readonly<{ unitCost: string; priceAed: string }>): string {
  const cost = Number.parseFloat(params.unitCost) || 0;
  const price = Number.parseFloat(params.priceAed) || 0;
  if (price === 0) return "AED 0.00";
  const marginAmount = price - cost;
  const marginPercent = (marginAmount / price) * 100;
  return `AED ${marginAmount.toFixed(2)} (${marginPercent.toFixed(1)}%)`;
}

