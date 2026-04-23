import React from "react";
import { Button } from "react-bootstrap";

export function OrderViewModalFooter(props: {
  readonly viewingOrder: any;
  readonly onHide: () => void;
}): React.ReactElement {
  const { viewingOrder, onHide } = props;
  return (
    <div
      style={{
        padding: "20px 32px",
        borderTop: "1px solid #e5e7eb",
        background: "white",
        borderBottomLeftRadius: "12px",
        borderBottomRightRadius: "12px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ fontSize: "13px", color: "#6b7280" }}>
        Order ID: <strong>#{viewingOrder.id}</strong>
      </div>
      <Button
        variant="outline-secondary"
        className="order-view-footer-close-btn"
        onClick={onHide}
        style={{
          padding: "10px 24px",
          borderRadius: "8px",
          fontWeight: 600,
          fontSize: "14px",
          border: "2px solid #e5e7eb",
          transition: "all 0.2s ease",
        }}
      >
        Close
      </Button>
    </div>
  );
}
