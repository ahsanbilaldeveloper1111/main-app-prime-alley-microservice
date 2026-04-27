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

/**
 * ECMAScript `WhiteSpace` + `LineTerminator` (same class as `\s` in regex).
 * O(1) per code point — no regex / no ReDoS (Sonar S5852).
 */
function isEcmaWhitespaceCodePoint(cp: number): boolean {
  return (
    cp === 0x0009 ||
    cp === 0x000a ||
    cp === 0x000b ||
    cp === 0x000c ||
    cp === 0x000d ||
    cp === 0x0020 ||
    cp === 0x00a0 ||
    cp === 0xfeff ||
    cp === 0x1680 ||
    (cp >= 0x2000 && cp <= 0x200a) ||
    cp === 0x2028 ||
    cp === 0x2029 ||
    cp === 0x202f ||
    cp === 0x205f ||
    cp === 0x3000
  );
}

function isEcmaWhitespaceChar(ch: string): boolean {
  const cp = ch.codePointAt(0);
  return cp !== undefined && isEcmaWhitespaceCodePoint(cp);
}

function isAsciiLowerOrDigitOrHyphen(ch: string): boolean {
  if (ch === "-") {
    return true;
  }
  const cp = ch.codePointAt(0);
  if (cp === undefined) {
    return false;
  }
  return (cp >= 0x30 && cp <= 0x39) || (cp >= 0x61 && cp <= 0x7a);
}

/** Same as `.replaceAll(/\s+/g, "-")` on the string (linear time). */
function insertHyphensForWhitespaceRuns(lower: string): string {
  let out = "";
  let inWhitespaceRun = false;
  for (const ch of lower) {
    if (isEcmaWhitespaceChar(ch)) {
      inWhitespaceRun = true;
      continue;
    }
    if (inWhitespaceRun && out.length > 0) {
      out += "-";
    }
    inWhitespaceRun = false;
    out += ch;
  }
  return out;
}

/** Same as `.replaceAll(/[^a-z0-9-]/g, "")` for ASCII letters (linear time). */
function keepAsciiSkuChars(s: string): string {
  let out = "";
  for (const ch of s) {
    if (isAsciiLowerOrDigitOrHyphen(ch)) {
      out += ch;
    }
  }
  return out;
}

/** Same as `.replaceAll(/-+/g, "-")` (linear time). */
function collapseAdjacentHyphens(s: string): string {
  let out = "";
  let previousWasHyphen = false;
  for (const ch of s) {
    if (ch === "-") {
      if (!previousWasHyphen) {
        out += "-";
        previousWasHyphen = true;
      }
    } else {
      out += ch;
      previousWasHyphen = false;
    }
  }
  return out;
}

/** Same as `.replaceAll(/^-+/g, "").replaceAll(/-+$/g, "")` (linear time). */
function trimLeadingTrailingHyphens(s: string): string {
  let start = 0;
  let end = s.length;
  while (start < end && s[start] === "-") {
    start += 1;
  }
  while (end > start && s[end - 1] === "-") {
    end -= 1;
  }
  return s.slice(start, end);
}

/**
 * e.g. `Abc Product` → `abc-product` for auto-filled SKU while creating.
 * Linear-time only (no vulnerable regex quantifiers — Sonar S5852 / ReDoS).
 */
function productNameToSuggestedSku(name: string): string {
  const lower = name.trim().toLowerCase();
  const hyphenated = insertHyphensForWhitespaceRuns(lower);
  const filtered = keepAsciiSkuChars(hyphenated);
  const collapsed = collapseAdjacentHyphens(filtered);
  const trimmed = trimLeadingTrailingHyphens(collapsed);
  return trimmed.slice(0, PRODUCT_SKU_MAX_LENGTH);
}

const FIELD_CHAR_COUNT_HINT: React.CSSProperties = {
  fontSize: "11px",
  color: "#888",
  marginTop: "4px",
  fontWeight: 300,
};

/** Maps API field `is_service` to a native `<select>` value (`true` / `false` / unset). */
function isServiceSelectString(isService: boolean | null): "" | "true" | "false" {
  if (isService === null) {
    return "";
  }
  return isService ? "true" : "false";
}

function ProductLogoField({
  idPrefix,
  submitting,
  existingLogoUrl,
  logoFile,
  onLogoFileChange,
  onExistingLogoClear,
}: Readonly<{
  idPrefix: string;
  submitting: boolean;
  existingLogoUrl?: string | null;
  logoFile: File | null;
  onLogoFileChange: (file: File | null) => void;
  /** Clear API/stored logo URL (edit mode). */
  onExistingLogoClear?: () => void;
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

  const handleRemoveImage = () => {
    if (submitting) return;
    if (logoFile) {
      handleRemoveNewUpload();
      return;
    }
    onExistingLogoClear?.();
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
          <img
            src={displayImageSrc}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
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
      {displayImageSrc ? (
        <button
          type="button"
          onClick={handleRemoveImage}
          disabled={submitting}
          aria-label="Remove product image"
          style={{
            marginTop: "6px",
            padding: 0,
            border: "none",
            background: "none",
            cursor: submitting ? "not-allowed" : "pointer",
            fontSize: "11px",
            color: "#b91c1c",
            textDecoration: "underline",
            fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
            fontWeight: 300,
          }}
        >
          Remove
        </button>
      ) : null}
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
  /** `null` = "Choose type"; mirrors API `is_service` when set. */
  isService,
  onIsServiceChange,
  additionalOpen,
  onAdditionalOpenChange,
  idPrefix = "cmp",
  disableSku = false,
  existingLogoUrl = null,
  logoFile,
  onLogoFileChange,
  onExistingLogoClear,
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
  isService: boolean | null;
  onIsServiceChange: (value: boolean | null) => void;
  additionalOpen: boolean;
  onAdditionalOpenChange: (next: boolean) => void;
  idPrefix?: string;
  /** When true (e.g. editing an existing product), SKU cannot be changed. */
  disableSku?: boolean;
  /** URL from API for edit mode (shown until the user picks a new file). */
  existingLogoUrl?: string | null;
  logoFile: File | null;
  onLogoFileChange: (file: File | null) => void;
  /** Called when user removes the saved logo (no new file selected). */
  onExistingLogoClear?: () => void;
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
            onChange={(e) => {
              const next = e.target.value.slice(0, PRODUCT_NAME_MAX_LENGTH);
              onProductNameChange(next);
              if (!disableSku) {
                onProductSkuChange(productNameToSuggestedSku(next));
              }
            }}
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
          onExistingLogoClear={onExistingLogoClear}
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
            value={isServiceSelectString(isService)}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") {
                onIsServiceChange(null);
              } else {
                onIsServiceChange(v === "true");
              }
            }}
            style={FIELD_SELECT}
            onFocus={onBorderFocus}
            onBlur={onBorderBlur}
            disabled={submitting}
          >
            <option value="">Choose type</option>
            <option value="false">Product</option>
            <option value="true">Service</option>
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

