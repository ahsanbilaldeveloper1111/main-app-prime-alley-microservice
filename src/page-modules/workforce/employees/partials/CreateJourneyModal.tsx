import React from "react";
import { Form, Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import type { UserProfile } from "@utils/staffManagement";
import { journeyStartDateMinIso } from "../employeesDomain";

export interface CreateJourneyModalProps {
  show: boolean;
  onHide: () => void;
  profile: UserProfile | null;
  journeyForm: { startDate: string; status: string };
  setJourneyForm: React.Dispatch<React.SetStateAction<{ startDate: string; status: string }>>;
  submitting: boolean;
  onSubmit: () => void;
  getDisplayName: (p: UserProfile) => string;
}

const CreateJourneyModal: React.FC<CreateJourneyModalProps> = ({
  show,
  onHide,
  profile,
  journeyForm,
  setJourneyForm,
  submitting,
  onSubmit,
  getDisplayName,
}) => (
  <Modal show={show} onHide={onHide} centered>
    <Modal.Header closeButton>
      <Modal.Title>Create Journey</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      {profile && (
        <>
          <Form.Group className="mb-3">
            <div className="employees-page__journey-employee-label">
              Create journey for: {getDisplayName(profile)}
            </div>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Start Date</Form.Label>
            <Form.Control
              type="date"
              min={journeyStartDateMinIso(profile)}
              value={journeyForm.startDate}
              onChange={(e) => {
                const next = e.target.value;
                const minStart = journeyStartDateMinIso(profile);
                if (next !== "" && next < minStart) {
                  toast.warn("Start date cannot be before the employee was created or before today.");
                  return;
                }
                setJourneyForm((f) => ({ ...f, startDate: next }));
              }}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Status</Form.Label>
            <Form.Select
              value={journeyForm.status}
              onChange={(e) => setJourneyForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="in_progress">In Progress</option>
              <option value="on_track">On Track</option>
              <option value="overdue">Overdue</option>
              <option value="completed">Completed</option>
            </Form.Select>
          </Form.Group>
        </>
      )}
    </Modal.Body>
    <Modal.Footer>
      <button type="button" className="workforce-sidebar-btn-cancel" onClick={onHide}>
        Cancel
      </button>
      <button type="button" className="workforce-sidebar-btn-create" onClick={onSubmit} disabled={submitting}>
        {submitting ? "Creating…" : "Create"}
      </button>
    </Modal.Footer>
  </Modal>
);

export default CreateJourneyModal;
