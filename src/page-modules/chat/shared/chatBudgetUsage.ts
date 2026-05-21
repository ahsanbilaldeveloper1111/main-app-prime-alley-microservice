export type ChatBudgetUsageRow = Readonly<{
  displayName: string;
  usedPct: number;
  effectiveThresholdPct: number;
  isExhausted: boolean;
  remainingUsd?: string | null;
  budgetSource?: string;
}>;

export type BudgetProgressVariant = "success" | "warning" | "danger";

const usd2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usd4 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

export const pct1 = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function parseBudgetMoney(value: string | null | undefined): number | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const n = Number.parseFloat(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function formatBudgetUsd(
  value: string | number | null | undefined,
  precise = false,
): string {
  if (value == null || value === "") return "—";
  const n = typeof value === "number" ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(n)) return String(value);
  return precise ? usd4.format(n) : usd2.format(n);
}

export function formatBudgetPct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${pct1.format(value)}%`;
}

export function isUnlimitedBudgetSource(source: string | undefined): boolean {
  return String(source ?? "").trim().toLowerCase() === "unlimited";
}

export function clampUsedPct(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function resolveBudgetProgressVariant(
  row: Pick<ChatBudgetUsageRow, "usedPct" | "effectiveThresholdPct" | "isExhausted">,
): BudgetProgressVariant {
  const pct = clampUsedPct(row.usedPct);
  if (row.isExhausted) return "danger";
  if (pct >= row.effectiveThresholdPct) return "warning";
  return "success";
}

export type TenantBudgetAttentionRow = ChatBudgetUsageRow &
  Readonly<{
    userId: string;
    mtdSpend: string;
    effectiveBudgetUsd: string;
  }>;

export type TenantBudgetAggregate = Readonly<{
  limitedUserCount: number;
  unlimitedUserCount: number;
  totalBudgetUsd: number;
  totalSpendUsd: number;
  usedPct: number;
  exhaustedCount: number;
  atThresholdCount: number;
}>;

export function aggregateTenantBudgetRows(
  rows: readonly TenantBudgetAttentionRow[],
): TenantBudgetAggregate | null {
  const limited = rows.filter((r) => !isUnlimitedBudgetSource(r.budgetSource));
  if (limited.length === 0) {
    return null;
  }

  let totalBudgetUsd = 0;
  let totalSpendUsd = 0;
  let exhaustedCount = 0;
  let atThresholdCount = 0;

  for (const row of limited) {
    const budget = parseBudgetMoney(row.effectiveBudgetUsd) ?? 0;
    const spend = parseBudgetMoney(row.mtdSpend) ?? 0;
    totalBudgetUsd += budget;
    totalSpendUsd += spend;
    if (row.isExhausted) {
      exhaustedCount += 1;
    } else if (clampUsedPct(row.usedPct) >= row.effectiveThresholdPct) {
      atThresholdCount += 1;
    }
  }

  const usedPct =
    totalBudgetUsd > 0
      ? Math.min(100, (totalSpendUsd / totalBudgetUsd) * 100)
      : 0;

  return {
    limitedUserCount: limited.length,
    unlimitedUserCount: rows.length - limited.length,
    totalBudgetUsd,
    totalSpendUsd,
    usedPct,
    exhaustedCount,
    atThresholdCount,
  };
}

export function listTenantBudgetAttentionUsers(
  rows: readonly TenantBudgetAttentionRow[],
  limit = 8,
): TenantBudgetAttentionRow[] {
  return rows
    .filter((r) => !isUnlimitedBudgetSource(r.budgetSource))
    .filter(
      (r) =>
        r.isExhausted ||
        clampUsedPct(r.usedPct) >= r.effectiveThresholdPct,
    )
    .sort((a, b) => clampUsedPct(b.usedPct) - clampUsedPct(a.usedPct))
    .slice(0, limit);
}
