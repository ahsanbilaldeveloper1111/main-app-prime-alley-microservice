import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  BASE_BUTTON,
  FIELD_INPUT,
  FIELD_TEXTAREA,
  FIELD_TEXTAREA_SMALL,
  FIELD_INPUT_DISABLED_STYLE
} from "@components/shared/productModalStyles";
import {
  onDarkBorderEnter,
  onDarkBorderLeave,
  onLightBgEnter,
  onLightBgLeave,
} from "@components/shared/modalUiHelpers";
import { FullScreenModalShell, SubBarButton } from "@components/shared/FullScreenModalShell";
import { ToggleSwitch } from "@components/shared/ToggleSwitch";
import SelectBox, { type SelectBoxOption } from "@components/SelectBox";
import { getErrorMessage } from "@utils/errors";
import { getMinifiedCompanies } from "@utils/crm";
import {
  createCustomer,
  createCustomerProductPricingBulk,
  type CustomerProductPricingDataItem,
  type CustomerProductPricingUpsertPayload,
  getCustomer,
  getProducts,
  type ProductData,
  upsertCustomerProductPricing,
} from "@utils/accounts";
import { toDateInputValue } from "@utils/dateInputValue";

interface CreateSubscriptionModalProps {
  customerId: string | number;
  mode?: "create" | "edit";
  initialPricingData?: CustomerProductPricingDataItem[];
  onClose: () => void;
  onCreate: () => void;
  onCreateAndAddAnother: () => void;
}

const Field = ({
  label,
  fullWidth,
  children,
}: {
  label: string;
  fullWidth?: boolean;
  children: ReactNode;
}) => (
  <div style={{ gridColumn: fullWidth ? "1 / -1" : undefined }}>
    <div style={{ fontSize: 12, color: "#444", marginBottom: 6 }}>{label}</div>
    {children}
  </div>
);

function toSingleSelectValue(
  value: string | number | (string | number)[] | null,
): string | number | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

/** Aligns with SelectBox option values (string) so company name resolves when parent passes numeric ids. */
function normalizeCompanySelectValue(id: string | number | null | undefined): string {
  if (id === null || id === undefined || id === "") {
    return "";
  }
  return String(id);
}

function isIsoDateBefore(a: string, b: string): boolean {
  // Compare YYYY-MM-DD (or normalize empty to avoid invalid `<` on ISO tails).
  const aa = toDateInputValue(a) || "0000-01-01";
  const bb = toDateInputValue(b) || "0000-01-01";
  return aa < bb;
}

const STATUS_OPTIONS: SelectBoxOption[] = [
  { value: "Active", label: "Active" },
  { value: "Trial", label: "Trial" },
  { value: "In Progress", label: "In Progress" },
  { value: "Suspended", label: "Suspended" },
  { value: "Inactive", label: "Inactive" },
];

const BILLING_CYCLE_OPTIONS: SelectBoxOption[] = [
  { value: "one time", label: "One Time" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

function parseDiscountValue(
  value: string | number | (string | number)[] | null,
): number | null {
  const v = toSingleSelectValue(value);
  return v == null || v === "" ? null : Number(v);
}

type PricingRowFormFieldsProps = {
  row: CustomerProductPricingDataItem;
  products: ProductData[];
  updateRow: (productId: number, patch: Partial<CustomerProductPricingDataItem>) => void;
  submitting: boolean;
  showBasePrice?: boolean;
  showFinalPrice?: boolean;
  showRemoveButton?: boolean;
  onRemove?: () => void;
};

function PricingRowFormFields({
  row,
  products,
  updateRow,
  submitting,
  showBasePrice,
  showFinalPrice,
  showRemoveButton,
  onRemove,
}: Readonly<PricingRowFormFieldsProps>) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 12,
      }}
    >
      {showBasePrice && (
        <Field label="Base price">
          <input
            type="number"
            value={String(row?.product?.base_price ?? 0)}
            disabled
            style={{ ...FIELD_INPUT, ...FIELD_INPUT_DISABLED_STYLE }}
          />
        </Field>
      )}
      <Field label="Selling price">
        <input
          type="number"
          value={String(row.selling_price)}
          min={0}
          onChange={(e) =>
            updateRow(row.product_id, { selling_price: Number(e.target.value) })
          }
          disabled={submitting}
          style={FIELD_INPUT}
        />
      </Field>
      {showFinalPrice && (
        <Field label="Final price">
          <input
            type="number"
            value={String(row.selling_price)}
            disabled
            style={{ ...FIELD_INPUT, ...FIELD_INPUT_DISABLED_STYLE }}
          />
        </Field>
      )}
      <Field label="Discount">
        <SelectBox
          options={[{ value: "", label: "No Discount" }]}
          value={row.discount_applicability_id ?? ""}
          onChange={(value) =>
            updateRow(row.product_id, {
              discount_applicability_id: parseDiscountValue(value),
            })
          }
          isClearable={false}
          isDisabled={submitting}
        />
      </Field>
      <Field label="Status">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ToggleSwitch
            checked={row.is_active}
            disabled={submitting}
            onChange={(next) => updateRow(row.product_id, { is_active: next })}
            ariaLabel="Toggle status"
          />
          <span style={{ fontSize: 12, color: "#141414" }}>
            {row.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      </Field>
      <Field label="Current period start date">
        <input
          type="date"
          value={toDateInputValue(row.renewal_start_date)}
          onChange={(e) => {
            const nextStart = e.target.value;
            const currentEnd =
              toDateInputValue(row.renewal_end_date) || nextStart;
            const nextEnd = isIsoDateBefore(currentEnd, nextStart)
              ? nextStart
              : currentEnd;
            updateRow(row.product_id, {
              renewal_start_date: nextStart,
              renewal_end_date: nextEnd,
            });
          }}
          disabled={submitting}
          style={FIELD_INPUT}
        />
      </Field>
      <Field label="Current period end date">
        <input
          type="date"
          value={toDateInputValue(row.renewal_end_date)}
          min={toDateInputValue(row.renewal_start_date) || undefined}
          onChange={(e) => {
            const next = e.target.value;
            const startNorm =
              toDateInputValue(row.renewal_start_date) || next;
            updateRow(row.product_id, {
              renewal_end_date: isIsoDateBefore(next, startNorm)
                ? startNorm
                : next,
            });
          }}
          disabled={submitting}
          style={FIELD_INPUT}
        />
      </Field>
      <Field label="Status badge">
        <SelectBox
          options={STATUS_OPTIONS}
          value={row.status}
          onChange={(value) =>
            updateRow(row.product_id, {
              status: String(
                toSingleSelectValue(value) ?? "Active",
              ) as CustomerProductPricingDataItem["status"],
            })
          }
          isClearable={false}
          isDisabled={submitting}
        />
      </Field>
      <Field label="Billing cycle">
        <SelectBox
          options={BILLING_CYCLE_OPTIONS}
          value={row.billing_cycle}
          onChange={(value) =>
            updateRow(row.product_id, {
              billing_cycle: String(
                toSingleSelectValue(value) ?? "one time",
              ) as CustomerProductPricingDataItem["billing_cycle"],
            })
          }
          isClearable={false}
          isDisabled={submitting}
        />
      </Field>
      <Field label="Subscriptions">
        <input
          type="number"
          min={0}
          value={String(row.subscriptions)}
          onChange={(e) =>
            updateRow(row.product_id, {
              subscriptions: Math.max(0, Number(e.target.value)),
            })
          }
          disabled={submitting}
          style={FIELD_INPUT}
        />
      </Field>
      <Field label="Custom description" fullWidth>
        <textarea
          value={row.custom_description}
          onChange={(e) =>
            updateRow(row.product_id, { custom_description: e.target.value })
          }
          disabled={submitting}
          style={FIELD_TEXTAREA_SMALL ?? FIELD_TEXTAREA}
          rows={2}
          placeholder="Enter custom description"
        />
      </Field>
      {showRemoveButton && onRemove && (
        <Field label="" fullWidth>
          <button
            type="button"
            onClick={onRemove}
            disabled={submitting}
            className="btn btn-danger"
          >
            Remove Product
          </button>
        </Field>
      )}
    </div>
  );
}

export default function CreateSubscriptionModal({
  customerId,
  mode = "create",
  initialPricingData,
  onClose,
  onCreate,
  onCreateAndAddAnother,
}: Readonly<CreateSubscriptionModalProps>) {
  const isEditMode = mode === "edit";
  const isCompanyLocked = customerId !== "";
  const today = new Date().toISOString().slice(0, 10);
  const [resolvingCustomer, setResolvingCustomer] = useState(false);
  const [customerReady, setCustomerReady] = useState(false);

  const [companyOptions, setCompanyOptions] = useState<
    { id: string | number; name?: string }[]
  >([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(() =>
    normalizeCompanySelectValue(customerId),
  );
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const [products, setProducts] = useState<ProductData[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [pricingData, setPricingData] = useState<CustomerProductPricingDataItem[]>(
    () => initialPricingData ?? [],
  );
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  const [submitting, setSubmitting] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const hasCompanySelected = String(selectedCompanyId ?? "").trim() !== "";
  const formEnabled = hasCompanySelected && customerReady && !resolvingCustomer;
  const hasSelectedProducts = pricingData.length > 0;
  const submitEnabled = formEnabled && hasSelectedProducts && !submitting;
  let productSelectPlaceholder = "Select product";
  if (loadingProducts) {
    productSelectPlaceholder = "Loading products...";
  }

  const companySelectOptions: SelectBoxOption[] = companyOptions.map((c) => ({
    value: normalizeCompanySelectValue(c.id),
    label: c?.name ? c.name : `Company #${String(c.id)}`,
  }));

  const selectedProductIds = new Set(pricingData.map((p) => p.product_id));
  const productSelectOptions: SelectBoxOption[] = products
    .filter((p) => !selectedProductIds.has(p.id))
    .map((p) => ({
      value: p.id,
      label: p?.name ? p.name : `Product #${String(p.id)}`,
    }));

  useEffect(() => {
    setSelectedCompanyId(normalizeCompanySelectValue(customerId));
  }, [customerId]);

  useEffect(() => {
    if (!initialPricingData) return;
    setPricingData(initialPricingData);
    setExpandedRows(
      Object.fromEntries(initialPricingData.map((r) => [r.product_id, true])),
    );
  }, [initialPricingData]);

  useEffect(() => {
    let cancelled = false;
    setLoadingCompanies(true);
    getMinifiedCompanies({ send_all: "true" })
      .then((result) => {
        if (cancelled) return;
        setCompanyOptions(Array.isArray(result) ? result : []);
      })
      .catch((error) => {
        if (cancelled) return;
        setSubmitError(getErrorMessage(error, "Failed to load companies"));
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingCompanies(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingProducts(true);
    getProducts({ page: 1, per_page: 200 })
      .then((response) => {
        if (cancelled) return;
        const list = response?.data ?? [];
        setProducts(Array.isArray(list) ? list : []);
      })
      .catch((error) => {
        if (cancelled) return;
        setSubmitError(getErrorMessage(error, "Failed to load products"));
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingProducts(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!hasCompanySelected) {
      setCustomerReady(false);
      setResolvingCustomer(false);
      return () => {
        cancelled = true;
      };
    }

    setResolvingCustomer(true);
    setCustomerReady(false);
    setSubmitError(null);

    (async () => {
      try {
        const existing: any = await getCustomer(selectedCompanyId);
        if (cancelled) return;

        const message = String(existing?.message ?? existing?.mesg ?? "").trim();
        const isNotFound =
          existing?.success === false && message.toLowerCase() === "not found";

        if (isNotFound) {
          await createCustomer({
            crm_company_id: selectedCompanyId,
            profile: { vat_exemption: false },
          });
          if (cancelled) return;
          const createdOrFetched: any = await getCustomer(selectedCompanyId);
          if (cancelled) return;
          setCustomerReady(createdOrFetched?.success !== false);
          return;
        }

        setCustomerReady(true);
      } catch (error) {
        if (cancelled) return;
        setSubmitError(getErrorMessage(error, "Failed to load customer"));
        setCustomerReady(false);
      } finally {
        if (cancelled) return;
        setResolvingCustomer(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasCompanySelected, selectedCompanyId]);

  const upsertProductRow = (productId: number) => {
    setExpandedRows((prev) => ({ ...prev, [productId]: true }));
    setPricingData((prev) => {
      if (prev.some((r) => r.product_id === productId)) return prev;

      const product = products.find((p) => p.id === productId);
      const defaultPriceRaw =
        String(product?.effective_price ?? "").trim() ||
        String(product?.base_price ?? "").trim() ||
        "0";
      const defaultPrice = Number(defaultPriceRaw);

      return [
        ...prev,
        {
          product_id: productId,
          selling_price: Number.isFinite(defaultPrice) ? defaultPrice : 0,
          discount_applicability_id: null,
          custom_description: "",
          is_active: true,
          renewal_start_date: today,
          renewal_end_date: today,
          status: "Active",
          billing_cycle: "one time",
          subscriptions: 0,
        },
      ];
    });
  };

  const updateRow = (
    productId: number,
    patch: Partial<CustomerProductPricingDataItem>,
  ) => {
    setPricingData((prev) =>
      prev.map((r) => (r.product_id === productId ? { ...r, ...patch } : r)),
    );
  };

  const deleteRow = (productId: number) => {
    setExpandedRows((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
    setPricingData((prev) => prev.filter((r) => r.product_id !== productId));
  };

  const buildUpsertPayload = (
    row: CustomerProductPricingDataItem,
  ): CustomerProductPricingUpsertPayload => ({
    product_id: String(row.product_id),
    selling_price: Number(row.selling_price),
    custom_description: String(row.custom_description ?? "").trim() ? row.custom_description : null,
    is_active: Boolean(row.is_active),
    discount_applicability_id: row.discount_applicability_id ?? null,
    renewal_start_date: toDateInputValue(row.renewal_start_date) || null,
    renewal_end_date: toDateInputValue(row.renewal_end_date) || null,
    status: row.status,
    billing_cycle: row.billing_cycle,
    subscriptions: Math.max(0, Number(row.subscriptions ?? 0) || 0),
  });

  const getSubmitValidationError = (): string | null => {
    if (!selectedCompanyId) return "Please select a company first";
    if (!formEnabled) return "Please wait until the customer is ready";
    if (pricingData.length === 0) return "Please choose at least one product";
    if (pricingData.some((r) => !Number.isFinite(Number(r.selling_price)))) {
      return "Selling price must be a valid number";
    }
    if (isEditMode && pricingData.length !== 1) {
      return "Edit requires exactly one selected product";
    }
    return null;
  };

  const handleSubmitMode = async (
    submitMode: "create" | "create_and_add_another",
  ) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const validationError = getSubmitValidationError();
      if (validationError) {
        setSubmitError(validationError);
        return;
      }

      if (isEditMode) {
        const row = pricingData[0];
        await upsertCustomerProductPricing(selectedCompanyId, buildUpsertPayload(row));
      } else {
        await createCustomerProductPricingBulk(selectedCompanyId, {
          pricing_data: pricingData,
        });
      }

      if (submitMode === "create") {
        onCreate();
      } else {
        setPricingData([]);
        onCreateAndAddAnother();
      }
    } catch (error) {
      setSubmitError(
        getErrorMessage(
          error,
          isEditMode ? "Failed to update subscription" : "Failed to create subscription",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const topBarActions =
    mode === "edit" ? (
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
          disabled={!submitEnabled}
        >
          Save
        </button>
      </div>
    ) : (
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
          disabled={!submitEnabled}
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
            disabled={!submitEnabled}
          >
            Create
          </button>
        </div>
      </>
    );

  return (
    <FullScreenModalShell
      title={`${mode === "edit" ? "Edit" : "Create"} Subscription`}
      onClose={onClose}
      topBarActions={topBarActions}
      subBarLeft={<SubBarButton>Edit this form</SubBarButton>}
      isActive={isActive}

      hideActiveToggle={true}
      hideSubBar={true}
      onToggleActive={() => setIsActive((v) => !v)}
    >
      <div style={{  margin: "0 auto" }}>
        {submitError && (
          <div
            style={{
              background: "#fff3f3",
              border: "1px solid #ffd2d2",
              color: "#9b1c1c",
              padding: "12px 14px",
              borderRadius: 10,
              marginBottom: 14,
              fontSize: 13,
            }}
          >
            {submitError}
          </div>
        )}

        <div
          style={{
            background: "#fff",
            border: "1px solid #e8e8e8",
            borderRadius: 12,
            padding: 16,
          }}
        >
          {mode !== "edit" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: "#444", marginBottom: 6 }}>
                  Company <span style={{ color: "#cc4444" }}>*</span>
                </div>
                <SelectBox
                  options={companySelectOptions}
                  value={hasCompanySelected ? selectedCompanyId : null}
                  onChange={(value) => {
                    const v = toSingleSelectValue(value);
                    setSelectedCompanyId(normalizeCompanySelectValue(v));
                    setPricingData([]);
                    setExpandedRows({});
                  }}
                  placeholder={loadingCompanies ? "Loading companies..." : "Select company"}
                  isClearable={!isCompanyLocked}
                  isDisabled={isCompanyLocked || loadingCompanies || submitting}
                />
                {isCompanyLocked && (
                  <div style={{ marginTop: 6, fontSize: 11, color: "#777" }}>
                    Company is pre-selected from the subscriptions page.
                  </div>
                )}
                {!isCompanyLocked && resolvingCustomer && (
                  <div style={{ marginTop: 6, fontSize: 11, color: "#777" }}>
                    Preparing customer...
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 12, color: "#444", marginBottom: 6 }}>
                  Product <span style={{ color: "#cc4444" }}>*</span>
                </div>
                <SelectBox
                  options={productSelectOptions}
                  value={null}
                  onChange={(value) => {
                    const v = toSingleSelectValue(value);
                    const id = Number(v);
                    if (Number.isFinite(id) && id > 0) {
                      upsertProductRow(id);
                    }
                  }}
                  placeholder={productSelectPlaceholder}
                  isClearable={false}
                  isDisabled={loadingProducts || submitting}
                />
                {!hasCompanySelected && (
                  <div style={{ marginTop: 6, fontSize: 11, color: "#777" }}>
                    Company is mandatory to submit.
                  </div>
                )}
                {!hasSelectedProducts && (
                  <div style={{ marginTop: 6, fontSize: 11, color: "#777" }}>
                    Please choose at least one product to enable Create.
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ marginTop: 14 }}>
            {pricingData.length === 0 ? (
              <div
                style={{
                  padding: "14px 12px",
                  border: "1px dashed #d0d0d0",
                  borderRadius: 12,
                  color: "#777",
                  textAlign: "center",
                  background: "#fafafa",
                }}
              >
                Select a product to add it here.
              </div>
            ) : (
              <>
                {mode === "edit"
                  ? pricingData.map((row, idx) => {
                const product = products.find((p) => p.id === row.product_id);
                const name = row?.product?.name ?? product?.name ?? `Product #${row.product_id}`;
                const description = String(row?.product?.description ?? product?.description ?? "").trim();


                return (
                  <div
                    key={String(row.product_id)}
                    style={{
                      border: "1px solid #e8e8e8",
                      borderRadius: 12,
                      overflow: "hidden",
                      marginBottom: 10,
                      background: "#fff",
                    }}
                  >
                    <div
                      style={{
                        padding: "12px 14px",
                        background: "#fafafa",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      <div style={{ fontWeight: 600, color: "#141414" }}>
                         {name}
                      </div>
                      <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                        {description || "No description"}
                      </div>
                    </div>

                    <div style={{ padding: 14 }}>
                      <PricingRowFormFields
                        row={row}
                        products={products}
                        updateRow={updateRow}
                        submitting={submitting}
                        showBasePrice
                        showFinalPrice
                      />
                    </div>
                  </div>
                );
              })
                  : pricingData.map((row, idx) => {
                const product = products.find((p) => p.id === row.product_id);
                const expanded = !!expandedRows[row.product_id];
                const name = product?.name ?? `Product #${row.product_id}`;
                const description = String(product?.description ?? "").trim();

                return (
                  <div
                    key={String(row.product_id)}
                    style={{
                      border: "1px solid #e8e8e8",
                      borderRadius: 12,
                      overflow: "hidden",
                      marginBottom: 10,
                      background: "#fff",
                    }}
                  >
                    <button
                      type="button"
                      aria-expanded={expanded}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "12px 14px",
                        background: expanded ? "#f7f8fb" : "#fafafa",
                        cursor: "pointer",
                        border: "none",
                        width: "100%",
                        textAlign: "left",
                      }}
                      onClick={() =>
                        setExpandedRows((prev) => ({
                          ...prev,
                          [row.product_id]: !prev[row.product_id],
                        }))
                      }
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <div style={{ width: 18, textAlign: "center", color: "#666" }}>
                          {expanded ? "▾" : "▸"}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              color: "#141414",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: 380,
                            }}
                          >
                            {idx + 1}. {name}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#666",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: 520,
                              marginTop: 2,
                            }}
                          >
                            {description || "—"}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ fontSize: 12, color: "#141414", whiteSpace: "nowrap" }}>
                          Status: {row.is_active ? "Active" : "Inactive"}
                        </div>
                      </div>
                    </button>

                    {expanded && (
                      <div style={{ padding: 14 }}>
                        <PricingRowFormFields
                          row={row}
                          products={products}
                          updateRow={updateRow}
                          submitting={submitting}
                          showRemoveButton
                          onRemove={() => deleteRow(row.product_id)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
              </>
            )}
          </div>
        </div>
      </div>

        {/* Bottom spacing */}
        <div style={{ height: "40px" }} />
    </FullScreenModalShell>
  );
}

