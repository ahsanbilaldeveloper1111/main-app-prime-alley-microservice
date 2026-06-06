import { useRouter } from "next/router";
import {
  resolveUsersTeamsTabPath,
  shouldShowUsersTeamsBreadcrumb,
  type UsersTeamsTab,
} from "@utils/controlhub/usersNavigation";

export function useUsersTeamsPanelChrome(tab: UsersTeamsTab = "user-directory") {
  const router = useRouter();
  const pathname = router.pathname;

  const showBreadcrumb = shouldShowUsersTeamsBreadcrumb(pathname);

  return {
    showBreadcrumb,
    breadcrumbMainLink: resolveUsersTeamsTabPath(tab, pathname),
    embeddedInMainSettings: !showBreadcrumb,
  };
}
