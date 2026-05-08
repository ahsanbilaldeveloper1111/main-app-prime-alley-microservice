import countries from "world-countries";
import { formatNumber } from "@utils/Helper";
import type {
  CountrySelectOption,
  OverviewDashboardCounters,
  OverviewInvoiceRow,
  OverviewPaymentRow,
  PaymentMethod,
} from "./accountOverviewTypes";

function asUnknownRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

/** Avoid `String(object)` → `[object Object]` when normalizing select options. */
function unknownToPrimitiveString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
}

export function normalizeCurrencyOptionsFromUnknown(
  data: unknown,
): CountrySelectOption[] {
  let list: unknown[] = [];
  if (Array.isArray(data)) {
    list = data;
  } else {
    const root = asUnknownRecord(data);
    if (root && Array.isArray(root.data)) {
      list = root.data;
    }
  }

  const out: CountrySelectOption[] = [];
  for (const item of list) {
    if (typeof item === "string" && item.trim()) {
      const v = item.trim();
      out.push({ value: v, label: v });
      continue;
    }
    const row = asUnknownRecord(item);
    if (!row) continue;
    const code = unknownToPrimitiveString(
      row.code ?? row.currency_code ?? row.currency ?? row.value,
    ).trim();
    if (!code) continue;
    const name = unknownToPrimitiveString(row.name ?? row.label).trim();
    out.push({ value: code, label: name ? `${code} - ${name}` : code });
  }
  const seen = new Set<string>();
  return out.filter((o) => {
    if (seen.has(o.value)) return false;
    seen.add(o.value);
    return true;
  });
}

export function extractPaymentMethodsList(payload: unknown): PaymentMethod[] {
  const root = asUnknownRecord(payload);
  const raw = root?.payment_methods;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x): x is PaymentMethod => x !== null && typeof x === "object",
  );
}

function paymentDateStringFromUnknown(raw: unknown): string | undefined {
  if (typeof raw === "string") return raw;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return String(raw);
  }
  return undefined;
}

function paymentInvoiceRef(
  invoiceNumber: string | undefined,
): OverviewPaymentRow["invoice"] {
  if (invoiceNumber !== undefined) {
    return { invoice_number: invoiceNumber };
  }
  return undefined;
}

export function extractOverviewPayments(payload: unknown): OverviewPaymentRow[] {
  const root = asUnknownRecord(payload);
  const raw = root?.dataList;
  if (!Array.isArray(raw)) return [];
  return raw.map((item): OverviewPaymentRow => {
    const r = asUnknownRecord(item) ?? {};
    const invRoot = asUnknownRecord(r.invoice);
    const invNumRaw = invRoot?.invoice_number;
    const invoiceNumber =
      typeof invNumRaw === "string" || typeof invNumRaw === "number"
        ? String(invNumRaw)
        : undefined;
    const statusRaw = r.status;
    const idRaw = r.id;
    return {
      id: idRaw as OverviewPaymentRow["id"],
      status: typeof statusRaw === "string" ? statusRaw : undefined,
      payment_date: paymentDateStringFromUnknown(r.payment_date),
      invoice: paymentInvoiceRef(invoiceNumber),
    };
  });
}

export function extractOverviewInvoices(payload: unknown): OverviewInvoiceRow[] {
  const root = asUnknownRecord(payload);
  const raw = root?.data;
  if (!Array.isArray(raw)) return [];
  return raw.map((item): OverviewInvoiceRow => {
    const r = asUnknownRecord(item) ?? {};
    const invNum = r.invoice_number;
    return {
      id: r.id as OverviewInvoiceRow["id"],
      invoice_number:
        typeof invNum === "string" || typeof invNum === "number"
          ? String(invNum)
          : "",
      status: typeof r.status === "string" ? r.status : undefined,
      invoice_date:
        typeof r.invoice_date === "string" ? r.invoice_date : undefined,
      currency_code:
        typeof r.currency_code === "string" ? r.currency_code : undefined,
      total_amount: r.total_amount,
    };
  });
}

export function parseOverviewDashboardCounters(
  payload: unknown,
): OverviewDashboardCounters | null {
  if (payload === null || payload === undefined) return null;
  const root = asUnknownRecord(payload);
  if (!root) return null;
  const inv = asUnknownRecord(root.invoices);
  return {
    invoices: inv ? { total_amount: inv.total_amount } : undefined,
  };
}

export function formatUnknownAmount(value: unknown): string {
  return formatNumber(Number(value ?? 0));
}

type WorldCountryRow = { name: { common: string } };

function isWorldCountryRow(value: unknown): value is WorldCountryRow {
  if (value === null || typeof value !== "object") return false;
  const name = (value as WorldCountryRow).name;
  return typeof name?.common === "string";
}

export function buildCountrySelectOptions(): CountrySelectOption[] {
  return countries.filter(isWorldCountryRow).map((country) => ({
    value: country.name.common,
    label: country.name.common,
  }));
}
