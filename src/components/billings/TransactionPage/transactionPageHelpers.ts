import type { CSSProperties } from "react";
import { transactionPageStyles as s } from "./transactionPageStyles";

function toStatusText(status: unknown): string {
  if (status == null) return "";

  if (typeof status === "string" || typeof status === "number" || typeof status === "boolean") {
    return String(status);
  }

  if (typeof status === "object") {
    const record = status as Record<string, unknown>;
    const candidate =
      record.status ??
      record.value ??
      record.name ??
      record.label;

    if (typeof candidate === "string" || typeof candidate === "number" || typeof candidate === "boolean") {
      return String(candidate);
    }
  }

  return "";
}

function normalizeStatus(status: unknown): string {
  return toStatusText(status).trim().toLowerCase();
}

export function getPaymentStatusBadge(status: unknown): { label: string; style?: CSSProperties } {
  const normalized = normalizeStatus(status);
  if (normalized === "completed") return { label: "Processed", style: s.statusBadgeSuccess };
  if (normalized === "failed") return { label: "Failed", style: s.statusBadgeDanger };
  const label = toStatusText(status).trim();
  return { label: label || "-", style: undefined };
}

export function getPaymentMethodLabel(paymentMethod: unknown): string {
  if (paymentMethod == null) return "-";
  if (typeof paymentMethod !== "string") return "-";

  const normalized = paymentMethod.trim().toLowerCase();
  if (normalized === "stripe") return "Card";

  return paymentMethod.trim() || "-";
}
