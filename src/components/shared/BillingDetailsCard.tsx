import { FIELD_LABEL, FIELD_SELECT, SECTION_CARD, SECTION_TITLE } from "@components/shared/productModalStyles";
import { onBorderBlur, onBorderFocus, SelectCaret } from "@components/shared/modalUiHelpers";

export function BillingDetailsCard({
  billingFrequency,
  onBillingFrequencyChange,
  idPrefix = "cmp",
  disabled = false,
}: Readonly<{
  billingFrequency: string;
  onBillingFrequencyChange: (value: string) => void;
  idPrefix?: string;
  disabled?: boolean;
}>) {
  return (
    <div style={SECTION_CARD}>
      <p style={SECTION_TITLE}>Billing details</p>

      <div style={{ maxWidth: "380px" }}>
        <label style={FIELD_LABEL} htmlFor={`${idPrefix}-product-billing-frequency`}>
          Billing frequency
        </label>
        <div style={{ position: "relative" }}>
          <select
            id={`${idPrefix}-product-billing-frequency`}
            value={billingFrequency}
            onChange={(e) => onBillingFrequencyChange(e.target.value)}
            style={FIELD_SELECT}
            onFocus={onBorderFocus}
            onBlur={onBorderBlur}
            disabled={disabled}
          >
            <option value="one-time">One-time</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annually">Annually</option>
          </select>
          <SelectCaret />
        </div>
      </div>
    </div>
  );
}

