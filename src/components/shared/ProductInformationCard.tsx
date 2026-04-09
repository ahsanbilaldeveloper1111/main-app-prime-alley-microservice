import { useEffect, useRef, useState } from "react";
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

const PRODUCT_NAME_MAX_LENGTH = 150;
const PRODUCT_SKU_MAX_LENGTH = 150;
const PRODUCT_DESCRIPTION_MAX_LENGTH = 500;

const FIELD_CHAR_COUNT_HINT: React.CSSProperties = {
  fontSize: "11px",
  color: "#888",
  marginTop: "4px",
  fontWeight: 300,
};

function ProductLogoField({
  idPrefix,
  submitting,
  existingLogoUrl,
  logoFile,
  onLogoFileChange,
}: Readonly<{
  idPrefix: string;
  submitting: boolean;
  existingLogoUrl?: string | null;
  logoFile: File | null;
  onLogoFileChange: (file: File | null) => void;
}>) {
  const [dragOver, setDragOver] = useState(false);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const remoteLogoUrl = existingLogoUrl?.trim() || null;

  useEffect(() => {
    if (!logoFile) {
      setFilePreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(logoFile);
    setFilePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  const displayImageSrc = filePreviewUrl ?? remoteLogoUrl;

  const pickImageFile = (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    onLogoFileChange(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (submitting) return;
    pickImageFile(e.dataTransfer.files?.[0]);
  };

  const openFilePicker = () => {
    if (submitting) return;
    fileInputRef.current?.click();
  };

  const handleRemoveNewUpload = () => {
    onLogoFileChange(null);
    const input = fileInputRef.current;
    if (input) input.value = "";
  };

  const dropZoneBorder = `1.5px dashed ${dragOver ? "#2d6ae0" : "rgb(138,138,138)"}`;
  const dropZoneBg = dragOver ? "#f0f5ff" : "#fafafa";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", flexShrink: 0 }}>
      <input
        ref={fileInputRef}
        id={`${idPrefix}-product-logo-file`}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        tabIndex={-1}
        disabled={submitting}
        onChange={(e) => {
          pickImageFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        aria-label="Upload product image"
        disabled={submitting}
        onDragOver={(e) => {
          e.preventDefault();
          if (!submitting) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={openFilePicker}
        style={{
          padding: 0,
          border: dropZoneBorder,
          width: "180px",
          height: "120px",
          borderRadius: "4px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          backgroundColor: dropZoneBg,
          cursor: submitting ? "not-allowed" : "pointer",
          transition: "150ms ease-out",
          flexShrink: 0,
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {displayImageSrc ? (
          <img src={displayImageSrc} alt="product" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
      {logoFile && remoteLogoUrl ? (
        <button
          type="button"
          onClick={handleRemoveNewUpload}
          disabled={submitting}
          style={{
            marginTop: "6px",
            padding: 0,
            border: "none",
            background: "none",
            cursor: submitting ? "not-allowed" : "pointer",
            fontSize: "11px",
            color: "#2d6ae0",
            textDecoration: "underline",
            fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
            fontWeight: 300,
          }}
        >
          Use saved logo
        </button>
      ) : null}
    </div>
  );
}

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
  disableSku = false,
  existingLogoUrl = null,
  logoFile,
  onLogoFileChange,
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
  /** When true (e.g. editing an existing product), SKU cannot be changed. */
  disableSku?: boolean;
  /** URL from API for edit mode (shown until the user picks a new file). */
  existingLogoUrl?: string | null;
  logoFile: File | null;
  onLogoFileChange: (file: File | null) => void;
}>) {
  useEffect(() => {
    if (productName.length <= PRODUCT_NAME_MAX_LENGTH) return;
    onProductNameChange(productName.slice(0, PRODUCT_NAME_MAX_LENGTH));
  }, [productName, onProductNameChange]);

  useEffect(() => {
    if (productSku.length <= PRODUCT_SKU_MAX_LENGTH) return;
    onProductSkuChange(productSku.slice(0, PRODUCT_SKU_MAX_LENGTH));
  }, [productSku, onProductSkuChange]);

  useEffect(() => {
    if (productDescription.length <= PRODUCT_DESCRIPTION_MAX_LENGTH) return;
    onProductDescriptionChange(
      productDescription.slice(0, PRODUCT_DESCRIPTION_MAX_LENGTH),
    );
  }, [productDescription, onProductDescriptionChange]);

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
            maxLength={PRODUCT_NAME_MAX_LENGTH}
            onChange={(e) =>
              onProductNameChange(e.target.value.slice(0, PRODUCT_NAME_MAX_LENGTH))
            }
            style={FIELD_INPUT}
            onFocus={onBorderFocus}
            onBlur={onBorderBlur}
            aria-describedby={`${idPrefix}-product-name-hint`}
          />
          <div id={`${idPrefix}-product-name-hint`} style={FIELD_CHAR_COUNT_HINT}>
            {productName.length} / {PRODUCT_NAME_MAX_LENGTH} characters maximum
          </div>
        </div>

        <div>
          <label style={FIELD_LABEL} htmlFor={`${idPrefix}-product-sku`}>
            SKU
          </label>
          <input
            id={`${idPrefix}-product-sku`}
            type="text"
            value={productSku}
            maxLength={PRODUCT_SKU_MAX_LENGTH}
            onChange={(e) =>
              onProductSkuChange(e.target.value.slice(0, PRODUCT_SKU_MAX_LENGTH))
            }
            style={{ ...FIELD_INPUT, cursor: disableSku ? "not-allowed" : "pointer" }}
            onFocus={onBorderFocus}
            onBlur={onBorderBlur}
            disabled={disableSku}
            aria-describedby={`${idPrefix}-product-sku-hint`}
          />
          <div id={`${idPrefix}-product-sku-hint`} style={FIELD_CHAR_COUNT_HINT}>
            {productSku.length} / {PRODUCT_SKU_MAX_LENGTH} characters maximum
          </div>
        </div>

        <ProductLogoField
          idPrefix={idPrefix}
          submitting={submitting}
          existingLogoUrl={existingLogoUrl}
          logoFile={logoFile}
          onLogoFileChange={onLogoFileChange}
        />
      </div>

      <div style={{ marginTop: "20px", maxWidth: "calc(100% - 200px)" }}>
        <label style={FIELD_LABEL} htmlFor={`${idPrefix}-product-description`}>
          Product description
        </label>
        <textarea
          id={`${idPrefix}-product-description`}
          value={productDescription}
          maxLength={PRODUCT_DESCRIPTION_MAX_LENGTH}
          onChange={(e) =>
            onProductDescriptionChange(
              e.target.value.slice(0, PRODUCT_DESCRIPTION_MAX_LENGTH),
            )
          }
          style={FIELD_TEXTAREA}
          onFocus={onBorderFocus}
          onBlur={onBorderBlur}
          aria-describedby={`${idPrefix}-product-description-hint`}
        />
        <div id={`${idPrefix}-product-description-hint`} style={FIELD_CHAR_COUNT_HINT}>
          {productDescription.length} / {PRODUCT_DESCRIPTION_MAX_LENGTH} characters maximum
        </div>
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

