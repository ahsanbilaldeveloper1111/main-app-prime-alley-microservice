import React from "react";
import { Badge } from "react-bootstrap";
import { User } from "lucide-react";
import {
  extensionDisplayName,
  fulfillmentBadgeVariant,
  orderApprovalBadgeVariant,
  paymentStatusBadgeVariant,
} from "./orderViewModalUtils";
import {
  OrderViewCard,
  OrderViewField,
  OrderViewGrid,
  OrderViewSection,
} from "./OrderViewModalShared";

export function OrderViewModalTabAdditional(props: {
  readonly viewingOrder: any;
  readonly extensions: any[];
}): React.ReactElement {
  const { viewingOrder, extensions } = props;
  return (
    <div>
      <OrderViewSection title="Additional Information">
        <OrderViewCard>
          <OrderViewGrid>
            <OrderViewField
              label="Approval Status"
              value={
                viewingOrder.order_approval_status ? (
                  <Badge bg={orderApprovalBadgeVariant(viewingOrder.order_approval_status)}>
                    {viewingOrder.order_approval_status}
                  </Badge>
                ) : (
                  <span className="text-muted">Not Set</span>
                )
              }
            />
            <OrderViewField
              label="Fulfillment Status"
              value={
                viewingOrder.fulfillment_status ? (
                  <Badge bg={fulfillmentBadgeVariant(viewingOrder.fulfillment_status)}>
                    {viewingOrder.fulfillment_status}
                  </Badge>
                ) : (
                  <span className="text-muted">Not Set</span>
                )
              }
            />
            <OrderViewField
              label="Payment Status"
              value={
                viewingOrder.payment_status ? (
                  <Badge bg={paymentStatusBadgeVariant(viewingOrder.payment_status)}>
                    {viewingOrder.payment_status}
                  </Badge>
                ) : (
                  <span className="text-muted">Not Set</span>
                )
              }
            />
            {viewingOrder.assigned_to ? (
              <OrderViewField
                label="Assigned To"
                value={
                  <>
                    <User
                      size={14}
                      style={{ color: "#f59e0b", marginRight: "6px", display: "inline" }}
                    />
                    {extensionDisplayName(extensions, viewingOrder.assigned_to)}
                  </>
                }
              />
            ) : null}
            {viewingOrder.contract_length ? (
              <OrderViewField label="Contract Length" value={viewingOrder.contract_length} />
            ) : null}
          </OrderViewGrid>
        </OrderViewCard>
      </OrderViewSection>

      {viewingOrder.notes ? (
        <OrderViewSection title="Notes">
          <OrderViewCard tone="warning">{viewingOrder.notes}</OrderViewCard>
        </OrderViewSection>
      ) : null}
    </div>
  );
}
