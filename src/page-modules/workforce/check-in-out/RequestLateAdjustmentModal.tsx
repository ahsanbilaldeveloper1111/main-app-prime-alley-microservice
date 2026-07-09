/** Late adjustment feature disabled — uncomment the block below to re-enable. */

/*
import {
  validateLateAdjustmentReason,
} from "@page-modules/workforce/check-in-out/lateAdjustmentDomain";
import { Clock } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";

export type RequestLateAdjustmentModalProps = Readonly<{
  show: boolean;
  lateMinutes: number | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}>;

export function RequestLateAdjustmentModal({
  show,
  lateMinutes,
  isSubmitting,
  onClose,
  onConfirm,
}: RequestLateAdjustmentModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!show) {
      setReason("");
      setError(null);
    }
  }, [show]);

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }
    setReason("");
    setError(null);
    onClose();
  };

  const handleConfirm = () => {
    const validationError = validateLateAdjustmentReason(reason);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    onConfirm(reason.trim());
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      className="late-adjustment-modal"
      backdrop={isSubmitting ? "static" : true}
      keyboard={!isSubmitting}
    >
      <Modal.Header closeButton={!isSubmitting}>
        <Modal.Title className="late-adjustment-modal__title">
          <Clock size={20} aria-hidden />
          Request late adjustment
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="late-adjustment-modal__intro">
          {lateMinutes != null && lateMinutes > 0
            ? `You were marked ${lateMinutes} minute${lateMinutes === 1 ? "" : "s"} late today. Explain why your manager should approve an adjustment.`
            : "Explain why your manager should approve a late adjustment for today."}
        </p>
        <Form.Group controlId="late-adjustment-reason">
          <Form.Label>Reason *</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            value={reason}
            disabled={isSubmitting}
            placeholder="e.g. Traffic delay on Sheikh Zayed Road"
            onChange={(event) => {
              setReason(event.target.value);
              if (error) {
                setError(null);
              }
            }}
          />
          {error ? <p className="late-adjustment-modal__error">{error}</p> : null}
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" type="button" disabled={isSubmitting} onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="primary" type="button" disabled={isSubmitting} onClick={handleConfirm}>
          {isSubmitting ? "Submitting…" : "Submit request"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
*/
