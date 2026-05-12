import React, { type CSSProperties } from "react";
import OverviewPage from "@components/billings/Overview";
import SubscriptionsPage from "@components/billings/SubscriptionPage";
import UsageLimitsPage from "@components/billings/UsageLimitsPage";
import BillingHistoryPage from "@components/billings/BillingHistoryPage";
import TransactionsPage from "@components/billings/TransactionPage";
import DocumentsPage from "@components/billings/DocumentPage";
import PaymentMethodsPage from "@components/billings/PaymentMethodsPage";
import CompanyInfoPage from "@components/billings/CompanyInfoPage";
import type { AccountBillingTab } from "@components/billings/shared/accountBillingTabs";
import type { AccountBillingPageContext } from "../useAccountBillingPage";

type TabPageComponent = React.ComponentType<Record<string, never>>;

const TAB_PAGES: Record<AccountBillingTab, TabPageComponent> = {
  Overview: OverviewPage,
  Subscriptions: SubscriptionsPage,
  "Usage & Limits": UsageLimitsPage,
  "Billing History": BillingHistoryPage,
  "Company Info": CompanyInfoPage,
  Transactions: TransactionsPage,
  Documents: DocumentsPage,
  "Payment Methods": PaymentMethodsPage,
};

type TabButtonProps = Readonly<{
  tab: AccountBillingTab;
  activeTab: AccountBillingTab;
  onSelect: (tab: AccountBillingTab) => void;
}>;

function TabButton({ tab, activeTab, onSelect }: TabButtonProps) {
  const isActive = activeTab === tab;

  return (
    <button
      type="button"
      style={{ ...styles.tab, ...(isActive ? styles.activeTab : undefined) }}
      onClick={() => onSelect(tab)}
    >
      {tab}
    </button>
  );
}

const styles: Record<string, CSSProperties> = {
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

export type AccountBillingPageViewProps = Readonly<{
  ctx: AccountBillingPageContext;
}>;

export function AccountBillingPageView({ ctx }: AccountBillingPageViewProps) {
  const { activeTab, selectTab, allowedTabs, mountedTabs } = ctx;

  return (
    <div style={styles.body}>
      <div style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e5e5" }}>
        <div style={{ ...styles.container, paddingBottom: 0 }}>
          <h1 style={styles.pageHeading}>Account &amp; Billing</h1>
          <div style={styles.tabBar}>
            {allowedTabs.map(({ label }) => (
              <TabButton key={label} tab={label} activeTab={activeTab} onSelect={selectTab} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ ...styles.container, paddingTop: 24 }}>
        {allowedTabs.map(({ label }) => {
          if (!mountedTabs.has(label)) return null;
          const TabPanel = TAB_PAGES[label];
          return (
            <div key={label} hidden={activeTab !== label}>
              <TabPanel />
            </div>
          );
        })}
      </div>
    </div>
  );
}
