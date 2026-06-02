import React from "react";
import { CrmSettingsPanelShell } from "@page-modules/crm/shared/CrmSettingsPanelShell";
import type { StageRow } from "@page-modules/crm/stages/stagesPageModel";

export interface StageRestoreModalProps {
  show: boolean;
  restoring: boolean;
  stageToRestore: StageRow | null;
  onHide: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

function StageRestoreFooter({
  restoring,
  onConfirm,
  onCancel,
}: Readonly<{
  restoring: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}>) {
  return (
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
  );
}

/** Confirmation when restoring a soft-deleted stage (sidebar in Main Settings). */
export const StageRestoreModal: React.FC<StageRestoreModalProps> = ({
  show,
  restoring,
  stageToRestore,
  onHide,
  onConfirm,
  onCancel,
}) => {
  const footer = (
    <StageRestoreFooter
      restoring={restoring}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );

  return (
    <CrmSettingsPanelShell
      show={show}
      onHide={onHide}
      title="Restore stage"
      disableClose={restoring}
      footer={footer}
    >
      {stageToRestore && (
        <p className="mb-0">
          Restore <strong>{stageToRestore.name}</strong>? It will be available again in the
          pipeline.
        </p>
      )}
    </CrmSettingsPanelShell>
  );
};
