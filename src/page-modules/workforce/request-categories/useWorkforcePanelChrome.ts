import { useRouter } from "next/router";
import {
  resolveWorkforceHubPath,
  shouldShowWorkforceAdminBreadcrumb,
  type WorkforceSettingsTab,
} from "@utils/workforce/workforceNavigation";

export function useWorkforcePanelChrome(tab: WorkforceSettingsTab = "request-categories") {
  const router = useRouter();
  const pathname = router.pathname;

  return {
    showBreadcrumb: shouldShowWorkforceAdminBreadcrumb(pathname),
    breadcrumbMainLink: resolveWorkforceHubPath(tab, pathname),
  };
}
