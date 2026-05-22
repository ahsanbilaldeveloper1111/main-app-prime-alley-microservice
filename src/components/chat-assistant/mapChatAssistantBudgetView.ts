import type { ChatUserDetailBudget } from "@utils/chat";

export type ChatAssistantBudgetBarVariant = "success" | "warning" | "danger";

export type ChatAssistantBudgetView = Readonly<{
  usedPct: number;
  spendUsd: string;
  totalUsd: string | null;
  remainingUsd: string | null;
  isExhausted: boolean;
  variant: ChatAssistantBudgetBarVariant;
}>;

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

function parseMoney(value: string | null | undefined): number | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const n = Number.parseFloat(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function formatChatBudgetUsd(
  value: string | null | undefined,
  precise = false,
): string {
  const n = parseMoney(value);
  if (n == null) return "—";
  return precise ? usd4.format(n) : usd2.format(n);
}

/** No progress bar when there is no finite monthly cap. */
export function isChatBudgetUnlimited(budget: ChatUserDetailBudget): boolean {
  const cap = parseMoney(budget.budget);
  if (cap != null) return false;

  if (budget.is_unlimited) return true;
  return String(budget.budget_source ?? "").trim().toLowerCase() === "unlimited";
}

function resolveBarVariant(
  budget: ChatUserDetailBudget,
  usedPct: number,
): ChatAssistantBudgetBarVariant {
  if (budget.is_exhausted) return "danger";
  const threshold = budget.threshold_pct ?? 0;
  if (Number.isFinite(threshold) && usedPct >= threshold) return "warning";
  return "success";
}

export function mapChatAssistantBudgetView(
  budget: ChatUserDetailBudget | undefined,
): ChatAssistantBudgetView | null {
  if (!budget) return null;
  if (isChatBudgetUnlimited(budget)) return null;

  const usedPct = Math.min(100, Math.max(0, budget.used_pct ?? 0));

  const total = parseMoney(budget.budget);
  const spend = parseMoney(budget.spend) ?? 0;
  const remainingFromApi = parseMoney(budget.remaining_usd);
  const remaining =
    remainingFromApi ??
    (total == null ? null : Math.max(0, total - spend));

  return {
    usedPct,
    spendUsd: budget.spend ?? "0",
    totalUsd: budget.budget,
    remainingUsd:
      remaining == null ? null : String(remaining),
    isExhausted: Boolean(budget.is_exhausted),
    variant: resolveBarVariant(budget, usedPct),
  };
}

const BAR_COLORS: Record<ChatAssistantBudgetBarVariant, string> = {
  success: "#059669",
  warning: "#d97706",
  danger: "#dc2626",
};

export function chatAssistantBudgetBarColor(
  variant: ChatAssistantBudgetBarVariant,
): string {
  return BAR_COLORS[variant];
}
