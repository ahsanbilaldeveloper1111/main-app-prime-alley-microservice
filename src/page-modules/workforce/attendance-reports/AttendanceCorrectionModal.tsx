import {
  ATTENDANCE_CORRECTION_STATUS_OPTIONS,
  buildAttendanceCorrectionFormState,
  buildAttendanceCorrectionPayload,
  computeCorrectionTotalMinutes,
  type AttendanceCorrectionFormState,
  type AttendanceCorrectionTarget,
  validateAttendanceCorrectionForm,
} from "@page-modules/workforce/attendance-reports/attendanceCorrectionDomain";
import { MainSettingsDatePicker } from "@components/main-settings/MainSettingsFormPrimitives";
import { ClipboardEdit } from "lucide-react";
import type { AttendanceCorrectionPayload } from "@utils/staffManagement";
import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";

export type AttendanceCorrectionModalProps = Readonly<{
  show: boolean;
  tenantId: string | null;
  target: AttendanceCorrectionTarget | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: AttendanceCorrectionPayload) => void;
}>;

function CorrectionDateTimeField({
  id,
  label,
  value,
  disabled,
  onChange,
}: Readonly<{
  id: string;
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}>) {
  return (
    <Form.Group controlId={id} className="attendance-correction-modal__field">
      <Form.Label className="attendance-correction-modal__label">{label}</Form.Label>
      <Form.Control
        type="datetime-local"
        step={60}
        size="sm"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </Form.Group>
  );
}

export function AttendanceCorrectionModal({
  show,
  tenantId,
  target,
  isSubmitting,
  onClose,
  onSubmit,
}: AttendanceCorrectionModalProps) {
  const [form, setForm] = useState<AttendanceCorrectionFormState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!show || !target) {
      setForm(null);
      setFormError(null);
      return;
    }

    setForm(buildAttendanceCorrectionFormState(target));
    setFormError(null);
  }, [show, target]);

  const updateForm = (patch: Partial<AttendanceCorrectionFormState>) => {
    setForm((current) => {
      if (!current) {
        return current;
      }

      const next = { ...current, ...patch };
      if ("checkInAtLocal" in patch || "checkOutAtLocal" in patch) {
        const computed = computeCorrectionTotalMinutes(next.checkInAtLocal, next.checkOutAtLocal);
        if (computed != null) {
          next.totalMinutes = String(computed);
        }
      }

      return next;
    });
    setFormError(null);
  };

  const handleSubmit = () => {
    if (!form || !target || !tenantId?.trim()) {
      setFormError("Correction context is not available.");
      return;
    }

    const validationError = validateAttendanceCorrectionForm(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload = buildAttendanceCorrectionPayload({
      tenantId,
      userId: target.userId,
      form,
    });

    if (!payload) {
      setFormError("Unable to build correction request.");
      return;
    }

    onSubmit(payload);
  };

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      size="lg"
      className="attendance-correction-modal"
      backdrop={isSubmitting ? "static" : true}
      keyboard={!isSubmitting}
    >
      <Modal.Header closeButton={!isSubmitting}>
        <Modal.Title className="attendance-correction-modal__title">
          <ClipboardEdit size={20} aria-hidden />
          Attendance correction
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {target ? (
          <p className="attendance-correction-modal__intro">
            Submit a correction for <strong>{target.employeeName}</strong> (
            {target.userId}) on {target.workDate}.
          </p>
        ) : null}

        {form ? (
          <div className="attendance-correction-modal__form">
            <Form.Group controlId="attendance-correction-work-date" className="attendance-correction-modal__field">
              <Form.Label className="attendance-correction-modal__label">Work date</Form.Label>
              <MainSettingsDatePicker
                id="attendance-correction-work-date"
                value={form.workDate}
                disabled={isSubmitting}
                onChange={(value) => updateForm({ workDate: value })}
              />
            </Form.Group>

            <CorrectionDateTimeField
              id="attendance-correction-check-in"
              label="Check in"
              value={form.checkInAtLocal}
              disabled={isSubmitting}
              onChange={(value) => updateForm({ checkInAtLocal: value })}
            />

            <CorrectionDateTimeField
              id="attendance-correction-check-out"
              label="Check out"
              value={form.checkOutAtLocal}
              disabled={isSubmitting}
              onChange={(value) => updateForm({ checkOutAtLocal: value })}
            />

            <Form.Group controlId="attendance-correction-status" className="attendance-correction-modal__field">
              <Form.Label className="attendance-correction-modal__label">Status</Form.Label>
              <Form.Select
                size="sm"
                value={form.status}
                disabled={isSubmitting}
                onChange={(event) => updateForm({ status: event.target.value as AttendanceCorrectionFormState["status"] })}
              >
                {ATTENDANCE_CORRECTION_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <div className="attendance-correction-modal__inline-fields">
              <Form.Group controlId="attendance-correction-late-minutes" className="attendance-correction-modal__field">
                <Form.Label className="attendance-correction-modal__label">Late minutes</Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  step={1}
                  size="sm"
                  value={form.lateMinutes}
                  disabled={isSubmitting}
                  onChange={(event) => updateForm({ lateMinutes: event.target.value })}
                />
              </Form.Group>

              <Form.Group controlId="attendance-correction-total-minutes" className="attendance-correction-modal__field">
                <Form.Label className="attendance-correction-modal__label">Total minutes</Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  step={1}
                  size="sm"
                  value={form.totalMinutes}
                  disabled={isSubmitting}
                  onChange={(event) => updateForm({ totalMinutes: event.target.value })}
                />
              </Form.Group>
            </div>

            <Form.Group controlId="attendance-correction-reason" className="attendance-correction-modal__field">
              <Form.Label className="attendance-correction-modal__label">Reason</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                size="sm"
                value={form.reason}
                disabled={isSubmitting}
                placeholder="Explain why this correction is required."
                onChange={(event) => updateForm({ reason: event.target.value })}
              />
            </Form.Group>
          </div>
        ) : null}

        {formError ? <p className="attendance-correction-modal__error">{formError}</p> : null}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" type="button" disabled={isSubmitting} onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          type="button"
          className="attendance-correction-modal__submit-btn"
          disabled={isSubmitting || !form || !tenantId}
          onClick={handleSubmit}
        >
          {isSubmitting ? "Submitting…" : "Submit correction"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
