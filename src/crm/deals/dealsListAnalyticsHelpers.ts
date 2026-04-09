export type DealsListAnalyticsRow = {
  stage?: string;
  dealType?: string;
  value: unknown;
  rawData?: { stage?: { is_won?: boolean } };
  isLost?: boolean;
  approvalStatus?: string;
};

export function computeDealsListAnalytics(
  transformedDeals: DealsListAnalyticsRow[],
  summaryTiles: unknown,
  totalDeals: number,
) {
  const total = summaryTiles ? totalDeals : transformedDeals.length;
  const won = transformedDeals.filter(
    (d) =>
      d.stage?.toLowerCase().includes("won") || d.rawData?.stage?.is_won,
  ).length;
  const inNegotiation = transformedDeals.filter((d) =>
    d.stage?.toLowerCase().includes("negotiation"),
  ).length;

  const totalValue = transformedDeals.reduce((sum, d) => {
    const value =
      Number.parseFloat(
        String(d.value).replaceAll(/[^0-9.-]/g, ""),
      ) || 0;
    return sum + value;
  }, 0);

  const stageCounts: Record<string, number> = {};
  transformedDeals.forEach((d) => {
    const stage = d.stage || "No Stage";
    stageCounts[stage] = (stageCounts[stage] || 0) + 1;
  });

  const dealTypeCounts: Record<string, number> = {};
  transformedDeals.forEach((d) => {
    const type = d.dealType || "new_sale";
    dealTypeCounts[type] = (dealTypeCounts[type] || 0) + 1;
  });

  return {
    total,
    won,
    inNegotiation,
    totalValue,
    stageCounts,
    dealTypeCounts,
  };
}

export type TabFilterCountsOptions = {
  /** Deals list includes a "rejected" tab with a fallback count; Approvals does not. */
  includeRejectedCount?: boolean;
};

export function computeDealsListTabFilterCounts(
  transformed: DealsListAnalyticsRow[],
  tabTotals: Record<string, number>,
  summaryTiles: {
    total_deals?: number;
    lost_deals?: number;
    deleted_deals?: number;
  } | null,
  totalDeals: number,
  stages: Array<{ id: number | string }>,
  options: TabFilterCountsOptions = {},
): Record<string, number> {
  const counts: Record<string, number> = {
    all:
      tabTotals.all ??
      summaryTiles?.total_deals ??
      totalDeals ??
      transformed.length,
    lost:
      tabTotals.lost ??
      summaryTiles?.lost_deals ??
      transformed.filter((d) => d.isLost).length,
    deleted: tabTotals.deleted ?? summaryTiles?.deleted_deals ?? 0,
  };

  if (options.includeRejectedCount) {
    counts.rejected =
      tabTotals.rejected ??
      transformed.filter((d) => d.approvalStatus === "rejected").length;
  }

  stages.forEach((stage) => {
    counts[stage.id] = tabTotals[stage.id] ?? 0;
  });

  return counts;
}
