import { useState, ReactElement } from "react";
import Layout from "@layout/index";
import OverviewPage from "@components/billings/Overview";
import SubscriptionsPage from "@components/billings/SubscriptionPage";
import UsageLimitsPage from "@components/billings/UsageLimitsPage";
import BillingHistoryPage from "@components/billings/BillingHistoryPage";
import TransactionsPage from "@components/billings/TransactionPage";
import DocumentsPage from "@components/billings/DocumentPage";
import PaymentMethodsPage from "@components/billings/PaymentMethodsPage";
import CompanyInfoPage from "@components/billings/CompanyInfoPage";
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
    borderBottom: "2px solid transparent",
    outline: "none",
    background: "none",
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
    transition: "color 150ms ease-out",
    textDecoration: "none",
  },
  activeTab: {
    borderBottom: "2px solid #141414",
    fontWeight: 700,
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

const AccountBilling = () => {
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
                type="button"
                style={{
                  ...styles.tab,
                  borderBottom: activeTab === tab ? "2px solid #141414" : "2px solid transparent",
                  fontWeight: activeTab === tab ? 700 : 500,
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
        ) : activeTab === "Transactions" ? (
          <TransactionsPage />
        ) : activeTab === "Documents" ? (
          <DocumentsPage />
        ) : activeTab === "Payment Methods" ? (
          <PaymentMethodsPage />
        ) : activeTab === "Company Info" ? (
          <CompanyInfoPage />
        ) : (
          <OverviewPage />
        )}

      </div>
    </div>
  );
}
AccountBilling.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};
export default AccountBilling;