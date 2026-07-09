import { OVERTIME_UNAPPROVED_WARNING } from "@page-modules/workforce/check-in-out/checkInOutDomain";
import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";

export type ShiftEndModalProps = Readonly<{
  show: boolean;
  canStartOvertime: boolean;
  isSubmitting: boolean;
  onCheckOut: () => void;
  onStartOvertime: (estimatedEndAt?: string) => void;
  onSnooze: () => void;
  onHide: () => void;
}>;

function buildDefaultEstimatedEndAt(): string {
  const date = new Date();
  date.setHours(date.getHours() + 2, 0, 0, 0);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function ShiftEndModal({
  show,
  canStartOvertime,
  isSubmitting,
  onCheckOut,
  onStartOvertime,
  onSnooze,
  onHide,
}: ShiftEndModalProps) {
  const [estimatedEndAt, setEstimatedEndAt] = useState(buildDefaultEstimatedEndAt);

  useEffect(() => {
    if (!show) {
      return;
    }
    setEstimatedEndAt(buildDefaultEstimatedEndAt());
  }, [show]);

  const handleStartOvertime = () => {
    const confirmed = globalThis.confirm(
      `${OVERTIME_UNAPPROVED_WARNING}\n\nDo you want to continue?`,
    );
    if (!confirmed) {
      return;
    }
    const isoEstimatedEndAt = estimatedEndAt
      ? new Date(estimatedEndAt).toISOString()
      : undefined;
    onStartOvertime(isoEstimatedEndAt);
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      backdrop={isSubmitting ? "static" : true}
      keyboard={!isSubmitting}
      centered
    >
      <Modal.Header closeButton={!isSubmitting}>
        <Modal.Title>Your shift has ended. What would you like to do?</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {canStartOvertime ? (
          <Form.Group controlId="shift-end-estimated-end" className="mb-3">
            <Form.Label>Estimated overtime end (optional)</Form.Label>
            <Form.Control
              type="datetime-local"
              value={estimatedEndAt}
              disabled={isSubmitting}
              onChange={(event) => setEstimatedEndAt(event.target.value)}
            />
          </Form.Group>
        ) : null}
        <p className="text-muted mb-0">
          You can check out now, start overtime if enabled, or snooze this reminder for 5 minutes.
        </p>
      </Modal.Body>
      <Modal.Footer className="d-flex flex-wrap gap-2 justify-content-end">
        <Button variant="outline-secondary" disabled={isSubmitting} onClick={onSnooze}>
          Snooze 5 min
        </Button>
        {canStartOvertime ? (
          <Button variant="warning" disabled={isSubmitting} onClick={handleStartOvertime}>
            Start overtime
          </Button>
        ) : null}
        <Button variant="primary" disabled={isSubmitting} onClick={onCheckOut}>
          Check out now
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
