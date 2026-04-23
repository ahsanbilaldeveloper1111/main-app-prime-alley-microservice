/** Sonar-friendly helpers: avoid nested ternaries in JSX */

export function orderStatusCardAccentColor(status: string | undefined): string {
  const s = status?.toLowerCase() ?? "";
  if (s === "completed") return "#10b981";
  if (s === "pending") return "#f59e0b";
  return "#6c757d";
}

export function leadPotentialBadgeVariant(
  potential: string | undefined,
): "danger" | "warning" | "secondary" {
  if (potential === "Hot") return "danger";
  if (potential === "Warm") return "warning";
  return "secondary";
}

export function orderApprovalBadgeVariant(
  status: string | undefined,
): "success" | "danger" | "warning" {
  const s = status?.toLowerCase() ?? "";
  if (s === "approved") return "success";
  if (s === "rejected") return "danger";
  return "warning";
}

export function fulfillmentBadgeVariant(
  status: string | undefined,
): "success" | "primary" | "secondary" {
  const s = status?.toLowerCase() ?? "";
  if (s.includes("completed") || s.includes("delivered")) return "success";
  if (s.includes("progress")) return "primary";
  return "secondary";
}

export function paymentStatusBadgeVariant(
  status: string | undefined,
): "success" | "warning" | "danger" {
  const s = status?.toLowerCase() ?? "";
  if (s === "paid") return "success";
  if (s === "partial") return "warning";
  return "danger";
}

export function historyEventDisplayLabel(event: string | undefined): string {
  if (event === "created") return "Created";
  if (event === "updated") return "Updated";
  return event ?? "";
}

export function orderListStatusBadgeVariant(
  status: string | undefined,
): "success" | "warning" | "secondary" {
  const s = status?.toLowerCase() ?? "";
  if (s === "completed") return "success";
  if (s === "pending") return "warning";
  return "secondary";
}

export function orderItemsFooterColSpan(items: readonly unknown[]): number {
  const hasDescription = items.some(
    (item: unknown) =>
      item &&
      typeof item === "object" &&
      "description" in item &&
      Boolean((item as { description?: unknown }).description),
  );
  return hasDescription ? 6 : 5;
}

export function formatOrderCurrencyAmount(
  currency: string | undefined,
  amount: string | number | undefined,
): string {
  const cur = currency || "AED";
  const raw =
    typeof amount === "number" ? String(amount) : amount || "0";
  const n = Number.parseFloat(raw);
  return `${cur} ${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatOrderFinalTotalDisplay(order: {
  currency?: string;
  final_amount?: string;
  total_amount?: string;
}): string {
  return formatOrderCurrencyAmount(
    order.currency,
    order.final_amount ?? order.total_amount,
  );
}

export function extensionDisplayName(
  extensions: any[],
  assignee: unknown,
): string {
  const matched = extensions.find(
    (ext: any) => ext?.id == assignee || ext?.extension == assignee,
  );
  return (
    matched?.display_name ||
    matched?.name ||
    (typeof assignee === "string" || typeof assignee === "number"
      ? String(assignee)
      : "Not assigned")
  );
}
