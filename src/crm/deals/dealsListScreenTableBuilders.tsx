import React from "react";
import {
  TableColumn,
  TableAction,
} from "@components/GenericTable";
import { StatsCardData } from "@components/GenericStatsCards";
import {
  Target,
  Users,
  Calendar,
  XCircle,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  X,
  CheckCircle,
  Paperclip,
  Download as DownloadIcon,
  ShoppingBag,
  RotateCcw,
} from "lucide-react";
import { getInitials, getRandomColor } from "@utils/crmNameAvatar";

/** Stable avatar helpers for deals list / Kanban (module scope avoids per-render identity churn). */
export const DEALS_LIST_KANBAN_AVATAR = {
  getInitials(name: string) {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  },
  getRandomColor(name: string) {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#FFA07A",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E2",
    ];
    const hash = name
      .split("")
      .reduce((acc, char) => acc + (char.codePointAt(0) ?? 0), 0);
    return colors[hash % colors.length];
  },
};

export function buildDealsListStatsCards(
  dealsMetrics: Record<string, number> | null,
  isApprovalsList: boolean,
): StatsCardData[] {
  const m = dealsMetrics || {};
  if (isApprovalsList) {
    return [
      {
        title: "All deals submitted",
        value: m.total_submitted ?? 0,
        icon: Users,
        iconColor: "#6366F1",
        iconBgColor: "#EEF2FF",
        metric: {
          text: `${m.total_submitted_last_7_days ?? 0} in last 7 days`,
          dotColor: "#6366F1",
        },
      },
      {
        title: "Pending Approval",
        value: m.pending_approval ?? 0,
        icon: Calendar,
        iconColor: "#10B981",
        iconBgColor: "#D1FAE5",
        metric: {
          text: `${m.pending_approval_last_7_days ?? 0} in last 7 days`,
          dotColor: "#10B981",
        },
      },
      {
        title: "Approved Deals",
        value: m.approved_deals ?? 0,
        icon: Target,
        iconColor: "#8B5CF6",
        iconBgColor: "#EDE9FE",
        metric: {
          text: `${m.approved_deals_last_7_days ?? 0} in last 7 days`,
          dotColor: "#8B5CF6",
        },
      },
      {
        title: "Rejected Deals",
        value: m.rejected_deals ?? 0,
        icon: XCircle,
        iconColor: "#64748B",
        iconBgColor: "#F1F5F9",
        metric: {
          text: `${m.rejected_deals_last_7_days ?? 0} in last 7 days`,
          dotColor: "#94A3B8",
        },
      },
      {
        title: "High-Value (Pending)",
        value: m.high_value_pending ?? 0,
        icon: Calendar,
        iconColor: "#10B981",
        iconBgColor: "#D1FAE5",
        additionalText: "High-value deals still awaiting approval",
      },
      {
        title: "Recently Reviewed",
        value: m.recently_reviewed_last_24h ?? 0,
        icon: Target,
        iconColor: "#8B5CF6",
        iconBgColor: "#EDE9FE",
        additionalText: "Deals approved or rejected in last 24 hours",
      },
    ];
  }

  const todaysMeetings = m.todays_meetings ?? 0;
  const overdueMeetings = m.overdue_meetings ?? 0;

  return [
    {
      title: "All Deals",
      value: m.total_deals ?? 0,
      icon: Users,
      iconColor: "#6366F1",
      iconBgColor: "#EEF2FF",
      subtitle: `${m.won_deals ?? 0} Won / ${m.lost_deals ?? 0} Lost`,
    },
    {
      title: "High-Value Deals",
      value: m.high_value_deals ?? 0,
      icon: Calendar,
      iconColor: "#10B981",
      iconBgColor: "#D1FAE5",
      additionalText: "Client-defined threshold",
    },
    {
      title: "At-Risk Deals",
      value: m.at_risk_deals ?? 0,
      icon: Target,
      iconColor: "#8B5CF6",
      iconBgColor: "#EDE9FE",
      additionalText: "Expected closed date slipped.",
    },
    {
      title: "Deals Won",
      value: m.won_deals ?? 0,
      icon: Users,
      iconColor: "#6366F1",
      iconBgColor: "#EEF2FF",
      metric: {
        text: `${m.won_deals_last_7_days ?? 0} in last 7 days`,
        dotColor: "#6366F1",
      },
    },
    {
      title: "Today's Follow-ups",
      value: m.todays_follow_ups ?? 0,
      icon: Calendar,
      iconColor: "#10B981",
      iconBgColor: "#D1FAE5",
      metric: {
        text: `${m.todays_follow_ups ?? 0} Follow-ups / ${todaysMeetings} Meeting${
          todaysMeetings === 1 ? "" : "s"
        }`,
        dotColor: "#10B981",
      },
    },
    {
      title: "Overdue",
      value: m.overdue_total ?? 0,
      icon: Target,
      iconColor: "#8B5CF6",
      iconBgColor: "#EDE9FE",
      metric: {
        text: `${m.overdue_follow_ups ?? 0} Follow-ups / ${overdueMeetings} Meeting${
          overdueMeetings === 1 ? "" : "s"
        }`,
        dotColor: "#8B5CF6",
      },
    },
  ];
}

export function buildDealsListTableColumns(
  isApprovalsList: boolean,
): TableColumn<any>[] {
  if (isApprovalsList) {
    return [
      {
        key: "name",
        label: "Deal Name",
        sortable: true,
        type: "avatar",
        avatar: {
          getInitials: (row) => getInitials(row.name),
          getColor: (row) => getRandomColor(row.name),
        },
        emptyValue: "N/A",
      },
      {
        key: "company",
        label: "Company",
        sortable: true,
        type: "multi-field",
        fields: {
          primary: "company",
          secondary: "industry",
          secondaryClass: "text-muted small",
        },
        emptyValue: "No Company",
      },
      {
        key: "stage",
        label: "Stage",
        sortable: true,
        type: "custom",
        render: (row) => (
          <span
            style={{ backgroundColor: row?.stageColor || "grey" }}
            className="badge"
          >
            {row?.stage}
          </span>
        ),
      },
      {
        key: "approvalStatus",
        label: "Approval Status",
        sortable: true,
        type: "text",
        emptyValue: "-",
      },
      {
        key: "dealType",
        label: "Deal Type",
        sortable: true,
        type: "badge",
        badge: {
          getVariant: () => "primary",
        },
        emptyValue: "-",
      },
      {
        key: "value",
        label: "Value",
        sortable: true,
        type: "custom",
        render: (row) => (
          <span className="fw-semibold">
            {row.currency}{" "}
            {Number.parseFloat(String(row.value)).toLocaleString()}
          </span>
        ),
      },
      {
        key: "closeDate",
        label: "Expected Close",
        sortable: true,
        type: "text",
        accessor: (row) => row.closeDate || "-",
        emptyValue: "-",
      },
      {
        key: "followUpDate",
        label: "Follow-up Date",
        sortable: true,
        type: "text",
        accessor: (row) => row.followUpDate || "-",
        emptyValue: "-",
      },
      {
        key: "owner",
        label: "Associate with",
        sortable: true,
        type: "text",
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
        key: "created",
        label: "Created",
        sortable: true,
        type: "text",
        emptyValue: "-",
      },
    ];
  }

  return [
    {
      key: "name",
      label: "Deal Name",
      sortable: true,
      type: "avatar",
      avatar: {
        getInitials: (row) => DEALS_LIST_KANBAN_AVATAR.getInitials(row.name),
        getColor: (row) => DEALS_LIST_KANBAN_AVATAR.getRandomColor(row.name),
      },
      emptyValue: "N/A",
    },
    {
      key: "company",
      label: "Company",
      sortable: true,
      type: "multi-field",
      fields: {
        primary: "company",
        secondary: "industry",
        secondaryClass: "text-muted small",
      },
      emptyValue: "No Company",
    },
    {
      key: "ticketId",
      label: "Ticket ID",
      sortable: true,
      type: "text",
      emptyValue: "-",
    },
    {
      key: "stage",
      label: "Stage",
      sortable: true,
      type: "custom",
      render: (row) => (
        <span
          style={{ backgroundColor: row?.stageColor || "grey" }}
          className="badge"
        >
          {row?.stage}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      type: "text",
      accessor: () => "pending",
      emptyValue: "pending",
    },
    {
      key: "approvalStatus",
      label: "Approval Status",
      sortable: true,
      type: "text",
      emptyValue: "",
    },
    {
      key: "value",
      label: "Value",
      sortable: true,
      type: "custom",
      render: (row) => (
        <span className="fw-semibold">
          {row.currency}{" "}
          {Number.parseFloat(String(row.value)).toLocaleString()}
        </span>
      ),
    },
    {
      key: "closeDate",
      label: "Expected Close",
      sortable: true,
      type: "text",
      accessor: (row) => row.closeDate || "-",
      emptyValue: "-",
    },
    {
      key: "followUpDate",
      label: "Follow-up Date",
      sortable: true,
      type: "text",
      accessor: (row) => row.followUpDate || "-",
      emptyValue: "-",
    },
    {
      key: "owner",
      label: "Created By",
      sortable: true,
      type: "text",
      emptyValue: "-",
    },
    {
      key: "assignedUser",
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

export type DealsListTableActionsDeps = Readonly<{
  activeFilter: string;
  session: { user?: { permissions?: string[] } } | null;
  isApprovalsList: boolean;
  handlePreviewClick: (row: any) => void;
  handleEditDeal: (dealId: number) => void;
  handleRestoreDeal: (id: number) => void;
  handleDeleteDeal: (id: number, name: string) => void;
  handleMarkLost: (row: any) => void;
  handleApproveDeal: (row: any) => void;
  handleRejectDeal: (row: any) => void;
  handleDownloadDeal: (id: number) => void;
  setSelectedDealForAttachments: (row: any) => void;
  setShowAttachmentModal: (open: boolean) => void;
  setDealToConvert: (id: number | null) => void;
  setShowConvertToOrderModal: (open: boolean) => void;
}>;

export function buildDealsListTableActions(
  d: DealsListTableActionsDeps,
): TableAction<any>[] {
  const {
    activeFilter,
    session,
    isApprovalsList,
    handlePreviewClick,
    handleEditDeal,
    handleRestoreDeal,
    handleDeleteDeal,
    handleMarkLost,
    handleApproveDeal,
    handleRejectDeal,
    handleDownloadDeal,
    setSelectedDealForAttachments,
    setShowAttachmentModal,
    setDealToConvert,
    setShowConvertToOrderModal,
  } = d;

  if (activeFilter === "deleted") {
    return [
      {
        label: "View",
        icon: <Eye size={16} />,
        onClick: (row: any) => handlePreviewClick(row),
        variant: "link" as const,
      },
      {
        label: "Restore",
        icon: <RotateCcw size={16} />,
        onClick: (row: any) => handleRestoreDeal(row.rawData?.id || row.id),
        variant: "link" as const,
        className: "text-success",
      },
    ];
  }

  return [
    {
      label: "View",
      icon: <Eye size={16} />,
      onClick: (row: any) => handlePreviewClick(row),
      variant: "link" as const,
    },
    ...(session?.user?.permissions?.includes("edit-crm-deals")
      ? [
          {
            label: "Edit",
            icon: <Edit size={16} />,
            onClick: (row: any) => {
              if (activeFilter !== "lost") {
                handleEditDeal(row.rawData?.id || row.id);
              }
            },
            variant: "link" as const,
            show: () => activeFilter !== "lost",
          },
        ]
      : []),
    {
      label: "Attachments",
      icon: <Paperclip size={16} />,
      onClick: (row: any) => {
        setSelectedDealForAttachments(row.rawData || row);
        setShowAttachmentModal(true);
      },
      variant: "link" as const,
      className: "text-info",
    },
    ...(!isApprovalsList &&
    session?.user?.permissions?.includes("download-document-crm-deals")
      ? [
          {
            label: "Download",
            icon: <DownloadIcon size={16} />,
            onClick: (row: any) => {
              handleDownloadDeal(row.rawData?.id || row.id);
            },
            variant: "link" as const,
            className: "text-secondary",
            show: (row: any) =>
              (row.rawData?.approval_status ?? row.approval_status) ===
              "approved",
          },
        ]
      : []),
    ...(session?.user?.permissions?.includes("add-crm-orders")
      ? [
          {
            label: "Convert to Order",
            icon: <ShoppingBag size={16} />,
            onClick: (row: any) => {
              setDealToConvert(row.rawData?.id || row.id);
              setShowConvertToOrderModal(true);
            },
            variant: "link" as const,
            className: "text-success",
            disabled: (row: any) =>
              (row.rawData?.approval_status ?? row.approval_status) !==
              "approved",
            disabledClassName: "text-muted",
            disabledTitle: "Only approved deals can be converted to orders",
          },
        ]
      : []),
    ...(session?.user?.permissions?.includes("delete-crm-deals")
      ? [
          {
            label: "Delete",
            icon: <Trash2 size={16} />,
            onClick: (row: any) =>
              handleDeleteDeal(row.rawData?.id || row.id, row.name),
            variant: "link" as const,
            className: "text-danger",
          },
        ]
      : []),
    ...(activeFilter === "lost"
      ? []
      : [
          {
            label: "More Actions",
            icon: <MoreVertical size={16} />,
            variant: "link" as const,
            dropdown: {
              align: "end" as const,
              options: [
                {
                  label: "Mark as Lost",
                  icon: <X size={14} />,
                  onClick: (row: any) => handleMarkLost(row.rawData || row),
                  className: "text-danger",
                },
                ...(isApprovalsList &&
                session?.user?.permissions?.includes("approve-reject-crm-deals")
                  ? [
                      {
                        label: "Approve",
                        icon: <CheckCircle size={14} />,
                        onClick: (row: any) => {
                          handleApproveDeal(row.rawData || row);
                        },
                        className: "text-success",
                        show: (row: any) =>
                          (row.rawData?.approval_status ??
                            row.approval_status) === "pending",
                      },
                      {
                        label: "Reject",
                        icon: <XCircle size={14} />,
                        onClick: (row: any) => {
                          handleRejectDeal(row.rawData || row);
                        },
                        className: "text-danger",
                        show: (row: any) =>
                          (row.rawData?.approval_status ??
                            row.approval_status) === "pending",
                      },
                    ]
                  : []),
              ],
            },
          },
        ]),
  ];
}
