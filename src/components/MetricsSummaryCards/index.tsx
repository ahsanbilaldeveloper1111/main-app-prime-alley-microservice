import React from "react";
import type { LucideIcon } from "lucide-react";
import type { StatsCardData } from "@components/GenericStatsCards";
import "@assets/scss/metrics-summary-cards.scss";

export interface MetricsSummaryCardsProps {
  data: StatsCardData[];
  /** Font size for the value (e.g. "28px") */
  valueFontSize?: string;
}

const defaultIconColor = "#006162";
const defaultIconBg = "rgba(0, 97, 98, 0.08)";

function renderIcon(Icon: LucideIcon | undefined, color?: string) {
  if (!Icon) return null;
  return <Icon size={18} color={color || defaultIconColor} />;
}

const MetricsSummaryCards: React.FC<MetricsSummaryCardsProps> = ({
  data,
  valueFontSize = "28px",
}) => {
  return (
    <div
      className="metrics-summary-cards-grid"
      style={{
        gap: "12px",
      }}
    >
      {data.map((card, idx) => {
        const IconComponent = card.icon as LucideIcon | undefined;
        const iconColor = card.iconColor || defaultIconColor;
        const iconBgColor = card.iconBgColor || defaultIconBg;

        return (
          <div
            key={`${card.title}-${idx}`}
            role={card.link?.onClick ? "button" : undefined}
            tabIndex={card.link?.onClick ? 0 : undefined}
            onClick={card.link?.onClick}
            onKeyDown={(e) => {
              if (!card.link?.onClick) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                card.link.onClick();
              }
            }}
            style={{
              background: "#fff",
              border: "1px solid #E9ECEF",
              borderRadius: "12px",
              padding: "14px 14px",
              boxShadow: "0 1px 2px rgba(16, 24, 40, 0.06)",
              cursor: card.link?.onClick ? "pointer" : "default",
              userSelect: "none",
            }}
          >
            <div className="d-flex align-items-center gap-3">
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: iconBgColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: "0 0 auto",
                }}
              >
                {renderIcon(IconComponent, iconColor)}
              </div>

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: valueFontSize,
                    fontWeight: 700,
                    lineHeight: 1.1,
                    color: "#111827",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={typeof card.value === "string" ? card.value : undefined}
                >
                  {card.value}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#6B7280",
                    marginTop: 2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={card.title}
                >
                  {card.title}
                </div>
              </div>
            </div>

            {(card.subtitle || card.metric || card.additionalText || card.badge) && (
              <div style={{ marginTop: 10 }}>
                {card.subtitle && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#374151",
                      lineHeight: 1.25,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={card.subtitle}
                  >
                    {card.subtitle}
                  </div>
                )}

                {card.metric && (
                  <div
                    className="d-flex align-items-center gap-2"
                    style={{ marginTop: card.subtitle ? 6 : 0 }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "999px",
                        background: card.metric.dotColor,
                        flex: "0 0 auto",
                      }}
                    />
                    <div
                      style={{
                        fontSize: 12,
                        color: "#6B7280",
                        lineHeight: 1.25,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={card.metric.text}
                    >
                      {card.metric.text}
                    </div>
                  </div>
                )}

                {card.badge && (
                  <div style={{ marginTop: 8 }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        fontSize: 12,
                        fontWeight: 700,
                        background: card.badge.bgColor,
                        color: card.badge.textColor,
                      }}
                    >
                      {card.badge.text}
                    </span>
                  </div>
                )}

                {card.additionalText && (
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 12,
                      color: "#9CA3AF",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={card.additionalText}
                  >
                    {card.additionalText}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MetricsSummaryCards;

