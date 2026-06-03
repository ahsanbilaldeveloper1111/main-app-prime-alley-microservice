import GenericTable, { type GenericTableProps } from "@components/GenericTable";
import { SettingsEmbeddedTableWrap } from "@components/main-settings/settingsEmbeddedTable";
import React from "react";

/** GenericTable with Smart CRM chrome for Main Settings embedded pages. */
export function EmbeddedSettingsTable<T extends Record<string, any> = Record<string, any>>({
  embedded,
  toolbar,
  showToolbar,
  ...tableProps
}: GenericTableProps<T> & Readonly<{ embedded: boolean }>) {
  const table = (
    <GenericTable<T>
      {...tableProps}
      showActions={false}
      sortable={tableProps.sortable ?? true}
      hover={tableProps.hover ?? true}
      size={tableProps.size ?? "md"}
      showToolbar={embedded ? false : (showToolbar ?? true)}
      toolbar={embedded ? undefined : toolbar}
      showToolbarActions={false}
    />
  );

  if (embedded) {
    return <SettingsEmbeddedTableWrap>{table}</SettingsEmbeddedTableWrap>;
  }

  return table;
}
