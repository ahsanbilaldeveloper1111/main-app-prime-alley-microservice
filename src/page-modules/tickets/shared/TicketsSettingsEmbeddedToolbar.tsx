import { sanitizeSearchInputLive } from "@utils/Helper";
import React from "react";

export function TicketsSettingsEmbeddedToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  actions,
}: Readonly<{
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  actions?: React.ReactNode;
}>) {
  return (
    <div className="tickets-settings-page__toolbar">
      <div className="tickets-settings-page__toolbar-search">
        <div className="search-container">
          <i className="fas fa-search search-icon" aria-hidden />
          <input
            type="text"
            className="search-bar"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(sanitizeSearchInputLive(e.target.value))}
            onPaste={(e) => {
              const target = e.currentTarget;
              globalThis.setTimeout(() => {
                onSearchChange(sanitizeSearchInputLive(target.value));
              }, 0);
            }}
          />
        </div>
      </div>
      {actions ? <div className="tickets-settings-page__toolbar-actions">{actions}</div> : null}
    </div>
  );
}
