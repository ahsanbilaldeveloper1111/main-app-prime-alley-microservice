import React from "react";
import moment from "moment";
import { Target, ShoppingBag, X } from "lucide-react";

export function OrderViewModalHeader(props: {
  readonly viewingOrder: any;
  readonly onHide: () => void;
}): React.ReactElement {
  const { viewingOrder, onHide } = props;

  return (
    <div
      style={{
        background: "#fff",
        color: "black",
        padding: "24px 32px",
        position: "relative",
        borderTopLeftRadius: "12px",
        borderTopRightRadius: "12px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        borderBottom: "1px solid #ccc",
      }}
    >
      <button
        type="button"
        className="order-view-modal-close-btn"
        onClick={onHide}
        aria-label="Close"
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "black",
          width: "32px",
          height: "32px",
          borderRadius: "8px",
          cursor: "pointer",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <X size={18} />
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "16px",
            background: "#f59e0b",
            backdropFilter: "blur(10px)",
            border: "2px solid rgba(255,255,255,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            fontWeight: "700",
            flexShrink: 0,
            color: "#fff",
          }}
        >
          <ShoppingBag size={32} style={{ color: "white" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: "26px",
              textShadow: "0 2px 4px rgba(0,0,0,0.1)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {viewingOrder.order_number || `Order #${viewingOrder.id}`}
          </h2>
          <div
            style={{
              marginTop: "6px",
              opacity: 0.95,
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              color: "#000",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Target size={14} />
              {viewingOrder.stage?.name || "No stage"}
            </span>
            <span>•</span>
            <span style={{ fontWeight: 600 }}>
              {viewingOrder.currency || "AED"}{" "}
              {Number.parseFloat(
                viewingOrder.final_amount ||
                  viewingOrder.total_amount ||
                  "0",
              ).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span>•</span>
            <span>
              {viewingOrder.order_date
                ? moment(viewingOrder.order_date).format("MMM DD, YYYY")
                : "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
