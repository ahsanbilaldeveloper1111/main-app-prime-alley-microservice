import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Form } from "react-bootstrap";
import {
  downloadInvoicePdf,
  getInvoice,
  getInvoices,
} from "@utils/accounts";
import type { InvoiceData } from "@utils/accounts";
import { GlobalDateTimeFormat } from "@utils/Helper";
import moment from "moment";
import { useSession } from "next-auth/react";
import InvoiceViewModal, { type InvoiceViewData } from "@components/billings/InvoiceViewModal";
import { BILLING_FONT } from "@components/billings/shared/styles";
import { useInvoicePaymentModal } from "@components/billings/InvoicePaymentModal";
import { getMinifiedCompanies } from "@utils/crm";
import { toast } from "react-toastify";
import { getErrorMessage } from "@utils/errors";
import GenericTable from "@components/GenericTable";
import type { FilterPill, ToolbarConfig, TableColumn, TableAction } from "@components/GenericTable";

const font = BILLING_FONT;

const toInvoiceViewData = (invoice: InvoiceData): InvoiceViewData => ({
  ...(invoice as unknown as InvoiceViewData),
  company: {
    ...(invoice.company as unknown as NonNullable<InvoiceViewData["company"]>),
    crm_company_id: invoice.company?.crm_company_id ?? undefined,
  },
});

const toggleStringSelection = (list: readonly string[], value: string): string[] => {
  if (!list.includes(value)) return [...list, value];
  const next: string[] = [];
  for (const item of list) {
    if (item !== value) next.push(item);
  }
  return next;
};

/** Human-readable labels for filter options; API/filter state keeps snake_case values. */
function formatBillingHistoryFilterLabel(option: string): string {
  if (option === "All Statuses" || option === "All Payments") return option;
  if (option.includes("_")) {
    return option
      .split("_")
      .map((part) =>
        part.length === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      )
      .join(" ");
  }
  return option.charAt(0).toUpperCase() + option.slice(1).toLowerCase();
}

// ── Shared styles ──────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: font,
    color: "#141414",
    backgroundColor: "#f5f5f5",
    minHeight: "100vh",
    padding: "0 0 40px 0",
  },
  visaChip: {
    background: "#1a1f71",
    color: "#fff",
    fontSize: 9,
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: 3,
    letterSpacing: 0.5,
    display: "inline-block",
    marginRight: 6,
  },
};

// ── Filter options ─────────────────────────────────────────────────────────────
const DATE_RANGE_OPTIONS = ["Last 30 days", "Last 3 months", "Last 6 months", "Last 12 months", "Custom range"] as const;
const STATUS_OPTIONS = ["All Statuses", "paid", "partially_paid", "pending", "overdue"] as const;
const ORDER_OPTIONS = ["Order issued", "Order amended", "Order cancelled"] as const;
const INVOICE_OPTIONS = ["Invoice issued", "Invoice credited", "Invoice voided"] as const;
const CREDIT_OPTIONS = ["Credit applied", "Credit issued", "Credit expired"] as const;
const REFUND_OPTIONS = ["Refund issued", "Refund pending"] as const;
const USAGE_LIMITS_OPTIONS = ["Credits used", "Credits added", "Limit changed"] as const;

function computeDateRange(option: string): { dateFrom: string; dateTo: string } | null {
  const today = moment();
  const dateTo = today.format("YYYY-MM-DD");

  if (option === "Last 30 days") {
    return { dateFrom: today.clone().subtract(30, "days").format("YYYY-MM-DD"), dateTo };
  }
  if (option === "Last 3 months") {
    return { dateFrom: today.clone().subtract(3, "months").format("YYYY-MM-DD"), dateTo };
  }
  if (option === "Last 6 months") {
    return { dateFrom: today.clone().subtract(6, "months").format("YYYY-MM-DD"), dateTo };
  }
  if (option === "Last 12 months") {
    return { dateFrom: today.clone().subtract(12, "months").format("YYYY-MM-DD"), dateTo };
  }

  return null;
}

// ── Filter pill content helpers ─────────────────────────────────────────────────
function MultiSelectPillContent({
  options,
  selected,
  onToggle,
}: Readonly<{
  options: readonly string[];
  selected: readonly string[];
  onToggle: (opt: string) => void;
}>) {
  return (
    <div style={{ minWidth: 180 }}>
      {options.map((opt) => {
        const isSelected = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            style={{
              width: "100%",
              textAlign: "left",
              background: "none",
              border: "none",
              padding: "8px 16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 14,
              fontFamily: font,
              backgroundColor: isSelected ? "#f0fafa" : "transparent",
              color: isSelected ? "rgb(0,97,98)" : "#141414",
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                border: `2px solid ${isSelected ? "rgb(0,97,98)" : "#ccc"}`,
                borderRadius: 3,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isSelected ? "rgb(0,97,98)" : "transparent",
                flexShrink: 0,
              }}
            >
              {isSelected && (
                <svg width="8" height="8" viewBox="0 0 8 8">
                  <polyline points="1,4 3,6 7,2" stroke="#fff" strokeWidth="1.5" fill="none" />
                </svg>
              )}
            </span>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function DateRangePillContent({
  options,
  selectedOption,
  dateFrom,
  dateTo,
  onChangeOption,
  onChangeDateFrom,
  onChangeDateTo,
  onClear,
}: Readonly<{
  options: readonly string[];
  selectedOption: string;
  dateFrom: string;
  dateTo: string;
  onChangeOption: (val: string) => void;
  onChangeDateFrom: (val: string) => void;
  onChangeDateTo: (val: string) => void;
  onClear: () => void;
}>) {
  const isCustom = selectedOption === "Custom range";
  const hasValue = selectedOption !== "" || (dateFrom !== "" && dateTo !== "");

  return (
    <div style={{ minWidth: 240, padding: "4px 0" }}>
      {hasValue && (
        <div style={{ display: "flex", justifyContent: "flex-end", paddingRight: 8, marginBottom: 4 }}>
          <button
            type="button"
            onClick={onClear}
            style={{
              border: "none",
              background: "transparent",
              color: "rgb(0,97,98)",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: font,
              fontSize: 12,
            }}
          >
            Clear
          </button>
        </div>
      )}
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChangeOption(opt)}
          style={{
            width: "100%",
            textAlign: "left",
            background: "none",
            border: "none",
            padding: "8px 12px",
            cursor: "pointer",
            fontSize: 14,
            fontFamily: font,
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderRadius: 6,
            backgroundColor: selectedOption === opt ? "#f0fafa" : "transparent",
            color: selectedOption === opt ? "rgb(0,97,98)" : "#141414",
          }}
        >
          <span
            style={{
              width: 14,
              height: 14,
              border: `2px solid ${selectedOption === opt ? "rgb(0,97,98)" : "#ccc"}`,
              borderRadius: 50,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: selectedOption === opt ? "rgb(0,97,98)" : "transparent",
              flexShrink: 0,
            }}
          />
          {opt}
        </button>
      ))}
      {isCustom && (
        <div style={{ paddingTop: 8, borderTop: "1px solid #eee", padding: "8px 8px 4px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: "#666", fontFamily: font, fontWeight: 700, marginBottom: 4 }}>From</div>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => onChangeDateFrom(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc", fontFamily: font, fontSize: 13 }}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#666", fontFamily: font, fontWeight: 700, marginBottom: 4 }}>To</div>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => onChangeDateTo(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc", fontFamily: font, fontSize: 13 }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



// ── Table row type ─────────────────────────────────────────────────────────────
type InvoiceBillingRow = {
  _id: string;
  _type: "invoice";
  date: string;
  invoiceNumber: string;
  products: string;
  amount: string;
  balance: string;
  status: string;
  payment_method: string;
  _invoiceId: number;
};

type PaymentBillingRow = {
  _id: string;
  _type: "payment";
  date: string;
  invoiceNumber: string;
  products: string;
  amount: string;
  balance: string;
  status: string;
  payment_method: string;
  _paymentMethodType: string;
  _paymentProvider: string;
};

type BillingRow = InvoiceBillingRow | PaymentBillingRow;

type BillingHistoryDateRangeDropdownProps = Readonly<{
  closeMenu: () => void;
  dateRangeOption: string;
  dateFrom: string;
  dateTo: string;
  setDateRangeOption: React.Dispatch<React.SetStateAction<string>>;
  setDateFrom: React.Dispatch<React.SetStateAction<string>>;
  setDateTo: React.Dispatch<React.SetStateAction<string>>;
}>;

type BillingMultiSelectPillConfig = Readonly<{
  id: string;
  label: string;
  options: readonly string[];
  selected: readonly string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
}>;

type BillingHistoryFilterPillsArgs = Readonly<{
  dateRangeOption: string;
  dateFrom: string;
  dateTo: string;
  setDateRangeOption: React.Dispatch<React.SetStateAction<string>>;
  setDateFrom: React.Dispatch<React.SetStateAction<string>>;
  setDateTo: React.Dispatch<React.SetStateAction<string>>;
  statusFilter: string;
  setStatusFilter: React.Dispatch<React.SetStateAction<string>>;
  ordersSelected: string[];
  setOrdersSelected: React.Dispatch<React.SetStateAction<string[]>>;
  invoicesSelected: string[];
  setInvoicesSelected: React.Dispatch<React.SetStateAction<string[]>>;
  creditsSelected: string[];
  setCreditsSelected: React.Dispatch<React.SetStateAction<string[]>>;
  refundsSelected: string[];
  setRefundsSelected: React.Dispatch<React.SetStateAction<string[]>>;
  usageLimitsSelected: string[];
  setUsageLimitsSelected: React.Dispatch<React.SetStateAction<string[]>>;
}>;

function isInvoiceBillingRow(row: BillingRow): row is InvoiceBillingRow {
  return row._type === "invoice";
}

function isPaymentBillingRow(row: BillingRow): row is PaymentBillingRow {
  return row._type === "payment";
}

function getDateRangeActiveLabel(
  option: string,
  from: string,
  to: string,
): string | undefined {
  if (option !== "") {
    return option;
  }
  if (from !== "" && to !== "") {
    return `${from} – ${to}`;
  }
  return undefined;
}

function BillingHistoryDateRangeDropdown({
  closeMenu,
  dateRangeOption,
  dateFrom,
  dateTo,
  setDateRangeOption,
  setDateFrom,
  setDateTo,
}: BillingHistoryDateRangeDropdownProps) {
  return (
    <DateRangePillContent
      options={DATE_RANGE_OPTIONS}
      selectedOption={dateRangeOption}
      dateFrom={dateFrom}
      dateTo={dateTo}
      onChangeOption={(opt) => {
        setDateRangeOption(opt);
        if (opt === "Custom range") {
          if (dateFrom === "" && dateTo === "") {
            const today = moment().format("YYYY-MM-DD");
            setDateFrom(today);
            setDateTo(today);
          }
          return;
        }
        const computed = computeDateRange(opt);
        if (computed === null) {
          setDateFrom("");
          setDateTo("");
          return;
        }
        setDateFrom(computed.dateFrom);
        setDateTo(computed.dateTo);
      }}
      onChangeDateFrom={(value) => {
        setDateRangeOption("Custom range");
        setDateFrom(value);
        if (dateTo !== "" && value !== "" && value > dateTo) {
          setDateTo(value);
        }
      }}
      onChangeDateTo={(value) => {
        setDateRangeOption("Custom range");
        setDateTo(value);
        if (dateFrom !== "" && value !== "" && value < dateFrom) {
          setDateFrom(value);
        }
      }}
      onClear={() => {
        setDateRangeOption("");
        setDateFrom("");
        setDateTo("");
        closeMenu();
      }}
    />
  );
}

function getDateRangeDropdownContent(
  args: Pick<
    BillingHistoryFilterPillsArgs,
    | "dateRangeOption"
    | "dateFrom"
    | "dateTo"
    | "setDateRangeOption"
    | "setDateFrom"
    | "setDateTo"
  >,
): (context: { closeMenu: () => void }) => React.ReactNode {
  return function renderDateRangeDropdown(context: { closeMenu: () => void }) {
    return (
      <BillingHistoryDateRangeDropdown
        closeMenu={context.closeMenu}
        dateRangeOption={args.dateRangeOption}
        dateFrom={args.dateFrom}
        dateTo={args.dateTo}
        setDateRangeOption={args.setDateRangeOption}
        setDateFrom={args.setDateFrom}
        setDateTo={args.setDateTo}
      />
    );
  };
}

function buildMultiSelectPill(config: BillingMultiSelectPillConfig): FilterPill {
  const selectedCount = config.selected.length;
  return {
    id: config.id,
    label: config.label,
    showDropdown: true,
    active: selectedCount > 0,
    activeLabel: selectedCount > 0 ? `${selectedCount} selected` : undefined,
    onClear: selectedCount > 0 ? () => config.setSelected([]) : undefined,
    dropdownContent: (
      <MultiSelectPillContent
        options={config.options}
        selected={config.selected}
        onToggle={(opt) =>
          config.setSelected((prev) => toggleStringSelection(prev, opt))
        }
      />
    ),
  };
}

function buildBillingHistoryFilterPills(
  args: BillingHistoryFilterPillsArgs,
): FilterPill[] {
  const dateRangeActive =
    args.dateRangeOption !== "" ||
    (args.dateFrom !== "" && args.dateTo !== "");
  const dateRangeActiveLabel = getDateRangeActiveLabel(
    args.dateRangeOption,
    args.dateFrom,
    args.dateTo,
  );

  return [
    {
      id: "bill-date-range",
      label: "Date range",
      showDropdown: true,
      active: dateRangeActive,
      activeLabel: dateRangeActiveLabel,
      onClear: dateRangeActive
        ? () => {
            args.setDateRangeOption("");
            args.setDateFrom("");
            args.setDateTo("");
          }
        : undefined,
      dropdownContent: getDateRangeDropdownContent({
        dateRangeOption: args.dateRangeOption,
        dateFrom: args.dateFrom,
        dateTo: args.dateTo,
        setDateRangeOption: args.setDateRangeOption,
        setDateFrom: args.setDateFrom,
        setDateTo: args.setDateTo,
      }),
    },
    {
      id: "bill-status",
      label: "Status",
      showDropdown: true,
      active: args.statusFilter !== "" && args.statusFilter !== "All Statuses",
      activeLabel:
        args.statusFilter !== "" && args.statusFilter !== "All Statuses"
          ? formatBillingHistoryFilterLabel(args.statusFilter)
          : undefined,
      onClear:
        args.statusFilter !== "" && args.statusFilter !== "All Statuses"
          ? () => args.setStatusFilter("All Statuses")
          : undefined,
      dropdownOptions: STATUS_OPTIONS.map((opt) => ({
        label: formatBillingHistoryFilterLabel(opt),
        value: opt,
        onClick: () => args.setStatusFilter(opt),
      })),
    },
    buildMultiSelectPill({
      id: "bill-orders",
      label: "Orders",
      options: ORDER_OPTIONS,
      selected: args.ordersSelected,
      setSelected: args.setOrdersSelected,
    }),
    buildMultiSelectPill({
      id: "bill-invoices",
      label: "Invoices",
      options: INVOICE_OPTIONS,
      selected: args.invoicesSelected,
      setSelected: args.setInvoicesSelected,
    }),
    buildMultiSelectPill({
      id: "bill-credits",
      label: "Credits",
      options: CREDIT_OPTIONS,
      selected: args.creditsSelected,
      setSelected: args.setCreditsSelected,
    }),
    buildMultiSelectPill({
      id: "bill-refunds",
      label: "Refunds",
      options: REFUND_OPTIONS,
      selected: args.refundsSelected,
      setSelected: args.setRefundsSelected,
    }),
    buildMultiSelectPill({
      id: "bill-usage-limits",
      label: "Usage & Limits",
      options: USAGE_LIMITS_OPTIONS,
      selected: args.usageLimitsSelected,
      setSelected: args.setUsageLimitsSelected,
    }),
  ];
}

const BILLING_NAV_ITEMS = [
  { label: "Overview", href: "/billing" },
  { label: "Invoices", href: "/billing-invoices" },
  { label: "Payments", href: "/billing-payments" },
  { label: "Subscriptions", href: "/billing-subscription" },
];

function getPrimaryPaymentMethodType(payment: any): string {
  const directTypes = payment?.payment_method_types;
  if (Array.isArray(directTypes) && directTypes.length > 0) {
    return String(directTypes[0] ?? "").trim();
  }

  const gatewayTypes = payment?.gateway_response?.payment_method_types;
  if (Array.isArray(gatewayTypes) && gatewayTypes.length > 0) {
    return String(gatewayTypes[0] ?? "").trim();
  }

  return "";
}

function buildPaymentMethodDisplay(
  paymentMethodType: string,
  paymentProvider: string,
): string {
  if (paymentMethodType !== "" && paymentProvider !== "") {
    return `${formatBillingHistoryFilterLabel(paymentMethodType)} via ${formatBillingHistoryFilterLabel(paymentProvider)}`;
  }
  if (paymentMethodType !== "") {
    return formatBillingHistoryFilterLabel(paymentMethodType);
  }
  if (paymentProvider !== "") {
    return formatBillingHistoryFilterLabel(paymentProvider);
  }
  return "";
}

function buildInvoiceRow(invoice: any): InvoiceBillingRow {
  return {
    _id: `invoice-${invoice.id}`,
    _type: "invoice",
    date: invoice.created_at ? moment(invoice.created_at).format(GlobalDateTimeFormat) : "",
    invoiceNumber: String(invoice.invoice_number ?? ""),
    products: (invoice.items as any[])
      ?.map((item: any) => item?.product?.name)
      .filter(Boolean)
      .join(", ") || "",
    amount: `${invoice.currency_code || "AED"} ${invoice.total_amount ?? 0}`,
    balance: `${invoice.currency_code || "AED"} ${invoice.amount_due ?? 0}`,
    status: String(invoice.status ?? ""),
    payment_method: "",
    _invoiceId: Number(invoice.id),
  };
}

function buildPaymentRow(payment: any, invoice: any): PaymentBillingRow {
  const paymentProvider = String(payment?.payment_method ?? "").trim();
  const paymentMethodType = getPrimaryPaymentMethodType(payment);
  const paymentMethodDisplay = buildPaymentMethodDisplay(
    paymentMethodType,
    paymentProvider,
  );
  const paymentDate = payment?.payment_date ?? payment?.created_at;
  return {
    _id: `payment-${payment.id}`,
    _type: "payment",
    date: paymentDate ? moment(paymentDate).format(GlobalDateTimeFormat) : "",
    invoiceNumber: String(invoice.invoice_number ?? ""),
    products: payment.notes || "",
    amount: `${payment?.currency_code || "AED"} ${payment?.amount ?? 0}`,
    balance: "—",
    status: "—",
    payment_method: paymentMethodDisplay,
    _paymentMethodType: paymentMethodType,
    _paymentProvider: paymentProvider,
  };
}

// ── Table columns ──────────────────────────────────────────────────────────────
const BILLING_COLUMNS: TableColumn<BillingRow>[] = [
  {
    key: "date",
    label: "Date",
    type: "text",
    width: "160px",
  },
  {
    key: "_type",
    label: "Type",
    width: "140px",
    render: (row) => {
      if (row._type === "invoice") {
        return <span style={{ fontWeight: 500 }}>Invoice issued</span>;
      }
      return <span style={{ color: "#666" }}>Payment processed</span>;
    },
  },
  {
    key: "invoiceNumber",
    label: "Invoice #",
    width: "120px",
    render: (row) => `#${row.invoiceNumber}`,
  },
  {
    key: "products",
    label: "Products / Notes",
    type: "text",
  },
  {
    key: "amount",
    label: "Amount",
    width: "150px",
    type: "text",
  },
  {
    key: "balance",
    label: "Balance / Paid",
    width: "150px",
    type: "text",
  },
  {
    key: "status",
    label: "Status",
    width: "130px",
    render: (row) => {
      if (row._type === "payment") return <span style={{ color: "#666" }}>—</span>;
      const statusVal = row.status.toLowerCase();
      const colorMap: Record<string, string> = {
        paid: "#007a5a",
        partially_paid: "#b45309",
        pending: "#b45309",
        overdue: "#c0392b",
      };
      const bgMap: Record<string, string> = {
        paid: "#d1fae5",
        partially_paid: "#fef3c7",
        pending: "#fef3c7",
        overdue: "#fee2e2",
      };
      const color = colorMap[statusVal] ?? "#141414";
      const bg = bgMap[statusVal] ?? "#f0f0f0";
      return (
        <span
          style={{
            display: "inline-block",
            padding: "2px 10px",
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600,
            fontFamily: font,
            background: bg,
            color,
            textTransform: "capitalize",
          }}
        >
          {formatBillingHistoryFilterLabel(row.status)}
        </span>
      );
    },
  },
  {
    key: "payment_method",
    label: "Payment Method",
    width: "200px",
    render: (row) => {
      if (!row.payment_method) return <span style={{ color: "#ccc" }}>—</span>;
      if (!isPaymentBillingRow(row)) return <span style={{ color: "#ccc" }}>—</span>;
      const methodChipLabel = row._paymentMethodType
        ? row._paymentMethodType.toUpperCase()
        : "PAY";
      return (
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={s.visaChip}>{methodChipLabel}</span>
          <div>
            <div style={{ fontSize: 13, fontFamily: font, color: "#141414" }}>
              {row.payment_method}
            </div>
          </div>
        </div>
      );
    },
  },
];

export type BillingHistoryPageProps = Readonly<{
  /**
   * Customer-facing route: show company dropdown and call invoices with
   * `crm_company_not_null: true` and `crm_company_id` when a company is selected.
   */
  customerCompanyPicker?: boolean;
}>;

// ── Main page ──────────────────────────────────────────────────────────────────
export default function BillingHistoryPage({
  customerCompanyPicker = false,
}: BillingHistoryPageProps) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRangeOption, setDateRangeOption] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All Statuses");
  const paymentStatusFilter = "All Payments";

  const [invoices, setInvoices] = useState<any[]>([]);
  /** Start true so the first paint shows loading, not an empty state, before `useEffect` fetches. */
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const requestIdRef = useRef(0);
  const [showViewInvoiceModal, setShowViewInvoiceModal] = useState(false);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<InvoiceViewData | null>(null);
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false);
  const [companyOptions, setCompanyOptions] = useState<{ id: string | number; name?: string }[]>(
    [],
  );
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | number>("");
  const [ordersSelected, setOrdersSelected] = useState<string[]>([]);
  const [invoicesSelected, setInvoicesSelected] = useState<string[]>([]);
  const [creditsSelected, setCreditsSelected] = useState<string[]>([]);
  const [refundsSelected, setRefundsSelected] = useState<string[]>([]);
  const [usageLimitsSelected, setUsageLimitsSelected] = useState<string[]>([]);

  const selectedCompanyLabel = useMemo(() => {
    if (!selectedCompanyId) return "";
    const found = companyOptions.find((c) => String(c.id) === String(selectedCompanyId));
    return found?.name?.trim() || String(selectedCompanyId);
  }, [companyOptions, selectedCompanyId]);

  useEffect(() => {
    if (!customerCompanyPicker) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await getMinifiedCompanies({ send_all: "true" });
        if (!cancelled) setCompanyOptions(result ?? []);
      } catch (e) {
        if (!cancelled) {
          toast.error(`Failed to load companies: ${getErrorMessage(e)}`, {
            toastId: "billing_history_load_companies_failed",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [customerCompanyPicker]);

  const closeViewInvoiceModal = useCallback(() => {
    setShowViewInvoiceModal(false);
    setSelectedInvoiceForView(null);
    setIsInvoiceLoading(false);
  }, []);

  const handleViewInvoice = useCallback(async (invoiceId: number) => {
    setShowViewInvoiceModal(true);
    setSelectedInvoiceForView(null);
    setIsInvoiceLoading(true);
    try {
      const invoiceDetails = await getInvoice(invoiceId);
      setSelectedInvoiceForView(toInvoiceViewData(invoiceDetails));
    } catch (err) {
      console.error("BillingHistoryPage view invoice error:", err);
      closeViewInvoiceModal();
    } finally {
      setIsInvoiceLoading(false);
    }
  }, [closeViewInvoiceModal]);

  const handleDownloadInvoice = useCallback(async (invoiceId: number) => {
    try {
      await downloadInvoicePdf(invoiceId);
    } catch (err) {
      console.error("BillingHistoryPage download invoice error:", err);
    }
  }, []);

  const fetchInvoices = useCallback(async (search: string) => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    setLoadingInvoices(true);
    try {
      const baseParams = {
        page: 1,
        per_page: 50,
        limit: 50,
        search: search || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        status: statusFilter === "All Statuses" ? "" : statusFilter,
        payment_status: paymentStatusFilter === "All Payments" ? "" : paymentStatusFilter,
      };
      const companyIdTrimmed = String(selectedCompanyId).trim();
      const params = customerCompanyPicker
        ? {
            ...baseParams,
            crm_company_not_null: true,
            ...(companyIdTrimmed ? { crm_company_id: selectedCompanyId } : {}),
          }
        : {
            ...baseParams,
            crm_company_id: "null",
          };

      const res = (await getInvoices(params)) as { data?: unknown[] };

      if (requestId !== requestIdRef.current) return;

      setInvoices(res?.data || []);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error("BillingHistoryPage getInvoices error:", err);
      setInvoices([]);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoadingInvoices(false);
      }
    }
  }, [
    customerCompanyPicker,
    selectedCompanyId,
    dateFrom,
    dateTo,
    statusFilter,
    paymentStatusFilter,
  ]);

  const { openInvoicePayment: openInvoicePaymentModal, invoicePaymentModal } = useInvoicePaymentModal({
    onPaymentSuccess: () => {
      fetchInvoices(searchQuery).then(() => undefined);
    },
  });

  const handlePayNow = useCallback(
    async (invoiceId: number) => {
      try {
        const invoiceDetails = await getInvoice(invoiceId);
        openInvoicePaymentModal(invoiceDetails);
      } catch (err) {
        console.error("BillingHistoryPage pay now error:", err);
      }
    },
    [openInvoicePaymentModal]
  );

  useEffect(() => {
    fetchInvoices(searchQuery).catch((err) => {
      console.error("BillingHistoryPage fetchInvoices effect error:", err);
    });
  }, [
    fetchInvoices,
    searchQuery,
    dateFrom,
    dateTo,
    statusFilter,
    paymentStatusFilter,
    selectedCompanyId,
  ]);

  const filterPills = useMemo<FilterPill[]>(
    () =>
      buildBillingHistoryFilterPills({
        dateRangeOption,
        dateFrom,
        dateTo,
        setDateRangeOption,
        setDateFrom,
        setDateTo,
        statusFilter,
        setStatusFilter,
        ordersSelected,
        setOrdersSelected,
        invoicesSelected,
        setInvoicesSelected,
        creditsSelected,
        setCreditsSelected,
        refundsSelected,
        setRefundsSelected,
        usageLimitsSelected,
        setUsageLimitsSelected,
      }),
    [
      dateRangeOption,
      dateFrom,
      dateTo,
      statusFilter,
      ordersSelected,
      invoicesSelected,
      creditsSelected,
      refundsSelected,
      usageLimitsSelected,
      setDateRangeOption,
      setDateFrom,
      setDateTo,
      setStatusFilter,
      setOrdersSelected,
      setInvoicesSelected,
      setCreditsSelected,
      setRefundsSelected,
      setUsageLimitsSelected,
    ],
  );

  const billingRows = useMemo<BillingRow[]>(() => {
    const rows: BillingRow[] = [];
    for (const invoice of invoices) {
      rows.push(buildInvoiceRow(invoice));
      if (Array.isArray(invoice.payments)) {
        for (const payment of invoice.payments) {
          rows.push(buildPaymentRow(payment, invoice));
        }
      }
    }
    return rows;
  }, [invoices]);

  const toolbar = useMemo<ToolbarConfig>(() => ({
    showTabs: true,
    tabsDropdownLabel: "Billing",
    tabsDropdownItems: BILLING_NAV_ITEMS,
    tabs: [{ id: "billing-history", label: "Billing History", count: loadingInvoices ? undefined : billingRows.length }],
    activeTab: "billing-history",
    showSearch: true,
    searchValue: searchQuery,
    searchPlaceholder: "Search Billing History",
    onSearchChange: setSearchQuery,
    onSearch: () => fetchInvoices(searchQuery).catch(console.error),
    showFiltersButton: true,
    showFilterPills: true,
    filterPills,
    showMoreFiltersButton: false,
  }), [searchQuery, filterPills, billingRows.length, loadingInvoices, fetchInvoices]);

  const billingActions = useMemo<TableAction<BillingRow>[]>(() => [
    {
      label: "View",
      show: (row) => isInvoiceBillingRow(row),
      onClick: (row) => {
        if (!isInvoiceBillingRow(row)) return;
        handleViewInvoice(row._invoiceId);
      },
    },
    {
      label: "Download",
      show: (row) => isInvoiceBillingRow(row),
      onClick: (row) => {
        if (!isInvoiceBillingRow(row)) return;
        handleDownloadInvoice(row._invoiceId);
      },
    },
    {
      label: "Pay Now",
      show: (row) => isInvoiceBillingRow(row) && row.status.toLowerCase() === "pending",
      onClick: (row) => {
        if (!isInvoiceBillingRow(row)) return;
        handlePayNow(row._invoiceId);
      },
    },
  ], [handleViewInvoice, handleDownloadInvoice, handlePayNow]);

  return (
    <div style={s.page}>
      {customerCompanyPicker && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "16px 24px 0 24px",
            flexShrink: 0,
          }}
        >
          <Form.Select
            size="sm"
            style={{
              width: 220,
              height: 40,
              fontFamily: font,
              border: "1px solid rgb(138, 138, 138)",
              borderRadius: 4,
            }}
            value={String(selectedCompanyId)}
            onChange={(e) =>
              setSelectedCompanyId(e.target.value === "" ? "" : e.target.value)
            }
            aria-label="Select company"
          >
            <option value="">Select company</option>
            {companyOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name ?? c.id}
              </option>
            ))}
          </Form.Select>
        </div>
      )}

      <GenericTable
        data={billingRows}
        columns={BILLING_COLUMNS}
        uniqueKey="_id"
        showActions
        actions={billingActions}
        showToolbarActions={false}
        showToolbar
        toolbar={toolbar}
        loading={loadingInvoices}
        emptyMessage="No billing history found. Adjust your search or filters."
      />

      <InvoiceViewModal
        show={showViewInvoiceModal}
        onHide={closeViewInvoiceModal}
        invoice={selectedInvoiceForView}
        loading={isInvoiceLoading}
        companyName={
          customerCompanyPicker
            ? selectedCompanyLabel || session?.user?.company_name || ""
            : session?.user?.company_name || ""
        }
        isTenantInvoice={!customerCompanyPicker}
      />
      {invoicePaymentModal}
    </div>
  );
}

