import { useRouter } from "next/router";
import {
  resolveTicketsHubPath,
  shouldShowTicketsAdminBreadcrumb,
  type TicketsSettingsTab,
} from "@utils/tickets/ticketsNavigation";

export function useTicketsPanelChrome(tab: TicketsSettingsTab) {
  const router = useRouter();
  const pathname = router.pathname;

  const showBreadcrumb = shouldShowTicketsAdminBreadcrumb(pathname);

  return {
    showBreadcrumb,
    breadcrumbMainLink: resolveTicketsHubPath(tab, pathname),
    embeddedInMainSettings: !showBreadcrumb,
  };
}
