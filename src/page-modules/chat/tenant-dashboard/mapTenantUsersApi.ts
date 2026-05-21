import type { TenantChatUserRow, TenantChatUsersResponse } from "@utils/chat";

import type { TenantUserBudgetRow } from "./types";

const BUDGET_SOURCE_LABELS: Record<string, string> = {
  user: "User override",
  tenant_default: "Tenant default",
  global_default: "Global default",
  unlimited: "Unlimited",
};

function formatBudgetSourceLabel(source: string): string {
  const key = source.trim();
  return BUDGET_SOURCE_LABELS[key] ?? (key || "—");
}

function resolveDisplayName(row: TenantChatUserRow): string {
  const name = row.display_name?.trim();
  if (name) return name;
  return row.user_id?.trim() || "—";
}

function mapUserRow(row: TenantChatUserRow): TenantUserBudgetRow {
  const source = String(row.budget_source ?? "").trim();
  return {
    userId: row.user_id ?? "",
    displayName: resolveDisplayName(row),
    monthlyBudgetUsd: row.monthly_budget_usd,
    budgetThresholdPct: row.budget_threshold_pct,
    effectiveBudgetUsd: row.effective_budget_usd ?? "",
    effectiveThresholdPct: row.effective_threshold_pct ?? 0,
    mtdSpend: row.mtd_spend ?? "",
    remainingUsd: row.remaining_usd ?? "",
    usedPct: row.used_pct ?? 0,
    isExhausted: Boolean(row.is_exhausted),
    budgetSource: source,
    budgetSourceLabel: formatBudgetSourceLabel(source),
    budgetSyncedAt: row.budget_synced_at,
    lastSeen: row.last_seen,
  };
}

export function mapTenantUsersApi(
  data: TenantChatUsersResponse,
): TenantUserBudgetRow[] {
  return (data.rows ?? []).map(mapUserRow);
}
