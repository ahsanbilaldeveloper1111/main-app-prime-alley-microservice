import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  startTransition,
} from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import {
  getAllowedAccountBillingTabs,
  tabLabelFromQuery,
  tabSlugFromLabel,
  type AccountBillingTab,
} from "@components/billings/shared/accountBillingTabs";

export const ACCOUNT_BILLING_BASE_PATH = "/billing/account-billing";
export const ACCOUNT_BILLING_TAB_PATHNAME = "/billing/account-billing/[tab]";

export function handleAccountBillingRouteChange(promise: Promise<boolean>, label: string) {
  promise.catch((error) => {
    console.error(`[AccountBilling] ${label} navigation failed`, error);
  });
}

export function useAccountBillingPage() {
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
      handleAccountBillingRouteChange(
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
          handleAccountBillingRouteChange(
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
        handleAccountBillingRouteChange(
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
    return getAllowedAccountBillingTabs(userPermissions);
  }, [session?.user?.permissions]);
  const firstAllowedTab = allowedTabs[0]?.label ?? "Overview";

  const selectTab = useCallback(
    (tab: AccountBillingTab) => {
      startTransition(() => {
        setActiveTab(tab);
      });

      if (!router.isReady) return;

      if (tab === "Overview") {
        handleAccountBillingRouteChange(
          router.push(
            { pathname: ACCOUNT_BILLING_BASE_PATH, query: queryWithoutTab },
            undefined,
            { shallow: true },
          ),
          "push overview",
        );
        return;
      }

      const slug = tabSlugFromLabel(tab);
      handleAccountBillingRouteChange(
        router.push(
          { pathname: ACCOUNT_BILLING_TAB_PATHNAME, query: { ...queryWithoutTab, tab: slug } },
          `${ACCOUNT_BILLING_BASE_PATH}/${slug}`,
          { shallow: true },
        ),
        `push tab ${slug}`,
      );
    },
    [queryWithoutTab, router, router.isReady],
  );

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
    handleAccountBillingRouteChange(router.replace("/access-denied"), "replace no allowed account-billing tabs");
  }, [allowedTabs.length, router, router.isReady]);

  return {
    activeTab,
    selectTab,
    allowedTabs,
    mountedTabs,
  };
}

export type AccountBillingPageContext = ReturnType<typeof useAccountBillingPage>;
