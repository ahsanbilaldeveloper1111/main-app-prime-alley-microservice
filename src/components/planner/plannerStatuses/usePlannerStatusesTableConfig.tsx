import React, { useMemo } from "react";
import { Badge } from "react-bootstrap";
import { Edit, MoreVertical, Trash2 } from "lucide-react";
import type { TableColumn, TableAction } from "@components/GenericTable";
import { PlannerColorTableCell } from "@planner/PlannerColorTableCell";
import type { PlannerWorkPlannerStatusRow } from "./plannerStatusesDomain";
import "./plannerStatuses.scss";

export type PlannerStatusesTableConfigParams = Readonly<{
  canUpdateGlobalStatus: boolean;
  canDeleteGlobalStatus: boolean;
  onEdit: (row: PlannerWorkPlannerStatusRow) => void;
  onDelete: (row: PlannerWorkPlannerStatusRow) => void;
}>;

export function usePlannerStatusesTableConfig({
  canUpdateGlobalStatus,
  canDeleteGlobalStatus,
  onEdit,
  onDelete,
}: PlannerStatusesTableConfigParams): {
  columns: TableColumn<PlannerWorkPlannerStatusRow>[];
  actions: TableAction<PlannerWorkPlannerStatusRow>[];
} {
  const columns = useMemo<TableColumn<PlannerWorkPlannerStatusRow>[]>(
    () => [
      {
        key: "name",
        label: "Name",
        sortable: true,
        accessor: (row) => row.name,
        render: (row) => <span className="fw-semibold">{row.name}</span>,
      },
      {
        key: "color",
        label: "Color",
        sortable: true,
        accessor: (row) => row.color,
        render: (row) => (
          <div className="wps-color-cell">
            <PlannerColorTableCell color={row.color} variant="barWide" />
          </div>
        ),
      },
      {
        key: "order",
        label: "Order",
        sortable: true,
        accessor: (row) => row.order ?? 0,
      },
      {
        key: "is_default",
        label: "Default",
        sortable: true,
        accessor: (row) => row.is_default,
        render: (row) =>
          row.is_default ? <Badge bg="success">Yes</Badge> : <Badge bg="secondary">No</Badge>,
      },
      {
        key: "is_completed",
        label: "Completed",
        sortable: true,
        accessor: (row) => row.is_completed,
        render: (row) =>
          row.is_completed ? <Badge bg="success">Yes</Badge> : <Badge bg="secondary">No</Badge>,
      },
    ],
    [],
  );

  const actions = useMemo<TableAction<PlannerWorkPlannerStatusRow>[]>(() => {
    if (!canUpdateGlobalStatus && !canDeleteGlobalStatus) return [];
    return [
      {
        label: "Actions",
        icon: <MoreVertical size={16} />,
        dropdown: {
          options: [
            ...(canUpdateGlobalStatus
              ? [
                  {
                    label: "Edit",
                    icon: <Edit size={14} />,
                    onClick: (row: PlannerWorkPlannerStatusRow) => onEdit(row),
                  },
                ]
              : []),
            ...(canDeleteGlobalStatus
              ? [
                  {
                    label: "Delete",
                    icon: <Trash2 size={14} />,
                    onClick: (row: PlannerWorkPlannerStatusRow) => onDelete(row),
                    className: "text-danger",
                    divider: true,
                  },
                ]
              : []),
          ],
          align: "end" as const,
        },
      },
    ];
  }, [canUpdateGlobalStatus, canDeleteGlobalStatus, onEdit, onDelete]);

  return { columns, actions };
}
