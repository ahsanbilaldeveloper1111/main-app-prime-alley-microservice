import React from "react";
import { Button } from "react-bootstrap";
import { RefreshCw, Trash2 } from "lucide-react";

import "./addRecordsPage.scss";

export interface AddRecordsTableToolbarProps {
  canBulkDelete: boolean;
  selectedCount: number;
  onBulkDeleteClick: () => void;
  onRefresh: () => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
}

export function AddRecordsTableToolbar(
  props: Readonly<AddRecordsTableToolbarProps>,
): React.ReactElement {
  const {
    canBulkDelete,
    selectedCount,
    onBulkDeleteClick,
    onRefresh,
    onApplyFilters,
    onResetFilters,
  } = props;

  return (
    <div className="addRecordsPage-toolbar">
      {canBulkDelete && selectedCount > 0 && (
        <Button
          variant="danger"
          size="sm"
          onClick={onBulkDeleteClick}
          className="addRecordsPage-toolbarBtnDanger"
        >
          <Trash2 size={14} className="addRecordsPage-toolbarIcon" />
          Delete Selected ({selectedCount})
        </Button>
      )}
      <Button
        variant="light"
        size="sm"
        onClick={onRefresh}
        className="addRecordsPage-toolbarBtnRefresh"
      >
        <RefreshCw size={14} className="addRecordsPage-toolbarIcon" />
        Refresh
      </Button>
      <Button
        variant="primary"
        size="sm"
        onClick={onApplyFilters}
        className="addRecordsPage-toolbarBtnApply"
      >
        Apply
      </Button>
      <Button
        variant="light"
        size="sm"
        onClick={onResetFilters}
        className="addRecordsPage-toolbarBtnReset"
      >
        Reset
      </Button>
    </div>
  );
}
