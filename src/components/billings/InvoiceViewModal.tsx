import React from "react";
import PrimeAlleyLogo from "@assets/images/Prime3.png";
import { Alert, Button, Col, Modal, Row } from "react-bootstrap";
import moment from "moment";
import { formatNumber, GlobalDateFormat, getCompanyByCrmId } from "@utils/Helper";

export type InvoiceViewData = {
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
    profile?: { address?: string; tax_id?: string | number };
    reseller?: {
      name?: string;
      email?: string;
      phone?: string;
      profile?: {
        tax_id?: string | number;
        address?: string;
        city?: any;
        country?: string;
        logo_url?: string;
        payment_terms?: any;
      };
      bank_accounts?: Array<{
        id?: string | number;
        bank_name?: string;
        account_holder_name?: string;
        account_number?: string;
        currency?: string;
        routing_number?: string;
        swift_code?: string;
        iban?: string;
      }>;
    };
  };
};

export type InvoiceViewModalProps = Readonly<{
  show: boolean;
  onHide: () => void;
  invoice: InvoiceViewData | null;
  loading?: boolean;
  companyName: string;
  companyOptions?: { id: string | number; name?: string }[];
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
}>;

function ResellerHeader({ invoice, companyName }: Readonly<{ invoice: InvoiceViewData; companyName: string }>) {
  const reseller = invoice.company?.reseller;
  const profile = reseller?.profile;

  const showTaxInvoice = isPositiveNumberLike(profile?.tax_id);
  const cityValue = profile?.city;
  const showCityLine = typeof cityValue === "string" ? Boolean(cityValue.trim()) : isPositiveNumberLike(cityValue);
  const showDueAmount = parseMoney(invoice.amount_due) > 0;

  return (
    <Row>
      <Col md={6}>
        <h3 className="mb-2">{companyName || ""}</h3>

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
          {reseller?.phone || ""}
        </p>
        <p className="mb-3">
          <b>Email:</b> {reseller?.email || ""}
        </p>
      </Col>

      <Col md={6}>
        <div>
          <img
            src={profile?.logo_url || PrimeAlleyLogo.src}
            alt="Logo"
            className="img-fluid"
            style={{ maxWidth: "60%", float: "right" }}
          />
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

function BillTo({ invoice, companyOptions }: Readonly<{ invoice: InvoiceViewData; companyOptions: { id: string | number; name?: string }[] }>) {
  const company = invoice.company;
  const showTrn = isPositiveNumberLike(company?.profile?.tax_id);

  return (
    <Col md={6}>
      <h5 className="mb-2 fw-bold" style={{ color: "#14509e" }}>
        Bill To
      </h5>
      <div className="border p-3 rounded bg-light mb-3">
        <p className="mb-2 fw-bold">
          {getCompanyByCrmId(company?.crm_company_id, companyOptions) ?? ""}
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

function InvoiceMeta({ invoice }: Readonly<{ invoice: InvoiceViewData }>) {
  const termsDays = invoice?.company?.reseller?.profile?.payment_terms;
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

function InvoiceItemsAndTotals({ invoice }: Readonly<{ invoice: InvoiceViewData }>) {
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
                {invoice?.company?.reseller?.name || "N/A"}.
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
                Value Added Tax (VAT) 5% will be applicable to this invoice.
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

function BankAccounts({ invoice }: Readonly<{ invoice: InvoiceViewData }>) {
  const accounts = invoice?.company?.reseller?.bank_accounts;
  const hasAccounts = Array.isArray(accounts) && accounts.length > 0;
  if (!hasAccounts) return null;

  return (
    <div className="mb-3 alert alert-info">
      <h6>Bank Accounts</h6>
      <Row>
        {accounts.map((bankAccount: any, idx: number) => (
          <Col md={4} key={bankAccount?.id ?? bankAccount?.iban ?? `${bankAccount?.account_number ?? "bank"}-${idx}`}>
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
            <p className="mb-1">
              <b>Routing Number:</b> {bankAccount.routing_number}
            </p>
            <p className="mb-1">
              <b>Swift Code:</b> {bankAccount.swift_code}
            </p>
            <p className="mb-1">
              <b>IBAN:</b> {bankAccount.iban}
            </p>
          </Col>
        ))}
      </Row>
    </div>
  );
}

function InvoiceDetails({ invoice, companyName, companyOptions }: InvoiceDetailsProps) {
  return (
    <>
      <ResellerHeader invoice={invoice} companyName={companyName} />

      <Row>
        <BillTo invoice={invoice} companyOptions={companyOptions} />
        <InvoiceMeta invoice={invoice} />
      </Row>

      <div>
        {/* Invoice Items */}
        <div className="mb-4">
          <InvoiceItemsAndTotals invoice={invoice} />
        </div>

        {/* Notes */}
        <BankAccounts invoice={invoice} />
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
}: InvoiceViewModalProps) {
  if (!show) return null;

  let body: React.ReactNode;
  if (loading && !invoice) body = <div className="text-muted">Loading…</div>;
  else if (invoice) body = <InvoiceDetails invoice={invoice} companyName={companyName} companyOptions={companyOptions} />;
  else body = <Alert variant="warning">No invoice data available</Alert>;

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
