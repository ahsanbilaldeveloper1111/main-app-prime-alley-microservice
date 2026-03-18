import { useEffect, useState, useMemo } from "react";
import type { NextRouter } from "next/router";

export const useCrmSectionTab = (
  router: NextRouter,
  validTabIds: string[],
  defaultTab: string,
) => {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

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

