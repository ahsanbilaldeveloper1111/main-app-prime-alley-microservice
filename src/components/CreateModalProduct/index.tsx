import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createProduct,
  getAccountsAxiosErrorMessage,
  getProduct,
  getProductCategoriesList,
  type ProductCategoryData,
  type ProductCreateUpdatePayload,
  updateProduct,
} from "@utils/accounts";
import { getErrorMessage } from "@utils/errors";
import { toast } from "react-toastify";
import {
  BASE_BUTTON
} from "@components/shared/productModalStyles";
import {
  onDarkBorderEnter,
  onDarkBorderLeave,
  onLightBgEnter,
  onLightBgLeave,
} from "@components/shared/modalUiHelpers";
import { FullScreenModalShell, SubBarButton } from "@components/shared/FullScreenModalShell";
import { ProductInformationCard } from "@components/shared/ProductInformationCard";
import {
  getProductBasePriceAedError,
  PricingConfigurationCard,
} from "@components/shared/PricingConfigurationCard";

function isCreateProductFailureResponse(
  result: unknown,
): result is { success: false; message?: string } {
  return (
    typeof result === "object" &&
    result !== null &&
    "success" in result &&
    (result as { success: unknown }).success === false
  );
}

function createProductErrorMessage(
  result: { success: false; message?: string },
): string {
  const raw = typeof result.message === "string" ? result.message.trim() : "";
  return raw || "Failed to create product";
}

function applyCreateProductSuccess(
  mode: "create" | "create_and_add_another",
  onCreateAndAddAnother: () => void,
  onCreate: () => void,
): void {
  toast.success("Product created successfully!");
  if (mode === "create_and_add_another") onCreateAndAddAnother();
  else onCreate();
}

interface CreateProductModalProps {
  onClose: () => void;
  onCreate: () => void;
  onCreateAndAddAnother: () => void;
  /** When provided, modal will load product data and update instead of creating. */
  productId?: number;
  /** Optional callback for edit mode. */
  onUpdated?: () => void;
}

export default function CreateProductModal({
  onClose,
  onCreate,
  onCreateAndAddAnother,
  productId,
  onUpdated,
}: Readonly<CreateProductModalProps>) {
  const [pricingTab, setPricingTab] = useState("flat");
  /** `null` until user picks; mirrors request/response `is_service`. */
  const [isService, setIsService] = useState<boolean | null>(null);
  const [additionalOpen, setAdditionalOpen] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [priceAED, setPriceAED] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);

  const [productName, setProductName] = useState("");
  const [productSku, setProductSku] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [currency, setCurrency] = useState<"AED" | "USD">("AED");
  const [categories, setCategories] = useState<ProductCategoryData[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isEditMode = typeof productId === "number" && Number.isFinite(productId);

  useEffect(() => {
    if (isEditMode) return;
    setLogoFile(null);
    setExistingLogoUrl(null);
  }, [isEditMode]);

  useEffect(() => {
    let cancelled = false;
    setLoadingCategories(true);
    getProductCategoriesList({ page: 1, limit: 100,is_active: true })
      .then((list) => {
        if (cancelled) return;
        setCategories(Array.isArray(list.data) ? list.data : []);
      })
      .catch((e) => {
        if (cancelled) return;
        toast.error(getErrorMessage(e, "Failed to load product categories"));
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

  useEffect(() => {
    if (!isEditMode) return;
    let cancelled = false;
    setSubmitting(true);
    setSubmitError(null);
    getProduct(productId)
      .then((p) => {
        if (cancelled) return;
        setProductName(p?.name ?? "");
        setProductSku((p as { sku?: string }).sku ?? "");
        setProductDescription(p?.description ?? "");
        setCategoryId(String(p?.category_id ?? ""));
        setPriceAED(p?.base_price == null ? "" : String(p.base_price));
        const currencyCode =
          (p as { currency_code?: string }).currency_code ?? p?.currency ?? "AED";
        setCurrency(currencyCode === "USD" ? "USD" : "AED");
        setLogoFile(null);
        const logoUrl = typeof p?.logo_url === "string" ? p.logo_url.trim() : "";
        setExistingLogoUrl(logoUrl || null);
        setIsService(
          typeof p?.is_service === "boolean" ? p.is_service : false,
        );
        const maybeRecord = p as unknown as Record<string, unknown>;
        const maybeIsActive = maybeRecord["is_active"];
        if (typeof maybeIsActive === "boolean") setIsActive(maybeIsActive);
      })
      .catch((e) => {
        if (cancelled) return;
        toast.error(getErrorMessage(e, "Failed to load product"));
      })
      .finally(() => {
        if (cancelled) return;
        setSubmitting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isEditMode, productId]);

  const validatePayload = useCallback((): string | null => {
    if (!productName.trim()) return "Name is mandatory";
    if (!categoryId) {
      setAdditionalOpen(true);
      return "Category is mandatory";
    }
    return getProductBasePriceAedError(priceAED);
  }, [categoryId, priceAED, productName, setAdditionalOpen]);

  const priceAedFieldError = useMemo(() => {
    const msg = getProductBasePriceAedError(priceAED);
    if (!msg) {
      return null;
    }
    const raw = String(priceAED ?? "").trim();
    if (!raw) {
      return submitError?.startsWith("Base price") ? msg : null;
    }
    return msg;
  }, [priceAED, submitError]);

  const submitProduct = useCallback(
    async (mode: "create" | "create_and_add_another") => {
      const validationError = validatePayload();
      if (validationError) {
        setSubmitError(validationError);
        return;
      }

      setSubmitting(true);
      setSubmitError(null);
      try {
        
        const payload: ProductCreateUpdatePayload = {
          name: productName.trim(),
          sku: productSku.trim() ? productSku.trim() : undefined,
          description: productDescription.trim() ? productDescription.trim() : undefined,
          category_id: categoryId,
          base_price: Number(priceAED),
          is_active: isActive,
          is_service: isService ?? false,
          currency,
          ...(logoFile ? { logo_file: logoFile } : {}),
        };

        if (isEditMode) {
          await updateProduct(productId, payload);
          toast.success("Product updated successfully!");
          onUpdated?.();
          if (!onUpdated) onCreate();
          return;
        }

        const productResponse = await createProduct(payload);
        if (isCreateProductFailureResponse(productResponse)) {
          const msg = createProductErrorMessage(productResponse);
          toast.error(msg);
          setSubmitError(msg);
          return;
        }

        applyCreateProductSuccess(mode, onCreateAndAddAnother, onCreate);
      } catch (e) {
        const fallback = isEditMode
          ? "Failed to update product"
          : "Failed to create product";
        const msg = getAccountsAxiosErrorMessage(e, fallback);
        setSubmitError(msg);
      } finally {
        setSubmitting(false);
      }
    },
    [
      categoryId,
      currency,
      isActive,
      isEditMode,
      isService,
      onCreate,
      onCreateAndAddAnother,
      onUpdated,
      logoFile,
      priceAED,
      productDescription,
      productName,
      productSku,
      productId,
      validatePayload,
    ],
  );

  const runSubmitAfterValidation = useCallback(
    (mode: "create" | "create_and_add_another") => {
      if (submitting) {
        return;
      }
      const validationError = validatePayload();
      if (validationError) {
        setSubmitError(validationError);
        toast.error(validationError);
        return;
      }
      submitProduct(mode).then(() => undefined);
    },
    [submitProduct, submitting, validatePayload],
  );

  const topBarActions = (
    <>
      {isEditMode ? (
        <button
          type="button"
          onClick={() => {
            runSubmitAfterValidation("create");
          }}
          style={{
            ...BASE_BUTTON,
            backgroundColor: "#fff",
            color: "#141414",
            fontWeight: 400,
            paddingInline: "20px",
            ...(submitting ? { cursor: "not-allowed", opacity: 0.85 } : {}),
          }}
          onMouseEnter={onLightBgEnter}
          onMouseLeave={onLightBgLeave}
          disabled={submitting}
        >
          Update
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              runSubmitAfterValidation("create_and_add_another");
            }}
            style={{
              ...BASE_BUTTON,
              backgroundColor: "transparent",
              borderColor: "rgba(255,255,255,0.35)",
              color: "#fff",
              ...(submitting ? { cursor: "not-allowed", opacity: 0.85 } : {}),
            }}
            onMouseEnter={onDarkBorderEnter}
            onMouseLeave={onDarkBorderLeave}
            disabled={submitting}
          >
            Create and add another
          </button>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => {
                runSubmitAfterValidation("create");
              }}
              style={{
                ...BASE_BUTTON,
                backgroundColor: "#fff",
                color: "#141414",
                fontWeight: 400,
                paddingInline: "20px",
                ...(submitting ? { cursor: "not-allowed", opacity: 0.85 } : {}),
              }}
              onMouseEnter={onLightBgEnter}
              onMouseLeave={onLightBgLeave}
              disabled={submitting}
            >
              Create
            </button>
          </div>
        </>
      )}
    </>
  );

  const subBarLeft = isEditMode ? (
    <SubBarButton>Edit product</SubBarButton>
  ) : (
    <SubBarButton>Creating new product</SubBarButton>
  );

  return (
    <FullScreenModalShell
      title="Create product"
      onClose={onClose}
      topBarActions={topBarActions}
      subBarLeft={subBarLeft}
      isActive={isActive}
      onToggleActive={() => setIsActive((v) => !v)}
    >
      <ProductInformationCard
        error={submitError}
        productName={productName}
        onProductNameChange={setProductName}
        productSku={productSku}
        onProductSkuChange={setProductSku}
        productDescription={productDescription}
        onProductDescriptionChange={setProductDescription}
        categoryId={categoryId}
        onCategoryIdChange={setCategoryId}
        categories={categories}
        loadingCategories={loadingCategories}
        submitting={submitting}
        isService={isService}
        onIsServiceChange={setIsService}
        additionalOpen={additionalOpen}
        onAdditionalOpenChange={setAdditionalOpen}
        idPrefix="cmp"
        disableSku={isEditMode}
        existingLogoUrl={existingLogoUrl}
        logoFile={logoFile}
        onLogoFileChange={setLogoFile}
        onExistingLogoClear={() => setExistingLogoUrl(null)}
      />

      <PricingConfigurationCard
        pricingTab={pricingTab as "flat" | "tiered"}
        onPricingTabChange={(t) => setPricingTab(t)}
        currency={currency}
        onCurrencyChange={setCurrency}
        priceAed={priceAED}
        onPriceAedChange={setPriceAED}
        submitting={submitting}
        syncCurrencyFromCompanyProfile={!isEditMode}
        idPrefix="cmp"
        priceAedError={priceAedFieldError}
      />

        {/* Bottom spacing */}
        <div style={{ height: "40px" }} />
    </FullScreenModalShell>
  );
}
