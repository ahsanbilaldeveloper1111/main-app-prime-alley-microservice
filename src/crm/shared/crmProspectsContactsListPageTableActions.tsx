import React from "react";
import { FiEdit, FiX, FiCalendar, FiTarget } from "react-icons/fi";
import {
  Eye,
  Trash2,
  MoreVertical,
  Phone as PhoneIcon,
  Mail,
  Tags,
  CheckCircle2,
  PhoneOff,
  PhoneMissed,
  RotateCcw,
} from "lucide-react";
import type { TableAction } from "@components/GenericTable";
import { HEADER_CONSTANTS } from "@constants/headerConstants";

const { PERMISSIONS } = HEADER_CONSTANTS;
import {
  CRM_PERSON_DISPOSITION_OPTIONS,
  getCrmPersonRowDispositionRaw,
} from "@utils/crmPersonDisposition";

/**
 * Outcome a user can record for a previously-scheduled call. Each outcome is
 * written to the prospect's history via `POST /crm/audit-logs` and (except for
 * `rescheduled`) automatically unschedules the call.
 */
export type ScheduledCallOutcome =
  | "completed"
  | "no_answer"
  | "missed"
  | "rescheduled";

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
  /** Right-click / row menu: quick-set disposition (same permission as Edit). */
  onDispositionChange?: (row: any, dispositionValue: string) => void | Promise<void>;
  /**
   * Record an outcome on a scheduled call. Should write a history entry and
   * unschedule the call (handled by `useCrmListSharedCallbacks`).
   */
  onScheduledCallStatusChange?: (
    row: any,
    outcome: ScheduledCallOutcome,
  ) => void | Promise<void>;
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
  onDispositionChange,
  onScheduledCallStatusChange,
}: BuildCrmProspectsContactsTableActionsParams): TableAction<any>[] {
  return [
    ...(session?.user?.permissions?.includes(PERMISSIONS.VIEW_CRM_DATA_MANAGEMENT)
      ? [
          {
            label: "View",
            icon: <Eye size={16} />,
            onClick: (row: any) => handleViewData(row),
            variant: "link" as const,
          },
        ]
      : []),
    ...(session?.user?.permissions?.includes(PERMISSIONS.EDIT_CRM_DATA_MANAGEMENT)
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
    ...(session?.user?.permissions?.includes(PERMISSIONS.EDIT_CRM_DATA_MANAGEMENT) &&
    onDispositionChange
      ? [
          {
            label: "Disposition",
            icon: <Tags size={16} />,
            variant: "link" as const,
            dropdown: {
              align: "end" as const,
              nestInContextMenu: true,
              options: CRM_PERSON_DISPOSITION_OPTIONS.map(
                ({ value, label }) => ({
                  label,
                  onClick: (row: any) => {
                    void onDispositionChange(row, value);
                  },
                  show: (row: any) =>
                    getCrmPersonRowDispositionRaw(row) !== value,
                }),
              ),
            },
          },
        ]
      : []),
    ...(session?.user?.permissions?.includes(
      PERMISSIONS.CALL_SERVICE_CRM_DATA_MANAGEMENT,
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
                  PERMISSIONS.CALL_SERVICE_CRM_DATA_MANAGEMENT,
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
                      ...(onScheduledCallStatusChange
                        ? [
                            {
                              label: "Mark as Completed",
                              icon: <CheckCircle2 size={14} />,
                              onClick: (row: any) =>
                                void onScheduledCallStatusChange(row, "completed"),
                              className: "text-success",
                              show: (row: any) => !!row.scheduled_call_at,
                            },
                            {
                              label: "Mark as No Answer",
                              icon: <PhoneOff size={14} />,
                              onClick: (row: any) =>
                                void onScheduledCallStatusChange(row, "no_answer"),
                              show: (row: any) => !!row.scheduled_call_at,
                            },
                            {
                              label: "Mark as Missed",
                              icon: <PhoneMissed size={14} />,
                              onClick: (row: any) =>
                                void onScheduledCallStatusChange(row, "missed"),
                              show: (row: any) => !!row.scheduled_call_at,
                            },
                            {
                              label: "Mark as Rescheduled",
                              icon: <RotateCcw size={14} />,
                              onClick: (row: any) =>
                                void onScheduledCallStatusChange(row, "rescheduled"),
                              show: (row: any) => !!row.scheduled_call_at,
                            },
                          ]
                        : []),
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
    ...(session?.user?.permissions?.includes(
      PERMISSIONS.DELETE_CRM_DATA_MANAGEMENT,
    )
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
