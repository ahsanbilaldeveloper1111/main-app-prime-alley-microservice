import React from "react";
import { History } from "lucide-react";
import { historyEventDisplayLabel } from "./orderViewModalUtils";
import { OrderViewCard, OrderViewSection } from "./OrderViewModalShared";

export function OrderViewModalTabHistory(props: {
  readonly viewingOrder: any;
  readonly ignoredHistoryKeys: Set<string>;
}): React.ReactElement {
  const { viewingOrder, ignoredHistoryKeys } = props;
  const histories = Array.isArray(viewingOrder.histories)
    ? viewingOrder.histories
    : [];

  return (
    <div>
      {histories.length > 0 ? (
        <OrderViewSection title="Activity History" badgeCount={histories.length}>
          <OrderViewCard>
            <div style={{ position: "relative", paddingLeft: "30px" }}>
              <div
                style={{
                  position: "absolute",
                  left: "8px",
                  top: 0,
                  bottom: 0,
                  width: "2px",
                  background: "#e5e7eb",
                }}
              />
              {histories.map((history: any, idx: number) => (
                <div
                  key={history.id || idx}
                  style={{
                    position: "relative",
                    paddingBottom: idx < histories.length - 1 ? "20px" : "0",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "-26px",
                      top: "4px",
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: history.event === "created" ? "#10b981" : "#f59e0b",
                      border: "3px solid white",
                      boxShadow: "0 0 0 2px #e5e7eb",
                    }}
                  />
                  <div
                    style={{
                      background: "#f9fafb",
                      padding: "12px 16px",
                      borderRadius: "8px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        fontWeight: 600,
                        marginBottom: "4px",
                      }}
                    >
                      {new Date(history.created_at).toLocaleString()}
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#1f2937",
                        marginBottom: "4px",
                        fontWeight: 500,
                      }}
                    >
                      {historyEventDisplayLabel(history.event)}
                    </div>
                    {history.description ? (
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#6b7280",
                          marginBottom: "8px",
                        }}
                      >
                        {history.description}
                      </div>
                    ) : null}
                    {history.changes && Object.keys(history.changes).length > 0 ? (
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>
                        {Object.entries(history.changes).map(([key, change]: [string, any]) => {
                          if (ignoredHistoryKeys.has(key)) {
                            return null;
                          }
                          return (
                            <div key={key} style={{ marginTop: "4px" }}>
                              <strong>{key}:</strong> {change.old ? `${change.old} → ` : ""}
                              {change.new || "N/A"}
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </OrderViewCard>
        </OrderViewSection>
      ) : (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "#6b7280",
            background: "#f9fafb",
            border: "2px dashed #d1d5db",
            borderRadius: "12px",
          }}
        >
          <History size={40} style={{ marginBottom: "12px", opacity: 0.5 }} />
          <div style={{ fontSize: "14px", fontWeight: 500 }}>
            No activity history found
          </div>
        </div>
      )}
    </div>
  );
}
