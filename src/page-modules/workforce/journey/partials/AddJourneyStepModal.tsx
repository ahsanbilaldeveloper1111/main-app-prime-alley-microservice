import React, { useEffect, useState } from "react";
import { Form, Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import { createJourneyStep } from "@utils/staffManagement";

export interface AddJourneyStepModalProps {
  show: boolean;
  journeyId: number;
  stepCount: number;
  onHide: () => void;
  onInvalidateJourneyQueries: () => void;
}

const AddJourneyStepModal: React.FC<AddJourneyStepModalProps> = ({
  show,
  journeyId,
  stepCount,
  onHide,
  onInvalidateJourneyQueries,
}) => {
  const [form, setForm] = useState({
    stage: "",
    title: "",
    description: "",
    due_date: new Date().toISOString().slice(0, 10),
    status: "pending",
    sort_order: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!show) return;
    setForm((prev) => ({
      ...prev,
      sort_order: stepCount,
    }));
  }, [show, stepCount]);

  const handleSubmit = async () => {
    if (form.title.trim() === "") {
      toast.error("Task is required");
      return;
    }
    setSubmitting(true);
    try {
      await createJourneyStep(journeyId, {
        stage: form.stage,
        title: form.title,
        description: form.description,
        due_date: form.due_date,
        status: form.status,
        sort_order: form.sort_order,
      });
      toast.success("Step added.");
      onHide();
      setForm({
        stage: "",
        title: "",
        description: "",
        due_date: new Date().toISOString().slice(0, 10),
        status: "pending",
        sort_order: stepCount,
      });
      onInvalidateJourneyQueries();
    } catch (error: unknown) {
      console.error("[WorkforceJourney] createJourneyStep failed", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered style={{ zIndex: 99999 }}>
      <Modal.Header closeButton>
        <Modal.Title>New step</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="journey-page__modal-fields">
          <Form.Group className="mb-3">
            <Form.Label>Stage</Form.Label>
            <Form.Control
              type="text"
              placeholder="Type the stage"
              value={form.stage}
              onChange={(e) => setForm((prev) => ({ ...prev, stage: e.target.value }))}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>
              Title <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Type the title"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Due Date</Form.Label>
            <Form.Control
              type="date"
              value={form.due_date}
              onChange={(e) => setForm((prev) => ({ ...prev, due_date: e.target.value }))}
            />
          </Form.Group>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button
          type="button"
          className="workforce-sidebar-btn-cancel"
          onClick={onHide}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="button"
          className="workforce-sidebar-btn-create"
          onClick={handleSubmit}
          disabled={submitting || form.title.trim() === ""}
        >
          {submitting ? "Adding..." : "Add step"}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddJourneyStepModal;
