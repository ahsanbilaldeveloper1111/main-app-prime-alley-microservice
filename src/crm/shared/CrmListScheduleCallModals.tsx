import React from "react";
import { Row, Col, Form, Alert, Modal, Button } from "react-bootstrap";
import { AlertCircle as AlertCircleIcon } from "lucide-react";
import moment from "moment";

/* ---------- Schedule Call Form Content ---------- */

export interface ScheduleData {
  date: string;
  time: string;
  notes: string;
}

export interface CrmListScheduleCallFormContentProps {
  selectedEntry: any;
  isEditing: boolean;
  scheduleData: ScheduleData;
  setScheduleData: React.Dispatch<React.SetStateAction<ScheduleData>>;
}

export function CrmListScheduleCallFormContent({
  selectedEntry,
  isEditing,
  scheduleData,
  setScheduleData,
}: CrmListScheduleCallFormContentProps) {
  const update = (patch: Partial<ScheduleData>) =>
    setScheduleData((prev) => ({ ...prev, ...patch }));

  return (
    <>
      {selectedEntry && (
        <div className="mb-3">
          <h6>Schedule Call For:</h6>
          <div className="bg-light p-3 rounded">
            <div>
              <strong>Name:</strong> {selectedEntry.name || "N/A"}
            </div>
            <div>
              <strong>Phone:</strong> {selectedEntry.phone || "N/A"}
            </div>
            <div>
              <strong>Email:</strong>{" "}
              {selectedEntry?.data?.email || "N/A"}
            </div>
          </div>
        </div>
      )}

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Date *</Form.Label>
            <Form.Control
              type="date"
              value={scheduleData.date}
              onChange={(e) => update({ date: e.target.value })}
              min={moment().format("YYYY-MM-DD")}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Time *</Form.Label>
            <Form.Control
              type="time"
              value={scheduleData.time}
              onChange={(e) => update({ time: e.target.value })}
            />
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Notes (Optional)</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={scheduleData.notes}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder="Add any notes or reminders for this call..."
        />
      </Form.Group>

      <Alert variant="info">
        <strong>Note:</strong> The call will be scheduled and you&apos;ll receive
        a reminder at the selected time.
      </Alert>
    </>
  );
}

/* ---------- Unschedule Confirmation Modal ---------- */

export interface CrmListUnscheduleModalProps {
  show: boolean;
  onHide: () => void;
  entryToUnschedule: any;
  onConfirm: () => void;
}

export function CrmListUnscheduleModal({
  show,
  onHide,
  entryToUnschedule,
  onConfirm,
}: CrmListUnscheduleModalProps) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="border-bottom">
        <Modal.Title>Confirm Unschedule</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        <div className="text-center">
          <AlertCircleIcon size={48} className="text-warning mb-3" />
          <p className="mb-0">
            Are you sure you want to unschedule the call for{" "}
            <strong>
              {entryToUnschedule
                ? entryToUnschedule.name ||
                  `prospect #${entryToUnschedule.id}`
                : "this prospect"}
            </strong>
            ?
          </p>
          <p className="text-muted small mb-3">
            This action cannot be undone.
          </p>

          {entryToUnschedule?.scheduled_call_at && (
            <div className="alert alert-warning mb-3 text-start">
              <strong>Prospect:</strong>{" "}
              {entryToUnschedule.name || `#${entryToUnschedule.id}`}
              <br />
              <strong>Phone:</strong> {entryToUnschedule.phone || "N/A"}
              <br />
              <strong>Scheduled Date:</strong>{" "}
              {moment(entryToUnschedule.scheduled_call_at).format(
                "MMM DD, YYYY HH:mm",
              )}
              {entryToUnschedule.note && (
                <>
                  <br />
                  <strong>Note:</strong> {entryToUnschedule.note}
                </>
              )}
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer className="border-top">
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="warning" onClick={onConfirm}>
          Unschedule
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
