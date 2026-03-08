import { useState, useRef } from "react";

const BASE_BUTTON = {
  cursor: "pointer",
  transition: "150ms ease-out",
  display: "inline-block",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  backgroundColor: "rgb(255, 255, 255)",
  borderColor: "rgb(138, 138, 138)",
  color: "rgb(20, 20, 20)",
  textDecoration: "none",
  borderRadius: "4px",
  borderWidth: "1px",
  borderStyle: "solid",
  verticalAlign: "middle",
  paddingBlock: "8px",
  paddingInline: "16px",
  maxWidth: "100%",
  fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
  fontSize: "12px",
  fontWeight: 300,
  letterSpacing: "0px",
  lineHeight: "14px",
  textUnderlineOffset: "24%",
};

const FIELD_LABEL = {
  fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
  fontSize: "12px",
  fontWeight: 400,
  color: "#141414",
  marginBottom: "6px",
  display: "block",
};

const FIELD_INPUT = {
  height: "42px",
  width: "100%",
  border: "1px solid rgb(138, 138, 138)",
  borderRadius: "4px",
  padding: "0 12px",
  fontSize: "14px",
  fontWeight: 100,
  color: "#141414",
  fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
  outline: "none",
  boxSizing: "border-box" as const,
  backgroundColor: "#fff",
};

const FIELD_TEXTAREA = {
  width: "100%",
  border: "1px solid rgb(138, 138, 138)",
  borderRadius: "4px",
  padding: "10px 12px",
  fontSize: "14px",
  fontWeight: 100,
  color: "#141414",
  fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
  outline: "none",
  boxSizing: "border-box" as const,
  resize: "vertical" as const,
  minHeight: "72px",
  backgroundColor: "#fff",
};

const FIELD_SELECT = {
  height: "42px",
  width: "100%",
  border: "1px solid rgb(138, 138, 138)",
  borderRadius: "4px",
  padding: "0 36px 0 12px",
  fontSize: "14px",
  fontWeight: 100,
  color: "#141414",
  fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
  outline: "none",
  boxSizing: "border-box" as const,
  backgroundColor: "#fff",
  appearance: "none" as const,
  WebkitAppearance: "none" as const,
  cursor: "pointer",
};

const SECTION_CARD = {
  backgroundColor: "#fff",
  border: "1px solid #e0e0e0",
  borderRadius: "8px",
  padding: "28px 32px",
  marginBottom: "16px",
};

const SECTION_TITLE = {
  fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
  fontSize: "14px",
  fontWeight: 500,
  color: "#141414",
  marginBottom: "24px",
  marginTop: 0,
};

interface CreateProductModalProps {
  onClose: () => void;
  onCreate: () => void;
  onCreateAndAddAnother: () => void;
}

export default function CreateProductModal({ onClose, onCreate, onCreateAndAddAnother }: CreateProductModalProps) {
  const [pricingTab, setPricingTab] = useState("flat");
  const [billingFrequency, setBillingFrequency] = useState("one-time");
  const [productType, setProductType] = useState("");
  const [additionalOpen, setAdditionalOpen] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [unitCost, setUnitCost] = useState("");
  const [priceAED, setPriceAED] = useState("");
  const [priceUSD, setPriceUSD] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const margin = (() => {
    const cost = parseFloat(unitCost) || 0;
    const price = parseFloat(priceAED) || 0;
    if (price === 0) return "AED 0.00";
    const m = ((price - cost) / price) * 100;
    return `AED ${(price - cost).toFixed(2)} (${m.toFixed(1)}%)`;
  })();

  const handleImageUpload = (file: File | null | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploadedImage(url);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageUpload(file);
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 99999,
      backgroundColor: "#f0f0f0",
      display: "flex",
      flexDirection: "column",
      fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
    }}>
      {/* ── Top bar ── */}
      <div style={{
        height: "52px",
        backgroundColor: "#1a1a1a",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingInline: "20px",
        flexShrink: 0,
      }}>
        {/* Exit */}
        <button
          onClick={onClose}
          style={{ ...BASE_BUTTON, backgroundColor: "transparent", borderColor: "rgba(255,255,255,0.35)", color: "#fff" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.7)"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"}
        >
          Exit
        </button>

        {/* Title */}
        <span style={{ color: "#fff", fontSize: "14px", fontWeight: 400, fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif" }}>
          Create product
        </span>

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={onCreateAndAddAnother}
            style={{ ...BASE_BUTTON, backgroundColor: "transparent", borderColor: "rgba(255,255,255,0.35)", color: "#fff" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.7)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"}
          >
            Create and add another
          </button>
          <div style={{ position: "relative" }}>
            <button
              onClick={onCreate}
              style={{ ...BASE_BUTTON, backgroundColor: "#fff", color: "#141414", fontWeight: 400, paddingInline: "20px" }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f0f0f0"}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "#fff"}
            >
              Create
            </button>
            {/* Badge */}
            <span style={{
              position: "absolute",
              top: "-8px",
              right: "-8px",
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              backgroundColor: "#e53e3e",
              color: "#fff",
              fontSize: "10px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #1a1a1a",
            }}>2</span>
          </div>
        </div>
      </div>

      {/* ── Sub bar ── */}
      <div style={{
        height: "44px",
        backgroundColor: "#fff",
        borderBottom: "1px solid #e0e0e0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingInline: "20px",
        flexShrink: 0,
      }}>
        <button
          style={{ ...BASE_BUTTON }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f5f5f5"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "#fff"}
        >
          Edit this form
        </button>

        {/* Active toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "#141414", fontWeight: 300 }}>Active:</span>
          {/* Info icon */}
          <span style={{ fontSize: "11px", color: "#888", cursor: "help" }} title="When active, this product is available for use in quotes">ⓘ</span>
          {/* Toggle */}
          <div
            onClick={() => setIsActive(v => !v)}
            style={{
              width: "44px",
              height: "24px",
              borderRadius: "12px",
              backgroundColor: isActive ? "#2d6ae0" : "#ccc",
              cursor: "pointer",
              transition: "background-color 150ms ease-out",
              position: "relative",
              flexShrink: 0,
            }}
          >
            <div style={{
              position: "absolute",
              top: "3px",
              left: isActive ? "23px" : "3px",
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              backgroundColor: "#fff",
              transition: "left 150ms ease-out",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }} />
          </div>
          {/* Checkmark */}
          {isActive && (
            <span style={{ fontSize: "14px", color: "#2d6ae0" }}>✓</span>
          )}
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "24px",
        maxWidth: "90%",
        width: "90%",
        margin: "0 auto",
        boxSizing: "border-box",
      }}>

        {/* ── Product information ── */}
        <div style={SECTION_CARD}>
          <p style={SECTION_TITLE}>Product information</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "20px", alignItems: "start" }}>
            {/* Name */}
            <div>
              <label style={FIELD_LABEL}>
                Name <span style={{ color: "#e53e3e" }}>*</span>
              </label>
              <input
                type="text"
                style={FIELD_INPUT}
                onFocus={e => e.target.style.borderColor = "#2d6ae0"}
                onBlur={e => e.target.style.borderColor = "rgb(138,138,138)"}
              />
            </div>

            {/* SKU */}
            <div>
              <label style={FIELD_LABEL}>SKU</label>
              <input
                type="text"
                style={FIELD_INPUT}
                onFocus={e => e.target.style.borderColor = "#2d6ae0"}
                onBlur={e => e.target.style.borderColor = "rgb(138,138,138)"}
              />
            </div>

            {/* Image upload */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                width: "180px",
                height: "120px",
                border: `1.5px dashed ${dragOver ? "#2d6ae0" : "rgb(138,138,138)"}`,
                borderRadius: "4px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                backgroundColor: dragOver ? "#f0f5ff" : "#fafafa",
                cursor: "pointer",
                transition: "150ms ease-out",
                flexShrink: 0,
                overflow: "hidden",
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={e => handleImageUpload(e.target.files?.[0])}
              />
              {uploadedImage ? (
                <img src={uploadedImage} alt="product" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <>
                  <button
                    style={{ ...BASE_BUTTON }}
                    onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f5f5f5"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "#fff"}
                  >
                    Upload
                  </button>
                  <span style={{ fontSize: "12px", color: "#2d6ae0", fontWeight: 300, textDecoration: "underline", cursor: "pointer" }}>
                    Browse images
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Product description */}
          <div style={{ marginTop: "20px", maxWidth: "calc(100% - 200px)" }}>
            <label style={FIELD_LABEL}>Product description</label>
            <textarea
              style={FIELD_TEXTAREA}
              onFocus={e => e.target.style.borderColor = "#2d6ae0"}
              onBlur={e => e.target.style.borderColor = "rgb(138,138,138)"}
            />
          </div>

          {/* Product type */}
          <div style={{ marginTop: "20px", maxWidth: "calc(100% - 200px)" }}>
            <label style={FIELD_LABEL}>Product type</label>
            <div style={{ position: "relative" }}>
              <select
                value={productType}
                onChange={e => setProductType(e.target.value)}
                style={FIELD_SELECT}
                onFocus={e => e.target.style.borderColor = "#2d6ae0"}
                onBlur={e => e.target.style.borderColor = "rgb(138,138,138)"}
              >
                <option value=""></option>
                <option value="physical">Physical</option>
                <option value="digital">Digital</option>
                <option value="service">Service</option>
                <option value="subscription">Subscription</option>
              </select>
              <span style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                fontSize: "10px",
                color: "#555",
              }}>▾</span>
            </div>
          </div>

          {/* Additional product information collapsible */}
          <div style={{ marginTop: "24px", borderTop: "1px solid #e0e0e0", paddingTop: "16px" }}>
            <button
              onClick={() => setAdditionalOpen(v => !v)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                fontSize: "13px",
                fontWeight: 400,
                color: "#141414",
                padding: 0,
              }}
            >
              <span style={{
                display: "inline-block",
                transition: "transform 150ms ease-out",
                transform: additionalOpen ? "rotate(90deg)" : "rotate(0deg)",
                fontSize: "11px",
              }}>›</span>
              Additional product information
            </button>

            {additionalOpen && (
              <div style={{ marginTop: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <label style={FIELD_LABEL}>Brand</label>
                  <input type="text" style={FIELD_INPUT}
                    onFocus={e => e.target.style.borderColor = "#2d6ae0"}
                    onBlur={e => e.target.style.borderColor = "rgb(138,138,138)"} />
                </div>
                <div>
                  <label style={FIELD_LABEL}>Category</label>
                  <input type="text" style={FIELD_INPUT}
                    onFocus={e => e.target.style.borderColor = "#2d6ae0"}
                    onBlur={e => e.target.style.borderColor = "rgb(138,138,138)"} />
                </div>
                <div>
                  <label style={FIELD_LABEL}>URL</label>
                  <input type="url" placeholder="https://" style={FIELD_INPUT}
                    onFocus={e => e.target.style.borderColor = "#2d6ae0"}
                    onBlur={e => e.target.style.borderColor = "rgb(138,138,138)"} />
                </div>
                <div>
                  <label style={FIELD_LABEL}>Terms &amp; conditions URL</label>
                  <input type="url" placeholder="https://" style={FIELD_INPUT}
                    onFocus={e => e.target.style.borderColor = "#2d6ae0"}
                    onBlur={e => e.target.style.borderColor = "rgb(138,138,138)"} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Billing details ── */}
        <div style={SECTION_CARD}>
          <p style={SECTION_TITLE}>Billing details</p>

          <div style={{ maxWidth: "380px" }}>
            <label style={FIELD_LABEL}>Billing frequency</label>
            <div style={{ position: "relative" }}>
              <select
                value={billingFrequency}
                onChange={e => setBillingFrequency(e.target.value)}
                style={FIELD_SELECT}
                onFocus={e => e.target.style.borderColor = "#2d6ae0"}
                onBlur={e => e.target.style.borderColor = "rgb(138,138,138)"}
              >
                <option value="one-time">One-time</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
              <span style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                fontSize: "10px",
                color: "#555",
              }}>▾</span>
            </div>
          </div>
        </div>

        {/* ── Pricing configuration ── */}
        <div style={SECTION_CARD}>
          {/* Pricing tabs */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
            <div style={{
              display: "inline-flex",
              border: "1px solid rgb(138,138,138)",
              borderRadius: "4px",
              overflow: "hidden",
            }}>
              {[
                { id: "flat", label: "Flat rate pricing" },
                { id: "tiered", label: "Tiered pricing" },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setPricingTab(tab.id)}
                  style={{
                    ...BASE_BUTTON,
                    borderRadius: 0,
                    border: "none",
                    borderRight: tab.id === "flat" ? "1px solid rgb(138,138,138)" : "none",
                    backgroundColor: pricingTab === tab.id ? "#f0f0f0" : "#fff",
                    fontWeight: pricingTab === tab.id ? 400 : 300,
                    color: "#141414",
                  }}
                  onMouseEnter={e => { if (pricingTab !== tab.id) e.currentTarget.style.backgroundColor = "#f9f9f9"; }}
                  onMouseLeave={e => { if (pricingTab !== tab.id) e.currentTarget.style.backgroundColor = "#fff"; }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing header row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
            <p style={SECTION_TITLE}>Pricing configuration</p>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ fontSize: "12px", color: "#141414", fontWeight: 300 }}>
                Default currency: United Arab Emirates Dirham (AED) ↓↑
              </span>
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
                Manage currencies
                <span style={{ fontSize: "10px" }}>↗</span>
              </a>
            </div>
          </div>

          {pricingTab === "flat" ? (
            <>
              {/* Price row */}
              <div style={{
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                overflow: "hidden",
                marginBottom: "20px",
              }}>
                {/* Column headers */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  borderBottom: "1px solid #e0e0e0",
                  backgroundColor: "#fafafa",
                }}>
                  <div style={{
                    padding: "10px 16px",
                    fontSize: "12px",
                    fontWeight: 400,
                    color: "#141414",
                    borderRight: "1px solid #e0e0e0",
                  }}>
                    Price AED <span style={{ color: "#e53e3e" }}>*</span>
                  </div>
                  <div style={{ padding: "10px 16px", fontSize: "12px", fontWeight: 400, color: "#141414" }}>
                    Price USD
                  </div>
                </div>

                {/* Price inputs */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                  <div style={{ padding: "12px 16px", borderRight: "1px solid #e0e0e0" }}>
                    <input
                      type="number"
                      value={priceAED}
                      onChange={e => setPriceAED(e.target.value)}
                      style={{ ...FIELD_INPUT, border: "1px solid rgb(138,138,138)" }}
                      onFocus={e => e.target.style.borderColor = "#2d6ae0"}
                      onBlur={e => e.target.style.borderColor = "rgb(138,138,138)"}
                      placeholder="0.00"
                    />
                  </div>
                  <div style={{ padding: "12px 16px" }}>
                    <input
                      type="number"
                      value={priceUSD}
                      onChange={e => setPriceUSD(e.target.value)}
                      style={{ ...FIELD_INPUT, border: "1px solid rgb(138,138,138)" }}
                      onFocus={e => e.target.style.borderColor = "#2d6ae0"}
                      onBlur={e => e.target.style.borderColor = "rgb(138,138,138)"}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Unit cost + Margin */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <label style={{ ...FIELD_LABEL, display: "flex", alignItems: "center", gap: "5px" }}>
                    Unit cost
                    <span style={{ fontSize: "11px", color: "#888", cursor: "help" }} title="The cost to produce this unit">ⓘ</span>
                  </label>
                  <input
                    type="number"
                    value={unitCost}
                    onChange={e => setUnitCost(e.target.value)}
                    style={FIELD_INPUT}
                    placeholder="0.00"
                    onFocus={e => e.target.style.borderColor = "#2d6ae0"}
                    onBlur={e => e.target.style.borderColor = "rgb(138,138,138)"}
                  />
                </div>
                <div>
                  <label style={{ ...FIELD_LABEL, display: "flex", alignItems: "center", gap: "5px" }}>
                    Margin
                    <span style={{ fontSize: "11px", color: "#888", cursor: "help" }} title="Calculated margin based on price and unit cost">ⓘ</span>
                  </label>
                  <div style={{
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
                  }}>
                    {margin}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Tiered pricing placeholder */
            <div style={{
              border: "1px solid #e0e0e0",
              borderRadius: "4px",
              padding: "32px",
              textAlign: "center",
              color: "#888",
              fontSize: "13px",
              fontWeight: 300,
            }}>
              <p style={{ margin: 0 }}>Tiered pricing lets you set different rates based on quantity ranges.</p>
              <button
                style={{ ...BASE_BUTTON, marginTop: "16px" }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f5f5f5"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "#fff"}
              >
                + Add tier
              </button>
            </div>
          )}
        </div>

        {/* Bottom spacing */}
        <div style={{ height: "40px" }} />
      </div>
    </div>
  );
}
