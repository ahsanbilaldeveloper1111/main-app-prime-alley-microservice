import React from "react";
import { Form } from "react-bootstrap";
import { getCompanyByCrmId } from "@utils/Helper";
import { BillingCustomerCompanySelect } from "@components/billings/customer/BillingCustomerCompanySelect";
import type { BillingCompanyOption } from "@hooks/billing/useMinifiedCompaniesForSelect";
import type { CountrySelectOption } from "./accountOverviewTypes";

export type AccountOverviewToolbarProps = Readonly<{
  companyOptions: BillingCompanyOption[];
  selectedCompanyId: string | number;
  onCompanyChange: (nextId: string | number | "") => void;
  currencyOptions: CountrySelectOption[];
  customerCurrency: string;
  isLoadingCustomer: boolean;
  isLoadingCurrencies: boolean;
  isSavingCurrency: boolean;
  isCurrencyLocked: boolean;
  currencyLockedTitle: string;
  onCurrencyChange: (nextCurrency: string) => void;
}>;

export function AccountOverviewToolbar({
  companyOptions,
  selectedCompanyId,
  onCompanyChange,
  currencyOptions,
  customerCurrency,
  isLoadingCustomer,
  isLoadingCurrencies,
  isSavingCurrency,
  isCurrencyLocked,
  currencyLockedTitle,
  onCurrencyChange,
}: AccountOverviewToolbarProps) {
  return (
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
      <div className="mb-3 mb-md-0">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item">
              <a href="/dashboard" className="text-decoration-none">
                Accounting
              </a>
            </li>
            <li className="breadcrumb-item active fw-bold" aria-current="page">
              Overview
            </li>
          </ol>
        </nav>
      </div>
      <div className="mb-3 mb-md-0 d-flex align-items-center gap-2">
        {companyOptions.length > 0 ? (
          <BillingCustomerCompanySelect
            showEmptyOption={false}
            value={selectedCompanyId}
            onChange={(next) => {
              onCompanyChange(next === "" ? "" : next);
            }}
            companies={companyOptions}
          />
        ) : (
          <span className="text-muted small">Loading companies…</span>
        )}

        {selectedCompanyId ? (
          <Form.Select
            size="sm"
            className="bc-company-select-w"
            value={customerCurrency}
            disabled={
              isLoadingCustomer ||
              isLoadingCurrencies ||
              isSavingCurrency ||
              isCurrencyLocked
            }
            title={isCurrencyLocked ? currencyLockedTitle : undefined}
            onChange={(e) => {
              onCurrencyChange(e.target.value);
            }}
          >
            <option value="">
              {isLoadingCustomer || isLoadingCurrencies
                ? "Loading currencies..."
                : "Select currency"}
            </option>
            {currencyOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Form.Select>
        ) : null}
      </div>
    </div>
  );
}

/** Labels company select after CRM id — keeps toolbar unaware of options shape beyond id/name. */
export function resolveCompanyLabelForToolbar(
  companyId: string | number,
  companyOptions: BillingCompanyOption[],
): string {
  return getCompanyByCrmId(String(companyId), companyOptions) ?? "";
}
