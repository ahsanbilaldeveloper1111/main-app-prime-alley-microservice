import moment from "moment";
import { ModuleSlug } from "@utils/Helper";
import type {
  DealReportFilters,
  LeadConversionReport,
  LeadReportFilters,
  OrderReportFilters,
  OrderRevenueReport,
} from "@utils/crm";

export type CrmReportModuleId = "leads" | "deals" | "orders";

export type ModuleSlugValue = (typeof ModuleSlug)[keyof typeof ModuleSlug];

export function crmInsightsModuleSlug(module: CrmReportModuleId): ModuleSlugValue {
  switch (module) {
    case "leads":
      return ModuleSlug.CRM_LEADS;
    case "deals":
      return ModuleSlug.CRM_DEALS;
    case "orders":
      return ModuleSlug.CRM_ORDERS;
    default:
      return ModuleSlug.CRM_REPORTS;
  }
}

export function crmInsightsStageType(module: CrmReportModuleId): "lead" | "deal" | "order" {
  switch (module) {
    case "leads":
      return "lead";
    case "deals":
      return "deal";
    case "orders":
      return "order";
    default:
      return "lead";
  }
}

export type SharedCrmReportFilterFields = {
  date_from: string;
  date_to: string;
  date_field: "updated_at";
  stage_id?: number;
  owner?: string;
  campaign_id?: number;
};

export function buildSharedCrmReportFilters(params: {
  startDate: string;
  endDate: string;
  selectedStage: number | null;
  selectedOwner: string;
  selectedCampaign: number | null;
}): SharedCrmReportFilterFields {
  return {
    date_from: params.startDate,
    date_to: params.endDate,
    date_field: "updated_at",
    stage_id: params.selectedStage || undefined,
    owner: params.selectedOwner || undefined,
    campaign_id: params.selectedCampaign || undefined,
  };
}

export function toLeadReportFilters(fields: SharedCrmReportFilterFields): LeadReportFilters {
  return fields;
}

export function toDealReportFilters(fields: SharedCrmReportFilterFields): DealReportFilters {
  return fields;
}

export function toOrderReportFilters(fields: SharedCrmReportFilterFields): OrderReportFilters {
  return fields;
}

/** Primitive id/extension only — never stringify arbitrary row objects. */
export function crmInsightsHierarchyUserKey(u: Record<string, unknown>): string | undefined {
  const id = u.id;
  if (typeof id === "string" || typeof id === "number") {
    return id.toString();
  }
  const ext = u.extension;
  if (typeof ext === "string" || typeof ext === "number") {
    return ext.toString();
  }
  return undefined;
}

/** Hierarchy extension rows from GetHierarchyData (shape varies). */
export function resolveCrmInsightsUserDisplayName(
  users: Record<string, unknown>[],
  extension: string | number,
): string {
  if (extension == null || extension === "") {
    return `User ${extension}`;
  }
  const extensionKey = String(extension);
  const user = users.find((u) => crmInsightsHierarchyUserKey(u) === extensionKey) as
    | { display_name?: string; name?: string }
    | undefined;
  if (user) {
    return user.display_name || user.name || `User ${extension}`;
  }
  return `User ${extension}`;
}

export type LeadConversionTableRow = {
  stage: string;
  count: number;
  converted: number;
  conversionRate: string;
};

export function buildLeadConversionTableRows(
  leadConversion: LeadConversionReport | null,
): LeadConversionTableRow[] {
  if (!leadConversion) return [];

  const stageMap = new Map<string, { count: number; converted: number }>();

  leadConversion.by_stage.forEach((item) => {
    const existing = stageMap.get(item.stage) || { count: 0, converted: 0 };
    stageMap.set(item.stage, {
      count: existing.count + Number.parseInt(item.count || "0", 10),
      converted: existing.converted + item.converted,
    });
  });

  return Array.from(stageMap.entries()).map(([stage, data]) => {
    const conversionRate =
      data.count > 0 ? ((data.converted / data.count) * 100).toFixed(2) : "0.00";
    return {
      stage,
      count: data.count,
      converted: data.converted,
      conversionRate,
    };
  });
}

/** Labels total value as $… for AED rows (legacy UI). */
export function formatAedTotalCompact(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
}

export function formatAedAvgCompact(value: number): string {
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
}

/** Aggregates multi-currency monthly rows for the revenue composed chart. */
export function aggregateOrderRevenueByMonthChartPoints(
  byMonth: NonNullable<OrderRevenueReport["by_month"]>,
): Array<{ month: string; orders: number; revenue: number }> {
  const monthMap = new Map<string, { orders: number; revenue: number }>();
  byMonth.forEach((item) => {
    const existing = monthMap.get(item.month) || { orders: 0, revenue: 0 };
    monthMap.set(item.month, {
      orders: existing.orders + item.order_count,
      revenue: existing.revenue + item.total_value,
    });
  });
  return Array.from(monthMap.entries()).map(([month, data]) => ({
    month: new Date(`${month}-01`).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    }),
    orders: data.orders,
    revenue: data.revenue,
  }));
}

export type DateRangePresetResult =
  | { kind: "range"; start: string; end: string }
  | { kind: "custom" }
  | null;

export function resolveCrmDateRangePreset(range: string): DateRangePresetResult {
  const today = moment();
  if (range === "custom") {
    return { kind: "custom" };
  }
  if (range === "this_week") {
    return {
      kind: "range",
      start: today.clone().startOf("week").format("YYYY-MM-DD"),
      end: today.clone().endOf("week").format("YYYY-MM-DD"),
    };
  }
  if (range === "this_month") {
    return {
      kind: "range",
      start: today.clone().startOf("month").format("YYYY-MM-DD"),
      end: today.clone().endOf("month").format("YYYY-MM-DD"),
    };
  }
  if (range === "last_month") {
    return {
      kind: "range",
      start: today.clone().subtract(1, "month").startOf("month").format("YYYY-MM-DD"),
      end: today.clone().subtract(1, "month").endOf("month").format("YYYY-MM-DD"),
    };
  }
  return null;
}

export const CRM_INSIGHTS_PIE_COLORS_LEAD_SOURCE = [
  "#4F46E5",
  "#10b981",
  "#f59e0b",
  "#3b82f6",
  "#8b5cf6",
  "#ef4444",
] as const;

export const CRM_INSIGHTS_FUNNEL_STAGE_COLORS = ["#4F46E5", "#6366f1", "#8b5cf6", "#10b981", "#059669"] as const;

export const CRM_INSIGHTS_LOST_REASON_COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#6b7280", "#9ca3af"] as const;

export const CRM_INSIGHTS_CANCELLATION_COLORS = ["#ef4444", "#f59e0b", "#dc2626", "#b91c1c", "#991b1b"] as const;
