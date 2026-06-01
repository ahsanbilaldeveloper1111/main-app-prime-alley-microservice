import React from "react";
import { Form } from "react-bootstrap";
import { X } from "lucide-react";
import { MainSettingsFormSidebar } from "@components/main-settings/MainSettingsFormSidebar";
import { useCrmSettingsPrefersSidebar } from "@page-modules/crm/shared/CrmSettingsPanelShell";
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

function StageCreateFooter({
  submitting,
  onClose,
  formId,
}: Readonly<{
  submitting: boolean;
  onClose: () => void;
  formId: string;
}>) {
  return (
    <div className="stages-create-footer contact-sidebar-footer w-100">
      <button
        type="submit"
        form={formId}
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
  );
}

/** Slide-in sidebar to create a new stage. */
export const StageCreateSidebar: React.FC<StageCreateSidebarProps> = ({
  formData,
  submitting,
  onClose,
  onSubmit,
  onChange,
}) => {
  const preferSidebar = useCrmSettingsPrefersSidebar();
  const formId = "stage-create-form";

  const formContent = (
    <>
      <p className="stages-create-intro">
        Please fill in the details below to create a new stage.
      </p>
      <StageFormFields formData={formData} onChange={onChange} singleColumn />
    </>
  );

  if (preferSidebar) {
    return (
      <MainSettingsFormSidebar
        show
        onHide={onClose}
        title="Create Stage"
        disableClose={submitting}
        footer={
          <StageCreateFooter submitting={submitting} onClose={onClose} formId={formId} />
        }
      >
        <Form id={formId} onSubmit={onSubmit}>
          {formContent}
        </Form>
      </MainSettingsFormSidebar>
    );
  }

  return (
    <>
      <div
        className="stages-create-overlay contact-sidebar-overlay"
        aria-hidden="true"
      />

      <div className="stages-create-sidebar contact-sidebar-container">
        <div className="stages-create-header contact-sidebar-header">
          <h2 className="stages-create-title contact-sidebar-title">Create Stage</h2>
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

        <Form id={formId} onSubmit={onSubmit} className="stages-create-form">
          <div className="stages-create-content contact-sidebar-content">
            {formContent}
          </div>
          <StageCreateFooter submitting={submitting} onClose={onClose} formId={formId} />
        </Form>
      </div>
    </>
  );
};
