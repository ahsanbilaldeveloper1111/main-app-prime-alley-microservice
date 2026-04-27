import React from "react";
import { formatDateForTable } from "@utils/Helper";
import {
  Target,
  ShoppingBag,
  FileText,
  History,
  Calendar,
  Mail,
  Phone,
  Building2,
  Link2,
  User,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { extensionLabelForAssignedTo } from "./orderInvoicingExtensionLabel";
import {
  fulfillmentBadgeVariant,
  leadPotentialBadgeVariant,
  orderApprovalBadgeVariant,
  orderListStatusBadgeVariant,
  paymentStatusBadgeVariant,
} from "./CrmOrderViewModal/orderViewModalUtils";

function OrderSidebarHistoryContent({
  histories,
}: Readonly<{ histories: any[] }>) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {histories.map((history: any, idx: number) => (
        <div
          key={history.id || idx}
          style={{
            padding: "16px",
            backgroundColor: "#f9fafb",
            borderRadius: "10px",
            border: "1px solid #f3f4f6",
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: "#111827",
              marginBottom: "6px",
            }}
          >
            {history.action || "Activity"}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#6b7280",
              marginBottom: "4px",
            }}
          >
            by{" "}
            {history.user?.name || history.created_by || "System"}
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "#9ca3af",
            }}
          >
            {history.created_at
              ? formatDateForTable(history.created_at)
              : "N/A"}
          </div>
          {history.description ? (
            <div
              style={{
                marginTop: "8px",
                fontSize: "12px",
                color: "#4b5563",
                fontStyle: "italic",
              }}
            >
              {history.description}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function finalAmountDisplay(viewingOrder: any): string {
  if (!(viewingOrder?.final_amount || viewingOrder?.total_amount)) {
    return "N/A";
  }
  const amount = viewingOrder.final_amount || viewingOrder.total_amount;
  const cur = viewingOrder?.currency || "AED";
  return `${cur} ${Number.parseFloat(String(amount)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function buildOrderInvoicingGeneralTab(viewingOrder: any) {
  return {
    id: "general",
    label: "General Information",
    sections: [
      {
        id: "order-info",
        title: "Order Information",
        icon: ShoppingBag,
        fields: [
          {
            label: "Order Number",
            value:
              viewingOrder?.order_number ||
              `ORD-${viewingOrder?.id}` ||
              "N/A",
            type: "text" as const,
          },
          {
            label: "Stage",
            value: viewingOrder?.stage?.name || "Not assigned",
            type: "badge" as const,
            badgeVariant: "secondary",
            show: !!viewingOrder?.stage,
          },
          {
            label: "Status",
            value: viewingOrder?.status || "N/A",
            type: "badge" as const,
            badgeVariant: orderListStatusBadgeVariant(viewingOrder?.status),
          },
          {
            label: "Final Amount",
            value: finalAmountDisplay(viewingOrder),
            type: "text" as const,
            icon: DollarSign,
          },
          {
            label: "Order Date",
            value: viewingOrder?.order_date,
            type: "date" as const,
            icon: Calendar,
            show: !!viewingOrder?.order_date,
          },
          {
            label: "Expected Delivery",
            value: viewingOrder?.expected_delivery_date,
            type: "date" as const,
            icon: Calendar,
            show: !!viewingOrder?.expected_delivery_date,
          },
          {
            label: "Industry",
            value: viewingOrder?.industry || "N/A",
            type: "text" as const,
            show: !!viewingOrder?.industry,
          },
        ],
      },
      {
        id: "customer-info",
        title: "Company Information",
        icon: User,
        fields: [
          {
            label: "Company Name",
            value: viewingOrder?.customer_name || "N/A",
            type: "text" as const,
            icon: Building2,
          },
          {
            label: "Email",
            value: viewingOrder?.customer_email || "N/A",
            type: "text" as const,
            icon: Mail,
            show: !!viewingOrder?.customer_email,
          },
          {
            label: "Phone",
            value: viewingOrder?.customer_phone || "N/A",
            type: "text" as const,
            icon: Phone,
            show: !!viewingOrder?.customer_phone,
          },
          {
            label: "Address",
            value: viewingOrder?.customer_address || "N/A",
            type: "text" as const,
            show: !!viewingOrder?.customer_address,
          },
        ],
      },
    ],
  };
}

function dealValueDisplay(relatedDeal: any): string {
  if (!(relatedDeal?.net_value || relatedDeal?.grand_total)) {
    return "N/A";
  }
  const raw = relatedDeal.net_value || relatedDeal.grand_total;
  const cur = relatedDeal?.currency || "AED";
  return `${cur} ${Number.parseFloat(String(raw)).toLocaleString()}`;
}

export function buildOrderInvoicingLeadDealTab(
  relatedDeal: any,
  relatedLead: any,
  extensions: any[],
) {
  const sections: any[] = [];

  if (relatedDeal) {
    sections.push({
      id: "deal-info",
      title: "Deal Information",
      icon: Link2,
      fields: [
        {
          label: "Deal Name",
          value: relatedDeal?.name || "N/A",
          type: "text" as const,
        },
        {
          label: "Stage",
          value: relatedDeal?.stage?.name || "Not assigned",
          type: "badge" as const,
          badgeVariant: "primary",
          show: !!relatedDeal?.stage,
        },
        {
          label: "Deal Value",
          value: dealValueDisplay(relatedDeal),
          type: "text" as const,
          icon: DollarSign,
          show: !!(relatedDeal?.net_value || relatedDeal?.grand_total),
        },
        {
          label: "Assigned To",
          value: extensionLabelForAssignedTo(
            extensions,
            relatedDeal?.assigned_to,
          ) || "Not assigned",
          type: "text" as const,
          icon: User,
          show: !!relatedDeal?.assigned_to,
        },
        {
          label: "Created Date",
          value: relatedDeal?.created_at,
          type: "date" as const,
          icon: Calendar,
          show: !!relatedDeal?.created_at,
        },
      ],
    });
  }

  if (relatedDeal?.company_name) {
    sections.push({
      id: "deal-company-info",
      title: "Deal Company Information",
      icon: Building2,
      fields: [
        {
          label: "Company Name",
          value: relatedDeal?.company_name || "N/A",
          type: "text" as const,
          icon: Building2,
        },
        {
          label: "Industry",
          value: relatedDeal?.industry || "N/A",
          type: "text" as const,
          show: !!relatedDeal?.industry,
        },
      ],
    });
  }

  if (relatedLead) {
    sections.push({
      id: "lead-info",
      title: "Lead Information",
      icon: Target,
      fields: [
        {
          label: "Lead Name",
          value: relatedLead?.name || "N/A",
          type: "text" as const,
        },
        {
          label: "Stage",
          value: relatedLead?.stage?.name || "Not assigned",
          type: "badge" as const,
          badgeVariant: "primary",
          show: !!relatedLead?.stage,
        },
        {
          label: "Lead Potential",
          value: relatedLead?.lead_potential || "N/A",
          type: "badge" as const,
          badgeVariant: leadPotentialBadgeVariant(relatedLead?.lead_potential),
          show: !!relatedLead?.lead_potential,
        },
        {
          label: "Status",
          value: relatedLead?.status || "N/A",
          type: "text" as const,
          show: !!relatedLead?.status,
        },
        {
          label: "Assigned To",
          value:
            extensionLabelForAssignedTo(
              extensions,
              relatedLead?.assigned_to,
            ) || "Not assigned",
          type: "text" as const,
          icon: User,
          show: !!relatedLead?.assigned_to,
        },
        {
          label: "Created Date",
          value: relatedLead?.created_at,
          type: "date" as const,
          icon: Calendar,
          show: !!relatedLead?.created_at,
        },
      ],
    });
  }

  if (relatedLead?.campaign) {
    sections.push({
      id: "campaign-info",
      title: "Campaign Information",
      icon: FileText,
      fields: [
        {
          label: "Campaign Name",
          value: relatedLead?.campaign?.name || "N/A",
          type: "text" as const,
        },
      ],
    });
  }

  if (relatedLead?.crm_data) {
    sections.push({
      id: "prospect-info",
      title: "Prospect Information",
      icon: User,
      fields: [
        {
          label: "CRM Data ID",
          value: relatedLead?.crm_data?.id
            ? `#${relatedLead.crm_data.id}`
            : "N/A",
          type: "text" as const,
          show: !!relatedLead?.crm_data?.id,
        },
        {
          label: "Name",
          value:
            relatedLead?.crm_data?.name ||
            relatedLead?.crm_data?.data?.name ||
            "N/A",
          type: "text" as const,
        },
        {
          label: "Phone",
          value:
            relatedLead?.crm_data?.phone ||
            relatedLead?.crm_data?.data?.phone ||
            "N/A",
          type: "text" as const,
          icon: Phone,
        },
        {
          label: "Source File",
          value: relatedLead?.crm_data?.source_file || "N/A",
          type: "text" as const,
          show: !!relatedLead?.crm_data?.source_file,
        },
        {
          label: "Uploaded By",
          value: relatedLead?.crm_data?.uploaded_by || "N/A",
          type: "text" as const,
          icon: User,
          show: !!relatedLead?.crm_data?.uploaded_by,
        },
        {
          label: "Created At",
          value: relatedLead?.crm_data?.created_at,
          type: "date" as const,
          icon: Calendar,
          show: !!relatedLead?.crm_data?.created_at,
        },
      ],
    });
  }

  if (!relatedDeal && !relatedLead) {
    sections.push({
      id: "no-info",
      title: "No Information Available",
      icon: AlertCircle,
      emptyState: {
        icon: AlertCircle,
        message: "No deal or lead information available for this order",
      },
    });
  }

  return {
    id: "lead-deal",
    label: "Lead/Deal Information",
    sections,
  };
}

export function buildOrderInvoicingAdditionalTab(
  viewingOrder: any,
  extensions: any[],
) {
  const hasNotes = Boolean(viewingOrder?.notes);
  return {
    id: "additional-info",
    label: "Additional Information",
    sections: [
      {
        id: "additional-details",
        title: "Additional Information",
        icon: FileText,
        fields: [
          {
            label: "Approval Status",
            value: viewingOrder?.order_approval_status || "Not Set",
            type: "badge" as const,
            badgeVariant: orderApprovalBadgeVariant(
              viewingOrder?.order_approval_status,
            ),
          },
          {
            label: "Fulfillment Status",
            value: viewingOrder?.fulfillment_status || "Not Set",
            type: "badge" as const,
            badgeVariant: fulfillmentBadgeVariant(
              viewingOrder?.fulfillment_status,
            ),
          },
          {
            label: "Payment Status",
            value: viewingOrder?.payment_status || "Not Set",
            type: "badge" as const,
            badgeVariant: paymentStatusBadgeVariant(
              viewingOrder?.payment_status,
            ),
          },
          {
            label: "Assigned To",
            value:
              extensionLabelForAssignedTo(
                extensions,
                viewingOrder?.assigned_to,
              ) || "Not assigned",
            type: "text" as const,
            icon: User,
            show: !!viewingOrder?.assigned_to,
          },
          {
            label: "Contract Length",
            value: viewingOrder?.contract_length || "N/A",
            type: "text" as const,
            show: !!viewingOrder?.contract_length,
          },
        ],
      },
      {
        id: "notes",
        title: "Notes",
        icon: FileText,
        fields: hasNotes
          ? [
              {
                label: "Notes",
                value: viewingOrder?.notes,
                type: "text" as const,
              },
            ]
          : [],
        emptyState: hasNotes
          ? undefined
          : {
              icon: FileText,
              message: "No notes available",
            },
      },
    ],
  };
}

export function buildOrderInvoicingHistoryTab(viewingOrder: any) {
  const histories = viewingOrder?.histories;
  const hasHistories = Array.isArray(histories) && histories.length > 0;
  return {
    id: "history",
    label: "History",
    sections: [
      {
        id: "activity-history",
        title: "Activity History",
        icon: History,
        badge: {
          value: histories?.length || 0,
          variant: "secondary",
        },
        emptyState: hasHistories
          ? undefined
          : {
              icon: History,
              message: "No activity history yet",
            },
        customContent: hasHistories ? (
          <OrderSidebarHistoryContent histories={histories} />
        ) : undefined,
      },
    ],
  };
}
