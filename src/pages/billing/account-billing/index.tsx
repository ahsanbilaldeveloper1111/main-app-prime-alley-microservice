import { useEffect, useMemo, useState, startTransition, ReactElement, useCallback } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Layout from "@layout/index";
import OverviewPage from "@components/billings/Overview";
import SubscriptionsPage from "@components/billings/SubscriptionPage";
import UsageLimitsPage from "@components/billings/UsageLimitsPage";
import BillingHistoryPage from "@components/billings/BillingHistoryPage";
import TransactionsPage from "@components/billings/TransactionPage";
import DocumentsPage from "@components/billings/DocumentPage";
import PaymentMethodsPage from "@components/billings/PaymentMethodsPage";
import CompanyInfoPage from "@components/billings/CompanyInfoPage";
import {
  ACCOUNT_BILLING_TABS,
  tabLabelFromQuery,
  tabSlugFromLabel,
  type AccountBillingTab,
} from "@components/billings/shared/accountBillingTabs";

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
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<AccountBillingTab>("Overview");
  /** Keep visited tab panels mounted so switching tabs does not remount/refetch and flicker. */
  const [mountedTabs, setMountedTabs] = useState<Set<AccountBillingTab>>(
    () => new Set<AccountBillingTab>(["Overview"]),
  );

  const queryWithoutTab = useMemo(() => {
    const { tab: _tab, ...rest } = router.query;
    return rest;
  }, [router.query]);
  const replaceWithTabSlug = useCallback(
    (tab: AccountBillingTab, reason: string) => {
      const slug = tabSlugFromLabel(tab);
      handleRouteChange(
        router.replace(
          { pathname: ACCOUNT_BILLING_TAB_PATHNAME, query: { ...queryWithoutTab, tab: slug } },
          `${ACCOUNT_BILLING_BASE_PATH}/${slug}`,
          { shallow: true },
        ),
        reason,
      );
    },
    [queryWithoutTab, router],
  );

  const normalizeAccountBillingRoute = useCallback(
    (tab: AccountBillingTab) => {
      if (router.pathname === ACCOUNT_BILLING_BASE_PATH) {
        if (tab === "Overview") {
          handleRouteChange(
            router.replace(
              { pathname: ACCOUNT_BILLING_BASE_PATH, query: queryWithoutTab },
              undefined,
              { shallow: true },
            ),
            "replace overview",
          );
          return;
        }
        replaceWithTabSlug(tab, `replace tab ${tabSlugFromLabel(tab)}`);
        return;
      }
      if (router.pathname === ACCOUNT_BILLING_TAB_PATHNAME && tab === "Overview") {
        handleRouteChange(
          router.replace(
            { pathname: ACCOUNT_BILLING_BASE_PATH, query: queryWithoutTab },
            undefined,
            { shallow: true },
          ),
          "replace canonical overview",
        );
      }
    },
    [queryWithoutTab, replaceWithTabSlug, router],
  );

  const allowedTabs = useMemo(() => {
    const userPermissions = session?.user?.permissions ?? [];
    return ACCOUNT_BILLING_TABS.filter((tab) =>
      userPermissions.includes(tab.permission),
    );
  }, [session?.user?.permissions]);
  const firstAllowedTab = allowedTabs[0]?.label ?? "Overview";

  const selectTab = (tab: AccountBillingTab) => {
    startTransition(() => {
      setActiveTab(tab);
    });

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
    if (allowedTabs.length === 0) return;

    const tabParam = router.query.tab;
    const requestedTab = Array.isArray(tabParam) ? tabParam[0] : tabParam;
    if (!requestedTab) {
      if (activeTab !== firstAllowedTab) setActiveTab(firstAllowedTab);
      return;
    }

    const nextTab = tabLabelFromQuery(requestedTab);
    if (!nextTab) return;
    const isAllowed = allowedTabs.some((tab) => tab.label === nextTab);
    if (!isAllowed) {
      if (activeTab !== firstAllowedTab) setActiveTab(firstAllowedTab);
      replaceWithTabSlug(firstAllowedTab, "replace unauthorized tab");
      return;
    }
    if (nextTab !== activeTab) setActiveTab(nextTab);
    normalizeAccountBillingRoute(nextTab);
  }, [
    activeTab,
    allowedTabs,
    firstAllowedTab,
    normalizeAccountBillingRoute,
    replaceWithTabSlug,
    router,
    router.isReady,
    router.query.tab,
  ]);

  useEffect(() => {
    setMountedTabs((prev) => (prev.has(activeTab) ? prev : new Set(prev).add(activeTab)));
  }, [activeTab]);

  useEffect(() => {
    if (!router.isReady) return;
    if (allowedTabs.length > 0) return;
    handleRouteChange(router.replace("/access-denied"), "replace no allowed account-billing tabs");
  }, [allowedTabs.length, router, router.isReady]);

  return (
    <div style={styles.body}>
      {/* Tab Bar */}
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

      {/* Main Content — keep visited panels mounted to avoid blank flash on tab change */}
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
};
AccountBilling.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};
export default AccountBilling;