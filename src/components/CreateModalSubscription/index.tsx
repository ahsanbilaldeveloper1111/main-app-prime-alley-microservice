import { useCallback, useEffect, useRef, useState } from "react";
import {
  createProduct,
  createCustomerProductPricing,
  getProductCategoriesList,
  type ProductCategoryData,
} from "@utils/accounts";
import {
  BASE_BUTTON,
  FIELD_INPUT,
  FIELD_LABEL,
  FIELD_SELECT,
  FIELD_TEXTAREA,
  SECTION_CARD,
  SECTION_TITLE,
} from "@components/shared/productModalStyles";

interface CreateSubscriptionModalProps {
  customerId: string | number;
  onClose: () => void;
  onCreate: () => void;
  onCreateAndAddAnother: () => void;
}

export default function CreateSubscriptionModal({
  customerId,
  onClose,
  onCreate,
  onCreateAndAddAnother,
}: Readonly<CreateSubscriptionModalProps>) {
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

  const [productName, setProductName] = useState("");
  const [productSku, setProductSku] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [currency, setCurrency] = useState<"AED" | "USD">("AED");
  const [categories, setCategories] = useState<ProductCategoryData[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const margin = (() => {
    const cost = Number.parseFloat(unitCost) || 0;
    const price = Number.parseFloat(priceAED) || 0;
    if (price === 0) return "AED 0.00";
    const m = ((price - cost) / price) * 100;
    return `AED ${(price - cost).toFixed(2)} (${m.toFixed(1)}%)`;
  })();

  const handleImageUpload = (file: File | null | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploadedImage(url);
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageUpload(file);
  };

  useEffect(() => {
    let cancelled = false;
    setLoadingCategories(true);
    getProductCategoriesList()
      .then((list) => {
        if (cancelled) return;
        setCategories(Array.isArray(list) ? list : []);
      })
      .catch((e) => {
        if (cancelled) return;
        console.error("Failed to load product categories:", e);
        setCategories([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingCategories(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const validatePayload = useCallback((): string | null => {
    if (!productName.trim()) return "Name is mandatory";
    if (!categoryId) {
      setAdditionalOpen(true);
      return "Category is mandatory";
    }
    if (!String(priceAED ?? "").trim()) return "Base price is mandatory";
    return null;
  }, [categoryId, priceAED, productName, setAdditionalOpen]);

  const submitCreateProduct = useCallback(
    async (mode: "create" | "create_and_add_another") => {
      const validationError = validatePayload();
      if (validationError) {
        setSubmitError(validationError);
        return;
      }

      setSubmitting(true);
      setSubmitError(null);
      try {
        if (customerId === "") {
          setSubmitError("Please select a company first");
          return;
        }

        const payload = {
          name: productName.trim(),
          sku: productSku.trim() ? productSku.trim() : undefined,
          description: productDescription.trim() ? productDescription.trim() : undefined,
          category_id: categoryId,
          base_price: Number(priceAED),
          is_active: isActive,
          is_service: productType === "service",
          currency,
        };
        const created = await createProduct(payload);
        console.log("Created product:", created);

        const createdProductId = created?.id;
        if (createdProductId == null) {
          throw new Error("Product created but id is missing");
        }

        await createCustomerProductPricing(customerId, {
          product_id: String(createdProductId),
          selling_price: String(payload.base_price ?? 0),
        });

        if (mode === "create_and_add_another") {
          onCreateAndAddAnother();
        } else {
          onCreate();
        }
      } catch (e: any) {
        console.error("Failed to create product:", e);
        setSubmitError(e?.message || "Failed to create product");
      } finally {
        setSubmitting(false);
      }
    },
    [
      categoryId,
      customerId,
      currency,
      isActive,
      onCreate,
      onCreateAndAddAnother,
      priceAED,
      productDescription,
      productName,
      productSku,
      productType,
      validatePayload,
    ],
  );

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
            onClick={() => {
              submitCreateProduct("create_and_add_another").then(() => undefined);
            }}
            style={{ ...BASE_BUTTON, backgroundColor: "transparent", borderColor: "rgba(255,255,255,0.35)", color: "#fff" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.7)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"}
            disabled={submitting}
          >
            Create and add another
          </button>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => {
                submitCreateProduct("create").then(() => undefined);
              }}
              style={{ ...BASE_BUTTON, backgroundColor: "#fff", color: "#141414", fontWeight: 400, paddingInline: "20px" }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f0f0f0"}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "#fff"}
              disabled={submitting}
            >
              Create
            </button>
            {/* Badge
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
            }}>2</span> */}
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
          <button
            type="button"
            aria-label="Toggle active"
            aria-pressed={isActive}
            onClick={() => setIsActive(v => !v)}
            style={{
              padding: 0,
              border: "none",
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
          </button>
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

          {submitError && (
            <div style={{ marginBottom: "16px", color: "#b91c1c", fontSize: "13px" }}>
              {submitError}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "20px", alignItems: "start" }}>
            {/* Name */}
            <div>
              <label style={FIELD_LABEL} htmlFor="cmp-product-name">
                Name <span style={{ color: "#e53e3e" }}>*</span>
              </label>
              <input
                id="cmp-product-name"
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                style={FIELD_INPUT}
                onFocus={e => e.target.style.borderColor = "#2d6ae0"}
                onBlur={e => e.target.style.borderColor = "rgb(138,138,138)"}
              />
            </div>

            {/* SKU */}
            <div>
              <label style={FIELD_LABEL} htmlFor="cmp-product-sku">SKU</label>
              <input
                id="cmp-product-sku"
                type="text"
                value={productSku}
                onChange={(e) => setProductSku(e.target.value)}
                style={FIELD_INPUT}
                onFocus={e => e.target.style.borderColor = "#2d6ae0"}
                onBlur={e => e.target.style.borderColor = "rgb(138,138,138)"}
              />
            </div>

            {/* Image upload */}
            <button
              type="button"
              aria-label="Upload product image"
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                padding: 0,
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
                borderStyle: "dashed",
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
                  <span style={{ ...BASE_BUTTON }}>Upload</span>
                  <span style={{ fontSize: "12px", color: "#2d6ae0", fontWeight: 300, textDecoration: "underline", cursor: "pointer" }}>
                    Browse images
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Product description */}
          <div style={{ marginTop: "20px", maxWidth: "calc(100% - 200px)" }}>
            <label style={FIELD_LABEL} htmlFor="cmp-product-description">
              Product description
            </label>
            <textarea
              id="cmp-product-description"
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              style={FIELD_TEXTAREA}
              onFocus={e => e.target.style.borderColor = "#2d6ae0"}
              onBlur={e => e.target.style.borderColor = "rgb(138,138,138)"}
            />
          </div>

          <div style={{ marginTop: "20px", maxWidth: "calc(100% - 200px)" }}>
            <label style={FIELD_LABEL} htmlFor="cmp-product-base-price">
              Base price <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <input
                      id="cmp-product-base-price"
                      type="number"
                      value={priceAED}
                      onChange={e => setPriceAED(e.target.value)}
                      style={{ ...FIELD_INPUT, border: "1px solid rgb(138,138,138)" }}
                      onFocus={e => e.target.style.borderColor = "#2d6ae0"}
                      onBlur={e => e.target.style.borderColor = "rgb(138,138,138)"}
                      placeholder="0.00"
                    />
          </div>


          <div style={{ marginTop: "20px", maxWidth: "calc(100% - 200px)" }}>
                  <label style={FIELD_LABEL} htmlFor="cmp-product-category">
                    Category <span style={{ color: "#e53e3e" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <select
                      id="cmp-product-category"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      style={FIELD_SELECT}
                      onFocus={e => (e.currentTarget.style.borderColor = "#2d6ae0")}
                      onBlur={e => (e.currentTarget.style.borderColor = "rgb(138,138,138)")}
                      disabled={loadingCategories || submitting}
                    >
                      <option value="">
                        {loadingCategories ? "Loading..." : "Select category"}
                      </option>
                      {categories.map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          {c.name}
                        </option>
                      ))}
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

          

          {/* Product type */}
          <div style={{ marginTop: "20px", maxWidth: "calc(100% - 200px)" }}>
            <label style={FIELD_LABEL} htmlFor="cms-product-type">Product type</label>
            <div style={{ position: "relative" }}>
              <select
                id="cms-product-type"
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
              {" "}
              Additional product information
            </button>

            {additionalOpen && (
              <div style={{ marginTop: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <label style={FIELD_LABEL} htmlFor="cms-product-brand">Brand</label>
                  <input id="cms-product-brand" type="text" style={FIELD_INPUT}
                    onFocus={e => e.target.style.borderColor = "#2d6ae0"}
                    onBlur={e => e.target.style.borderColor = "rgb(138,138,138)"} />
                </div>
               
                <div>
                  <label style={FIELD_LABEL} htmlFor="cms-product-url">URL</label>
                  <input id="cms-product-url" type="url" placeholder="https://" style={FIELD_INPUT}
                    onFocus={e => e.target.style.borderColor = "#2d6ae0"}
                    onBlur={e => e.target.style.borderColor = "rgb(138,138,138)"} />
                </div>
                <div>
                  <label style={FIELD_LABEL} htmlFor="cms-product-terms-url">Terms &amp; conditions URL</label>
                  <input id="cms-product-terms-url" type="url" placeholder="https://" style={FIELD_INPUT}
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
            <label style={FIELD_LABEL} htmlFor="cms-product-billing-frequency">Billing frequency</label>
            <div style={{ position: "relative" }}>
              <select
                id="cms-product-billing-frequency"
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
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12px", color: "#141414", fontWeight: 300 }}>
                  Currency:
                </span>
                <div style={{ position: "relative", width: "100px" }}>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as "AED" | "USD")}
                    style={{ ...FIELD_SELECT, height: "34px", paddingInline: "10px", paddingRight: "28px" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#2d6ae0")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgb(138,138,138)")}
                    disabled={submitting}
                  >
                    <option value="AED">AED</option>
                    <option value="USD">USD</option>
                  </select>
                  <span style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    fontSize: "10px",
                    color: "#555",
                  }}>▾</span>
                </div>
              </div>
              <button
                type="button"
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
                Manage currencies
                {" "}
                <span style={{ fontSize: "10px" }}>↗</span>
              </button>
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
                  <label
                    style={{ ...FIELD_LABEL, display: "flex", alignItems: "center", gap: "5px" }}
                    htmlFor="cms-product-unit-cost"
                  >
                    Unit cost
                    {" "}
                    <span style={{ fontSize: "11px", color: "#888", cursor: "help" }} title="The cost to produce this unit">ⓘ</span>
                  </label>
                  <input
                    id="cms-product-unit-cost"
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
                  <div style={{ ...FIELD_LABEL, display: "flex", alignItems: "center", gap: "5px" }}>
                    Margin{" "}
                    <span style={{ fontSize: "11px", color: "#888", cursor: "help" }} title="Calculated margin based on price and unit cost">ⓘ</span>
                  </div>
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
