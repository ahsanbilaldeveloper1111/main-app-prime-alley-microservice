import React from "react";
import moment from "moment";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";

function deleteModalItemName(
  deleteModalMode: "single" | "bulk" | null,
  itemToDelete: { id?: number | string; phone?: string; user_extension?: string | number; created_at?: string } | null,
  selectedCount: number,
): string | undefined {
  if (deleteModalMode === "single" && itemToDelete) {
    return `prospect entry #${itemToDelete.id}`;
  }
  if (deleteModalMode === "bulk") {
    return `${selectedCount} selected prospects`;
  }
  return undefined;
}

type AdditionalProps = {
  deleteModalMode: "single" | "bulk" | null;
  itemToDelete: {
    id?: number | string;
    phone?: string;
    user_extension?: string | number;
    created_at?: string;
  } | null;
  selectedCount: number;
  extensions: any[];
};

function renderDeleteQuotesModalAdditionalInfo({
  deleteModalMode,
  itemToDelete,
  selectedCount,
  extensions,
}: AdditionalProps): React.ReactNode {
  if (deleteModalMode === "single" && itemToDelete) {
    const assignedLabel = itemToDelete.user_extension
      ? extensions.find(
          (extension: any) =>
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
        <strong>Assigned To:</strong> {assignedLabel}
        <br />
        <strong>Created:</strong>{" "}
        {moment(itemToDelete.created_at).format("MMM DD, YYYY HH:mm")}
      </div>
    );
  }

  if (deleteModalMode === "bulk") {
    return (
      <div className="alert alert-warning mb-3">
        <strong>Warning:</strong> This action cannot be undone. All{" "}
        {selectedCount} selected entries will be permanently deleted.
      </div>
    );
  }

  return undefined;
}

export type CrmQuotesListPageDeleteConfirmationBlockProps = {
  show: boolean;
  onHide: () => void;
  deleteModalMode: "single" | "bulk" | null;
  itemToDelete: any;
  selectedItems: Array<string | number>;
  extensions: any[];
  handleBulkDelete: () => void;
  confirmDelete: () => void;
};

export function CrmQuotesListPageDeleteConfirmationBlock({
  show,
  onHide,
  deleteModalMode,
  itemToDelete,
  selectedItems,
  extensions,
  handleBulkDelete,
  confirmDelete,
}: CrmQuotesListPageDeleteConfirmationBlockProps) {
  return (
    <DeleteConfirmationModal
      show={show}
      onHide={onHide}
      onConfirm={
        deleteModalMode === "bulk" ? handleBulkDelete : confirmDelete
      }
      itemName={deleteModalItemName(
        deleteModalMode,
        itemToDelete,
        selectedItems.length,
      )}
      itemType={
        deleteModalMode === "bulk" ? "prospect entries" : "prospect entry"
      }
      additionalInfo={renderDeleteQuotesModalAdditionalInfo({
        deleteModalMode,
        itemToDelete,
        selectedCount: selectedItems.length,
        extensions,
      })}
    />
  );
}
