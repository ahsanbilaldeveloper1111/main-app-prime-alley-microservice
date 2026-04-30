import React from "react";
import { Badge } from "@crm/orders/orderListBootstrap";
import type { TableAction, TableColumn } from "@crm/orders/orderListOrderPageFrame";
import {
  Edit,
  Eye,
  MoreVertical,
  Paperclip,
  RotateCcw,
  Trash2,
  X,
} from "@crm/orders/orderListLucideHeavy";
import { getInitials, getRandomColor } from "@crm/orders/orderListOrderPageShared";
import {
  fulfillmentBadgeVariant,
  orderApprovalBadgeVariant,
  paymentBadgeVariant,
} from "../crmOrdersPlannerOrderDisplayHelpers";

export function plannerGetOrderRowNumericId(row: any): number {
  return Number(row?.rawData?.id || row?.id || 0);
}

export function plannerBuildOrdersRowActions(params: {
  activeFilter: string;
  canEdit: boolean;
  canDelete: boolean;
  onViewOrder: (orderId: number) => void | Promise<void>;
  onRestoreOrder: (orderId: number) => void | Promise<void>;
  onEditOrder: (row: any) => void;
  onOpenAttachments: (row: any) => void;
  onDeleteOrder: (orderId: number, orderNumber?: string) => void;
  onMarkLost: (row: any) => void;
}): TableAction<any>[] {
  if (params.activeFilter === "deleted") {
    return [
      {
        label: "View",
        icon: <Eye size={16} />,
        onClick: (row: any) => params.onViewOrder(plannerGetOrderRowNumericId(row)),
        variant: "link",
      },
      {
        label: "Restore",
        icon: <RotateCcw size={16} />,
        onClick: (row: any) => params.onRestoreOrder(plannerGetOrderRowNumericId(row)),
        variant: "link",
        className: "text-success",
      },
    ];
  }

  const actions: TableAction<any>[] = [
    {
      label: "View",
      icon: <Eye size={16} />,
      onClick: (row: any) => params.onViewOrder(plannerGetOrderRowNumericId(row)),
      variant: "link",
    },
    {
      label: "Attachments",
      icon: <Paperclip size={16} />,
      onClick: (row: any) => params.onOpenAttachments(row),
      variant: "link",
      className: "text-info",
    },
  ];

  if (params.canEdit) {
    actions.splice(1, 0, {
      label: "Edit",
      icon: <Edit size={16} />,
      onClick: (row: any) => params.onEditOrder(row),
      variant: "link",
    });
  }

  if (params.canDelete) {
    actions.push({
      label: "Delete",
      icon: <Trash2 size={16} />,
      onClick: (row: any) =>
        params.onDeleteOrder(plannerGetOrderRowNumericId(row), row.orderNumber),
      variant: "link",
      className: "text-danger",
    });
  }

  if (params.activeFilter !== "lost") {
    actions.push({
      label: "More Actions",
      icon: <MoreVertical size={16} />,
      variant: "link",
      dropdown: {
        align: "end",
        options: [
          {
            label: "Mark as Lost",
            icon: <X size={14} />,
            onClick: (row: any) => params.onMarkLost(row.rawData || row),
            className: "text-danger",
          },
        ],
      },
    });
  }

  return actions;
}

function plannerBuildOrdersTableColumnDefs(): TableColumn<any>[] {
  return [
    {
      key: "orderNumber",
      label: "Order Number",
      sortable: true,
      type: "text",
      emptyValue: "-",
    },
    {
      key: "customer",
      label: "Company",
      sortable: true,
      type: "multi-field",
      fields: {
        primary: "customer",
        secondary: "customerEmail",
        secondaryClass: "text-muted small",
      },
      render: (row: any) => (
        <div className="d-flex align-items-center gap-2">
          {row.customer ? (
            <>
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  backgroundColor: getRandomColor(row.customer),
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: "600",
                  flexShrink: 0,
                }}
              >
                {getInitials(row.customer)}
              </div>
              <div>
                <div className="fw-medium">{row.customer}</div>
                {row.customerEmail ? (
                  <small className="text-muted">{row.customerEmail}</small>
                ) : null}
              </div>
            </>
          ) : (
            <div>No Company</div>
          )}
        </div>
      ),
      emptyValue: "No Company",
    },
    {
      key: "deal",
      label: "Linked Deal",
      sortable: true,
      type: "text",
      accessor: (row: any) => row.deal || "No Deal",
      emptyValue: "No Deal",
    },
    {
      key: "stage",
      label: "Stage",
      sortable: true,
      type: "custom",
      render: (row: any) => (
        <span style={{ backgroundColor: row?.stageColor || "grey" }} className="badge">
          {row.stage}
        </span>
      ),
    },
    {
      key: "value",
      label: "Value",
      sortable: true,
      type: "custom",
      render: (row: any) => (
        <span className="fw-semibold">
          {row.currency} {Number.parseFloat(String(row.value)).toLocaleString()}
        </span>
      ),
    },
    {
      key: "approvalStatus",
      label: "Approval",
      sortable: true,
      type: "custom",
      render: (row: any) => (
        <Badge bg={orderApprovalBadgeVariant(row.approvalStatus)}>{row.approvalStatus}</Badge>
      ),
      emptyValue: "-",
    },
    {
      key: "fulfillmentStatus",
      label: "Fulfillment",
      sortable: true,
      type: "custom",
      render: (row: any) => (
        <Badge bg={fulfillmentBadgeVariant(row.fulfillmentStatus)}>
          {row.fulfillmentStatus}
        </Badge>
      ),
      emptyValue: "-",
    },
    {
      key: "paymentStatus",
      label: "Payment",
      sortable: true,
      type: "custom",
      render: (row: any) => (
        <Badge bg={paymentBadgeVariant(row.paymentStatus)}>{row.paymentStatus}</Badge>
      ),
      emptyValue: "-",
    },
    {
      key: "assignedUser",
      label: "Assigned To",
      sortable: true,
      type: "text",
      emptyValue: "-",
    },
    {
      key: "orderDate",
      label: "Order Date",
      sortable: true,
      type: "text",
      emptyValue: "-",
    },
    {
      key: "owner",
      label: "Owner",
      sortable: true,
      type: "text",
      emptyValue: "-",
    },
    {
      key: "created",
      label: "Created",
      sortable: true,
      type: "text",
      emptyValue: "-",
    },
  ];
}

export const PLANNER_CRM_ORDERS_TABLE_COLUMNS = plannerBuildOrdersTableColumnDefs();
