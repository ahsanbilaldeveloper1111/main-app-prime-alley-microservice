import { useState } from "react";
import { Info, ChevronDown } from "lucide-react";

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

export default function SubscriptionsPage() {
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
              {/* Hub ID */}
              <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.label}>Tenant ID</div>
                  <div style={styles.value}>147764492</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.label}>Billing Frequency</div>
                  <div style={styles.value}>Monthly</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.label}>Subscription Term</div>
                  <div style={styles.value}>1st Mar 2026 to 31st Mar 2026</div>
                </div>

              {/* Primary Contact */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.label}>Primary Contact</div>
                <div style={styles.value}>Rizwan Haider</div>
              </div>

              {/* Payment Method */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.label}>Payment Method</div>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 2 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{
                      background: "#1a1f71", color: "#fff", fontSize: 9, fontWeight: 700,
                      padding: "2px 5px", borderRadius: 3, letterSpacing: 0.5,
                    }}>VISA</div>
                    <span style={styles.value}>ending in 5478</span>
                  </div>
                  <div style={{ ...styles.value, fontSize: 12 }}>RIZWAN HAIDER</div>
                  <a style={{ ...styles.link, fontSize: 12 }}>Change</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Committed Terms Card */}
        <div style={styles.card}>
          <div style={styles.cardPadding}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <ChevronDown size={20} strokeWidth={2} color="#141414" style={{ cursor: "pointer" }} />
              <h2 style={styles.sectionHeading}>Committed Terms | 1st April 2026 – 30th April 2026</h2>
            </div>

            {/* Product row */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ flex: 1 }}>
                <h3 style={styles.subHeading}>Pro Plan</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-end", minWidth: 120 }}>
                <span style={styles.strikethrough}>AED 216.00</span>
                <span style={{ ...styles.discountText, marginTop: 4 }}>AED 118.80</span>
                <span style={{ ...styles.finalPrice, marginTop: 4 }}>AED 97.20</span>
              </div>
              <div style={{ marginLeft: 32 }}>
                <button style={styles.btnLight}>View pricing</button>
              </div>
            </div>

            {/* Discount label */}
            <div style={{ fontSize: 13, color: "#141414", marginTop: 2, marginBottom: 20 }}>
              New Pro Plan Promotion Annual Discount (55%)
            </div>

            {/* Includes */}
            <div style={{ paddingLeft: 16 }}>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>Includes:</div>
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

            <div style={{ borderTop: "1px solid #e5e5e5", margin: "20px 0" }} />

            {/* Total Prime Alley Credits */}
            <div style={{ marginBottom: 20 }}>
              <div style={styles.subHeading}>Total Credits</div>
              <div style={{ fontSize: 14, color: "#141414", marginTop: 6 }}>500 Included Credits</div>
            </div>

            <div style={styles.divider} />

            <div style={styles.costRow}>
              <span style={styles.subHeading}>Cost for 1 year</span>
              <span style={styles.finalPrice}>AED 97.20</span>
            </div>
            <div style={styles.costRow}>
              <span style={styles.subHeading}>You Save:</span>
              <span style={styles.finalPrice}>AED 118.80</span>
            </div>
            <div style={{ textAlign: "right" as const, fontSize: 13, color: "#666", marginTop: 4 }}>
              All costs exclude tax
            </div>
          </div>
        </div>

        {/* Auto-Renewal Terms Card */}
        <div style={styles.card}>
          <div style={styles.cardPadding}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ChevronDown size={20} strokeWidth={2} color="#141414" style={{ cursor: "pointer" }} />
                <h2 style={styles.sectionHeading}>Auto-Renewal Terms | 1st April 2026 – 30th April 2026</h2>
              </div>
              <button style={styles.btnLight}>Cancel auto-renewal</button>
            </div>

            {/* Product row */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ flex: 1 }}>
                <h3 style={styles.subHeading}>Pro Plan</h3>
                <div style={{ fontSize: 13, color: "#141414", marginTop: 4 }}>Annual payment discount (25%)</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-end", minWidth: 120 }}>
                <span style={styles.strikethrough}>AED 216.00</span>
                <span style={{ ...styles.discountText, marginTop: 4 }}>-AED 54.00</span>
                <span style={{ ...styles.finalPrice, marginTop: 4 }}>AED 162.00</span>
              </div>
            </div>

            <div style={{ paddingLeft: 16, marginTop: 20 }}>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>Includes:</div>
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

            <div style={{ borderTop: "1px solid #e5e5e5", margin: "20px 0" }} />

            <div style={{ marginBottom: 20 }}>
              <div style={styles.subHeading}>Total Credits</div>
              <div style={{ fontSize: 14, color: "#141414", marginTop: 6 }}>500 Included Credits</div>
            </div>

            <div style={styles.divider} />

            <div style={styles.costRow}>
              <span style={styles.subHeading}>Cost for 1 year</span>
              <span style={styles.finalPrice}>AED 162.00</span>
            </div>
            <div style={styles.costRow}>
              <span style={styles.subHeading}>You Save:</span>
              <span style={styles.finalPrice}>AED 54.00</span>
            </div>
            <div style={{ textAlign: "right" as const, fontSize: 13, color: "#666", marginTop: 4 }}>
              All costs exclude tax
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
