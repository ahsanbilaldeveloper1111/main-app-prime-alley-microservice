import React from "react";
import { Button, Modal } from "react-bootstrap";
import { PlannerStatusFormFields } from "./PlannerStatusFormFields";
import type { PlannerStatusFormState } from "./plannerStatusesDomain";

export type PlannerStatusFormModalProps = Readonly<{
  show: boolean;
  mode: "create" | "edit";
  onHide: () => void;
  formData: PlannerStatusFormState;
  setFormData: React.Dispatch<React.SetStateAction<PlannerStatusFormState>>;
  processing: boolean;
  onSubmit: () => void | Promise<void>;
}>;

export function PlannerStatusFormModal({
  show,
  mode,
  onHide,
  formData,
  setFormData,
  processing,
  onSubmit,
}: PlannerStatusFormModalProps) {
  const isCreate = mode === "create";
  const title = isCreate ? "Create Status" : "Edit Status";

  let primaryLabel: string;
  if (processing && isCreate) {
    primaryLabel = "Creating...";
  } else if (processing) {
    primaryLabel = "Updating...";
  } else if (isCreate) {
    primaryLabel = "Create";
  } else {
    primaryLabel = "Update";
  }

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <PlannerStatusFormFields formData={formData} setFormData={setFormData} />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={() => void onSubmit()} disabled={processing}>
          {primaryLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
