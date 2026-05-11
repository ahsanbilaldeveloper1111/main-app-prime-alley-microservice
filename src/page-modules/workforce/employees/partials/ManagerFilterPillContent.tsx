import React, { useMemo, useState } from "react";
import type { MainAppUserLookup } from "@hooks/useMainAppLookups";
import { hierarchyLabel, userIdForProfilePayload } from "../employeesDomain";

export interface ManagerFilterPillContentProps {
  managers: MainAppUserLookup[];
  selectedManagerIds: string[];
  onToggle: (idStr: string, isSelected: boolean) => void;
  closeMenu: () => void;
}

const ManagerFilterPillContent: React.FC<ManagerFilterPillContentProps> = ({
  managers,
  selectedManagerIds,
  onToggle,
  closeMenu,
}) => {
  const [query, setQuery] = useState("");

  const filteredManagers = useMemo(
    () =>
      managers.filter((mgr: MainAppUserLookup) => {
        if (userIdForProfilePayload(mgr) === "") return false;
        const label = hierarchyLabel(mgr);
        return !query.trim() || label.toLowerCase().includes(query.trim().toLowerCase());
      }),
    [managers, query],
  );

  return (
    <div className="employees-page__mgr-filter">
      <div className="employees-page__mgr-filter-search p-2 border-bottom">
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Search user..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>
      <div className="employees-page__mgr-filter-list">
        <button type="button" className="dropdown-item" onClick={() => closeMenu()}>
          Done
        </button>
        {filteredManagers.map((mgr: MainAppUserLookup) => {
          const label = hierarchyLabel(mgr);
          const userIdStr = userIdForProfilePayload(mgr);
          const isSelected = selectedManagerIds.includes(userIdStr);
          return (
            <button
              type="button"
              key={String(mgr.id)}
              className={`dropdown-item d-flex align-items-center gap-2${isSelected ? " employees-page__mgr-filter-item--selected" : ""}`}
              onClick={() => onToggle(userIdStr, isSelected)}
            >
              <span className="employees-page__mgr-filter-check">{isSelected ? "✓" : ""}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ManagerFilterPillContent;
