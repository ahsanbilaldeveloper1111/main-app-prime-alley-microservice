import React, { type FormEvent } from "react";
import { Form, Modal, Spinner } from "react-bootstrap";
import { AlertCircle, Check } from "lucide-react";
import { MainSettingsFormSidebar } from "@components/main-settings/MainSettingsFormSidebar";
import { useMainSettingsFormSidebar } from "@components/main-settings/mainSettingsFormContext";
import {
  CRM_DIALOG_FOOTER_ACTIONS_ROW_STYLE,
  CRM_DIALOG_PRIMARY_BUTTON_STYLE,
  CRM_DIALOG_SECONDARY_BUTTON_STYLE,
} from "@components/crm/crmDialogActionButtonStyles";
import {
  modalTitle,
  primarySubmitLabel,
} from "@hooks/useBusinessTypesPage";
import type { BusinessTypeData } from "@utils/crm";

export type BusinessTypeFormData = Readonly<{
  name: string;
  description: string;
}>;

export interface BusinessTypeFormModalProps {
  show: boolean;
  submitting: boolean;
  editingBusinessType: BusinessTypeData | null;
  formData: BusinessTypeFormData;
  setFormData: React.Dispatch<React.SetStateAction<BusinessTypeFormData>>;
  onHide: () => void;
  onSubmit: (e: FormEvent) => void;
}

function BusinessTypeFormFields({
  formData,
  setFormData,
}: Readonly<{
  formData: BusinessTypeFormData;
  setFormData: React.Dispatch<React.SetStateAction<BusinessTypeFormData>>;
}>) {
  return (
    <>
      <Form.Group className="mb-3">
        <Form.Label>
          Name <span className="text-danger">*</span>
        </Form.Label>
        <Form.Control
          type="text"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Enter business type name"
          required
        />
      </Form.Group>
      <Form.Group className="mb-0">
        <Form.Label>Description</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Enter business type description"
        />
      </Form.Group>
    </>
  );
}

function BusinessTypeSidebarFooter({
  submitting,
  editingBusinessType,
  onHide,
  formId,
}: Readonly<{
  submitting: boolean;
  editingBusinessType: BusinessTypeData | null;
  onHide: () => void;
  formId: string;
}>) {
  return (
    <div className="main-settings-form-sidebar-footer w-100">
      <Form.Text className="text-muted d-flex align-items-center gap-1 mb-0 min-w-0">
        <AlertCircle size={14} className="flex-shrink-0" />
        <span style={{ fontSize: "0.813rem" }}>
          Fields marked with <span className="text-danger fw-bold">*</span> are required
        </span>
      </Form.Text>
      <div className="main-settings-form-sidebar-footer__actions industries-crm-dialog-footer">
        <button
          type="submit"
          form={formId}
          disabled={submitting}
          className="industries-crm-btn-primary industries-crm-btn-primary--min148 d-inline-flex align-items-center justify-content-center gap-2"
        >
          {submitting ? (
            <>
              <Spinner size="sm" />
              {primarySubmitLabel(true, editingBusinessType)}
            </>
          ) : (
            <>
              <Check size={16} aria-hidden />
              {primarySubmitLabel(false, editingBusinessType)}
            </>
          )}
        </button>
        <button
          type="button"
          className="industries-crm-btn-secondary"
          onClick={onHide}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/** Create/edit form for a business type (sidebar in Main Settings, modal elsewhere). */
export function BusinessTypeFormModal({
  show,
  submitting,
  editingBusinessType,
  formData,
  setFormData,
  onHide,
  onSubmit,
}: Readonly<BusinessTypeFormModalProps>) {
  const preferSidebar = useMainSettingsFormSidebar();
  const formId = "business-type-form";

  const handleHide = () => {
    if (submitting) return;
    onHide();
  };

  const title = modalTitle(editingBusinessType);

  if (preferSidebar) {
    return (
      <MainSettingsFormSidebar
        show={show}
        onHide={handleHide}
        title={title}
        disableClose={submitting}
        footer={
          <BusinessTypeSidebarFooter
            submitting={submitting}
            editingBusinessType={editingBusinessType}
            onHide={onHide}
            formId={formId}
          />
        }
      >
        <Form id={formId} onSubmit={onSubmit}>
          <BusinessTypeFormFields formData={formData} setFormData={setFormData} />
        </Form>
      </MainSettingsFormSidebar>
    );
  }

  return (
    <Modal show={show} onHide={handleHide} centered>
      <Modal.Header closeButton={!submitting}>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={onSubmit}>
        <Modal.Body>
          <BusinessTypeFormFields formData={formData} setFormData={setFormData} />
        </Modal.Body>
        <Modal.Footer className="border-top flex-column align-items-stretch gap-3">
          <Form.Text className="text-muted d-flex align-items-center gap-1 mb-0">
            <AlertCircle size={14} aria-hidden />
            <span style={{ fontSize: "0.813rem" }}>
              Fields marked with <span className="text-danger fw-bold">*</span> are required
            </span>
          </Form.Text>
          <div
            style={{
              ...CRM_DIALOG_FOOTER_ACTIONS_ROW_STYLE,
              justifyContent: "flex-end",
              width: "100%",
            }}
          >
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary d-inline-flex align-items-center justify-content-center gap-2"
              style={{
                ...CRM_DIALOG_PRIMARY_BUTTON_STYLE,
                width: "168px",
              }}
            >
              {submitting ? (
                <Spinner size="sm" aria-hidden />
              ) : (
                <Check size={16} aria-hidden />
              )}
              {primarySubmitLabel(submitting, editingBusinessType)}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onHide}
              disabled={submitting}
              style={{ ...CRM_DIALOG_SECONDARY_BUTTON_STYLE, width: "120px" }}
            >
              Cancel
            </button>
          </div>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
