import { useEffect, useState, useMemo } from "react";
import type { NextRouter } from "next/router";

export type CrmTabId = string;

export const useCrmSectionTab = (
  router: NextRouter,
  validTabIds: CrmTabId[],
  defaultTab: CrmTabId,
) => {
  const [activeTab, setActiveTab] = useState<CrmTabId>(defaultTab);

  const validTabSet = useMemo(
    () => new Set(validTabIds.map((t) => t.toLowerCase().trim())),
    [validTabIds],
  );

  useEffect(() => {
    if (!router.isReady) return;
    const section = router.query.section;
    const tabId =
      typeof section === "string" ? section.toLowerCase().trim() : null;
    if (tabId && validTabSet.has(tabId)) {
      setActiveTab(tabId);
    }
  }, [router.isReady, router.query.section, validTabSet]);

  return { activeTab, setActiveTab };
};

