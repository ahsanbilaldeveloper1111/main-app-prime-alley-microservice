import React from "react";

export type VoicebotTab = {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
};

export function TabsNavigation({
  tabs,
  activeTab,
  onTabChange,
}: Readonly<{
  tabs: VoicebotTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}>) {
  return (
    <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb" }}>
      <div
        style={{
          maxWidth: "1600px",
          margin: "0 auto",
          display: "flex",
          gap: "8px",
          overflowX: "auto",
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 20px",
                border: "none",
                backgroundColor: "transparent",
                color: isActive ? "#667eea" : "#9ca3af",
                fontWeight: isActive ? 600 : 500,
                fontSize: "14px",
                cursor: "pointer",
                borderBottom: isActive ? "3px solid #667eea" : "3px solid transparent",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor: isActive ? "#667eea" : "#e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <tab.icon size={14} color={isActive ? "white" : "#9ca3af"} />
              </div>
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

