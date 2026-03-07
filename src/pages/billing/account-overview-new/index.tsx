import { useState } from "react";
import {
  BarChart3,
  CreditCard,
  ExternalLink,
  FileText,
  Info,
  LifeBuoy,
  RefreshCcw,
  Settings,
  UserPlus,
} from "lucide-react";
import SubscriptionsPage from "@components/SubscriptionPage";
import UsageLimitsPage from "@components/UsageLimitsPage";
import BillingHistoryPage from "@components/BillingHistoryPage";
const styles: Record<string, React.CSSProperties> = {
  body: {
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
    color: "#141414",
    backgroundColor: "#f5f5f5",
    margin: 0,
    padding: 0,
    fontSize: 14,
  },
  container: {
    maxWidth: "calc(1376px)",
    margin: "0 auto",
    padding: "24px",
  },
  pageHeading: {
    fontWeight: 300,
    color: "#141414",
    cursor: "pointer",
    fontSize: 20,
    margin: "24px 0 16px",
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
  },
  tabBar: {
    display: "flex",
    
    backgroundColor: "#fff",
    marginBottom: 0,
    overflowX: "auto" as const,
  },
  tab: {
    fontWeight: 500,
    fontSize: 14,
    paddingBlock: 12,
    paddingInline: 28,
    position: "relative" as const,
    color: "#141414",
    whiteSpace: "nowrap" as const,
    cursor: "pointer",
    border: "none",
    background: "none",
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
    transition: "color 150ms ease-out",
    textDecoration: "none",
  },
  activeTab: {
    borderBottom: "2px solid #141414",
    fontWeight: 700,
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
  companyHeading: {
    boxSizing: "border-box" as const,
    fontSize: 24,
    fontStyle: "unset",
    fontWeight: 300,
    textTransform: "unset" as const,
    margin: 0,
    padding: 0,
    backgroundColor: "unset",
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
    letterSpacing: 0,
    lineHeight: "29px",
    marginBottom: 20,
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
  sectionHeading: {
    boxSizing: "border-box" as const,
    fontSize: 24,
    fontStyle: "unset",
    fontWeight: 300,
    textTransform: "unset" as const,
    margin: "0 0 16px 0",
    padding: 0,
    backgroundColor: "unset",
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
    letterSpacing: 0,
    lineHeight: "29px",
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
    maxWidth: "100%",
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
    fontSize: 12,
    fontWeight: 400,
    letterSpacing: 0,
    lineHeight: "14px",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center" as const,
    textUnderlineOffset: "24%",
    transition: "150ms ease-out",
    cursor: "pointer",
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
    maxWidth: "100%",
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
    fontSize: 12,
    fontWeight: 400,
    letterSpacing: 0,
    lineHeight: "14px",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center" as const,
    transition: "150ms ease-out",
    cursor: "pointer",
  },
  subHeading: {
    boxSizing: "border-box" as const,
    fontSize: 20,
    fontStyle: "unset",
    fontWeight: 600,
    textTransform: "unset" as const,
    margin: 0,
    padding: 0,
    backgroundColor: "unset",
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
    letterSpacing: 0,
    lineHeight: "24px",
  },
};

const tabs = [
  "Overview",
  "Subscriptions",
  "Usage & Limits",
  "Billing History",
  "Company Info",
  "Transactions",
  "Documents",
  "Payment Methods",
];

const commonActions = [
  { Icon: FileText, label: "View or download invoices" },
  { Icon: Settings, label: "Manage subscription details" },
  { Icon: BarChart3, label: "View usage & limits" },
  { Icon: UserPlus, label: "Add a billing contact" },
  { Icon: CreditCard, label: "Add a payment method" },
  { Icon: RefreshCcw, label: "Cancel auto-renewal" },
];

const starterIncludes = [
  "Marketing Hub Starter (Includes 1,000 Marketing Contacts)",
  "Sales Hub Starter",
  "Service Hub Starter",
  "Content Hub Starter",
  "Data Hub Starter",
  "1 Core Seat",
];

const billingHelpLinks = [
  ["How do I cancel my Prime Alley subscription?", "Understand marketing contacts billing"],
  ["Billing and payment FAQs", "How do I update my payment method?"],
  ["Where do I find my subscription and service limits?", "View or download your invoices and receipts"],
];

export default function AccountBilling() {
  const [activeTab, setActiveTab] = useState("Overview");

  return (
    <div style={styles.body}>
      {/* Tab Bar */}
      <div style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e5e5" }}>
        <div style={{ ...styles.container, paddingBottom: 0 }}>
          <h1 style={styles.pageHeading}>Account &amp; Billing</h1>
          <div style={styles.tabBar}>
            {tabs.map((tab) => (
              <button
                key={tab}
                style={{
                  ...styles.tab,
                  ...(activeTab === tab ? styles.activeTab : {}),
                }}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ ...styles.container, paddingTop: 24 }}>

      {activeTab === "Subscriptions" ? (
          <SubscriptionsPage />
        ) : activeTab === "Usage & Limits" ? (
          <UsageLimitsPage />
        ) : activeTab === "Billing History" ? (
          <BillingHistoryPage />
        ) : (
          <>
        {/* Company Info Card */}
        <div style={styles.card}>
          <div style={{ ...styles.cardPadding, display: "flex", alignItems: "flex-start", gap: 16 }}>
            {/* Logo placeholder */}
            <div style={{
              width: 48, height: 48, borderRadius: 8,
              background: "linear-gradient(135deg, #00bcd4, #006162)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="4" y="4" width="8" height="8" rx="2" fill="white" opacity="0.9" />
                <rect x="16" y="4" width="8" height="8" rx="2" fill="white" opacity="0.6" />
                <rect x="4" y="16" width="8" height="8" rx="2" fill="white" opacity="0.6" />
                <rect x="16" y="16" width="8" height="8" rx="2" fill="white" opacity="0.9" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={styles.companyHeading}>Prime Alley Technology</h2>
              <div style={{ margin: 0, display: "flex", flexDirection: "row" as const, justifyContent: "space-between", marginTop: 16, gap: 24 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.label}>Hub ID</div>
                  <div style={styles.value}>147764492</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.label}>Billing Frequency</div>
                  <div style={styles.value}>Annually</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.label}>Subscription Term</div>
                  <div style={styles.value}>11 Feb 2026 to 10 Feb 2027</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.label}>Primary Contact</div>
                  <div style={styles.value}>Rizwan Haider</div>
                </div>
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
        </div>

        {/* Two column: Your Next Payment + Common Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, marginBlockEnd: 16 }}>
          {/* Your Next Payment */}
          <div style={{ ...styles.card, marginBlockEnd: 0 }}>
            <div style={styles.cardPadding}>
              <h2 style={styles.sectionHeading}>Your Next Payment</h2>
              <p style={{ margin: "0 0 16px 0", fontSize: 18, color: "#141414" }}>
                A total of <strong>£162.00*</strong> will be charged on <strong>11 Feb 2027</strong>.
              </p>
              <p style={{ margin: "0 0 16px 0", fontSize: 12, color: "#666", lineHeight: "18px" }}>
                *Includes estimated sales tax or VAT, based on your main company address. Excludes any recent credits to your account. Your recurring fees may increase based on your usage.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ ...styles.label, marginBottom: 4 }}>Billing period</div>
                  <div style={{ fontSize: 14, color: "#141414" }}>11 Feb 2027 – 10 Feb 2028</div>
                </div>
                <div>
                  <div style={{ ...styles.label, marginBottom: 4 }}>Payment method</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{
                      background: "#1a1f71", color: "#fff", fontSize: 9, fontWeight: 700,
                      padding: "2px 5px", borderRadius: 3, letterSpacing: 0.5,
                    }}>VISA</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>ending in 5478</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>RIZWAN HAIDER</div>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ ...styles.label, marginBottom: 4 }}><strong style={{ color: "#141414", fontSize: 14 }}>Products &amp; Add-ons</strong></div>
                <div style={{ fontSize: 14 }}>Starter Customer Platform</div>
              </div>
              <div>
                <div style={{ ...styles.value, marginBottom: 4 }}>Need help?</div>
                <p style={{ margin: 0, fontSize: 14 }}>
                  Visit the{" "}
                  <a style={styles.link}>Knowledge Base</a>
                  {" "}for answers to FAQs or{" "}
                  <a style={styles.link}>contact us</a>
                  {" "}for more support.
                </p>
              </div>
            </div>
          </div>

          {/* Common Actions */}
          <div style={{ ...styles.card, marginBlockEnd: 0 }}>
            <div style={styles.cardPadding}>
              <h2 style={styles.sectionHeading}>Common Actions</h2>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
                {commonActions.map((action) => (
                  <div key={action.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <action.Icon size={16} strokeWidth={2} color="#141414" />
                    <a style={styles.link}>{action.label}</a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Two column: Prime Alley Credits + Marketing Contacts */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBlockEnd: 16 }}>
          {/* Prime Alley Credits */}
          <div style={{ ...styles.card, marginBlockEnd: 0 }}>
            <div style={styles.cardPadding}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ ...styles.sectionHeading, margin: 0 }}>Prime Alley Credits</h2>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={styles.btnDark}>Add credits</button>
                  <button style={styles.btnLight}>Manage usage</button>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13 }}>10 of 500 credits used</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>2%</span>
              </div>
              <div style={{ height: 8, backgroundColor: "#e5e5e5", borderRadius: 4, marginBottom: 8 }}>
                <div style={{ width: "2%", height: "100%", backgroundColor: "#00a47c", borderRadius: 4 }} />
              </div>
              <p style={{ fontSize: 12, color: "#666", margin: "0 0 12px 0" }}>Resets on 10 Mar 2026.</p>
              <div style={{
                border: "1px solid rgb(0, 97, 98)", borderRadius: 4, padding: "8px 12px",
                fontSize: 12, color: "rgb(0, 97, 98)", marginBottom: 12,
              }}>
                Usage will be paused if you reach your credit limit
              </div>
              <p style={{ fontSize: 13, margin: 0 }}>
                Explore features that use Prime Alley Credits in{" "}
                <a style={styles.link}>Breeze Agents Marketplace</a>
              </p>
            </div>
          </div>

          {/* Marketing Contacts */}
          <div style={{ ...styles.card, marginBlockEnd: 0 }}>
            <div style={styles.cardPadding}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ ...styles.sectionHeading, margin: 0 }}>Marketing Contacts</h2>
                <button style={styles.btnLight}>View Usage &amp; Limits</button>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Contact tier: 1,000 contacts</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>0/1,000 used</span>
              </div>
              <p style={{ fontSize: 13, color: "#444", lineHeight: "20px", margin: 0 }}>
                Billed data for marketing contacts is updated once a day. Marketing contacts are updated to non-marketing once a month on the next update date. Go to{" "}
                <a style={styles.link}>Usage &amp; Limits</a>
                {" "}to set contacts as non-marketing.
              </p>
            </div>
          </div>
        </div>

        {/* Seats */}
        <div style={styles.card}>
          <div style={styles.cardPadding}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ ...styles.sectionHeading, margin: 0 }}>Seats</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={styles.btnDark}>Add seats</button>
                <button style={{ ...styles.btnLight, gap: 6 }}>
                  <span>Manage seats &amp; users</span>
                  <ExternalLink size={14} strokeWidth={2} />
                </button>
              </div>
            </div>
            <div style={{ textAlign: "center" as const, padding: "16px 0" }}>
              <div style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 1,
                color: "#666",
                marginBottom: 4,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}>
                <span>CORE SEATS (STARTER)</span>
                <Info size={14} strokeWidth={2} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 300, lineHeight: 1 }}>1/2,501</div>
              <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>2,500 seats left</div>
            </div>
          </div>
        </div>

                {/* Products & Add-ons */}
        <div style={styles.card}>
          <div style={styles.cardPadding}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ ...styles.sectionHeading, margin: 0 }}>Products &amp; Add-ons</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...styles.btnLight, gap: 6 }}>
                  <span>Manage seats &amp; users</span>
                  <ExternalLink size={14} strokeWidth={2} />
                </button>
                <button style={styles.btnLight}>View credits usage</button>
                <button style={styles.btnDark}>Manage subscriptions</button>
              </div>
            </div>

            {/* Starter Customer Platform */}
            <div style={{ borderBottom: "1px solid #e5e5e5", paddingBottom: 24, marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h3 style={styles.subHeading}>Starter Customer Platform</h3>
                <button style={styles.btnLight}>View pricing</button>
              </div>
              <div style={{ marginTop: 12, paddingLeft: 8 }}>
                <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>Includes:</div>
                {starterIncludes.map((item) => (
                  <div key={item} style={{ fontSize: 14, color: "#141414", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>{item}</span>
                    <Info size={14} strokeWidth={2} color="#666" />
                  </div>
                ))}
              </div>
            </div>

            {/* Commerce Professional Bundle Trial */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h3 style={styles.subHeading}>Commerce Professional Bundle Trial</h3>
                    <span style={{
                      background: "#ff5c35", color: "#fff", fontSize: 11, fontWeight: 600,
                      padding: "3px 8px", borderRadius: 12, whiteSpace: "nowrap" as const,
                    }}>41 days left</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#666", margin: "6px 0 6px 0" }}>
                    You won't be charged at the end of your trial - you'll just return to your current plan
                  </p>
                  <p style={{ fontSize: 13, color: "#666", margin: 0 }}>
                    Data hosting location:{" "}
                    <a style={{ ...styles.link, display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <span>European Union</span>
                      <ExternalLink size={13} strokeWidth={2} />
                    </a>
                  </p>
                </div>
                <button style={styles.btnLight}>View pricing</button>
              </div>
            </div>

            {/* Total Prime Alley Credits */}
            <div>
              <h3 style={styles.subHeading}>Total Prime Alley Credits</h3>
              <p style={{ fontSize: 14, color: "#141414", margin: "6px 0 0 0" }}>500 Included Prime Alley Credits</p>
            </div>
          </div>
        </div>

         {/* Want to enhance your plan? */}
         <div style={styles.card}>
          <div style={{
            ...styles.cardPadding,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <h2 style={{ ...styles.sectionHeading, margin: "0 0 6px 0" }}>Want to enhance your plan?</h2>
              <p style={{ fontSize: 13, color: "#666", margin: 0 }}>
                Explore the growth platform for upgrades, services, and add-ons
              </p>
            </div>
            <button style={styles.btnLight}>Explore add-ons</button>
          </div>
        </div>

        {/* Billing Help */}
        <div style={styles.card}>
          <div style={{ ...styles.cardPadding, position: "relative" as const }}>
            <h2 style={{ ...styles.sectionHeading, marginBottom: 20 }}>Billing Help</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 32px" }}>
              {billingHelpLinks.map((row, i) => (
                <div key={row[0]} style={{ display: "contents" }}>
                  <a style={{ ...styles.link, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <span>{row[0]}</span>
                    <ExternalLink size={13} strokeWidth={2} />
                  </a>
                  <a key={`right-${i}`} style={{ ...styles.link, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <span>{row[1]}</span>
                    <ExternalLink size={13} strokeWidth={2} />
                  </a>
                </div>
              ))}
            </div>
            {/* <div style={{
              position: "absolute" as const, right: 24, bottom: 16,
              width: 80, height: 80,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <LifeBuoy size={68} color="#ff8c69" strokeWidth={1.75} />
            </div> */}
          </div>
        </div>

        </>
        )}

      </div>
    </div>
  );
}
