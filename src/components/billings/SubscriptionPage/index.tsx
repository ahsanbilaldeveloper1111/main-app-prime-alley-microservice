import { useState, useEffect, useCallback } from "react";
import { Info, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  GetProducts,
  GetCompanyDetails,
  GetPaymentMethods,
} from "@utils/accounting";
import { useSession } from "next-auth/react";

const styles: Record<string, React.CSSProperties> = {
  body: {
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
    color: "#141414",
    backgroundColor: "#f5f5f5",
    margin: 0,
    padding: 0,
    fontSize: 14,
  },
  card: {
    position: "relative" as const,
    display: "flex",
    flexDirection: "column" as const,
    width: "100%",
    padding: 0,
    backgroundColor: "rgb(255, 255, 255)",
    boxShadow: "rgba(20, 20, 20, 0.08) 0px 1px 8px 0px",
    border: "1px solid rgb(204, 204, 204)",
    marginBlockEnd: 16,
    borderRadius: 8,
    boxSizing: "border-box" as const,
  },
  cardPadding: {
    padding: "40px",
  },
  sectionHeading: {
    fontSize: 24,
    fontWeight: 300,
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
    margin: 0,
    letterSpacing: 0,
    lineHeight: "29px",
    color: "#141414",
  },
  label: {
    color: "rgb(102, 102, 102)",
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
    fontSize: 12,
    fontWeight: 300,
    letterSpacing: 0,
    lineHeight: "18px",
  },
  value: {
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: 0,
    lineHeight: "18px",
  },
  link: {
    fontWeight: 600,
    color: "rgb(0, 97, 98)",
    cursor: "pointer",
    textUnderlineOffset: "24%",
    textDecoration: "underline",
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
    fontSize: 14,
  },
  btnDark: {
    display: "inline-flex",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    backgroundColor: "rgb(20, 20, 20)",
    borderColor: "rgba(20, 20, 20, 0)",
    color: "rgb(255, 255, 255)",
    textDecoration: "none",
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: "solid",
    verticalAlign: "middle",
    paddingBlock: 8,
    paddingInline: 16,
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
    fontSize: 12,
    fontWeight: 400,
    letterSpacing: 0,
    lineHeight: "14px",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center" as const,
    cursor: "pointer",
    transition: "150ms ease-out",
  },
  btnLight: {
    display: "inline-flex",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    backgroundColor: "rgb(255, 255, 255)",
    borderColor: "rgb(204, 204, 204)",
    color: "rgb(20, 20, 20)",
    textDecoration: "none",
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: "solid",
    verticalAlign: "middle",
    paddingBlock: 8,
    paddingInline: 16,
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
    fontSize: 12,
    fontWeight: 400,
    letterSpacing: 0,
    lineHeight: "14px",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center" as const,
    cursor: "pointer",
    transition: "150ms ease-out",
  },
  subHeading: {
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
    margin: 0,
    letterSpacing: 0,
    lineHeight: "20px",
    color: "#141414",
  },
  strikethrough: {
    textDecoration: "line-through",
    color: "#999",
    fontSize: 14,
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
  },
  discountText: {
    fontSize: 14,
    color: "#141414",
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
  },
  finalPrice: {
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
    color: "#141414",
  },
  divider: {
    borderTop: "1px dashed #ccc",
    margin: "16px 0",
  },
  includedItem: {
    fontSize: 14,
    color: "#141414",
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
    marginBottom: 4,
  },
  costRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
};

function SubscriptionTermCard({
  title,
  isAutoRenewal = false,
  originalPrice,
  discountLabel,
  discountAmount,
  finalPrice,
  costForYear,
  youSave,
}: {
  title: string;
  isAutoRenewal?: boolean;
  originalPrice: string;
  discountLabel: string;
  discountAmount: string;
  finalPrice: string;
  costForYear: string;
  youSave: string;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div style={styles.card}>
      <div style={styles.cardPadding}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: 0, lineHeight: 1,
                display: "flex", alignItems: "center",
              }}
            >
              <ChevronDown
                size={20}
                strokeWidth={2}
                color="#141414"
                style={{
                  transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
                  transition: "transform 150ms ease-out",
                }}
              />
            </button>
            <h2 style={styles.sectionHeading}>{title}</h2>
          </div>
          {isAutoRenewal && (
            <button style={styles.btnLight}>Cancel auto-renewal</button>
          )}
        </div>

        {expanded && (
          <>
            {/* Pro Plan Row */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
              <h3 style={styles.subHeading}>Pro Plan</h3>
              <div style={{ textAlign: "right" as const }}>
                <div style={styles.strikethrough}>{originalPrice}</div>
              </div>
              {!isAutoRenewal && (
                <button style={{ ...styles.btnLight, marginLeft: 32 }}>View pricing</button>
              )}
            </div>

            {/* For auto-renewal, View pricing is inline right side */}
            {isAutoRenewal && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -28, marginBottom: 4 }}>
                {/* no view pricing button in auto-renewal based on design */}
              </div>
            )}

            {/* Discount row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, paddingRight: isAutoRenewal ? 0 : 120 }}>
              <span style={styles.discountText}>{discountLabel}</span>
              <span style={{ ...styles.discountText, color: "#141414" }}>{discountAmount}</span>
            </div>

            {/* Final price row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingRight: isAutoRenewal ? 0 : 120 }}>
              <span></span>
              <span style={styles.finalPrice}>{finalPrice}</span>
            </div>

            {/* Includes list */}
            <div style={{ paddingLeft: 16 }}>
              <div style={{ ...styles.includedItem, color: "#666", marginBottom: 8 }}>Includes:</div>
              {[
                "Smart CRM ",
  "Call Logs & Recordings",
  "Planner",
  "Pulse",
  "Workforce",
  "1 Core Seat",
              ].map((item) => (
                <div key={item} style={{ ...styles.includedItem, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{item}</span>
                  <Info size={14} strokeWidth={2} color="#666" />
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px solid #e5e5e5", margin: "20px 0" }} />

            {/* Total Prime Alley Credits */}
            <div style={{ marginBottom: 20 }}>
              <div style={styles.subHeading}>Total Prime Alley Credits</div>
              <div style={{ fontSize: 14, color: "#141414", marginTop: 6 }}>500 Included Prime Alley Credits</div>
            </div>

            {/* Cost summary - dashed divider */}
            <div style={styles.divider} />

            <div style={styles.costRow}>
              <span style={styles.subHeading}>Cost for 1 year</span>
              <span style={styles.finalPrice}>{costForYear}</span>
            </div>
            <div style={styles.costRow}>
              <span style={styles.subHeading}>You Save:</span>
              <span style={styles.finalPrice}>{youSave}</span>
            </div>
            <div style={{ textAlign: "right" as const, fontSize: 13, color: "#666", marginTop: 4 }}>
              All costs exclude tax
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [5, 10, 15, 25];

export default function SubscriptionsPage() {
  const { data: session } = useSession();
  const [companyDetails, setCompanyDetails] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any>(null);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: DEFAULT_PAGE_SIZE,
    total: 0,
    last_page: 1,
    from: 0,
    to: 0,
  });
  const [collapsedSubscriptionIds, setCollapsedSubscriptionIds] = useState<Set<string | number>>(new Set());

  const toggleSubscription = (key: string | number) => {
    setCollapsedSubscriptionIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const fetchSummary = useCallback(async () => {
    try {
      const [companyRes, paymentMethodsRes] = await Promise.all([
        GetCompanyDetails(),
        GetPaymentMethods(),
      ]);
      setCompanyDetails(companyRes);
      setPaymentMethods(paymentMethodsRes);
    } catch (err) {
      console.error("Subscription summary API error:", err);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const response = await GetProducts({
        page: pagination.page,
        per_page: pagination.per_page,
      }) as any;
      const list = response?.dataList ?? response?.data ?? [];
      const meta = response?.meta ?? {};
      setProductsList(list);
      setPagination((prev) => ({
        ...prev,
        total: meta.total ?? response?.recordsTotal ?? 0,
        last_page: meta.last_page ?? meta.current_page ?? 1,
        from: meta.from ?? 0,
        to: meta.to ?? 0,
        page: meta.current_page ?? meta.page ?? prev.page,
      }));
    } catch (err) {
      console.error("GetProducts error:", err);
      setProductsList([]);
    } finally {
      setProductsLoading(false);
    }
  }, [pagination.page, pagination.per_page]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const paymentMethodsList = Array.isArray(paymentMethods)
    ? paymentMethods
    : paymentMethods?.data ?? paymentMethods?.payment_methods ?? [];
  const displayPaymentMethod = paymentMethodsList.find((pm: any) => pm?.is_default) ?? paymentMethodsList[0];
  const hasDefaultAccount = paymentMethodsList.some((pm: any) => pm?.is_default);

  const canPrev = pagination.page > 1;
  const canNext = pagination.page < pagination.last_page;

  const formatTermDate = (d: string | undefined) => {
    if (!d) return "";
    try {
      const date = new Date(d);
      const day = date.getDate();
      const suffix = day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th";
      const month = date.toLocaleDateString("en-GB", { month: "long" });
      const year = date.getFullYear();
      return `${day}${suffix} ${month} ${year}`;
    } catch {
      return d;
    }
  };

  const committedTerm = productsList[0];
  const committedPeriodLabel = committedTerm?.renewal_start_date && committedTerm?.renewal_end_date
    ? `${formatTermDate(committedTerm.renewal_start_date)} – ${formatTermDate(committedTerm.renewal_end_date)}`
    : "1st April 2026 – 30th April 2026";
  const currency = committedTerm?.company?.profile?.currency ?? committedTerm?.product?.currency ?? "AED";
  const sellingPrice = committedTerm?.selling_price != null ? Number(committedTerm.selling_price).toFixed(2) : "0.00";
  const productName = committedTerm?.product?.name ?? committedTerm?.name ?? "Pro Plan";
  const includesList = committedTerm?.product?.includes ?? ["Smart CRM", "Call Logs & Recordings", "Planner", "Pulse", "Workforce", "1 Core Seat"];
  const creditsLabel = committedTerm?.product?.credits ?? "500 Included Credits";

  return (
    <div style={styles.body}>
      <div style={{ maxWidth: "calc(1376px)", margin: "0 auto" }}>

        {/* Subscription Summary Card */}
        <div style={styles.card}>
          <div style={styles.cardPadding}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={styles.sectionHeading}>Subscription Summary</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={styles.btnDark}>Add seats</button>
                <button style={styles.btnLight}>View invoices</button>
              </div>
            </div>

            <div style={{ margin: 0, display: "flex", flexDirection: "row" as const, justifyContent: "space-between", gap: 24 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.label}>Tenant ID</div>
                <div style={styles.value}>
                  {companyDetails?.tenant_id ?? companyDetails?.company_identifier ?? session?.user?.company_identifier ?? "—"}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.label}>Billing Frequency</div>
                <div style={styles.value}>
                  {companyDetails?.profile?.payment_mode ?? companyDetails?.billing_frequency ?? "Monthly"}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.label}>Subscription Term</div>
                <div style={styles.value}>
                  {companyDetails?.profile?.payment_terms ?? companyDetails?.subscription_term ?? "—"}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.label}>Primary Contact</div>
                <div style={styles.value}>
                  {companyDetails?.phone ?? "—"}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.label}>Payment Method</div>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 2 }}>
                  {displayPaymentMethod ? (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
                        <div style={{
                          background: "#1a1f71", color: "#fff", fontSize: 9, fontWeight: 700,
                          padding: "2px 5px", borderRadius: 3, letterSpacing: 0.5,
                        }}>
                          {(displayPaymentMethod?.card?.brand ?? displayPaymentMethod?.brand ?? "card").toUpperCase()}
                        </div>
                        <span style={styles.value}>
                          ending in {displayPaymentMethod?.card?.last4 ?? displayPaymentMethod?.last4 ?? "****"}
                        </span>
                        {hasDefaultAccount && displayPaymentMethod?.is_default && (
                          <span style={{
                            fontSize: 10, fontWeight: 600, color: "rgb(0, 97, 98)",
                            background: "rgba(0, 97, 98, 0.1)", padding: "2px 6px", borderRadius: 4,
                          }}>Default</span>
                        )}
                      </div>
                      <div style={{ ...styles.value, fontSize: 12 }}>
                        {displayPaymentMethod?.billing_details?.name ?? displayPaymentMethod?.holder_name ?? ""}
                      </div>
                    </>
                  ) : (
                    <div style={styles.value}>No payment method</div>
                  )}
                  <a style={{ ...styles.link, fontSize: 12 }}>Change</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Your Subscriptions (from API) with pagination */}
        <div style={styles.card}>
          <div style={styles.cardPadding}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={styles.sectionHeading}>Your Subscriptions</h2>
            </div>
            {productsLoading ? (
              <div style={{ padding: 24, textAlign: "center" as const, color: "#666" }}>Loading…</div>
            ) : productsList.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center" as const, color: "#666" }}>No subscriptions found.</div>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
                  {productsList.map((row: any, index: number) => {
                    const rowKey = row?.id ?? row?.product?.id ?? `idx-${index}`;
                    const isExpanded = !collapsedSubscriptionIds.has(rowKey);
                    const periodLabel = row?.renewal_start_date && row?.renewal_end_date
                      ? `${formatTermDate(row.renewal_start_date)} – ${formatTermDate(row.renewal_end_date)}`
                      : "";
                    const rowCurrency = row?.company?.profile?.currency ?? row?.product?.currency ?? "AED";
                    const rowPrice = row?.selling_price != null ? Number(row.selling_price).toFixed(2) : "0.00";
                    const rowName = row?.product?.name ?? row?.name ?? "—";
                    const rowIncludes = row?.product?.includes ?? (() => {
                      const items: string[] = [];
                      if (row?.product?.name) items.push(row.product.name);
                      return items.length > 0 ? items : ["—"];
                    })();
                    const rowCredits = row?.product?.credits ?? "0 Included Credits";
                    const isActive = row?.status === "Active" || row?.product?.is_active !== false;
                    return (
                      <div
                        key={rowKey}
                        style={{
                          border: "1px solid #e5e5e5",
                          borderRadius: 8,
                          padding: 40,
                          backgroundColor: "#fff",
                        }}
                      >
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleSubscription(rowKey)}
                            onKeyDown={(e) => e.key === "Enter" && toggleSubscription(rowKey)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              marginBottom: isExpanded ? 24 : 0,
                              cursor: "pointer",
                            }}
                          >
                            <ChevronDown
                              size={20}
                              strokeWidth={2}
                              color="#141414"
                              style={{
                                cursor: "pointer",
                                transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                                transition: "transform 150ms ease-out",
                                flexShrink: 0,
                              }}
                            />
                            <h2 style={styles.sectionHeading}>
                              {rowName} | {row?.billing_cycle ? row.billing_cycle : ""}
                            </h2>
                          </div>

                          {isExpanded && (
                          <>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                            <div style={{ flex: 1 }}>
                              <h3 style={styles.subHeading}>{rowName}</h3>
                              {row?.billing_cycle && (
                                <div style={{ fontSize: 13, color: "#141414", marginTop: 4 }}>
                                  Billing: {row.billing_cycle} {!isActive && "• Suspended"}
                                </div>
                              )}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-end", minWidth: 120 }}>
                              {row?.original_price != null && (
                                <span style={styles.strikethrough}>
                                  {rowCurrency} {Number(row.original_price).toFixed(2)}
                                </span>
                              )}
                              {row?.discount_amount != null && (
                                <span style={{ ...styles.discountText, marginTop: 4 }}>
                                  {rowCurrency} {Number(row.discount_amount).toFixed(2)}
                                </span>
                              )}
                              <span style={{ ...styles.finalPrice, marginTop: 4 }}>
                                {rowCurrency} {rowPrice}
                              </span>
                            </div>
                            <div style={{ marginLeft: 32 }}>
                              <button style={styles.btnLight}>View pricing</button>
                            </div>
                          </div>

                          {row?.discount_label && (
                            <div style={{ fontSize: 13, color: "#141414", marginTop: 2, marginBottom: 20 }}>
                              {row.discount_label}
                            </div>
                          )}
                          {row?.product?.description && !row?.discount_label && (
                            <div style={{ fontSize: 13, color: "#666", marginTop: 2, marginBottom: 20 }}>
                              {row.product.description}
                            </div>
                          )}

                          <div style={{ paddingLeft: 16 }}>
                            <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>Includes:</div>
                            {(Array.isArray(rowIncludes) ? rowIncludes : [rowIncludes]).map((item: any, idx: number) => (
                              <div key={idx} style={{ ...styles.includedItem, display: "flex", alignItems: "center", gap: 6 }}>
                                <span>{typeof item === "string" ? item : item?.name ?? item}</span>
                                <Info size={14} strokeWidth={2} color="#666" />
                              </div>
                            ))}
                          </div>

                          <div style={{ borderTop: "1px solid #e5e5e5", margin: "20px 0" }} />

                          <div style={{ marginBottom: 20 }}>
                            <div style={styles.subHeading}>Total Credits</div>
                            <div style={{ fontSize: 14, color: "#141414", marginTop: 6 }}>{rowCredits}</div>
                          </div>

                          <div style={styles.divider} />

                          <div style={styles.costRow}>
                            <span style={styles.subHeading}>Cost for 1 year</span>
                            <span style={styles.finalPrice}>{rowCurrency} {rowPrice}</span>
                          </div>
                          {row?.you_save != null && (
                            <div style={styles.costRow}>
                              <span style={styles.subHeading}>You Save:</span>
                              <span style={styles.finalPrice}>{rowCurrency} {Number(row.you_save).toFixed(2)}</span>
                            </div>
                          )}
                          <div style={{ textAlign: "right" as const, fontSize: 13, color: "#666", marginTop: 4 }}>
                            All costs exclude tax
                          </div>
                          </>
                          )}
                      </div>
                    );
                  })}
                </div>
                {/* Pagination */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: "1px solid #e5e5e5",
                  flexWrap: "wrap" as const,
                  gap: 12,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={styles.label}>Rows per page:</span>
                    <select
                      value={pagination.per_page}
                      onChange={(e) => setPagination((p) => ({ ...p, per_page: Number(e.target.value), page: 1 }))}
                      style={{
                        padding: "6px 8px",
                        borderRadius: 4,
                        border: "1px solid #ccc",
                        fontSize: 12,
                        fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                      }}
                    >
                      {PAGE_SIZE_OPTIONS.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    <span style={{ ...styles.label, marginLeft: 8 }}>
                      {pagination.from}-{pagination.to} of {pagination.total}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <button
                      style={{
                        ...styles.btnLight,
                        padding: "6px 10px",
                        opacity: canPrev ? 1 : 0.5,
                        cursor: canPrev ? "pointer" : "not-allowed",
                      }}
                      disabled={!canPrev}
                      onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                    >
                      <ChevronLeft size={16} strokeWidth={2} />
                    </button>
                    <span style={{ fontSize: 12, padding: "0 8px" }}>
                      Page {pagination.page} of {Math.max(1, pagination.last_page)}
                    </span>
                    <button
                      style={{
                        ...styles.btnLight,
                        padding: "6px 10px",
                        opacity: canNext ? 1 : 0.5,
                        cursor: canNext ? "pointer" : "not-allowed",
                      }}
                      disabled={!canNext}
                      onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.last_page, p.page + 1) }))}
                    >
                      <ChevronRight size={16} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
