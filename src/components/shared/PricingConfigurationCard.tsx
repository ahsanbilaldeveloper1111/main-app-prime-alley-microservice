import { useCallback } from "react";
import {
  BASE_BUTTON,
  FIELD_INPUT,
  FIELD_LABEL,
  FIELD_SELECT,
  SECTION_CARD,
  SECTION_TITLE,
} from "@components/shared/productModalStyles";
import { onBorderBlur, onBorderFocus, SelectCaret } from "@components/shared/modalUiHelpers";
import { SubBarButton } from "@components/shared/FullScreenModalShell";

type PricingTabId = "flat" | "tiered";

export function PricingConfigurationCard({
  pricingTab,
  onPricingTabChange,
  currency,
  onCurrencyChange,
  priceAed,
  onPriceAedChange,
  submitting,
  onManageCurrencies,
  idPrefix = "cmp",
}: Readonly<{
  pricingTab: PricingTabId;
  onPricingTabChange: (tab: PricingTabId) => void;
  currency: "AED" | "USD";
  onCurrencyChange: (currency: "AED" | "USD") => void;
  priceAed: string;
  onPriceAedChange: (value: string) => void;
  submitting: boolean;
  onManageCurrencies?: () => void;
  idPrefix?: string;
}>) {
  const handlePricingTabEnter = useCallback(
    (tabId: PricingTabId, e: React.MouseEvent<HTMLButtonElement>) => {
      if (pricingTab !== tabId) e.currentTarget.style.backgroundColor = "#f9f9f9";
    },
    [pricingTab],
  );

  const handlePricingTabLeave = useCallback(
    (tabId: PricingTabId, e: React.MouseEvent<HTMLButtonElement>) => {
      if (pricingTab !== tabId) e.currentTarget.style.backgroundColor = "#fff";
    },
    [pricingTab],
  );

  const handleManageCurrenciesClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      onManageCurrencies?.();
    },
    [onManageCurrencies],
  );

  return (
    <div style={SECTION_CARD}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
        <div
          style={{
            display: "inline-flex",
            border: "1px solid rgb(138,138,138)",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          {([
            { id: "flat", label: "Flat rate pricing" },
            { id: "tiered", label: "Tiered pricing" },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => onPricingTabChange(tab.id)}
              style={{
                ...BASE_BUTTON,
                borderRadius: 0,
                border: "none",
                borderRight: tab.id === "flat" ? "1px solid rgb(138,138,138)" : "none",
                backgroundColor: pricingTab === tab.id ? "#f0f0f0" : "#fff",
                fontWeight: pricingTab === tab.id ? 400 : 300,
                color: "#141414",
              }}
              onMouseEnter={(e) => handlePricingTabEnter(tab.id, e)}
              onMouseLeave={(e) => handlePricingTabLeave(tab.id, e)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "16px",
        }}
      >
        <p style={SECTION_TITLE}>Pricing configuration</p>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "#141414", fontWeight: 300 }}>
              Currency:
            </span>
            <div style={{ position: "relative", width: "100px" }}>
              <select
                value={currency}
                onChange={(e) => onCurrencyChange(e.target.value === "USD" ? "USD" : "AED")}
                style={{ ...FIELD_SELECT, height: "34px", paddingInline: "10px", paddingRight: "28px" }}
                onFocus={onBorderFocus}
                onBlur={onBorderBlur}
                disabled={submitting}
              >
                <option value="AED">AED</option>
                <option value="USD">USD</option>
              </select>
              <SelectCaret right={10} />
            </div>
          </div>

          <button
            type="button"
            onClick={handleManageCurrenciesClick}
            style={{
              fontSize: "12px",
              color: "#2d6ae0",
              textDecoration: "underline",
              fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
              fontWeight: 300,
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: 0,
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            Manage currencies <span style={{ fontSize: "10px" }}>↗</span>
          </button>
        </div>
      </div>

      {pricingTab === "flat" ? (
        <div>
          <label style={FIELD_LABEL} htmlFor={`${idPrefix}-product-base-price`}>
            Base price <span style={{ color: "#e53e3e" }}>*</span>
          </label>
          <input
            id={`${idPrefix}-product-base-price`}
            type="number"
            value={priceAed}
            onChange={(e) => onPriceAedChange(e.target.value)}
            style={FIELD_INPUT}
            onFocus={onBorderFocus}
            onBlur={onBorderBlur}
            placeholder="0.00"
            disabled={submitting}
          />
        </div>
      ) : (
        <div
          style={{
            border: "1px solid #e0e0e0",
            borderRadius: "4px",
            padding: "32px",
            textAlign: "center",
            color: "#888",
            fontSize: "13px",
            fontWeight: 300,
          }}
        >
          <p style={{ margin: 0 }}>
            Tiered pricing lets you set different rates based on quantity ranges.
          </p>
          <div style={{ marginTop: "16px" }}>
            <SubBarButton>+ Add tier</SubBarButton>
          </div>
        </div>
      )}
    </div>
  );
}

