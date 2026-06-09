import { Search } from "lucide-react";
import { sanitizeSearchInputLive } from "@utils/Helper";
import React from "react";
import "./settingsEmbeddedToolbar.scss";

export function SettingsEmbeddedToolbar({
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
    <div className="settings-embedded-page__toolbar">
      <div className="settings-embedded-page__toolbar-search">
        <div className="search-container">
          <Search size={16} className="search-icon" aria-hidden />
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
      {actions ? <div className="settings-embedded-page__toolbar-actions">{actions}</div> : null}
    </div>
  );
}
