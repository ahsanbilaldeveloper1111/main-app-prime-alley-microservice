import React from "react";
import { X } from "lucide-react";
import { Form, Row, Col, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import RichTextEditor from "@page-modules/help-center/partials/RichTextEditor";
import {
  PROJECT_NAME_MAX_LENGTH,
  todayYmdLocal,
  type Project,
  type ProjectFormState,
  type ProjectFormStatus,
} from "@planner/workPlannerProjectsDomain";
import "@components/planner/workPlannerProjects/workPlannerProjectsPage.scss";

export type ProjectFormSidebarProps = {
  show: boolean;
  editingProject: Project | null;
  projectFormData: ProjectFormState;
  setProjectFormData: React.Dispatch<React.SetStateAction<ProjectFormState>>;
  submitting: boolean;
  submitButtonText: string;
  submittingButtonText: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
};

export const ProjectFormSidebar: React.FC<ProjectFormSidebarProps> = ({
  show,
  editingProject,
  projectFormData,
  setProjectFormData,
  submitting,
  submitButtonText,
  submittingButtonText,
  onClose,
  onSubmit,
}) => {
  if (!show) {
    return null;
  }

  const hasName = projectFormData.name.trim() !== "";
  const hasStartDate = projectFormData.start_date.trim() !== "";
  const hasStartDateInPast =
    editingProject == null && hasStartDate && projectFormData.start_date.trim() < todayYmdLocal();
  const hasEndDateBeforeStart =
    projectFormData.end_date.trim() !== "" &&
    projectFormData.end_date.trim() < projectFormData.start_date.trim();
  const disableSubmit =
    submitting || !hasName || !hasStartDate || hasStartDateInPast || hasEndDateBeforeStart;

  return (
    <>
      <div className="wp-project-form-backdrop" aria-hidden="true" />
      <div className="wp-project-form-panel">
        <div className="wp-project-form-header">
          <h2 className="wp-project-form-title">
            {editingProject ? "Edit Project" : "Create New Project"}
          </h2>
          <button type="button" className="wp-project-form-close" onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <Form onSubmit={onSubmit} className="wp-project-form-body">
          <div className="wp-project-form-scroll">
            <Form.Group className="wp-project-form-group">
              <Form.Label className="wp-project-form-label">
                Project Name <span className="wp-required-asterisk">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                className="wp-project-form-control"
                value={projectFormData.name}
                maxLength={PROJECT_NAME_MAX_LENGTH}
                onChange={(e) =>
                  setProjectFormData((prev) => ({
                    ...prev,
                    name: e.target.value.slice(0, PROJECT_NAME_MAX_LENGTH),
                  }))
                }
                placeholder="Enter project name"
                required
              />
              <div className="d-flex justify-content-between align-items-baseline gap-2 mt-1">
                <Form.Text className="text-muted mb-0">
                  Maximum {PROJECT_NAME_MAX_LENGTH} characters.
                </Form.Text>
                <Form.Text className="text-muted mb-0 small text-nowrap" aria-live="polite">
                  {projectFormData.name.length}/{PROJECT_NAME_MAX_LENGTH}
                </Form.Text>
              </div>
            </Form.Group>

            <Form.Group className="wp-project-form-group">
              <Form.Label className="wp-project-form-label">Description</Form.Label>
              <RichTextEditor
                buttonSize="sm"
                value={projectFormData.description || ""}
                onChange={(html) => setProjectFormData((prev) => ({ ...prev, description: html }))}
                placeholder="Enter project description"
                minHeight="100px"
                maxHeight="220px"
                maxLength={5000}
              />
            </Form.Group>

            <Row className="g-2 wp-project-form-group">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="wp-project-form-label">
                    Start date <span className="wp-required-asterisk">*</span>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    className="wp-project-form-control"
                    required
                    min={editingProject == null ? todayYmdLocal() : undefined}
                    value={projectFormData.start_date}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      const today = todayYmdLocal();
                      if (editingProject == null && newStart && newStart < today) {
                        toast.error("Start date cannot be in the past");
                        return;
                      }
                      setProjectFormData((prev) => {
                        let nextEnd = prev.end_date;
                        if (newStart && nextEnd && nextEnd < newStart) {
                          nextEnd = newStart;
                        }
                        return { ...prev, start_date: newStart, end_date: nextEnd };
                      });
                    }}
                  />
                  {editingProject == null ? (
                    <Form.Text className="text-muted">Start date must be today or a future date.</Form.Text>
                  ) : null}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="wp-project-form-label">End date</Form.Label>
                  <Form.Control
                    type="date"
                    className="wp-project-form-control"
                    min={projectFormData.start_date || todayYmdLocal()}
                    value={projectFormData.end_date}
                    onChange={(e) => {
                      const v = e.target.value;
                      setProjectFormData((prev) => {
                        if (v && prev.start_date && v < prev.start_date) {
                          toast.error("End date cannot be before start date");
                          return prev;
                        }
                        return { ...prev, end_date: v };
                      });
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="wp-project-form-group">
              <Form.Label className="wp-project-form-label">Status</Form.Label>
              <Form.Select
                className="wp-project-form-control"
                value={projectFormData.status}
                onChange={(e) =>
                  setProjectFormData((prev) => ({
                    ...prev,
                    status: e.target.value as ProjectFormStatus,
                  }))
                }
              >
                <option value="active">Active</option>
                <option value="archived">Archived</option>
                <option value="completed">Completed</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="wp-project-form-group">
              <Form.Label className="wp-project-form-label">Color</Form.Label>
              <div className="d-flex align-items-center gap-3">
                <Form.Control
                  type="color"
                  className="wp-project-form-color-swatch"
                  value={projectFormData.color}
                  onChange={(e) => setProjectFormData((prev) => ({ ...prev, color: e.target.value }))}
                />
                <Form.Control
                  type="text"
                  className="wp-project-form-control"
                  value={projectFormData.color}
                  onChange={(e) => setProjectFormData((prev) => ({ ...prev, color: e.target.value }))}
                  placeholder="#3b82f6"
                />
              </div>
            </Form.Group>
          </div>

          <div className="wp-project-form-footer">
            <button
              type="submit"
              disabled={disableSubmit}
              className={`wp-project-form-submit${disableSubmit ? " wp-project-form-submit--disabled" : " wp-project-form-submit--enabled"}`}
            >
              {submitting ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  {submittingButtonText}
                </>
              ) : (
                submitButtonText
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={`wp-project-form-cancel${submitting ? " wp-project-form-cancel--disabled" : " wp-project-form-cancel--enabled"}`}
            >
              Cancel
            </button>
          </div>
        </Form>
      </div>
    </>
  );
};
