import React from "react";
import PrimeAlleyLogo from "@assets/images/Prime3.png";
import { Alert, Button, Col, Modal, Row } from "react-bootstrap";
import moment from "moment";
import { formatNumber, getCompanyByCrmId, GlobalDateFormat } from "@utils/Helper";
import { useSession } from "next-auth/react";

/** Issuing party on the invoice (API: `company.vendor`; legacy: `company.reseller`). */
export type InvoiceIssuingPartyBankAccount = {
  id?: string | number;
  vendor_id?: string | number;
  bank_name?: string;
  account_holder_name?: string;
  account_number?: string;
  currency?: string;
  routing_number?: string;
  swift_code?: string;
  iban?: string;
  account_type?: string;
  is_default?: boolean;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type InvoiceIssuingPartyProfile = {
  tax_id?: string | number | null;
  address?: string;
  city?: unknown;
  state?: string;
  postal_code?: string;
  country?: string;
  logo_url?: string;
  /** Relative storage path when `logo_url` is empty */
  logo?: string;
  payment_terms?: string | number | null;
  vendor_id?: string;
};

export type InvoiceIssuingParty = {
  id?: string | number;
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  profile?: InvoiceIssuingPartyProfile;
  bank_accounts?: InvoiceIssuingPartyBankAccount[];
};

export type InvoiceViewData = {
  /** When true, use vendor + session bill-to + vendor bank accounts; when false, reseller/CRM legacy behavior. */
  is_tenant_invoice?: boolean;
  id?: string | number;
  invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
  end_date?: string;
  status?: string;
  currency_code?: string;
  subtotal?: string | number | null;
  tax_amount?: string | number | null;
  total_amount?: string | number | null;
  paid_amount?: string | number | null;
  amount_due?: string | number | null;
  items?: Array<{
    id?: string | number;
    product?: { name?: string };
    description?: string;
    quantity?: string | number;
    unit_price?: string | number;
    tax_amount?: string | number;
    line_total?: string | number;
  }>;
  company?: {
    crm_company_id?: string | number;
    country?: string;
    profile?: { address?: string; tax_id?: string | number; vat_rate?: string | number | null };
    vendor?: InvoiceIssuingParty;
    /** Legacy issuing party when `vendor` is absent (older payloads). */
    reseller?: InvoiceIssuingParty;
  };
};

function getInvoiceIssuingParty(
  company: InvoiceViewData["company"],
  isTenantInvoice: boolean,
): InvoiceIssuingParty | undefined {
  if (isTenantInvoice) {
    return company?.vendor ?? company?.reseller;
  }
  return company?.reseller;
}

/** Tenant: vendor `bank_accounts` only. Legacy: reseller `bank_accounts` only. */
function getIssuingPartyBankAccounts(
  company: InvoiceViewData["company"],
  isTenantInvoice: boolean,
): InvoiceIssuingPartyBankAccount[] | undefined {
  if (isTenantInvoice) {
    const fromVendor = company?.vendor?.bank_accounts;
    if (Array.isArray(fromVendor) && fromVendor.length > 0) return fromVendor;
    return undefined;
  }
  const fromReseller = company?.reseller?.bank_accounts;
  if (Array.isArray(fromReseller) && fromReseller.length > 0) return fromReseller;
  return undefined;
}

function resolveIsTenantInvoice(
  prop: boolean | undefined,
  invoice: InvoiceViewData | null | undefined,
): boolean {
  if (prop !== undefined) return prop;
  return Boolean(invoice?.is_tenant_invoice);
}

function issuingPartyLogoSrc(profile: InvoiceIssuingPartyProfile | undefined): string {
  const fromUrl = typeof profile?.logo_url === "string" ? profile.logo_url.trim() : "";
  if (fromUrl) return fromUrl;
  const fromPath = typeof profile?.logo === "string" ? profile.logo.trim() : "";
  if (fromPath) return fromPath;
  return "";
}

export type InvoiceViewModalProps = Readonly<{
  show: boolean;
  onHide: () => void;
  invoice: InvoiceViewData | null;
  loading?: boolean;
  companyName: string;
  companyOptions?: { id: string | number; name?: string }[];
  /**
   * When true: vendor issuing block, session bill-to name, vendor bank accounts, profile VAT %.
   * When false: reseller issuing, CRM bill-to name, reseller bank accounts, fixed 5% VAT copy.
   * If omitted, uses `invoice.is_tenant_invoice`.
   */
  isTenantInvoice?: boolean;
}>;

const DEFAULT_CURRENCY = "AED";

function isPositiveNumberLike(value: unknown): boolean {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

function parseMoney(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const n = Number.parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  }
  if (value == null) return 0;
  return 0;
}

function formatMoney(currencyCode: unknown, amount: unknown): string {
  const currency = (typeof currencyCode === "string" && currencyCode.trim()) ? currencyCode : DEFAULT_CURRENCY;
  return `${currency} ${formatNumber(parseMoney(amount))}`;
}

function formatInvoicePeriod(invoice: InvoiceViewData): string {
  const start = invoice.invoice_date ? moment(invoice.invoice_date).format("DD MMM YYYY") : "N/A";
  const endDate = invoice.end_date ?? invoice.due_date;
  const end = endDate ? moment(endDate).format("DD MMM YYYY") : "N/A";
  return `${start} - ${end}`;
}

type InvoiceDetailsProps = Readonly<{
  invoice: InvoiceViewData;
  companyName: string;
  companyOptions: { id: string | number; name?: string }[];
  isTenantInvoice: boolean;
}>;

function VendorHeader({
  invoice,
  companyName,
  isTenantInvoice,
}: Readonly<{ invoice: InvoiceViewData; companyName: string; isTenantInvoice: boolean }>) {
  const vendor = getInvoiceIssuingParty(invoice.company, isTenantInvoice);
  const profile = vendor?.profile;
  const headerTitle = isTenantInvoice ? vendor?.name || "" : companyName || "";

  const showTaxInvoice = isPositiveNumberLike(profile?.tax_id);
  const cityValue = profile?.city;
  const showCityLine = typeof cityValue === "string" ? Boolean(cityValue.trim()) : isPositiveNumberLike(cityValue);
  const showDueAmount = parseMoney(invoice.amount_due) > 0;

  return (
    <Row>
      <Col md={6}>
        <h3 className="mb-2">{headerTitle}</h3>

        {showTaxInvoice && (
          <h5 className="mb-3 fw-bold" style={{ color: "#14509e" }}>
            TAX INVOICE {String(profile?.tax_id ?? "")}
          </h5>
        )}

        <p className="mb-2">{profile?.address || ""}</p>
        {showCityLine && (
          <p className="mb-2">
            {String(cityValue ?? "")},{" "}
            {profile?.country || ""}
          </p>
        )}

        <p className="mb-2">
          <b>Phone:</b>
          {vendor?.phone || ""}
        </p>
        <p className="mb-3">
          <b>Email:</b> {vendor?.email || ""}
        </p>
      </Col>

      <Col md={6}>
        <div>
          {issuingPartyLogoSrc(profile) && (
            <img
              src={issuingPartyLogoSrc(profile)}
              alt="Logo"
              className="img-fluid"
              style={{ maxWidth: "60%", float: "right" }}
            />
          )}
        </div>

        {showDueAmount && (
          <div
            className="text-end mt-3"
            style={{ float: "right", clear: "both", fontSize: "1.2rem" }}
          >
            Due Amount:{" "}
            <span className="fw-bold text-danger">
              {formatMoney(invoice.currency_code, invoice.amount_due)}
            </span>
          </div>
        )}
      </Col>
    </Row>
  );
}

function BillTo({
  invoice,
  companyOptions,
  isTenantInvoice,
}: Readonly<{
  invoice: InvoiceViewData;
  companyOptions: { id: string | number; name?: string }[];
  isTenantInvoice: boolean;
}>) {
  const { data: session } = useSession();
  const company = invoice.company;
  const showTrn = isPositiveNumberLike(company?.profile?.tax_id);
  const billToName = isTenantInvoice
    ? (session?.user as { company_name?: string } | undefined)?.company_name ?? ""
    : getCompanyByCrmId(company?.crm_company_id, companyOptions) ?? "";

  return (
    <Col md={6}>
      <h5 className="mb-2 fw-bold" style={{ color: "#14509e" }}>
        Bill To
      </h5>
      <div className="border p-3 rounded bg-light mb-3">
        <p className="mb-2 fw-bold">
          {billToName}
        </p>
        <p className="mb-2">{company?.profile?.address || ""}</p>
        <p className="mb-3">{company?.country || ""}</p>

        {showTrn && (
          <p className="mb-0 fw-bold">
            <b>TRN No.:</b> {company?.profile?.tax_id || ""}
          </p>
        )}
      </div>
    </Col>
  );
}

function InvoiceMeta({
  invoice,
  isTenantInvoice,
}: Readonly<{ invoice: InvoiceViewData; isTenantInvoice: boolean }>) {
  const termsDays = getInvoiceIssuingParty(invoice.company, isTenantInvoice)?.profile?.payment_terms;
  const terms = termsDays ? `${termsDays} days` : "";
  const dueDate = invoice?.due_date ? moment(invoice?.due_date).format(GlobalDateFormat) : "";

  return (
    <Col md={6}>
      <div style={{ display: "grid", gridTemplateColumns: "40% 1fr", gap: 0 }}>
        <div className="fw-bold p-2" style={{ verticalAlign: "top" }}>Invoice Number:</div>
        <div className="p-2">{invoice.invoice_number || "N/A"}</div>

        <div className="fw-bold p-2" style={{ verticalAlign: "top" }}>Invoice Date:</div>
        <div className="p-2">
          {invoice.invoice_date ? moment(invoice.invoice_date).format(GlobalDateFormat) : "N/A"}
        </div>

        <div className="fw-bold p-2" style={{ verticalAlign: "top" }}>Invoice Period:</div>
        <div className="p-2">{formatInvoicePeriod(invoice)}</div>

        <div className="fw-bold p-2" style={{ verticalAlign: "top" }}>Terms:</div>
        <div className="p-2">{terms}</div>

        <div className="fw-bold p-2" style={{ verticalAlign: "top" }}>Due Date:</div>
        <div className="p-2">{dueDate}</div>
      </div>
    </Col>
  );
}

function InvoiceItemsAndTotals({
  invoice,
  isTenantInvoice,
}: Readonly<{ invoice: InvoiceViewData; isTenantInvoice: boolean }>) {
  const currency = invoice.currency_code || DEFAULT_CURRENCY;
  const items = invoice.items ?? [];
  const hasItems = items.length > 0;
  const showPaid = Number(invoice.paid_amount) >= 0;
  const showDue = Number(invoice.amount_due) >= 0;

  if (!hasItems) {
    return <Alert variant="info">No items found for this invoice</Alert>;
  }

  return (
    <div className="">
      <table className="table table-bordered table-sm">
        <thead
          className="table-dark"
          style={{ backgroundColor: "#0f3b66", color: "white" }}
        >
          <tr>
            <th className="text-uppercase">Product Name</th>
            <th className="text-uppercase text-start">Product Description</th>
            <th className="text-uppercase text-end">QTY</th>
            <th className="text-uppercase text-end">Unit Price ({currency})</th>
            <th className="text-uppercase text-end">Tax ({currency})</th>
            <th className="text-uppercase text-end">Amount ({currency})</th>
            <th className="text-uppercase text-end">Total Price ({currency})</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: any, index: number) => (
            <tr key={item.id || index}>
              <td className="text-capitalize">{item.product?.name}</td>
              <td className="text-start" style={{ whiteSpace: "wrap" }}>
                <p className="mb-0">{item.description}</p>
              </td>
              <td className="text-end">{item.quantity}</td>
              <td className="text-end">{formatNumber(parseMoney(item.unit_price))}</td>
              <td className="text-end">{formatNumber(parseMoney(item.tax_amount))}</td>
              <td className="text-end">{formatNumber(parseMoney(item.line_total))}</td>
              <td className="text-end">
                <strong>
                  {formatNumber(parseMoney(item.tax_amount) + parseMoney(item.line_total))}
                </strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Row>
        <Col md={6}>
          <h5 className="mb-2 fw-bold" style={{ color: "#14509e" }}>
            Terms & Conditions
          </h5>
          <ol style={{ paddingLeft: "15px" }}>
            <li>
              <p className="mb-1 text-muted">
                Payment can be made as bank transfer or direct deposit
              </p>
            </li>
            <li>
              <p className="mb-1 text-muted">
                Cheque can be issued in favor of{" "}
                <b>{getInvoiceIssuingParty(invoice.company, isTenantInvoice)?.name || ""}</b>.
              </p>
            </li>
            <li>
              <p className="mb-1 text-muted">
                Services may be disconnected after the due date without further
                notice.
              </p>
            </li>
            <li>
              <p className="mb-1 text-muted">
                Value Added Tax (VAT){" "}
                <b>
                  {isTenantInvoice
                    ? `${invoice.company?.profile?.vat_rate ?? 5}%`
                    : "5%"}
                </b>{" "}
                will be applicable to this invoice.
              </p>
            </li>
          </ol>
        </Col>
        <Col md={6}>
          <table className="table table-borderless table-sm">
            <tr>
              <td className="p-0 fw-bold">Subtotal</td>
              <td className="text-end fw-bold">
                {currency}{" "}
                {formatNumber(parseMoney(invoice.subtotal))}
              </td>
            </tr>
            <tr>
              <td className="p-0 fw-bold">Vat Total</td>
              <td className="text-end fw-bold">
                {currency}{" "}
                {formatNumber(parseMoney(invoice.tax_amount))}
              </td>
            </tr>
            <tr>
              <td className="p-0 fw-bold">Total</td>
              <td className="text-end fw-bold">
                {currency}{" "}
                {formatNumber(parseMoney(invoice.total_amount))}
              </td>
            </tr>

            {showPaid && (
              <tr style={{ borderTop: "2px #000 solid" }}>
                <td className="p-0 fw-bold text-uppercase">Paid Amount</td>
                <td className="text-end fw-bold text-success">
                  {currency}{" "}
                  {formatNumber(parseMoney(invoice.paid_amount))}
                </td>
              </tr>
            )}
            {showDue && (
              <tr>
                <td className="p-0 fw-bold text-uppercase">Due Amount</td>
                <td className="text-end fw-bold text-danger">
                  {currency}{" "}
                  {formatNumber(parseMoney(invoice.amount_due))}
                </td>
              </tr>
            )}
          </table>
        </Col>
      </Row>
    </div>
  );
}

function BankAccounts({
  invoice,
  isTenantInvoice,
}: Readonly<{ invoice: InvoiceViewData; isTenantInvoice: boolean }>) {
  const accounts = getIssuingPartyBankAccounts(invoice.company, isTenantInvoice);
  const issuingParty = getInvoiceIssuingParty(invoice.company, isTenantInvoice);
  const hasAccounts = Array.isArray(accounts) && accounts.length > 0;
  if (!hasAccounts) return null;

  return (
    <div className="mb-3 alert alert-info">
      <h6>Bank Accounts</h6>
      <Row>
        {accounts.map((bankAccount, idx) => (
          <Col
            md={6}
            key={bankAccount.id ?? bankAccount.iban ?? `${bankAccount.account_number ?? "bank"}-${idx}`}
          >
            <p className="mb-1">
              <b>Account Title:</b> {issuingParty?.name ?? ""}
            </p>
            <p className="mb-1">
              <b>Bank Name:</b> {bankAccount.bank_name}
            </p>
            <p className="mb-1">
              <b>Account Holder Name:</b> {bankAccount.account_holder_name}
            </p>
            <p className="mb-1">
              <b>Account Number:</b> {bankAccount.account_number}
            </p>
            <p className="mb-1">
              <b>Currency:</b> {bankAccount.currency}
            </p>
            {bankAccount.account_type ? (
              <p className="mb-1">
                <b>Account Type:</b> {bankAccount.account_type}
              </p>
            ) : null}
            <p className="mb-1">
              <b>Routing Number:</b> {bankAccount.routing_number}
            </p>
            <p className="mb-1">
              <b>Swift Code:</b> {bankAccount.swift_code}
            </p>
            <p className="mb-1">
              <b>IBAN:</b> {bankAccount.iban}
            </p>
            {bankAccount.notes ? (
              <p className="mb-1">
                <b>Notes:</b> {bankAccount.notes}
              </p>
            ) : null}
          </Col>
        ))}
      </Row>
    </div>
  );
}

function InvoiceDetails({
  invoice,
  companyName,
  companyOptions,
  isTenantInvoice,
}: InvoiceDetailsProps) {
  return (
    <>
      <VendorHeader invoice={invoice} companyName={companyName} isTenantInvoice={isTenantInvoice} />

      <Row>
        <BillTo invoice={invoice} companyOptions={companyOptions} isTenantInvoice={isTenantInvoice} />
        <InvoiceMeta invoice={invoice} isTenantInvoice={isTenantInvoice} />
      </Row>

      <div>
        {/* Invoice Items */}
        <div className="mb-4">
          <InvoiceItemsAndTotals invoice={invoice} isTenantInvoice={isTenantInvoice} />
        </div>

        {/* Notes */}
        <BankAccounts invoice={invoice} isTenantInvoice={isTenantInvoice} />
      </div>
    </>
  );
}

export default function InvoiceViewModal({
  show,
  onHide,
  invoice,
  loading = false,
  companyName,
  companyOptions = [],
  isTenantInvoice: isTenantInvoiceProp,
}: InvoiceViewModalProps) {
  if (!show) return null;

  const isTenantInvoice = resolveIsTenantInvoice(isTenantInvoiceProp, invoice);

  let body: React.ReactNode;
  if (loading && !invoice) body = <div className="text-muted">Loading…</div>;
  else if (invoice) {
    body = (
      <InvoiceDetails
        invoice={invoice}
        companyName={companyName}
        companyOptions={companyOptions}
        isTenantInvoice={isTenantInvoice}
      />
    );
  } else body = <Alert variant="warning">No invoice data available</Alert>;

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>Invoice Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {body}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
