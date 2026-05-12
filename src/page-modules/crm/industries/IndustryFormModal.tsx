import React, {
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import { Form, Modal, Spinner } from "react-bootstrap";
import { AlertCircle, Check } from "lucide-react";
import type {
  IndustryFormData,
} from "@page-modules/crm/industries/industriesPageModel";
import type { IndustryData } from "@utils/crm";

export interface IndustryFormModalProps {
  show: boolean;
  submitting: boolean;
  editingIndustry: IndustryData | null;
  formData: IndustryFormData;
  setFormData: Dispatch<SetStateAction<IndustryFormData>>;
  onHide: () => void;
  onSubmit: (e: FormEvent) => void;
}

/** Create/edit form modal for an industry / product group. */
export function IndustryFormModal({
  show,
  submitting,
  editingIndustry,
  formData,
  setFormData,
  onHide,
  onSubmit,
}: Readonly<IndustryFormModalProps>) {
  const handleHide = () => {
    if (submitting) return;
    onHide();
  };

  return (
    <Modal show={show} onHide={handleHide} size="lg" centered>
      <Modal.Header closeButton={!submitting}>
        <Modal.Title>
          {editingIndustry ? "Edit Product Group" : "Add New Product Group"}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={onSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>
              Name <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter product group name"
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Enter product group description"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-2">
          <div className="industries-modal-footer-hint-row">
            <Form.Text className="text-muted d-flex align-items-center gap-1 mb-0 min-w-0 flex-shrink-1 pe-2">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span className="industries-form-hint-text">
                Fields marked with{" "}
                <span className="text-danger fw-bold">*</span> are required
              </span>
            </Form.Text>
            <div className="flex-shrink-0 industries-crm-dialog-footer industries-crm-dialog-footer--nowrap">
              <button
                type="submit"
                disabled={submitting}
                className="industries-crm-btn-primary industries-crm-btn-primary--min148 d-inline-flex align-items-center justify-content-center gap-2"
              >
                {submitting ? (
                  <>
                    <Spinner size="sm" />
                    {editingIndustry ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Check size={16} aria-hidden />
                    {editingIndustry ? "Update" : "Create"}
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
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
