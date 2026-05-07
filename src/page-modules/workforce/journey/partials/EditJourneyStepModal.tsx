import React, { useEffect, useState } from "react";
import { Form, Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import { updateJourneyStep } from "@utils/staffManagement";
import {
  clampDueDateToJourneyMin,
  toInputDate,
  type JourneyStepRecord,
} from "../journeyDomain";

export interface EditJourneyStepModalProps {
  step: JourneyStepRecord | null;
  journeyId: number;
  journeyDueDateMin: string | undefined;
  onHide: () => void;
  onInvalidateJourneyQueries: () => void;
}

const EditJourneyStepModal: React.FC<EditJourneyStepModalProps> = ({
  step,
  journeyId,
  journeyDueDateMin,
  onHide,
  onInvalidateJourneyQueries,
}) => {
  const [form, setForm] = useState({
    stage: "",
    title: "",
    description: "",
    due_date: "",
    status: "pending",
    sort_order: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (step == null) return;
    const dueRaw = step.due_date ? toInputDate(step.due_date) : new Date().toISOString().slice(0, 10);
    setForm({
      stage: step.stage ?? "",
      title: step.title ?? "",
      description: step.description ?? "",
      due_date: clampDueDateToJourneyMin(dueRaw, journeyDueDateMin),
      status: step.status ?? "pending",
      sort_order: Number(step.sort_order ?? 0),
    });
  }, [step, journeyDueDateMin]);

  const handleSubmit = async () => {
    if (step?.id == null) return;
    if (journeyDueDateMin != null && form.due_date !== "" && form.due_date < journeyDueDateMin) {
      toast.error("Due date cannot be before the journey start date.");
      return;
    }
    setSubmitting(true);
    try {
      await updateJourneyStep(journeyId, step.id, {
        stage: form.stage,
        title: form.title,
        description: form.description,
        due_date: form.due_date,
        status: form.status,
        sort_order: form.sort_order,
      });
      toast.success("Step updated.");
      onHide();
      onInvalidateJourneyQueries();
    } catch (error: unknown) {
      console.error("[WorkforceJourney] updateJourneyStep failed", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={step != null} onHide={onHide} centered style={{ zIndex: 99999 }}>
      <Modal.Header closeButton>
        <Modal.Title>Edit step</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>Stage</Form.Label>
          <Form.Control
            type="text"
            placeholder="Stage"
            value={form.stage}
            onChange={(e) => setForm((prev) => ({ ...prev, stage: e.target.value }))}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Title</Form.Label>
          <Form.Control
            type="text"
            placeholder="Title"
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
            min={journeyDueDateMin}
            value={form.due_date}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                due_date: clampDueDateToJourneyMin(e.target.value, journeyDueDateMin),
              }))
            }
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Status</Form.Label>
          <Form.Control
            as="select"
            value={form.status}
            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </Form.Control>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <button
          type="button"
          className="journey-page__modal-footer-btn journey-page__modal-footer-btn--cancel"
          onClick={onHide}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="button"
          className="journey-page__modal-footer-btn journey-page__modal-footer-btn--submit"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Saving..." : "Save"}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditJourneyStepModal;
