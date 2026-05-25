import { useRouter } from "next/router";
import {
  resolveFaqsHubPath,
  shouldShowFaqsAdminBreadcrumb,
  type FaqsHelpCenterTab,
} from "@utils/faqs/faqsNavigation";

export function useFaqsPanelChrome(subTab: FaqsHelpCenterTab) {
  const router = useRouter();
  const pathname = router.pathname;

  return {
    showBreadcrumb: shouldShowFaqsAdminBreadcrumb(pathname),
    breadcrumbMainLink: resolveFaqsHubPath(subTab, pathname),
  };
}
