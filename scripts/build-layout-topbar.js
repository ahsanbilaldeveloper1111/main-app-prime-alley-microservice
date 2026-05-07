const fs = require("fs");
const nav = fs.readFileSync("src/NLayout_nav_extract.txt", "utf8");
const header = `import React, { type RefObject } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import {
  Bell,
  ChevronDown,
  MoreVertical,
  Phone,
  Search,
  User,
  HelpCircle,
  Settings,
  ExternalLink,
  Sparkles,
  Plus,
  MonitorCheck,
} from "lucide-react";
import GlobalFloatingCallBar from "@components/GlobalFloatingCallBar";
import {
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_WIDTH_EXPANDED,
} from "../Moduler/AppCustomerSidebar";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { canAccessRoute } from "../../config/permissions";
import { getAllowedAccountBillingTabs } from "@components/billings/shared/accountBillingTabs";
import { getNotificationsOverflowLabel } from "./layoutCtiHelpers";
import type { SearchableRouteItem } from "./layoutTypes";
import { useAuth } from "../../hooks/useAuth";

const { PERMISSIONS } = HEADER_CONSTANTS;

export interface LayoutTopBarProps {
  isSidebarExpanded: boolean;
  searchWrapperRef: RefObject<HTMLDivElement | null>;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  showSearchSuggestions: boolean;
  setShowSearchSuggestions: (v: boolean) => void;
  searchSuggestions: SearchableRouteItem[];
  showCreateDropdown: boolean;
  setShowCreateDropdown: (v: boolean) => void;
  setShowCreateLeadModal: (v: boolean) => void;
  setShowCreateCompanySidebar: (v: boolean) => void;
  setShowCreateTicketSidebar: (v: boolean) => void;
  setShowCreateTaskSidebar: (v: boolean) => void;
  totalUnreadCount: number;
  setShowNotificationsSidebar: (v: boolean) => void;
  isInitialized: boolean;
  openDialer: () => void;
  dialerButtonRef: RefObject<HTMLButtonElement | null>;
  showIconsDropdown: boolean;
  setShowIconsDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  iconsDropdownRef: RefObject<HTMLDivElement | null>;
  showUserDropdown: boolean;
  setShowUserDropdown: (v: boolean) => void;
  userDropdownRef: RefObject<HTMLDivElement | null>;
  headerLogoUrl: string | null;
  loggedInCompanyName: string;
  loggedInName: string;
  profileImageUrl: string | null;
  showBreezeAssistant: boolean;
  setShowBreezeAssistant: (v: boolean) => void;
}

export default function LayoutTopBar({
  isSidebarExpanded,
  searchWrapperRef,
  searchQuery,
  setSearchQuery,
  showSearchSuggestions,
  setShowSearchSuggestions,
  searchSuggestions,
  showCreateDropdown,
  setShowCreateDropdown,
  setShowCreateLeadModal,
  setShowCreateCompanySidebar,
  setShowCreateTicketSidebar,
  setShowCreateTaskSidebar,
  totalUnreadCount,
  setShowNotificationsSidebar,
  isInitialized,
  openDialer,
  dialerButtonRef,
  showIconsDropdown,
  setShowIconsDropdown,
  iconsDropdownRef,
  showUserDropdown,
  setShowUserDropdown,
  userDropdownRef,
  headerLogoUrl,
  loggedInCompanyName,
  loggedInName,
  profileImageUrl,
  showBreezeAssistant,
  setShowBreezeAssistant,
}: LayoutTopBarProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { logout } = useAuth();
  return (
${nav}
  );
}
`;
fs.writeFileSync("src/Layouts/components/LayoutTopBar.tsx", header);
console.log("wrote LayoutTopBar");
