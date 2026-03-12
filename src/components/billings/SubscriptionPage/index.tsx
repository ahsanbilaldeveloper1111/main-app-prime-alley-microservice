import { useState, useEffect } from "react";
import { Info, ChevronDown } from "lucide-react";
import { useSession } from "next-auth/react";
import { GetCompanyDetails, GetPaymentMethods } from "@utils/accounting";
import TopSection from "../Overview/TopSection";

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

export default function SubscriptionsPage() {
  const { data: session } = useSession();
  const [companyDetails, setCompanyDetails] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companyRes, paymentMethodsRes] = await Promise.all([
          GetCompanyDetails({ crm_company_id: "" }),
          GetPaymentMethods(),
        ]);
        setCompanyDetails(companyRes);
        setPaymentMethods(paymentMethodsRes);
      } catch (err) {
        console.error("SubscriptionPage API error:", err);
      }
    };
    fetchData();
  }, []);

  const paymentMethodsList = Array.isArray(paymentMethods)
    ? paymentMethods
    : paymentMethods?.data ?? paymentMethods?.payment_methods ?? [];
  const displayPaymentMethod = paymentMethodsList.find((pm: any) => pm?.is_default) ?? paymentMethodsList[0];
  const hasDefaultAccount = paymentMethodsList.some((pm: any) => pm?.is_default);

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

            <TopSection
              companyDetails={companyDetails}
              session={session}
              displayPaymentMethod={displayPaymentMethod}
              hasDefaultAccount={hasDefaultAccount}
              styles={{ label: styles.label, value: styles.value, link: styles.link }}
            />
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
                <span style={styles.strikethrough}>AED 0.00</span>
                <span style={{ ...styles.discountText, marginTop: 4 }}>AED 0.80</span>
                <span style={{ ...styles.finalPrice, marginTop: 4 }}>AED 0.00</span>
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
              <div style={{ fontSize: 14, color: "#141414", marginTop: 6 }}>0 Included Credits</div>
            </div>

            <div style={styles.divider} />

            <div style={styles.costRow}>
              <span style={styles.subHeading}>Cost for 1 year</span>
              <span style={styles.finalPrice}>AED 0.00</span>
            </div>
            <div style={styles.costRow}>
              <span style={styles.subHeading}>You Save:</span>
              <span style={styles.finalPrice}>AED 0.00</span>
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
                <span style={styles.strikethrough}>AED 0.00</span>
                <span style={{ ...styles.discountText, marginTop: 4 }}>-AED 0.00</span>
                <span style={{ ...styles.finalPrice, marginTop: 4 }}>AED 0.00</span>
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
              <div style={{ fontSize: 14, color: "#141414", marginTop: 6 }}>0 Included Credits</div>
            </div>

            <div style={styles.divider} />

            <div style={styles.costRow}>
              <span style={styles.subHeading}>Cost for 1 year</span>
              <span style={styles.finalPrice}>AED 0.00</span>
            </div>
            <div style={styles.costRow}>
              <span style={styles.subHeading}>You Save:</span>
              <span style={styles.finalPrice}>AED 0.00</span>
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
