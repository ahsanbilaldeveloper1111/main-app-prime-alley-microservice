import type { TableColumn } from "@components/GenericTable";
import {
  CrmTableRowActions,
  type CrmTableRowAction,
} from "@page-modules/crm/shared/CrmTableRowActions";
import React from "react";

export function SettingsEmbeddedTableWrap({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="smart-crm-table-page">{children}</div>;
}

/** Appends a centered Actions column using Ranks / Smart CRM row action buttons. */
export function appendSettingsActionsColumn<T>(
  columns: TableColumn<T>[],
  buildRowActions: (row: T) => readonly CrmTableRowAction[],
  options?: Readonly<{ width?: string; label?: string }>,
): TableColumn<T>[] {
  return [
    ...columns,
    {
      key: "actions",
      label: options?.label ?? "Actions",
      sortable: false,
      align: "center",
      type: "custom",
      width: options?.width ?? "160px",
      render: (row: T) => {
        const actions = buildRowActions(row);
        return <CrmTableRowActions actions={actions} />;
      },
    },
  ];
}
