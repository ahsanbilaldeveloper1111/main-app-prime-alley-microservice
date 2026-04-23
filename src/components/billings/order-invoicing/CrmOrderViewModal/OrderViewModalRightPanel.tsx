import React from "react";
import { Badge } from "react-bootstrap";
import moment from "moment";
import { Edit } from "lucide-react";
import {
  formatOrderFinalTotalDisplay,
  orderListStatusBadgeVariant,
  paymentStatusBadgeVariant,
} from "./orderViewModalUtils";
import {
  OrderViewSidebarCard,
  OrderViewSidebarRow,
  OrderViewSidebarTitle,
  OrderViewSidebarValueText,
  OrderViewStageBadge,
  OrderViewSummaryField,
} from "./OrderViewModalShared";

export function OrderViewModalRightPanel(props: {
  readonly viewingOrder: any;
  readonly session: { user?: { permissions?: string[] } } | null;
  readonly onHide: () => void;
}): React.ReactElement {
  const { viewingOrder, session, onHide } = props;
  return (
    <div
      style={{
        padding: "32px 24px",
        background: "#fafbfc",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      <div>
        <OrderViewSidebarTitle>Quick Actions</OrderViewSidebarTitle>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {session?.user?.permissions?.includes("edit-crm-orders") ? (
            <button
              type="button"
              className="order-view-edit-order-btn"
              style={{
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                padding: "12px 16px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                fontSize: "14px",
                fontWeight: 500,
                color: "#1f2937",
              }}
              onClick={() => {
                onHide();
                globalThis.location.href = `/crm/orders/${viewingOrder.id}/edit`;
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "#f59e0b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Edit size={16} style={{ color: "white" }} />
              </div>
              Edit Order
            </button>
          ) : null}
        </div>
      </div>

      <div>
        <OrderViewSidebarTitle>Status Overview</OrderViewSidebarTitle>
        <OrderViewSidebarCard>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <OrderViewSidebarRow
              label="Stage"
              right={
                <OrderViewStageBadge
                  stage={viewingOrder.stage}
                  fallbackLabel="N/A"
                />
              }
            />
            <OrderViewSidebarRow
              label="Status"
              right={
                <Badge
                  bg={orderListStatusBadgeVariant(viewingOrder.status)}
                  style={{ fontSize: "11px", padding: "4px 10px" }}
                >
                  {viewingOrder.status || "N/A"}
                </Badge>
              }
            />
            <OrderViewSidebarRow
              label="Total Amount"
              right={
                <OrderViewSidebarValueText>
                  {formatOrderFinalTotalDisplay(viewingOrder)}
                </OrderViewSidebarValueText>
              }
            />
            <OrderViewSidebarRow
              label="Items"
              right={
                <OrderViewSidebarValueText>
                  {viewingOrder.items?.length || 0}
                </OrderViewSidebarValueText>
              }
            />
          </div>
        </OrderViewSidebarCard>
      </div>

      <div style={{ flex: 1 }}>
        <OrderViewSidebarTitle>Order Summary</OrderViewSidebarTitle>
        <OrderViewSidebarCard>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {viewingOrder.order_date ? (
              <OrderViewSummaryField
                label="Order Date"
                value={moment(viewingOrder.order_date).format("MMM DD, YYYY")}
              />
            ) : null}
            {viewingOrder.expected_delivery_date ? (
              <OrderViewSummaryField
                label="Expected Delivery"
                value={moment(viewingOrder.expected_delivery_date).format(
                  "MMM DD, YYYY",
                )}
              />
            ) : null}
            {viewingOrder.payment_status ? (
              <OrderViewSummaryField
                label="Payment Status"
                value={
                  <Badge
                    bg={paymentStatusBadgeVariant(
                      viewingOrder.payment_status,
                    )}
                    style={{
                      fontSize: "11px",
                      padding: "4px 10px",
                    }}
                  >
                    {viewingOrder.payment_status}
                  </Badge>
                }
              />
            ) : null}
          </div>
        </OrderViewSidebarCard>
      </div>
    </div>
  );
}
