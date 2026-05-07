import React from "react";
import type { MainAppUserLookup } from "@hooks/useMainAppLookups";
import ManagerFilterPillContent from "./ManagerFilterPillContent";

export interface UsersPillDropdownContentProps {
  closeMenu: () => void;
  managers: MainAppUserLookup[];
  selectedManagerIds: string[];
  onToggle: (idStr: string, isSelected: boolean) => void;
}

const UsersPillDropdownContent: React.FC<UsersPillDropdownContentProps> = ({
  closeMenu,
  managers,
  selectedManagerIds,
  onToggle,
}) => (
  <ManagerFilterPillContent
    managers={managers}
    selectedManagerIds={selectedManagerIds}
    onToggle={onToggle}
    closeMenu={closeMenu}
  />
);

export default UsersPillDropdownContent;
