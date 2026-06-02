import React from "react";
import { Button, Modal } from "react-bootstrap";
import { MainSettingsFormSidebar } from "@components/main-settings/MainSettingsFormSidebar";
import { useMainSettingsFormSidebar } from "@components/main-settings/mainSettingsFormContext";
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

  const preferSidebar = useMainSettingsFormSidebar();

  if (preferSidebar) {
    return (
      <MainSettingsFormSidebar
        show={show}
        onHide={onHide}
        title={title}
        disableClose={processing}
        footer={
          <div className="main-settings-form-sidebar-footer">
            <div className="main-settings-form-sidebar-footer__actions">
              <Button variant="outline-secondary" type="button" onClick={onHide} disabled={processing}>
                Cancel
              </Button>
              <Button variant="primary" type="button" onClick={() => void onSubmit()} disabled={processing}>
                {primaryLabel}
              </Button>
            </div>
          </div>
        }
      >
        <PlannerStatusFormFields formData={formData} setFormData={setFormData} />
      </MainSettingsFormSidebar>
    );
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
