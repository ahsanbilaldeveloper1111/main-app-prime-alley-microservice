import React from "react";
import { Modal } from "react-bootstrap";
import type { StageRow } from "@page-modules/crm/stages/stagesPageModel";

export interface StageRestoreModalProps {
  show: boolean;
  restoring: boolean;
  stageToRestore: StageRow | null;
  onHide: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmation modal shown when restoring a soft-deleted stage. */
export const StageRestoreModal: React.FC<StageRestoreModalProps> = ({
  show,
  restoring,
  stageToRestore,
  onHide,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Restore stage</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {stageToRestore && (
          <p className="mb-0">
            Restore <strong>{stageToRestore.name}</strong>? It will be available
            again in the pipeline.
          </p>
        )}
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <div className="w-100 d-flex justify-content-end stages-crm-dialog-footer">
          <button
            type="button"
            className="stages-crm-btn-primary"
            onClick={onConfirm}
            disabled={restoring}
          >
            {restoring ? "Restoring…" : "Restore"}
          </button>
          <button
            type="button"
            className="stages-crm-btn-secondary"
            onClick={onCancel}
            disabled={restoring}
          >
            Cancel
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};
