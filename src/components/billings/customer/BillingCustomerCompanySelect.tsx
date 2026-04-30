import type { CSSProperties } from "react";
import Form from "react-bootstrap/Form";
import type { BillingCompanyOption } from "@hooks/billing/useMinifiedCompaniesForSelect";

export type BillingCustomerCompanySelectProps = Readonly<{
  value: string | number;
  onChange: (next: string | number) => void;
  companies: BillingCompanyOption[];
  className?: string;
  style?: CSSProperties;
  id?: string;
  /** When true (default), renders a leading empty-value option (e.g. “All companies”). */
  showEmptyOption?: boolean;
  /** Label for the empty-value option when `showEmptyOption` is true. */
  emptyOptionLabel?: string;
}>;

const defaultSelectStyle: CSSProperties = { width: "220px" };

/**
 * Shared “All companies” CRM company picker used on customer billing list pages.
 */
export function BillingCustomerCompanySelect({
  value,
  onChange,
  companies,
  className,
  style = defaultSelectStyle,
  id,
  showEmptyOption = true,
  emptyOptionLabel = "All companies",
}: BillingCustomerCompanySelectProps) {
  return (
    <div className={className}>
      <Form.Select
        id={id}
        size="sm"
        style={style}
        value={String(value)}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? "" : v);
        }}
      >
        {showEmptyOption ? (
          <option value="">{emptyOptionLabel}</option>
        ) : null}
        {companies.map((c) => (
          <option key={String(c.id)} value={String(c.id)}>
            {c.name ?? String(c.id)}
          </option>
        ))}
      </Form.Select>
    </div>
  );
}
