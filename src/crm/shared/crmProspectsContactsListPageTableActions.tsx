import React from "react";
import { FiEdit, FiX, FiCalendar, FiTarget } from "react-icons/fi";
import {
  Eye,
  Trash2,
  MoreVertical,
  Phone as PhoneIcon,
  Mail,
} from "lucide-react";
import type { TableAction } from "@components/GenericTable";

export type BuildCrmProspectsContactsTableActionsParams = {
  session: { user?: { permissions?: string[] } } | null;
  activeFilter: string;
  handleViewData: (row: any) => void;
  handleCallClick: (row: any) => void;
  handleScheduleCall: (row: any) => void;
  handleUnscheduleCallClick: (row: any) => void;
  setEditingContactId: (id: number | null) => void;
  setShowCreateContactSidebar: (open: boolean) => void;
  setConvertingToLeadCrmRecordId: (id: number | null) => void;
  setShowConvertToLeadModal: (open: boolean) => void;
  setDeleteModalMode: (mode: "single" | "bulk" | null) => void;
  setItemToDelete: (row: any) => void;
  setShowDeleteModal: (open: boolean) => void;
};

export function buildCrmProspectsContactsTableActions({
  session,
  activeFilter,
  handleViewData,
  handleCallClick,
  handleScheduleCall,
  handleUnscheduleCallClick,
  setEditingContactId,
  setShowCreateContactSidebar,
  setConvertingToLeadCrmRecordId,
  setShowConvertToLeadModal,
  setDeleteModalMode,
  setItemToDelete,
  setShowDeleteModal,
}: BuildCrmProspectsContactsTableActionsParams): TableAction<any>[] {
  return [
    ...(session?.user?.permissions?.includes("view-crm-data-management")
      ? [
          {
            label: "View",
            icon: <Eye size={16} />,
            onClick: (row: any) => handleViewData(row),
            variant: "link" as const,
          },
        ]
      : []),
    ...(session?.user?.permissions?.includes("view-crm-data-management")
      ? [
          {
            label: "Edit",
            icon: <FiEdit size={16} />,
            onClick: (row: any) => {
              setEditingContactId(row.id);
              setShowCreateContactSidebar(true);
            },
            variant: "link" as const,
          },
        ]
      : []),
    ...(session?.user?.permissions?.includes(
      "call-service-crm-data-management",
    )
      ? [
          {
            label: "Call",
            icon: <PhoneIcon size={16} />,
            onClick: (row: any) => handleCallClick(row),
            variant: "link" as const,
            className: "text-success",
          },
        ]
      : []),
    ...(activeFilter === "has_leads"
      ? []
      : [
          {
            label: "More Actions",
            icon: <MoreVertical size={16} />,
            variant: "link" as const,
            dropdown: {
              align: "end" as const,
              options: [
                ...(session?.user?.permissions?.includes(
                  "call-service-crm-data-management",
                )
                  ? [
                      {
                        label: "Schedule Call",
                        icon: <FiCalendar size={14} />,
                        onClick: (row: any) => handleScheduleCall(row),
                        show: (row: any) => !row.scheduled_call_at,
                      },
                      {
                        label: "Edit Scheduled Call",
                        icon: <FiCalendar size={14} />,
                        onClick: (row: any) => handleScheduleCall(row),
                        show: (row: any) => !!row.scheduled_call_at,
                      },
                      {
                        label: "Unschedule Call",
                        icon: <FiX size={14} />,
                        onClick: (row: any) => handleUnscheduleCallClick(row),
                        className: "text-danger",
                        show: (row: any) => !!row.scheduled_call_at,
                        divider: true,
                      },
                    ]
                  : []),
                {
                  label: "Convert to Lead",
                  icon: <FiTarget size={14} />,
                  onClick: (row: any) => {
                    setConvertingToLeadCrmRecordId(row.id);
                    setShowConvertToLeadModal(true);
                  },
                },
                {
                  label: "Send Email",
                  icon: <Mail size={14} />,
                  onClick: (row: any) => {
                    globalThis.location.href = `mailto:${row.email}`;
                  },
                  show: (row: any) => !!row.email,
                },
              ],
            },
          },
        ]),
    ...(session?.user?.permissions?.includes("delete-crm-data-management")
      ? [
          {
            label: "Delete",
            icon: <Trash2 size={16} />,
            onClick: (row: any) => {
              setDeleteModalMode("single");
              setItemToDelete(row);
              setShowDeleteModal(true);
            },
            variant: "link" as const,
            className: "text-danger",
          },
        ]
      : []),
  ];
}
