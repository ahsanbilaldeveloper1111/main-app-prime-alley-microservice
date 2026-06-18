import React from "react";

export type WorkforceInnerTabItem = Readonly<{
  id: string;
  label: string;
}>;

export type WorkforceInnerTabLayoutProps = Readonly<{
  tabs: readonly WorkforceInnerTabItem[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  children: React.ReactNode;
}>;

/** Matches GenericTable tab + card chrome used across workforce list pages. */
export function WorkforceInnerTabLayout({
  tabs,
  activeTabId,
  onSelectTab,
  children,
}: WorkforceInnerTabLayoutProps) {
  return (
    <div className="generic-table-container workforce-inner-tab-layout">
      <div className="gt-toolbar-container">
        <div className="gt-toolbar-tabs-section">
          <div className="gt-toolbar-tabs-row d-flex align-items-center">
            <div className="gt-toolbar-tabs-list d-flex align-items-center">
              {tabs.map((tab) => {
                const isActive = activeTabId === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => onSelectTab(tab.id)}
                    className={`gt-tab-button ${isActive ? "active" : ""}`}
                  >
                    <span className="gt-tab-label" title={tab.label}>
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="generic-table-card workforce-inner-tab-layout__body">{children}</div>
    </div>
  );
}
