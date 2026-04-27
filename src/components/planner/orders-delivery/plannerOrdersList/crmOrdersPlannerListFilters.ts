import type React from "react";
import type { OrdersUiFilters } from "./crmOrdersPlannerListConstants";
import {
  OPTIONAL_STRING_FILTER_KEYS,
  OPTIONAL_TRUE_FILTER_KEYS,
} from "./crmOrdersPlannerListConstants";

export function setOptionalFilterValue(
  target: Record<string, unknown>,
  key: string,
  value: unknown,
  toStringValue = false,
): void {
  if (!value) {
    delete target[key];
    return;
  }
  if (!toStringValue) {
    target[key] = value;
    return;
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    target[key] = String(value);
    return;
  }
  delete target[key];
}

export function applyActiveFilterState(
  previousFilters: Record<string, unknown>,
  activeFilter: string,
  stages: unknown[],
): { nextFilters: Record<string, unknown>; stageValue: string | null } {
  const nextFilters = { ...previousFilters };

  delete nextFilters.stage_id;
  delete nextFilters.include_archived;
  delete nextFilters.include_lost;

  if (activeFilter === "lost") {
    nextFilters.include_lost = true;
    return { nextFilters, stageValue: null };
  }

  if (activeFilter === "deleted") {
    nextFilters.include_archived = true;
    return { nextFilters, stageValue: null };
  }

  if (activeFilter !== "all") {
    const selectedStage = stages.find((s: any) => s.id.toString() === activeFilter);
    if (selectedStage) {
      const stageId = selectedStage.id.toString();
      nextFilters.stage_id = stageId;
      return { nextFilters, stageValue: stageId };
    }
  }

  return { nextFilters, stageValue: null };
}

export function isValidPlannerOrdersTab(tab: string, stages: unknown[]): boolean {
  if (tab === "all" || tab === "lost" || tab === "deleted") return true;
  return stages.some((s: any) => s.id.toString() === tab);
}

export function buildPlannerOrdersFiltersPayload(
  ordersSearch: string,
  ordersFilters: OrdersUiFilters,
): Record<string, string> {
  const filtersToApply: Record<string, string> = {};
  setOptionalFilterValue(filtersToApply, "search", ordersSearch);
  setOptionalFilterValue(filtersToApply, "assigned_to", ordersFilters.assignedTo, true);
  setOptionalFilterValue(filtersToApply, "order_stage_id", ordersFilters.stage, true);
  setOptionalFilterValue(filtersToApply, "industry", ordersFilters.industry);
  setOptionalFilterValue(filtersToApply, "order_value_min", ordersFilters.orderValueMin, true);
  setOptionalFilterValue(filtersToApply, "order_value_max", ordersFilters.orderValueMax, true);
  setOptionalFilterValue(filtersToApply, "order_approval_status", ordersFilters.orderApprovalStatus);
  setOptionalFilterValue(filtersToApply, "fulfillment_status", ordersFilters.fulfillmentStatus);
  setOptionalFilterValue(filtersToApply, "payment_status", ordersFilters.paymentStatus);
  setOptionalFilterValue(filtersToApply, "date_from", ordersFilters.dateFrom);
  setOptionalFilterValue(filtersToApply, "date_to", ordersFilters.dateTo);
  return filtersToApply;
}

export function syncPlannerOrdersFiltersFromActiveTab(params: {
  activeFilter: string;
  stages: unknown[];
  setCurrentFilters: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  setOrdersFilters: React.Dispatch<React.SetStateAction<OrdersUiFilters>>;
}): void {
  const { stageValue } = applyActiveFilterState({}, params.activeFilter, params.stages);
  params.setCurrentFilters((prev) =>
    applyActiveFilterState(prev, params.activeFilter, params.stages).nextFilters,
  );
  params.setOrdersFilters((prev) => ({ ...prev, stage: stageValue }));
}

export function syncPlannerOrdersActiveTabFromRouter(params: {
  routerReady: boolean;
  routerTab: unknown;
  stages: unknown[];
  activeFilter: string;
  setActiveFilter: React.Dispatch<React.SetStateAction<string>>;
}): void {
  if (!params.routerReady || !params.routerTab) return;
  let tabFromUrl = "";
  if (typeof params.routerTab === "string") {
    tabFromUrl = params.routerTab;
  } else if (Array.isArray(params.routerTab)) {
    tabFromUrl = params.routerTab[0] ?? "";
  }
  if (!tabFromUrl) return;
  const isValidFilter = isValidPlannerOrdersTab(tabFromUrl, params.stages);
  if (isValidFilter && tabFromUrl !== params.activeFilter) {
    params.setActiveFilter(tabFromUrl);
  }
}

export function mergePlannerOrdersSidebarFilters(
  prev: Record<string, unknown>,
  filters: Record<string, unknown>,
): Record<string, unknown> {
  const newFilters = { ...prev };
  if ("is_lost" in filters) {
    newFilters.is_lost = filters.is_lost;
  }
  OPTIONAL_STRING_FILTER_KEYS.forEach((key) => {
    if (!(key in filters)) return;
    const shouldStringify =
      key === "stage_id" ||
      key === "assigned_to" ||
      key === "order_value_min" ||
      key === "order_value_max" ||
      key === "order_stage_id";
    setOptionalFilterValue(newFilters, key, filters[key], shouldStringify);
  });
  OPTIONAL_TRUE_FILTER_KEYS.forEach((key) => {
    if (!(key in filters)) return;
    setOptionalFilterValue(newFilters, key, filters[key] ? true : undefined);
  });
  return newFilters;
}
