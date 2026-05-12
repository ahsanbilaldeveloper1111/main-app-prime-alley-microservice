import React from "react";
import { Form } from "react-bootstrap";
import { X } from "lucide-react";
import { StageFormFields } from "@page-modules/crm/stages/StageFormFields";
import type { StageFormState } from "@page-modules/crm/stages/stagesPageModel";

export interface StageCreateSidebarProps {
  formData: StageFormState;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onChange: <K extends keyof StageFormState>(
    field: K,
    value: StageFormState[K],
  ) => void;
}

/** Slide-in sidebar to create a new stage. */
export const StageCreateSidebar: React.FC<StageCreateSidebarProps> = ({
  formData,
  submitting,
  onClose,
  onSubmit,
  onChange,
}) => {
  return (
    <>
      <div
        className="stages-create-overlay contact-sidebar-overlay"
        aria-hidden="true"
      />

      <div className="stages-create-sidebar contact-sidebar-container">
        <div className="stages-create-header contact-sidebar-header">
          <h2 className="stages-create-title contact-sidebar-title">
            Create Stage
          </h2>
          <button
            type="button"
            className="stages-create-close contact-sidebar-close-btn"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close create stage sidebar"
          >
            <X size={24} />
          </button>
        </div>

        <Form onSubmit={onSubmit} className="stages-create-form">
          <div className="stages-create-content contact-sidebar-content">
            <p className="stages-create-intro">
              Please fill in the details below to create a new stage.
            </p>
            <StageFormFields
              formData={formData}
              onChange={onChange}
              singleColumn
            />
          </div>

          <div className="stages-create-footer contact-sidebar-footer">
            <button
              type="submit"
              className="stages-create-submit"
              disabled={submitting}
            >
              {submitting ? "Creating Stage..." : "Create Stage"}
            </button>
            <button
              type="button"
              className="stages-create-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </Form>
      </div>
    </>
  );
};
