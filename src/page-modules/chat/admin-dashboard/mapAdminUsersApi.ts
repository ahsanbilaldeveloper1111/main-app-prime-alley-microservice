import type { AdminChatUserRow, AdminChatUsersResponse } from "@utils/chat";

import type { AdminUserBudgetRow } from "./types";

function resolveDisplayName(row: AdminChatUserRow): string {
  const name = row.display_name?.trim();
  if (name) return name;
  return row.user_id?.trim() || "—";
}

function mapUserRow(row: AdminChatUserRow): AdminUserBudgetRow {
  const tenantId = row.tenant_id?.trim() ?? "";
  return {
    tenantId,
    tenantName: tenantId,
    userId: row.user_id ?? "",
    displayName: resolveDisplayName(row),
    monthlyBudgetUsd: row.monthly_budget_usd,
    budgetThresholdPct: row.budget_threshold_pct,
    effectiveBudgetUsd: row.effective_budget_usd ?? "",
    effectiveThresholdPct: row.effective_threshold_pct ?? 0,
    mtdSpend: row.mtd_spend ?? "",
    mtdBaseSpend: row.mtd_base_spend ?? "",
    profitUsd: row.profit_usd ?? "",
    usedPct: row.used_pct ?? 0,
    isExhausted: Boolean(row.is_exhausted),
    budgetSyncedAt: row.budget_synced_at,
    lastSeen: row.last_seen,
  };
}

export function mapAdminUsersApi(data: AdminChatUsersResponse): AdminUserBudgetRow[] {
  return (data.rows ?? []).map(mapUserRow);
}
