import React from "react";
import moment from "moment";
import type { CrmDataItem } from "@utils/crm";

export type CrmListDeleteModalAdditionalInfoProps = {
  mode: "single" | "bulk" | null;
  itemToDelete: CrmDataItem | null;
  selectedCount: number;
  extensions: Array<{ id: string | number; display_name?: string }>;
};

export function CrmListDeleteModalAdditionalInfo({
  mode,
  itemToDelete,
  selectedCount,
  extensions,
}: Readonly<CrmListDeleteModalAdditionalInfoProps>) {
  if (mode === "single" && itemToDelete) {
    const assignedTo = itemToDelete.user_extension
      ? extensions.find(
          (extension) =>
            extension.id.toString() ===
            itemToDelete.user_extension?.toString(),
        )?.display_name || itemToDelete.user_extension
      : "Unassigned";

    return (
      <div className="alert alert-warning mb-3">
        <strong>Entry ID:</strong> #{itemToDelete.id}
        <br />
        <strong>Phone:</strong> {itemToDelete.phone || "N/A"}
        <br />
        <strong>Assigned To:</strong> {assignedTo}
        <br />
        <strong>Created:</strong>{" "}
        {moment(itemToDelete.created_at).format("MMM DD, YYYY HH:mm")}
      </div>
    );
  }

  if (mode === "bulk") {
    return (
      <div className="alert alert-warning mb-3">
        <strong>Warning:</strong> This action cannot be undone. All{" "}
        {selectedCount} selected entries will be permanently deleted.
      </div>
    );
  }

  return null;
}
