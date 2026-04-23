import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import type { SelectBoxOption } from "@components/SelectBox";
import { getMinifiedCompanies } from "@utils/crm";
import { getErrorMessage } from "@utils/errors";
import { isValidEmail } from "@utils/Helper";
import { isOptionalWorkforcePhoneValid } from "@utils/workforcePhoneValidation";
import {
  createInvoice,
  getCustomerProductPricingList,
  getInvoice,
  updateCustomer,
  updateInvoice,
  type CustomerUpdatePayload,
  type InvoiceItemData,
  type ProductPricingData,
  type InvoiceItemAPIPayload,
} from "@utils/accounts";
import { ensureCustomerExistsForCrmCompany } from "@hooks/billing/useEnsureCustomerForCrmCompany";

export interface InvoiceLineItem {
  id: string;
  product_id: number;
  product_name: string;
  product_description: string;
  quantity: number;
  unit_price: number;
  vat_rate: string;
  description: string;
}

export type CreateInvoiceFormProps = Readonly<{
  editInvoiceId?: string;
}>;

function computeDefaultDueDate(): string {
  const base = new Date();
  const day = base.getUTCDate();
  const y = base.getUTCFullYear();
  const m = base.getUTCMonth();
  const targetYear = y + Math.floor((m + 1) / 12);
  const targetMonth = (m + 1) % 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const clampedDay = Math.min(day, lastDay);
  return new Date(Date.UTC(targetYear, targetMonth, clampedDay)).toISOString().slice(0, 10);
}

function normalizeCustomerField(value: unknown): string {
  if (value == null) {
    return "";
  }
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value).trim() : "";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return "";
}

/** Normalizes VAT rate for display and API (two decimal places, percent without %). */
function formatVatRateString(vat: unknown): string {
  const raw = typeof vat === "string" || typeof vat === "number" ? String(vat) : "";
  const s = raw.replaceAll("%", "").trim();
  const n = Number(s);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

function buildCustomerUpdatePayload(params: {
  crmCompanyId: string;
  customerData: any;
  customerForm: {
    phone: string;
    email: string;
    address: string;
    postal_code: string;
    city: string;
    country: string;
    tax_id: string;
    vat_rate: string;
    vat_exemption: boolean;
  };
}): CustomerUpdatePayload {
  const { crmCompanyId, customerData, customerForm } = params;
  const payload: CustomerUpdatePayload = { crm_company_id: crmCompanyId };

  const phoneNext = normalizeCustomerField(customerForm.phone);
  const phonePrev = normalizeCustomerField(customerData?.phone);
  if (phoneNext !== phonePrev) {
    payload.phone = phoneNext || undefined;
  }

  const emailNext = normalizeCustomerField(customerForm.email).toLowerCase();
  const emailPrev = normalizeCustomerField(customerData?.email).toLowerCase();
  if (emailNext !== emailPrev) {
    payload.email = emailNext || undefined;
  }

  const prevProfile =
    customerData?.profile && typeof customerData.profile === "object"
      ? (customerData.profile as Record<string, unknown>)
      : {};
  const profileKeys = ["address", "postal_code", "city", "country"] as const;
  const profilePatch: Record<string, unknown> = {};
  for (const key of profileKeys) {
    const next = normalizeCustomerField(customerForm[key]);
    const prev = normalizeCustomerField(prevProfile[key]);
    if (next !== prev) {
      profilePatch[key] = next;
    }
  }

  const nextTaxId = normalizeCustomerField(customerForm.tax_id);
  const prevTaxId = normalizeCustomerField(prevProfile.tax_id);
  if (nextTaxId !== prevTaxId) {
    profilePatch.tax_id = nextTaxId;
  }

  const nextVatRate = formatVatRateString(customerForm.vat_rate);
  const prevVatRate = formatVatRateString(prevProfile.vat_rate);
  if (nextVatRate !== prevVatRate) {
    profilePatch.vat_rate = nextVatRate;
  }

  const nextExempt = Boolean(customerForm.vat_exemption);
  const prevExempt = Boolean(prevProfile.vat_exemption);
  if (nextExempt !== prevExempt) {
    profilePatch.vat_exemption = nextExempt;
  }

  if (Object.keys(profilePatch).length > 0) {
    payload.profile = profilePatch;
  }

  return payload;
}

function getProductSelectPlaceholder(
  selectedCompanyId: string | null,
  loadingCustomerProducts: boolean,
  hasAvailableProducts: boolean,
): string {
  if (selectedCompanyId == null) return "Select company first";
  if (loadingCustomerProducts) return "Loading products...";
  if (!hasAvailableProducts) return "No more products";
  return "Select product";
}

function normalizePaymentMode(pm: string): "one_time" | "recurring" | "subscription" {
  const s = String(pm ?? "one_time").toLowerCase();
  if (s === "recurring") return "recurring";
  if (s === "subscription") return "subscription";
  return "one_time";
}

export function useCreateInvoiceForm(props: CreateInvoiceFormProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const [acceptOnline, setAcceptOnline] = useState(true);
  const [collectBilling, setCollectBilling] = useState(false);
  const [collectShipping, setCollectShipping] = useState(false);
  const [storePayment, setStorePayment] = useState(false);
  const [partialPayments, setPartialPayments] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [companyOptions, setCompanyOptions] = useState<SelectBoxOption[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [companySelectOpen, setCompanySelectOpen] = useState(false);
  const companySelectWrapRef = useRef<HTMLDivElement | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>("Add company");

  const [customerData, setCustomerData] = useState<any>(null);
  const [resolvingCustomer, setResolvingCustomer] = useState(false);
  const [currencyCode, setCurrencyCode] = useState<string>("USD");

  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerModalSection, setCustomerModalSection] = useState<"billing" | "shipping">("billing");
  const [customerForm, setCustomerForm] = useState<{
    phone: string;
    email: string;
    address: string;
    postal_code: string;
    city: string;
    country: string;
    tax_id: string;
    vat_rate: string;
    vat_exemption: boolean;
  }>({
    phone: "",
    email: "",
    address: "",
    postal_code: "",
    city: "",
    country: "",
    tax_id: "",
    vat_rate: "0.00",
    vat_exemption: false,
  });

  const [customerProducts, setCustomerProducts] = useState<ProductPricingData[]>([]);
  const [loadingCustomerProducts, setLoadingCustomerProducts] = useState(false);
  const [productSelectOpen, setProductSelectOpen] = useState(false);
  const [productSelectAnchor, setProductSelectAnchor] = useState<"top" | "empty">("empty");
  const productSelectWrapRef = useRef<HTMLDivElement | null>(null);
  const productSelectWrapRefTop = useRef<HTMLDivElement | null>(null);

  const [invoiceDate, setInvoiceDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState<string>(computeDefaultDueDate);
  const [endDate, setEndDate] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<"one_time" | "recurring" | "subscription">("one_time");
  const [poNumber, setPoNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [termsConditions, setTermsConditions] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<InvoiceLineItem[]>([]);
  const [loadingEditInvoice, setLoadingEditInvoice] = useState(false);

  const editInvoiceId =
    props.editInvoiceId ??
    router.query.invoiceId ??
    router.query.id;
  const isEditMode = Boolean(editInvoiceId && String(editInvoiceId).trim());

  const tenantId =
    (session as any)?.user?.tenant_id ??
    (session as any)?.user?.company_identifier ??
    "7ccb6ae7-4a37-47e1-9bcb-83e8f53b14f1";

  const resetForm = useCallback(() => {
    setAcceptOnline(true);
    setCollectBilling(false);
    setCollectShipping(false);
    setStorePayment(false);
    setPartialPayments(false);
    setAdvancedOpen(false);
    setCompanySelectOpen(false);
    setSelectedCompanyId(null);
    setSelectedCompanyName("Add company");
    setCustomerData(null);
    setResolvingCustomer(false);
    setCurrencyCode("USD");
    setCustomerProducts([]);
    setLoadingCustomerProducts(false);
    setProductSelectOpen(false);
    setProductSelectAnchor("empty");
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setDueDate(computeDefaultDueDate());
    setEndDate("");
    setPaymentMode("one_time");
    setPoNumber("");
    setNotes("");
    setTermsConditions("");
    setItems([]);
  }, []);

  const toSingleSelectString = useCallback((value: unknown): string | null => {
    if (value == null) return null;
    const v = Array.isArray(value) ? value[0] : value;
    return v == null ? null : String(v);
  }, []);

  const formatCustomerAddress = useCallback((cust: any) => {
    const p = cust?.profile;
    const address = String(p?.address ?? "").trim();
    const city = String(p?.city ?? "").trim();
    const postal = String(p?.postal_code ?? "").trim();
    const country = String(p?.country ?? "").trim();
    const line1 = address || "No address";
    const line2Parts = [city, postal].filter(Boolean);
    const line2 = line2Parts.length ? line2Parts.join(", ") : "";
    const line3 = country || "";
    return [line1, line2, line3].filter(Boolean).join("\n");
  }, []);

  const openCustomerModal = useCallback(
    (section: "billing" | "shipping") => {
      const p = customerData?.profile;
      setCustomerModalSection(section);
      setCustomerForm({
        phone: String(customerData?.phone ?? ""),
        email: String(customerData?.email ?? "").toLowerCase(),
        address: String(p?.address ?? ""),
        postal_code: String(p?.postal_code ?? ""),
        city: String(p?.city ?? ""),
        country: String(p?.country ?? ""),
        tax_id: String(p?.tax_id ?? ""),
        vat_rate: formatVatRateString(p?.vat_rate),
        vat_exemption: Boolean(p?.vat_exemption),
      });
      setCustomerModalOpen(true);
    },
    [customerData],
  );

  const saveCustomerModal = useCallback(async () => {
    const customerId = customerData?.id;
    if (!customerId) {
      toast.error("Please select a company first");
      return;
    }
    const crmFallback = customerData?.crm_company_id;
    const crmCompanyIdRaw =
      selectedCompanyId ??
      (crmFallback !== undefined && crmFallback !== null ? String(crmFallback) : "");
    const crmCompanyId = String(crmCompanyIdRaw).trim();
    if (crmCompanyId === "") {
      toast.error("Please select a company first");
      return;
    }
    const emailForSave = normalizeCustomerField(customerForm.email).toLowerCase();
    if (emailForSave && !isValidEmail(emailForSave)) {
      toast.error("Enter a valid email address (lowercase).");
      return;
    }
    if (!isOptionalWorkforcePhoneValid(customerForm.phone)) {
      toast.error("Enter a valid phone number or clear the field.");
      return;
    }
    try {
      const payload = buildCustomerUpdatePayload({
        crmCompanyId,
        customerData,
        customerForm,
      });
      const serverCrm = normalizeCustomerField(customerData?.crm_company_id);
      const crmChanged = crmCompanyId !== serverCrm;
      const hasDelta =
        crmChanged ||
        payload.phone !== undefined ||
        payload.email !== undefined ||
        (payload.profile != null && Object.keys(payload.profile).length > 0);
      if (!hasDelta) {
        toast.info("No changes to save");
        setCustomerModalOpen(false);
        return;
      }
      await ensureCustomerExistsForCrmCompany(crmCompanyId);
      const updated = await updateCustomer(crmCompanyId, payload);
      setCustomerData(updated);
      const ccy = String(updated?.profile?.currency_code ?? updated?.profile?.currency ?? "").trim().toUpperCase();
      if (ccy) setCurrencyCode(ccy);
      toast.success("Customer updated");
      setCustomerModalOpen(false);
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to update customer"));
    }
  }, [customerData, customerForm, selectedCompanyId]);

  useEffect(() => {
    if (!customerModalOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCustomerModalOpen(false);
    };
    globalThis.addEventListener("keydown", handler);
    return () => globalThis.removeEventListener("keydown", handler);
  }, [customerModalOpen]);

  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
  const toVatPercent = (vat: string) => {
    const raw = typeof vat === "string" ? vat : "";
    const n = Number(raw.replaceAll("%", "").trim());
    return Number.isFinite(n) ? n : 0;
  };

  const formatVatRate2 = useCallback((vat: unknown): string => formatVatRateString(vat), []);

  const customerVatRate = useMemo(
    () => formatVatRateString(customerData?.profile?.vat_rate),
    [customerData],
  );

  const lineSubtotal = useCallback((it: InvoiceLineItem) => it.quantity * it.unit_price, []);
  const lineTax = useCallback(
    (it: InvoiceLineItem) => lineSubtotal(it) * (toVatPercent(it.vat_rate) / 100),
    [lineSubtotal],
  );
  const lineTotal = useCallback(
    (it: InvoiceLineItem) => lineSubtotal(it) + lineTax(it),
    [lineSubtotal, lineTax],
  );

  const subtotal = useMemo(
    () => round2(items.reduce((acc, it) => acc + lineSubtotal(it), 0)),
    [items, lineSubtotal],
  );
  const taxAmount = useMemo(
    () => round2(items.reduce((acc, it) => acc + lineTax(it), 0)),
    [items, lineTax],
  );
  const totalAmount = useMemo(() => round2(subtotal + taxAmount), [subtotal, taxAmount]);

  const productOptions: SelectBoxOption[] = useMemo(
    () =>
      customerProducts.map((cp) => ({
        value: cp?.product?.id ?? Number(cp.product_id),
        label: cp?.product?.name ? cp.product.name : `Product #${String(cp?.product?.id ?? cp.product_id)}`,
        customerProduct: cp,
      })),
    [customerProducts],
  );

  const selectedProductIds = useMemo(
    () => new Set(items.map((it) => Number(it.product_id))),
    [items],
  );

  const availableProductOptions: SelectBoxOption[] = useMemo(
    () => productOptions.filter((o) => !selectedProductIds.has(Number(o.value))),
    [productOptions, selectedProductIds],
  );

  const hasAvailableProducts = availableProductOptions.length > 0;

  const productSelectDisabled = useMemo(
    () => loadingCustomerProducts || selectedCompanyId == null || !hasAvailableProducts,
    [loadingCustomerProducts, selectedCompanyId, hasAvailableProducts],
  );

  const productSelectPlaceholder = useMemo(
    () => getProductSelectPlaceholder(selectedCompanyId, loadingCustomerProducts, hasAvailableProducts),
    [selectedCompanyId, loadingCustomerProducts, hasAvailableProducts],
  );

  const closeDropdownsOnOutsideClick = useCallback((event: MouseEvent) => {
    const target = event.target as Node;
    if (companySelectWrapRef.current && !companySelectWrapRef.current.contains(target)) {
      setCompanySelectOpen(false);
    }
    const inEmpty = productSelectWrapRef.current?.contains(target) ?? false;
    const inTop = productSelectWrapRefTop.current?.contains(target) ?? false;
    if (!inEmpty && !inTop) {
      setProductSelectOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", closeDropdownsOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeDropdownsOnOutsideClick);
  }, [closeDropdownsOnOutsideClick]);

  useEffect(() => {
    if (!selectedCompanyId || companyOptions.length === 0) return;
    const found = companyOptions.find((o) => String(o.value) === String(selectedCompanyId));
    if (found?.label) {
      setSelectedCompanyName(found.label);
    }
  }, [selectedCompanyId, companyOptions]);

  useEffect(() => {
    let cancelled = false;
    setLoadingCompanies(true);
    getMinifiedCompanies({ send_all: "true" })
      .then((result) => {
        if (cancelled) return;
        const list = Array.isArray(result) ? result : [];
        setCompanyOptions(
          list.map((c: any) => ({
            value: String(c.id),
            label: c?.name ? c.name : `Company #${String(c.id)}`,
          })),
        );
      })
      .catch((e) => {
        if (cancelled) return;
        toast.error(`Failed to load companies: ${getErrorMessage(e)}`, {
          toastId: "create_invoice_load_companies_failed",
        });
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingCompanies(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedCompanyId || companyOptions.length === 0) return;
    const found = companyOptions.find((o) => String(o.value) === String(selectedCompanyId));
    if (found?.label) setSelectedCompanyName(found.label);
  }, [selectedCompanyId, companyOptions]);

  const resolveCustomerForCompany = useCallback(async (crmCompanyId: string) => {
    setResolvingCustomer(true);
    try {
      const { customer } = await ensureCustomerExistsForCrmCompany(crmCompanyId);
      setCustomerData(customer);
      const customerName = String(customer?.name ?? "").trim();
      if (customerName && !/^\d+$/.test(customerName)) {
        setSelectedCompanyName(customerName);
      }
      const ccy =
        String(customer?.profile?.currency_code ?? customer?.profile?.currency ?? "").trim().toUpperCase() ||
        "USD";
      setCurrencyCode(ccy);
      setLoadingCustomerProducts(true);
      try {
        const list = await getCustomerProductPricingList(crmCompanyId, {
          page: 1,
          per_page: 200,
          sort_order: "desc",
        } as any);
        setCustomerProducts(Array.isArray(list) ? list : []);
      } catch (e) {
        toast.error(getErrorMessage(e, "Failed to load customer products"), {
          toastId: "create_invoice_load_customer_products_failed",
        });
        setCustomerProducts([]);
      } finally {
        setLoadingCustomerProducts(false);
      }
    } finally {
      setResolvingCustomer(false);
    }
  }, []);

  const onCompanyChange = useCallback(
    (value: unknown) => {
      const v = toSingleSelectString(value);
      setSelectedCompanyId(v);
      const label = v
        ? (companyOptions.find((o) => String(o.value) === String(v))?.label ?? "Company")
        : "Add company";
      setSelectedCompanyName(label);
      setCompanySelectOpen(false);
      setCustomerData(null);
      setCurrencyCode("USD");
      setCustomerProducts([]);
      setItems([]);
      setProductSelectOpen(false);
      if (v) {
        resolveCustomerForCompany(v).catch((e) =>
          toast.error(getErrorMessage(e, "Failed to load customer")),
        );
      }
    },
    [
      companyOptions,
      toSingleSelectString,
      resolveCustomerForCompany,
    ],
  );

  const createLineItemId = useCallback((): string => {
    const c: any = (globalThis as any)?.crypto;
    if (c?.randomUUID) return String(c.randomUUID());
    if (c?.getRandomValues) {
      const bytes = new Uint8Array(16);
      c.getRandomValues(bytes);
      return Array.from(bytes, (b: number) => b.toString(16).padStart(2, "0")).join("");
    }
    return `${Date.now()}-${String(performance?.now?.() ?? 0).replaceAll(".", "")}`;
  }, []);

  useEffect(() => {
    const id = editInvoiceId;
    if (!id || !String(id).trim()) return;
    const numId = Number(id);
    if (!Number.isFinite(numId) || numId <= 0) return;
    let cancelled = false;
    setLoadingEditInvoice(true);
    getInvoice(numId)
      .then((invoice: any) => {
        if (cancelled) return;
        const crmId = String(
          invoice?.company?.crm_company_id ?? invoice?.crm_company_id ?? invoice.company_id ?? "",
        ).trim();
        if (!crmId) {
          toast.error("Invoice has no associated company");
          return;
        }
        const rawName = invoice?.company?.name;
        const companyName =
          typeof rawName === "string" && rawName.trim() && !/^\d+$/.test(rawName)
            ? rawName
            : `Company #${crmId}`;
        setSelectedCompanyId(crmId);
        setSelectedCompanyName(companyName);
        setInvoiceDate(String(invoice.invoice_date ?? "").slice(0, 10));
        setDueDate(String(invoice.due_date ?? "").slice(0, 10));
        setPaymentMode(normalizePaymentMode(invoice.payment_mode ?? "one_time"));
        setCurrencyCode(String(invoice?.currency_code ?? "USD").trim().toUpperCase() || "USD");
        setNotes(String(invoice?.notes ?? ""));
        setTermsConditions(String(invoice?.terms_conditions ?? ""));
        setPoNumber(String(invoice?.po_number ?? ""));
        const rawEnd =
          invoice?.end_date ?? invoice?.recurring_end_date ?? null;
        setEndDate(rawEnd ? String(rawEnd).slice(0, 10) : "");
        const invItems = Array.isArray(invoice?.items) ? invoice.items : [];
        const mapped: InvoiceLineItem[] = invItems.map((it: InvoiceItemData) => {
          const pid = Number(it?.product_id ?? it?.product?.id ?? 0);
          const qty = Number(it?.quantity ?? 0) || 0;
          const up = Number(it?.unit_price ?? 0) || 0;
          const tax = String(it?.tax_rate ?? "0").replaceAll("%", "").trim();
          const vat = Number.isFinite(Number(tax)) ? Number(tax).toFixed(2) : "0.00";
          const p = it?.product ?? {};
          return {
            id: createLineItemId(),
            product_id: pid,
            product_name: p?.name ?? `Product #${pid}`,
            product_description: String(p?.description ?? ""),
            quantity: qty,
            unit_price: up,
            vat_rate: vat,
            description: String(p?.description ?? ""),
          };
        });
        setItems(mapped);
        resolveCustomerForCompany(crmId).catch((e) =>
          toast.error(getErrorMessage(e, "Failed to load customer data")),
        );
      })
      .catch((e: any) => {
        if (cancelled) return;
        toast.error(getErrorMessage(e, "Failed to load invoice"));
        router.push("/billing/invoices").catch(() => undefined);
      })
      .finally(() => {
        if (!cancelled) setLoadingEditInvoice(false);
      });
    return () => {
      cancelled = true;
    };
  }, [editInvoiceId, router, createLineItemId, resolveCustomerForCompany]);

  const addProductToInvoice = useCallback(
    (customerProduct: ProductPricingData) => {
      const id = createLineItemId();
      const p: any = customerProduct?.product ?? {};
      const unitPriceRaw =
        String(customerProduct?.selling_price ?? "").trim() ||
        String(p?.effective_price ?? "").trim() ||
        String(p?.base_price ?? "").trim() ||
        "0";
      const unitPrice = Number(unitPriceRaw);
      const vatRate = customerVatRate || "0";
      setItems((prev) => [
        ...prev,
        {
          id,
          product_id: Number(p?.id ?? customerProduct?.product_id),
          product_name: p?.name ?? `Product #${String(p?.id ?? customerProduct?.product_id)}`,
          product_description: String(p?.description ?? ""),
          quantity: 1,
          unit_price: Number.isFinite(unitPrice) ? unitPrice : 0,
          vat_rate: vatRate,
          description: String(p?.description ?? ""),
        },
      ]);
    },
    [createLineItemId, customerVatRate],
  );

  const cloneItem = useCallback(
    (lineId: string) => {
      setItems((prev) => {
        const found = prev.find((x) => x.id === lineId);
        if (!found) return prev;
        const clone = { ...found, id: createLineItemId() };
        return [...prev, clone];
      });
    },
    [createLineItemId],
  );

  const removeItem = useCallback((lineId: string) => {
    setItems((prev) => prev.filter((x) => x.id !== lineId));
  }, []);

  const updateItem = useCallback((lineId: string, patch: Partial<InvoiceLineItem>) => {
    setItems((prev) => prev.map((x) => (x.id === lineId ? { ...x, ...patch } : x)));
  }, []);

  const handleDueDateChange = useCallback(
    (next: string) => {
      const trimmed = String(next).trim();
      const invDate = invoiceDate;
      const trimmedMs = Date.parse(trimmed);
      const invMs = Date.parse(invDate);
      const maxMs = Math.max(trimmedMs, invMs);
      setDueDate(Number.isFinite(maxMs) ? new Date(maxMs).toISOString().slice(0, 10) : (trimmed || invDate));
    },
    [invoiceDate],
  );

  useEffect(() => {
    if (!dueDate || !invoiceDate) return;
    if (dueDate < invoiceDate) setDueDate(invoiceDate);
  }, [invoiceDate]);

  const handleCreateInvoice = useCallback(async () => {
    if (!selectedCompanyId) {
      toast.error("Please select a company");
      return;
    }
    if (items.length === 0) {
      toast.error("Please add at least one line item");
      return;
    }
    const numId = isEditMode && editInvoiceId ? Number(editInvoiceId) : 0;
    if (isEditMode && (!Number.isFinite(numId) || numId <= 0)) {
      toast.error("Invalid invoice for update");
      return;
    }
    setSubmitting(true);
    try {
      const payloadCurrency = currencyCode && currencyCode !== "USD" ? currencyCode : undefined;
      const invoiceItems: InvoiceItemAPIPayload[] = items.map((it) => ({
        product_id: it.product_id,
        quantity: Math.max(0, Number(it.quantity) || 0),
        unit_price: Number(it.unit_price) || 0,
        vat_rate: String(it.vat_rate ?? "0"),
        description: it.description,
      }));
      const optionalPoNumber = poNumber.trim() || undefined;
      const optionalEndDate = endDate || undefined;
      const payload = {
        tenant_id: String(tenantId),
        crm_company_id: String(selectedCompanyId),
        po_number: optionalPoNumber,
        invoice_date: invoiceDate,
        due_date: dueDate,
        end_date: optionalEndDate,
        payment_mode: paymentMode,
        currency_code: payloadCurrency,
        exchange_rate: 1,
        tax_amount: taxAmount,
        notes,
        terms_conditions: termsConditions,
        items: invoiceItems,
        subtotal,
        total_amount: totalAmount,
      };
      if (isEditMode) {
        await updateInvoice(numId, payload);
        toast.success("Invoice updated");
      } else {
        await createInvoice(payload);
        toast.success("Invoice created");
        resetForm();
      }
      await router.push("/billing/invoices");
    } catch (e) {
      toast.error(getErrorMessage(e, isEditMode ? "Failed to update invoice" : "Failed to create invoice"));
    } finally {
      setSubmitting(false);
    }
  }, [
    currencyCode,
    dueDate,
    endDate,
    editInvoiceId,
    invoiceDate,
    isEditMode,
    items,
    paymentMode,
    poNumber,
    selectedCompanyId,
    subtotal,
    taxAmount,
    tenantId,
    termsConditions,
    totalAmount,
    notes,
    resetForm,
    router,
  ]);

  return {
    acceptOnline,
    setAcceptOnline,
    collectBilling,
    setCollectBilling,
    collectShipping,
    setCollectShipping,
    storePayment,
    setStorePayment,
    partialPayments,
    setPartialPayments,
    advancedOpen,
    setAdvancedOpen,
    companyOptions,
    loadingCompanies,
    companySelectOpen,
    setCompanySelectOpen,
    companySelectWrapRef,
    selectedCompanyId,
    setSelectedCompanyId,
    selectedCompanyName,
    setSelectedCompanyName,
    customerData,
    setCustomerData,
    resolvingCustomer,
    currencyCode,
    setCurrencyCode,
    customerModalOpen,
    setCustomerModalOpen,
    customerModalSection,
    setCustomerModalSection,
    customerForm,
    setCustomerForm,
    customerProducts,
    setCustomerProducts,
    loadingCustomerProducts,
    productSelectOpen,
    setProductSelectOpen,
    productSelectAnchor,
    setProductSelectAnchor,
    productSelectWrapRef,
    productSelectWrapRefTop,
    invoiceDate,
    setInvoiceDate,
    dueDate,
    setDueDate,
    endDate,
    setEndDate,
    paymentMode,
    setPaymentMode,
    poNumber,
    setPoNumber,
    notes,
    setNotes,
    termsConditions,
    setTermsConditions,
    submitting,
    items,
    setItems,
    loadingEditInvoice,
    editInvoiceId,
    isEditMode,
    resetForm,
    toSingleSelectString,
    formatCustomerAddress,
    openCustomerModal,
    saveCustomerModal,
    onCompanyChange,
    round2,
    toVatPercent,
    customerVatRate,
    lineSubtotal,
    lineTax,
    lineTotal,
    subtotal,
    taxAmount,
    totalAmount,
    productOptions,
    availableProductOptions,
    selectedProductIds,
    productSelectDisabled,
    productSelectPlaceholder,
    formatVatRate2,
    resolveCustomerForCompany,
    createLineItemId,
    addProductToInvoice,
    cloneItem,
    removeItem,
    updateItem,
    handleDueDateChange,
    handleCreateInvoice,
    router,
  };
}
