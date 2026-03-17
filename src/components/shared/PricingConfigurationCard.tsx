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
  priceUsd,
  onPriceUsdChange,
  unitCost,
  onUnitCostChange,
  marginText,
  submitting,
  idPrefix = "cmp",
}: Readonly<{
  pricingTab: PricingTabId;
  onPricingTabChange: (tab: PricingTabId) => void;
  currency: "AED" | "USD";
  onCurrencyChange: (currency: "AED" | "USD") => void;
  priceAed: string;
  onPriceAedChange: (value: string) => void;
  priceUsd: string;
  onPriceUsdChange: (value: string) => void;
  unitCost: string;
  onUnitCostChange: (value: string) => void;
  marginText: string;
  submitting: boolean;
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

          <a
            href="#"
            style={{
              fontSize: "12px",
              color: "#2d6ae0",
              textDecoration: "underline",
              fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
              fontWeight: 300,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            Manage currencies <span style={{ fontSize: "10px" }}>↗</span>
          </a>
        </div>
      </div>

      {pricingTab === "flat" ? (
        <>
          <div
            style={{
              border: "1px solid #e0e0e0",
              borderRadius: "4px",
              overflow: "hidden",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                borderBottom: "1px solid #e0e0e0",
                backgroundColor: "#fafafa",
              }}
            >
              <div
                style={{
                  padding: "10px 16px",
                  fontSize: "12px",
                  fontWeight: 400,
                  color: "#141414",
                  borderRight: "1px solid #e0e0e0",
                }}
              >
                Price AED <span style={{ color: "#e53e3e" }}>*</span>
              </div>
              <div
                style={{
                  padding: "10px 16px",
                  fontSize: "12px",
                  fontWeight: 400,
                  color: "#141414",
                }}
              >
                Price USD
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              <div style={{ padding: "12px 16px", borderRight: "1px solid #e0e0e0" }}>
                <input
                  type="number"
                  value={priceAed}
                  onChange={(e) => onPriceAedChange(e.target.value)}
                  style={FIELD_INPUT}
                  onFocus={onBorderFocus}
                  onBlur={onBorderBlur}
                  placeholder="0.00"
                />
              </div>
              <div style={{ padding: "12px 16px" }}>
                <input
                  type="number"
                  value={priceUsd}
                  onChange={(e) => onPriceUsdChange(e.target.value)}
                  style={FIELD_INPUT}
                  onFocus={onBorderFocus}
                  onBlur={onBorderBlur}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <label
                style={{ ...FIELD_LABEL, display: "flex", alignItems: "center", gap: "5px" }}
                htmlFor={`${idPrefix}-product-unit-cost`}
              >
                Unit cost{" "}
                <span style={{ fontSize: "11px", color: "#888", cursor: "help" }} title="The cost to produce this unit">
                  ⓘ
                </span>
              </label>
              <input
                id={`${idPrefix}-product-unit-cost`}
                type="number"
                value={unitCost}
                onChange={(e) => onUnitCostChange(e.target.value)}
                style={FIELD_INPUT}
                placeholder="0.00"
                onFocus={onBorderFocus}
                onBlur={onBorderBlur}
              />
            </div>
            <div>
              <div style={{ ...FIELD_LABEL, display: "flex", alignItems: "center", gap: "5px" }}>
                Margin{" "}
                <span style={{ fontSize: "11px", color: "#888", cursor: "help" }} title="Calculated margin based on price and unit cost">
                  ⓘ
                </span>
              </div>
              <div
                style={{
                  height: "42px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "4px",
                  backgroundColor: "#f5f5f5",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 12px",
                  fontSize: "14px",
                  fontWeight: 100,
                  color: "#141414",
                  fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                  boxSizing: "border-box",
                }}
              >
                {marginText}
              </div>
            </div>
          </div>
        </>
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

