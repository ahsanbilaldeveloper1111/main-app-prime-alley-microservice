import React, { useState, useEffect } from "react";
import { X, ExternalLink } from "lucide-react";
import { Form } from "react-bootstrap";

// ─── Type Definitions ─────────────────────────────────────────────────────────

interface Deal {
  id: number;
  name: string;
  amount?: number;
  currency?: string;
}

interface QuoteTemplate {
  id: number;
  name: string;
}

interface QuoteFormData {
  deal_id: number | null;
  template_id: number | null;
}

interface CreateQuoteSidebarProps {
  onClose: () => void;
  onSuccess?: () => void;
  /** Pre-select a deal by ID */
  preselectedDealId?: number | null;
}

// ─── Initial State ────────────────────────────────────────────────────────────

const initialQuoteForm: QuoteFormData = {
  deal_id: null,
  template_id: null,
};

// ─── Styles (matching renderCreateDeal pattern) ───────────────────────────────

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #8a8a8a",
  borderRadius: "4px",
  fontSize: "16px",
  fontWeight: "100",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
  backgroundColor: "#ffffff",
  color: "#141414",
  appearance: "none",
};

const fieldWrap: React.CSSProperties = { marginBottom: "20px" };

const fieldLabel = (text: string, required: boolean = false, info: boolean = false) => (
  <label
    style={{
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "14px",
      fontWeight: "600",
      color: "#141414",
      marginBottom: "8px",
    }}
  >
    {text}
    {required && <span style={{ color: "#f2545b", marginLeft: "2px" }}>*</span>}
    {info && (
      <span
        title="More information"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "16px",
          height: "16px",
          borderRadius: "50%",
          border: "1.5px solid #a0aec0",
          color: "#718096",
          fontSize: "11px",
          fontWeight: "600",
          cursor: "help",
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        i
      </span>
    )}
  </label>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const CreateQuoteSidebar: React.FC<CreateQuoteSidebarProps> = ({
  onClose,
  onSuccess,
  preselectedDealId,
}) => {
  const [quoteForm, setQuoteForm] = useState<QuoteFormData>({
    ...initialQuoteForm,
    deal_id: preselectedDealId ?? null,
  });
  const [deals, setDeals] = useState<Deal[]>([]);
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // ── Data fetch — replace with real API calls ──
  useEffect(() => {
    const fetchInitialData = async () => {
      setFetching(true);
      try {
        // Replace with your actual API calls, e.g.:
        // const dealsResponse = await getDeals({ per_page: 100 });
        // const templatesResponse = await getQuoteTemplates({ per_page: 100 });
        // setDeals(dealsResponse?.data || []);
        // setTemplates(templatesResponse?.data || []);

        // ── Mock data ──
        setDeals([
          { id: 1, name: "Laptop sell", amount: 4500.0, currency: "AED" },
          { id: 2, name: "Software License Deal", amount: 12000.0, currency: "AED" },
          { id: 3, name: "Annual Support Contract", amount: 8750.0, currency: "AED" },
        ]);
        setTemplates([
          {
            id: 1,
            name: `Quote Template ${new Date().toLocaleDateString("en-US", {
              month: "numeric",
              day: "numeric",
              year: "2-digit",
            })}, 12:44 AM`,
          },
          { id: 2, name: "Standard Proposal Template" },
          { id: 3, name: "Enterprise Quote Template" },
        ]);
      } catch (error) {
        console.error("Failed to fetch quote data:", error);
      } finally {
        setFetching(false);
      }
    };
    fetchInitialData();
  }, []);

  const selectedDeal = deals.find((d) => d.id === quoteForm.deal_id) ?? null;
  const selectedTemplate = templates.find((t) => t.id === quoteForm.template_id) ?? null;

  const isFormValid = quoteForm.deal_id !== null && quoteForm.template_id !== null;

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setLoading(true);
    try {
      // Replace with your actual API call, e.g.:
      // await createQuote({ deal_id: quoteForm.deal_id, template_id: quoteForm.template_id });
      console.log("Creating quote:", quoteForm);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Failed to create quote:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          background: "transparent",
        }}
      />

      {/* Sidebar panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "500px",
          height: "100vh",
          backgroundColor: "#ffffff",
          boxShadow: "-2px 0 8px rgba(0,0,0,0.15)",
          zIndex: 1001,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #eaf0f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#141414",
              margin: 0,
            }}
          >
            Create quote
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              padding: "4px",
              cursor: "pointer",
              color: "#718096",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* ── Content ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 24px 40px" }}>
          {fetching ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p>Loading...</p>
            </div>
          ) : (
            <>
              {/* ── Associate with a deal ── */}
              <div style={fieldWrap}>
                {fieldLabel("Associate with a deal", false, true)}
                <Form.Select
                  value={quoteForm.deal_id ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQuoteForm((prev) => ({
                      ...prev,
                      deal_id: val ? Number(val) : null,
                    }));
                  }}
                  style={selectStyle}
                >
                  <option value="">Select a deal</option>
                  {deals.map((deal) => (
                    <option key={deal.id} value={deal.id}>
                      {deal.name}
                    </option>
                  ))}
                </Form.Select>
              </div>

              {/* ── Selected deal card — renders immediately after deal dropdown ── */}
              {selectedDeal && (
                <div
                  style={{
                    border: "1px solid #d1d9e0",
                    borderRadius: "6px",
                    padding: "14px 16px",
                    marginTop: "-12px",
                    marginBottom: "20px",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <a
                    href="#"
                    style={{
                      color: "#0091ae",
                      fontWeight: "600",
                      fontSize: "14px",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      marginBottom: "4px",
                    }}
                    onClick={(e) => e.preventDefault()}
                  >
                    {selectedDeal.name}
                    <ExternalLink size={13} />
                  </a>
                  {selectedDeal.amount != null && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: "14px",
                        fontWeight: "100",
                        color: "#4a5568",
                      }}
                    >
                      Amount: {selectedDeal.currency ?? "AED"}{" "}
                      {selectedDeal.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  )}
                </div>
              )}

              {/* ── Select a quote template ── */}
              <div style={fieldWrap}>
                {fieldLabel("Select a quote template", false, true)}
                <Form.Select
                  value={quoteForm.template_id ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQuoteForm((prev) => ({
                      ...prev,
                      template_id: val ? Number(val) : null,
                    }));
                  }}
                  style={selectStyle}
                >
                  <option value="">Select a template</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </Form.Select>
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #eaf0f6",
            display: "flex",
            gap: "12px",
            justifyContent: "flex-start",
          }}
        >
          <button
            type="button"
            disabled={!isFormValid || loading}
            onClick={handleSubmit}
            style={{
              padding: "10px 24px",
              backgroundColor: isFormValid && !loading ? "#141414" : "#cbd5e0",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: isFormValid && !loading ? "pointer" : "not-allowed",
              transition: "background-color 0.15s ease",
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
              if (isFormValid && !loading)
                e.currentTarget.style.backgroundColor = "#000000";
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
              if (isFormValid && !loading)
                e.currentTarget.style.backgroundColor = "#141414";
            }}
          >
            {loading ? "Creating..." : "Create quote"}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: "10px 20px",
              backgroundColor: "transparent",
              color: "#141414",
              border: "1px solid #8a8a8a",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: loading ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
              if (!loading) e.currentTarget.style.backgroundColor = "#f7fafc";
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
              if (!loading) e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
};

// ─── Helper render function (matches renderCreateDeal pattern) ─────────────────

const renderCreateQuote = (
  showCreateQuoteSidebar: boolean,
  setShowCreateQuoteSidebar: (show: boolean) => void,
  options?: { preselectedDealId?: number | null; onSuccess?: () => void },
) => {
  if (!showCreateQuoteSidebar) return null;
  return (
    <CreateQuoteSidebar
      onClose={() => setShowCreateQuoteSidebar(false)}
      onSuccess={options?.onSuccess}
      preselectedDealId={options?.preselectedDealId}
    />
  );
};

export default renderCreateQuote;

/**
 * Usage:
 *
 * import { CreateQuoteSidebar } from './renderCreateQuote';
 *
 * const [showCreateQuoteSidebar, setShowCreateQuoteSidebar] = useState(false);
 *
 * // In your JSX:
 * {showCreateQuoteSidebar && (
 *   <CreateQuoteSidebar
 *     onClose={() => setShowCreateQuoteSidebar(false)}
 *     onSuccess={() => refetchQuotes()}
 *     preselectedDealId={currentDealId}  // optional
 *   />
 * )}
 *
 * // Or use the renderCreateQuote helper:
 * import renderCreateQuote from './renderCreateQuote';
 * {renderCreateQuote(showCreateQuoteSidebar, setShowCreateQuoteSidebar, {
 *   preselectedDealId: currentDealId,
 *   onSuccess: () => refetchQuotes(),
 * })}
 */
