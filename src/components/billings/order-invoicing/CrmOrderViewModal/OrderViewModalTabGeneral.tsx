import React from "react";
import { formatDateForTable } from "@utils/Helper";
import { CrmPhoneDisplay as PhoneDisplay } from "@components/crm/CrmListPageUi";
import { getInitials, getRandomColor } from "@utils/crmNameAvatar";
import {
  Target,
  CheckCircle,
  ShoppingBag,
  Calendar,
  Building2,
  Mail,
  DollarSign,
} from "lucide-react";
import {
  formatOrderFinalTotalDisplay,
  orderItemsFooterColSpan,
  orderStatusCardAccentColor,
} from "./orderViewModalUtils";
import { OrderViewModalOrderItemsTable } from "./OrderViewModalOrderItemsTable";
import {
  OrderViewCard,
  OrderViewDetailGrid,
  OrderViewDetailRow,
  OrderViewField,
  OrderViewGrid,
  OrderViewQuickInfoCard,
  OrderViewSection,
} from "./OrderViewModalShared";

export function OrderViewModalTabGeneral(props: {
  readonly viewingOrder: any;
}): React.ReactElement {
  const { viewingOrder } = props;
  const orderItems = Array.isArray(viewingOrder.items)
    ? (viewingOrder.items as unknown[])
    : [];
  const hasItemDescriptionColumn = orderItems.some(
    (item) =>
      item &&
      typeof item === "object" &&
      "description" in item &&
      Boolean((item as { description?: unknown }).description),
  );
  const footerColSpan = orderItemsFooterColSpan(orderItems);

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        <OrderViewQuickInfoCard
          iconBackground={viewingOrder.stage?.color || "#6c757d"}
          icon={<Target size={20} style={{ color: "white" }} />}
          label="Stage"
          value={viewingOrder.stage?.name || "Not assigned"}
        />
        <OrderViewQuickInfoCard
          iconBackground={orderStatusCardAccentColor(viewingOrder.status)}
          icon={<CheckCircle size={20} style={{ color: "white" }} />}
          label="Status"
          value={viewingOrder.status || "N/A"}
        />
        <OrderViewQuickInfoCard
          iconBackground="#10b981"
          icon={<DollarSign size={20} style={{ color: "white" }} />}
          label="Final Amount"
          labelColor="#10b981"
          value={formatOrderFinalTotalDisplay(viewingOrder)}
        />
        <OrderViewQuickInfoCard
          iconBackground="#3b82f6"
          icon={<Calendar size={20} style={{ color: "white" }} />}
          label="Order Date"
          labelColor="#3b82f6"
          value={
            viewingOrder.order_date
              ? formatDateForTable(viewingOrder.order_date)
              : "N/A"
          }
        />
      </div>

      <OrderViewSection title="Order Details">
        <OrderViewCard>
          <OrderViewDetailGrid>
            <OrderViewDetailRow
              icon={<ShoppingBag size={16} style={{ color: "#f59e0b" }} />}
              label="Order Number"
              value={viewingOrder.order_number || `ORD-${viewingOrder.id}`}
            />
            {viewingOrder.expected_delivery_date ? (
              <OrderViewDetailRow
                icon={<Calendar size={16} style={{ color: "#f59e0b" }} />}
                label="Expected Delivery"
                value={formatDateForTable(
                  viewingOrder.expected_delivery_date,
                )}
              />
            ) : null}
            {viewingOrder.industry ? (
              <OrderViewDetailRow
                icon={<Building2 size={16} style={{ color: "#f59e0b" }} />}
                label="Industry"
                value={viewingOrder.industry}
              />
            ) : null}
          </OrderViewDetailGrid>
        </OrderViewCard>
      </OrderViewSection>

      <OrderViewSection title="Company Information">
        <OrderViewCard>
          <OrderViewGrid>
            {viewingOrder.customer_name ? (
              <OrderViewField
                label="Company Name"
                value={
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        backgroundColor: getRandomColor(
                          viewingOrder.customer_name,
                        ),
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                        fontWeight: "600",
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(viewingOrder.customer_name)}
                    </div>
                    <span>{viewingOrder.customer_name}</span>
                  </div>
                }
              />
            ) : null}
            {viewingOrder.customer_email ? (
              <OrderViewField
                label="Email"
                value={
                  <>
                    <Mail
                      size={14}
                      style={{
                        color: "#f59e0b",
                        marginRight: "6px",
                        display: "inline",
                      }}
                    />
                    {viewingOrder.customer_email}
                  </>
                }
              />
            ) : null}
            {viewingOrder.customer_phone ? (
              <OrderViewField
                label="Phone"
                value={
                  <PhoneDisplay phone={viewingOrder.customer_phone || ""} />
                }
              />
            ) : null}
            {viewingOrder.customer_address ? (
              <OrderViewField
                label="Address"
                fullWidth
                value={viewingOrder.customer_address}
              />
            ) : null}
          </OrderViewGrid>
        </OrderViewCard>
      </OrderViewSection>

      {orderItems.length > 0 ? (
        <OrderViewSection
          title="Order Items"
          badgeCount={viewingOrder.items.length}
        >
          <OrderViewModalOrderItemsTable
            viewingOrder={viewingOrder}
            hasItemDescriptionColumn={hasItemDescriptionColumn}
            footerColSpan={footerColSpan}
          />
        </OrderViewSection>
      ) : null}
    </div>
  );
}
