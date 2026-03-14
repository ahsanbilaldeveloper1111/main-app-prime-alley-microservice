import { useEffect, useMemo, useState, ReactElement } from "react";
import { useRouter } from "next/router";
import Layout from "@layout/index";
import OverviewPage from "@components/billings/Overview";
import SubscriptionsPage from "@components/billings/SubscriptionPage";
import UsageLimitsPage from "@components/billings/UsageLimitsPage";
import BillingHistoryPage from "@components/billings/BillingHistoryPage";
import TransactionsPage from "@components/billings/TransactionPage";
import DocumentsPage from "@components/billings/DocumentPage";
import PaymentMethodsPage from "@components/billings/PaymentMethodsPage";
import CompanyInfoPage from "@components/billings/CompanyInfoPage";
import { ACCOUNT_BILLING_TABS, tabLabelFromQuery, tabSlugFromLabel, type AccountBillingTab } from "@components/billings/shared/accountBillingTabs";

type TabPageComponent = React.ComponentType<Record<string, never>>;

const ACCOUNT_BILLING_BASE_PATH = "/billing/account-billing";
const ACCOUNT_BILLING_TAB_PATHNAME = "/billing/account-billing/[tab]";

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

type TabButtonProps = {
  tab: AccountBillingTab;
  activeTab: AccountBillingTab;
  onSelect: (tab: AccountBillingTab) => void;
};

const TabButton = ({ tab, activeTab, onSelect }: TabButtonProps) => {
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
};
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

function handleRouteChange(promise: Promise<boolean>, label: string) {
  promise.catch((error) => {
    console.error(`[AccountBilling] ${label} navigation failed`, error);
  });
}

const AccountBilling = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AccountBillingTab>("Overview");
  const ActiveTabPage = TAB_PAGES[activeTab];

  const queryWithoutTab = useMemo(() => {
    const { tab: _tab, ...rest } = router.query;
    return rest;
  }, [router.query]);

  const selectTab = (tab: AccountBillingTab) => {
    setActiveTab(tab);

    if (!router.isReady) return;

    if (tab === "Overview") {
      handleRouteChange(
        router.push({ pathname: ACCOUNT_BILLING_BASE_PATH, query: queryWithoutTab }, undefined, { shallow: true }),
        "push overview",
      );
      return;
    }

    const slug = tabSlugFromLabel(tab);
    handleRouteChange(
      router.push(
        { pathname: ACCOUNT_BILLING_TAB_PATHNAME, query: { ...queryWithoutTab, tab: slug } },
        `${ACCOUNT_BILLING_BASE_PATH}/${slug}`,
        { shallow: true },
      ),
      `push tab ${slug}`,
    );
  };

  useEffect(() => {
    if (!router.isReady) return;

    const tabParam = router.query.tab;
    const requestedTab = Array.isArray(tabParam) ? tabParam[0] : tabParam;
    if (!requestedTab) {
      if (activeTab !== "Overview") setActiveTab("Overview");
      return;
    }

    const nextTab = tabLabelFromQuery(requestedTab);
    if (!nextTab) return;
    if (nextTab !== activeTab) setActiveTab(nextTab);

    // Normalize legacy query-param URLs to friendly path URLs.
    if (router.pathname === ACCOUNT_BILLING_BASE_PATH) {
      if (nextTab === "Overview") {
        handleRouteChange(
          router.replace({ pathname: ACCOUNT_BILLING_BASE_PATH, query: queryWithoutTab }, undefined, { shallow: true }),
          "replace overview",
        );
        return;
      }

      const slug = tabSlugFromLabel(nextTab);
      handleRouteChange(
        router.replace(
          { pathname: ACCOUNT_BILLING_TAB_PATHNAME, query: { ...queryWithoutTab, tab: slug } },
          `${ACCOUNT_BILLING_BASE_PATH}/${slug}`,
          { shallow: true },
        ),
        `replace tab ${slug}`,
      );
    }

    // If someone lands on /account-billing/overview, keep the canonical URL clean.
    if (router.pathname === ACCOUNT_BILLING_TAB_PATHNAME && nextTab === "Overview") {
      handleRouteChange(
        router.replace({ pathname: ACCOUNT_BILLING_BASE_PATH, query: queryWithoutTab }, undefined, { shallow: true }),
        "replace canonical overview",
      );
    }
  }, [activeTab, queryWithoutTab, router.isReady, router.pathname, router.query.tab]);

  return (
    <div style={styles.body}>
      {/* Tab Bar */}
      <div style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e5e5" }}>
        <div style={{ ...styles.container, paddingBottom: 0 }}>
          <h1 style={styles.pageHeading}>Account &amp; Billing</h1>
          <div style={styles.tabBar}>
            {ACCOUNT_BILLING_TABS.map(({ label }) => (
              <TabButton key={label} tab={label} activeTab={activeTab} onSelect={selectTab} />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ ...styles.container, paddingTop: 24 }}>
        <ActiveTabPage />
      </div>
    </div>
  );
};
AccountBilling.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};
export default AccountBilling;