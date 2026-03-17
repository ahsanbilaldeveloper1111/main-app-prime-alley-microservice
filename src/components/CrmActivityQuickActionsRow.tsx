import React, { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";

interface QuickActionConfig {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}

interface MoreActionConfig {
  label: string;
  onClick: () => void;
}

interface CrmActivityQuickActionsRowProps {
  actions: QuickActionConfig[];
  moreActions: MoreActionConfig[];
  quickActionCircleButtonStyle: React.CSSProperties;
  dropdownMenuItemStyle: React.CSSProperties;
}

const CrmActivityQuickActionsRow: React.FC<CrmActivityQuickActionsRowProps> = ({
  actions,
  moreActions,
  quickActionCircleButtonStyle,
  dropdownMenuItemStyle,
}) => {
  const [showMoreActivities, setShowMoreActivities] = useState(false);
  const moreActivitiesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        moreActivitiesRef.current &&
        !moreActivitiesRef.current.contains(event.target as Node)
      ) {
        setShowMoreActivities(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "17px",
        paddingTop: "6px",
        paddingBottom: "4px",
        paddingLeft: "24px",
        paddingRight: "24px",
      }}
    >
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <div
            key={action.label}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <button
              type="button"
              disabled={action.disabled}
              onClick={action.onClick}
              style={{
                ...quickActionCircleButtonStyle,
                cursor: action.disabled ? "not-allowed" : "pointer",
              }}
            >
              <Icon size={20} />
            </button>
            <span
              style={{
                fontSize: "12px",
                color: "#141414",
                fontWeight: 300,
              }}
            >
              {action.label}
            </span>
          </div>
        );
      })}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
          position: "relative",
        }}
        ref={moreActivitiesRef}
      >
        <button
          type="button"
          onClick={() => setShowMoreActivities(!showMoreActivities)}
          style={{
            ...quickActionCircleButtonStyle,
            cursor: "pointer",
          }}
        >
          <MoreHorizontal size={20} />
        </button>
        <span
          style={{
            fontSize: "12px",
            color: "#141414",
            fontWeight: 300,
          }}
        >
          More
        </span>

        {showMoreActivities && moreActions.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: "4px",
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "5px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              minWidth: "150px",
              zIndex: 1000,
            }}
          >
            {moreActions.map(({ label, onClick }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setShowMoreActivities(false);
                  onClick();
                }}
                style={dropdownMenuItemStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f7fafc";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CrmActivityQuickActionsRow;

