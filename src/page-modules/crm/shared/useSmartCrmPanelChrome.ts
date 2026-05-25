import { useRouter } from "next/router";
import {
  resolveSmartCrmHubPath,
  shouldShowSmartCrmAdminBreadcrumb,
  type SmartCrmSettingsTab,
} from "@utils/crm/smartCrmNavigation";

export function useSmartCrmPanelChrome(tab: SmartCrmSettingsTab) {
  const router = useRouter();
  const pathname = router.pathname;

  return {
    showBreadcrumb: shouldShowSmartCrmAdminBreadcrumb(pathname),
    breadcrumbMainLink: resolveSmartCrmHubPath(tab, pathname),
  };
}
