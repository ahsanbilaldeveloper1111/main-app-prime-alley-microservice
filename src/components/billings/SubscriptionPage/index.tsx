import { useState, useEffect } from "react";
import { Info, ChevronDown } from "lucide-react";
import { useSession } from "next-auth/react";
import { GetCompanyDetails, GetPaymentMethods } from "@utils/accounting";
import TopSection from "../Overview/TopSection";
import { BILLING_PAGE, billingSharedStyles } from "@components/billings/shared/styles";
import { hasDefaultPaymentMethod, normalizePaymentMethods, pickDisplayPaymentMethod } from "@components/billings/shared/paymentMethods";

const PRO_PLAN_INCLUDES = [
  "Smart CRM ",
  "Call Logs & Recordings",
  "Planner",
  "Pulse",
  "Workforce",
  "1 Core Seat",
] as const;

const styles: Record<string, React.CSSProperties> = {
  body: BILLING_PAGE,
  ...billingSharedStyles,
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

function IncludesList({ items }: Readonly<{ items: readonly string[] }>) {
  return (
    <>
      {items.map((item) => (
        <div key={item} style={{ ...styles.includedItem, display: "flex", alignItems: "center", gap: 6 }}>
          <span>{item}</span>
          <Info size={14} strokeWidth={2} color="#666" />
        </div>
      ))}
    </>
  );
}

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

  const paymentMethodsList = normalizePaymentMethods(paymentMethods);
  const displayPaymentMethod = pickDisplayPaymentMethod(paymentMethodsList);
  const hasDefaultAccount = hasDefaultPaymentMethod(paymentMethodsList);

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
              <IncludesList items={PRO_PLAN_INCLUDES} />
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
              <IncludesList items={PRO_PLAN_INCLUDES} />
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
