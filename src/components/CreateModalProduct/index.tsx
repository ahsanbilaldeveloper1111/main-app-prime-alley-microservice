import { useCallback, useEffect, useState } from "react";
import {
  createProduct,
  getProduct,
  getProductCategoriesList,
  type ProductCategoryData,
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
import { BillingDetailsCard } from "@components/shared/BillingDetailsCard";
import { PricingConfigurationCard } from "@components/shared/PricingConfigurationCard";
import { formatAedMargin } from "@components/shared/pricingUtils";

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
  const [billingFrequency, setBillingFrequency] = useState("one-time");
  const [productType, setProductType] = useState("");
  const [additionalOpen, setAdditionalOpen] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [unitCost, setUnitCost] = useState("");
  const [priceAED, setPriceAED] = useState("");
  const [priceUSD, setPriceUSD] = useState("");

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

  const margin = formatAedMargin({ unitCost, priceAed: priceAED });

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
        setProductType(p?.is_service ? "service" : "");
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
    if (!String(priceAED ?? "").trim()) return "Base price is mandatory";
    return null;
  }, [categoryId, priceAED, productName, setAdditionalOpen]);

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

        if (isEditMode) {
          await updateProduct(productId, payload);
          toast.success("Product updated successfully!");
          onUpdated?.();
          if (!onUpdated) onCreate();
          return;
        }

        await createProduct(payload);
        toast.success("Product created successfully!");
        if (mode === "create_and_add_another") onCreateAndAddAnother();
        else onCreate();
      } catch (e) {
        const msg = getErrorMessage(
          e,
          isEditMode ? "Failed to update product" : "Failed to create product",
        );
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
      onCreate,
      onCreateAndAddAnother,
      onUpdated,
      priceAED,
      productDescription,
      productName,
      productSku,
      productId,
      productType,
      validatePayload,
    ],
  );

  const topBarActions = (
    <>
      {isEditMode ? (
        <button
          onClick={() => {
            submitProduct("create").then(() => undefined);
          }}
          style={{
            ...BASE_BUTTON,
            backgroundColor: "#fff",
            color: "#141414",
            fontWeight: 400,
            paddingInline: "20px",
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
            onClick={() => {
              submitProduct("create_and_add_another").then(() => undefined);
            }}
            style={{
              ...BASE_BUTTON,
              backgroundColor: "transparent",
              borderColor: "rgba(255,255,255,0.35)",
              color: "#fff",
            }}
            onMouseEnter={onDarkBorderEnter}
            onMouseLeave={onDarkBorderLeave}
            disabled={submitting}
          >
            Create and add another
          </button>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => {
                submitProduct("create").then(() => undefined);
              }}
              style={{
                ...BASE_BUTTON,
                backgroundColor: "#fff",
                color: "#141414",
                fontWeight: 400,
                paddingInline: "20px",
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
    <SubBarButton>Create new product</SubBarButton>
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
        productType={productType}
        onProductTypeChange={setProductType}
        additionalOpen={additionalOpen}
        onAdditionalOpenChange={setAdditionalOpen}
        idPrefix="cmp"
      />

      <BillingDetailsCard
        billingFrequency={billingFrequency}
        onBillingFrequencyChange={setBillingFrequency}
        idPrefix="cmp"
      />

      <PricingConfigurationCard
        pricingTab={pricingTab as "flat" | "tiered"}
        onPricingTabChange={(t) => setPricingTab(t)}
        currency={currency}
        onCurrencyChange={setCurrency}
        priceAed={priceAED}
        onPriceAedChange={setPriceAED}
        priceUsd={priceUSD}
        onPriceUsdChange={setPriceUSD}
        unitCost={unitCost}
        onUnitCostChange={setUnitCost}
        marginText={margin}
        submitting={submitting}
        idPrefix="cmp"
      />

        {/* Bottom spacing */}
        <div style={{ height: "40px" }} />
    </FullScreenModalShell>
  );
}
