import { useRef, useState } from "react";
import type { ProductCategoryData } from "@utils/accounts";
import {
  BASE_BUTTON,
  FIELD_INPUT,
  FIELD_LABEL,
  FIELD_SELECT,
  FIELD_TEXTAREA,
  SECTION_CARD,
  SECTION_TITLE,
} from "@components/shared/productModalStyles";
import { onBorderBlur, onBorderFocus, SelectCaret } from "@components/shared/modalUiHelpers";

export function ProductInformationCard({
  title = "Product information",
  error,
  productName,
  onProductNameChange,
  productSku,
  onProductSkuChange,
  productDescription,
  onProductDescriptionChange,
  categoryId,
  onCategoryIdChange,
  categories,
  loadingCategories,
  submitting,
  productType,
  onProductTypeChange,
  additionalOpen,
  onAdditionalOpenChange,
  idPrefix = "cmp",
}: Readonly<{
  title?: string;
  error?: string | null;
  productName: string;
  onProductNameChange: (value: string) => void;
  productSku: string;
  onProductSkuChange: (value: string) => void;
  productDescription: string;
  onProductDescriptionChange: (value: string) => void;
  categoryId: string;
  onCategoryIdChange: (value: string) => void;
  categories: ProductCategoryData[];
  loadingCategories: boolean;
  submitting: boolean;
  productType: string;
  onProductTypeChange: (value: string) => void;
  additionalOpen: boolean;
  onAdditionalOpenChange: (next: boolean) => void;
  idPrefix?: string;
}>) {
  const [dragOver, setDragOver] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div style={SECTION_CARD}>
      <p style={SECTION_TITLE}>{title}</p>

      {error && (
        <div style={{ marginBottom: "16px", color: "#b91c1c", fontSize: "13px" }}>
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr auto",
          gap: "20px",
          alignItems: "start",
        }}
      >
        <div>
          <label style={FIELD_LABEL} htmlFor={`${idPrefix}-product-name`}>
            Name <span style={{ color: "#e53e3e" }}>*</span>
          </label>
          <input
            id={`${idPrefix}-product-name`}
            type="text"
            value={productName}
            onChange={(e) => onProductNameChange(e.target.value)}
            style={FIELD_INPUT}
            onFocus={onBorderFocus}
            onBlur={onBorderBlur}
          />
        </div>

        <div>
          <label style={FIELD_LABEL} htmlFor={`${idPrefix}-product-sku`}>
            SKU
          </label>
          <input
            id={`${idPrefix}-product-sku`}
            type="text"
            value={productSku}
            onChange={(e) => onProductSkuChange(e.target.value)}
            style={FIELD_INPUT}
            onFocus={onBorderFocus}
            onBlur={onBorderBlur}
          />
        </div>

        <button
          type="button"
          aria-label="Upload product image"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            padding: 0,
            border: `1.5px dashed ${dragOver ? "#2d6ae0" : "rgb(138,138,138)"}`,
            width: "180px",
            height: "120px",
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
            onChange={(e) => handleImageUpload(e.target.files?.[0])}
          />
          {uploadedImage ? (
            <img src={uploadedImage} alt="product" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <>
              <span style={{ ...BASE_BUTTON }}>Upload</span>
              <span
                style={{
                  fontSize: "12px",
                  color: "#2d6ae0",
                  fontWeight: 300,
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                Browse images
              </span>
            </>
          )}
        </button>
      </div>

      <div style={{ marginTop: "20px", maxWidth: "calc(100% - 200px)" }}>
        <label style={FIELD_LABEL} htmlFor={`${idPrefix}-product-description`}>
          Product description
        </label>
        <textarea
          id={`${idPrefix}-product-description`}
          value={productDescription}
          onChange={(e) => onProductDescriptionChange(e.target.value)}
          style={FIELD_TEXTAREA}
          onFocus={onBorderFocus}
          onBlur={onBorderBlur}
        />
      </div>

      <div style={{ marginTop: "20px", maxWidth: "calc(100% - 200px)" }}>
        <label style={FIELD_LABEL} htmlFor={`${idPrefix}-product-category`}>
          Category <span style={{ color: "#e53e3e" }}>*</span>
        </label>
        <div style={{ position: "relative" }}>
          <select
            id={`${idPrefix}-product-category`}
            value={categoryId}
            onChange={(e) => onCategoryIdChange(e.target.value)}
            style={FIELD_SELECT}
            onFocus={onBorderFocus}
            onBlur={onBorderBlur}
            disabled={loadingCategories || submitting}
          >
            <option value="">{loadingCategories ? "Loading..." : "Select category"}</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
          <SelectCaret />
        </div>
      </div>

      <div style={{ marginTop: "20px", maxWidth: "calc(100% - 200px)" }}>
        <label style={FIELD_LABEL} htmlFor={`${idPrefix}-product-type`}>
          Product type
        </label>
        <div style={{ position: "relative" }}>
          <select
            id={`${idPrefix}-product-type`}
            value={productType}
            onChange={(e) => onProductTypeChange(e.target.value)}
            style={FIELD_SELECT}
            onFocus={onBorderFocus}
            onBlur={onBorderBlur}
          >
            <option value=""></option>
            <option value="physical">Physical</option>
            <option value="digital">Digital</option>
            <option value="service">Service</option>
            <option value="subscription">Subscription</option>
          </select>
          <SelectCaret />
        </div>
      </div>

      <div
        style={{
          marginTop: "24px",
          borderTop: "1px solid #e0e0e0",
          paddingTop: "16px",
        }}
      >
        <button
          type="button"
          onClick={() => onAdditionalOpenChange(!additionalOpen)}
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
          <span
            style={{
              display: "inline-block",
              transition: "transform 150ms ease-out",
              transform: additionalOpen ? "rotate(90deg)" : "rotate(0deg)",
              fontSize: "11px",
            }}
          >
            ›
          </span>{" "}
          Additional product information
        </button>

        {additionalOpen && (
          <div
            style={{
              marginTop: "20px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
            }}
          >
            <div>
              <label style={FIELD_LABEL} htmlFor={`${idPrefix}-product-brand`}>
                Brand
              </label>
              <input
                id={`${idPrefix}-product-brand`}
                type="text"
                style={FIELD_INPUT}
                onFocus={onBorderFocus}
                onBlur={onBorderBlur}
              />
            </div>

            <div>
              <label style={FIELD_LABEL} htmlFor={`${idPrefix}-product-url`}>
                URL
              </label>
              <input
                id={`${idPrefix}-product-url`}
                type="url"
                placeholder="https://"
                style={FIELD_INPUT}
                onFocus={onBorderFocus}
                onBlur={onBorderBlur}
              />
            </div>

            <div>
              <label style={FIELD_LABEL} htmlFor={`${idPrefix}-product-terms-url`}>
                Terms &amp; conditions URL
              </label>
              <input
                id={`${idPrefix}-product-terms-url`}
                type="url"
                placeholder="https://"
                style={FIELD_INPUT}
                onFocus={onBorderFocus}
                onBlur={onBorderBlur}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

