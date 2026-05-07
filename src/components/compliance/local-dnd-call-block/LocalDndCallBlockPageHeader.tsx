import React from "react";
import { Button } from "react-bootstrap";
import { Plus, Trash2, Upload } from "lucide-react";

import type { LocalDndCallBlockViewModel } from "./useLocalDndCallBlockPage";

import "./localDndCallBlockPage.scss";

export function LocalDndCallBlockPageHeader(
  props: Readonly<{ vm: LocalDndCallBlockViewModel }>,
): React.ReactElement {
  const { vm } = props;

  return (
    <div className="mb-4 d-flex justify-content-between align-items-center">
      <h4 className="localDndCallBlockPage-title mb-0">
        Local DND Call Block{" "}
        <span className="localDndCallBlockPage-titleMuted">
          — Blocked Numbers
        </span>
      </h4>
      <div className="d-flex gap-2">
        {vm.selectedRecords.length > 0 && (
          <Button
            variant="danger"
            onClick={vm.handleBulkDeleteClick}
            className="localDndCallBlockPage-btnDanger"
          >
            <Trash2 size={16} />
            Delete Selected ({vm.selectedRecords.length})
          </Button>
        )}
        <Button
          onClick={() => vm.setShowBulkAddModal(true)}
          variant="outline-primary"
          className="localDndCallBlockPage-btnOutlinePrimary"
        >
          <Upload size={16} />
          Bulk Add
        </Button>
        <Button
          onClick={() => vm.setShowAddModal(true)}
          className="localDndCallBlockPage-btnPrimary"
        >
          <Plus size={16} />
          Add Block
        </Button>
      </div>
    </div>
  );
}
