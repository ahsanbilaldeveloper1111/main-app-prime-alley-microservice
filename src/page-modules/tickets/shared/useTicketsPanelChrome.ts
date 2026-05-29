import { useRouter } from "next/router";
import {
  resolveTicketsHubPath,
  shouldShowTicketsAdminBreadcrumb,
  type TicketsSettingsTab,
} from "@utils/tickets/ticketsNavigation";

export function useTicketsPanelChrome(tab: TicketsSettingsTab) {
  const router = useRouter();
  const pathname = router.pathname;

  return {
    showBreadcrumb: shouldShowTicketsAdminBreadcrumb(pathname),
    breadcrumbMainLink: resolveTicketsHubPath(tab, pathname),
  };
}
