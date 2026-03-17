import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  createProduct,
  createCustomerProductPricing,
  getProductCategoriesList,
  type ProductCategoryData,
} from "@utils/accounts";
import {
  BASE_BUTTON,
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

  const handlePricingTabEnter = useCallback(
    (tabId: string, e: React.MouseEvent<HTMLButtonElement>) => {
      if (pricingTab !== tabId) e.currentTarget.style.backgroundColor = "#f9f9f9";
    },
    [pricingTab],
  );
  const handlePricingTabLeave = useCallback(
    (tabId: string, e: React.MouseEvent<HTMLButtonElement>) => {
      if (pricingTab !== tabId) e.currentTarget.style.backgroundColor = "#fff";
    },
    [pricingTab],
  );

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
        console.error("Failed to create subscription:", e);
        setSubmitError(e?.message || "Failed to create subscription");
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

  const handleSubmitMode = useCallback(
    (mode: "create" | "create_and_add_another") => {
      submitCreateProduct(mode).then(() => undefined);
    },
    [submitCreateProduct],
  );

  const topBarActions = (
    <>
      <button
        onClick={() => handleSubmitMode("create_and_add_another")}
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
          onClick={() => handleSubmitMode("create")}
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
  );

  return (
    <FullScreenModalShell
      title="Create Subscription"
      onClose={onClose}
      topBarActions={topBarActions}
      subBarLeft={<SubBarButton>Edit this form</SubBarButton>}
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
        idPrefix="cms"
      />

      <BillingDetailsCard
        billingFrequency={billingFrequency}
        onBillingFrequencyChange={setBillingFrequency}
        idPrefix="cms"
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
        idPrefix="cms"
      />

        {/* Bottom spacing */}
        <div style={{ height: "40px" }} />
    </FullScreenModalShell>
  );
}
