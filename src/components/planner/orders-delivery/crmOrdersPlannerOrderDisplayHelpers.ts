/** Planner CRM orders UI — shared display helpers (no `pages/crm` usage). */

export function assignedToLookupKey(assignedTo: unknown): string | number | null {
  if (assignedTo === undefined || assignedTo === null || assignedTo === "") {
    return null;
  }
  if (typeof assignedTo === "object") {
    return null;
  }
  if (typeof assignedTo === "string" || typeof assignedTo === "number") {
    return assignedTo;
  }
  if (typeof assignedTo === "boolean") {
    return Number(assignedTo);
  }
  return null;
}

export type CrmPlannerExtensionDisplayOptions = Readonly<{
  /** When lookup key is missing (e.g. sidebar vs table cell). */
  labelWhenUnassigned?: string;
}>;

export function crmPlannerExtensionDisplayName(
  extensions: any[],
  assignedTo: unknown,
  options?: CrmPlannerExtensionDisplayOptions,
): string {
  const key = assignedToLookupKey(assignedTo);
  if (key === null) {
    return options?.labelWhenUnassigned ?? "Not assigned";
  }
  const match = extensions.find(
    (ext: any) => ext?.id == key || ext?.extension == key,
  );
  if (match?.display_name) return match.display_name;
  if (match?.name) return match.name;
  return String(key);
}

const STATUS_TO_BADGE: Record<string, string> = {
  completed: "success",
  pending: "warning",
};

export function orderStatusBadgeVariant(status: string | undefined): string {
  return STATUS_TO_BADGE[status?.toLowerCase() ?? ""] ?? "secondary";
}

const APPROVAL_TO_BADGE: Record<string, string> = {
  approved: "success",
  rejected: "danger",
};

export function orderApprovalBadgeVariant(status: string | undefined): string {
  return APPROVAL_TO_BADGE[status?.toLowerCase() ?? ""] ?? "warning";
}

export function fulfillmentBadgeVariant(status: string | undefined): string {
  const s = status?.toLowerCase() ?? "";
  if (s.includes("completed") || s.includes("delivered")) return "success";
  if (s.includes("progress")) return "primary";
  return "secondary";
}

const PAYMENT_TO_BADGE: Record<string, string> = {
  paid: "success",
  partial: "warning",
};

export function paymentBadgeVariant(status: string | undefined): string {
  return PAYMENT_TO_BADGE[status?.toLowerCase() ?? ""] ?? "danger";
}

export function leadPotentialBadgeVariant(potential: string | undefined): string {
  if (potential === "Hot") return "danger";
  if (potential === "Warm") return "warning";
  return "secondary";
}

export function formatOrderAmount(viewingOrder: any): string {
  const amount = viewingOrder?.final_amount || viewingOrder?.total_amount;
  if (!amount) return "N/A";
  const cur = viewingOrder?.currency || "AED";
  const n = Number.parseFloat(String(amount)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${cur} ${n}`;
}

export function formatDealValue(relatedDeal: any): string {
  const v = relatedDeal?.net_value || relatedDeal?.grand_total;
  if (!v) return "N/A";
  const cur = relatedDeal?.currency || "AED";
  return `${cur} ${Number.parseFloat(String(v)).toLocaleString()}`;
}
