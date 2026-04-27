/**
 * LogActivityModal
 * ----------------
 *
 * Generic modal used to **log** (not send) a CRM activity into the record's
 * history / audit log. Mirrors the lightweight pattern of `LogCallModal` but
 * works for any activity kind (call, email, SMS, WhatsApp, meeting).
 *
 * The user picks:
 *   - When the activity took place (datetime-local, defaults to now)
 *   - Who it was with (target — e.g. phone number, email, attendees)
 *   - A short subject line
 *   - An optional longer description
 *
 * On Save we build a single human-readable description string in the form
 *
 *     "<Kind> sent to <target> on <local datetime> with subject <subject>"
 *     "<Kind> <description>"
 *
 * which is what gets persisted via `POST /crm/audit-logs`.
 *
 * This component is purely presentational — it does not hit any APIs. The
 * caller is responsible for wiring `onSave` to `createCrmAuditLog`.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

export type LogActivityKind =
  | "call"
  | "email"
  | "sms"
  | "whatsapp"
  | "meeting";

export interface LogActivityPayload {
  kind: LogActivityKind;
  /** Local YYYY-MM-DDTHH:mm string from the datetime picker. */
  activityDate: string;
  /** UTC ISO string equivalent of `activityDate` — convenient for callers. */
  activityDateUtcIso: string;
  /** Who/what this activity was with (phone, email, attendee list, etc.). */
  target: string;
  /** Short subject / headline. */
  subject: string;
  /** Optional longer description. */
  description: string;
}

export interface LogActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Activity kind — controls labels and the placeholder for `target`. */
  kind: LogActivityKind;
  /** Display name of the record this is being logged on (e.g. prospect name). */
  recordName?: string;
  /** Pre-fill for the `target` field (e.g. prospect.phone for call/sms/whatsapp). */
  defaultTarget?: string;
  /** Pre-fill for the `subject` field. */
  defaultSubject?: string;
  /** Async/sync save handler; modal stays open until this resolves. */
  onSave: (payload: LogActivityPayload) => void | Promise<void>;
}

/** Format a Date as the value expected by `<input type="datetime-local">`. */
function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

const KIND_CONFIG: Record<
  LogActivityKind,
  {
    title: string;
    targetLabel: string;
    targetPlaceholder: string;
    subjectLabel: string;
    descriptionLabel: string;
    /** Past-tense verb used in the audit-log description. */
    pastVerb: string;
    /** Preposition between the verb and the target ("to" / "with"). */
    preposition: string;
  }
> = {
  call: {
    title: "Log a Call",
    targetLabel: "Phone number",
    targetPlaceholder: "+1 555 123 4567",
    subjectLabel: "Subject / Outcome",
    descriptionLabel: "Notes",
    pastVerb: "Call made",
    preposition: "to",
  },
  email: {
    title: "Log an Email",
    targetLabel: "Recipient email",
    targetPlaceholder: "name@example.com",
    subjectLabel: "Subject",
    descriptionLabel: "Body / Notes",
    pastVerb: "Email sent",
    preposition: "to",
  },
  sms: {
    title: "Log an SMS",
    targetLabel: "Phone number",
    targetPlaceholder: "+1 555 123 4567",
    subjectLabel: "Subject",
    descriptionLabel: "Message / Notes",
    pastVerb: "SMS sent",
    preposition: "to",
  },
  whatsapp: {
    title: "Log a WhatsApp",
    targetLabel: "Phone number",
    targetPlaceholder: "+1 555 123 4567",
    subjectLabel: "Subject",
    descriptionLabel: "Message / Notes",
    pastVerb: "WhatsApp message sent",
    preposition: "to",
  },
  meeting: {
    title: "Log a Meeting",
    targetLabel: "Attendees",
    targetPlaceholder: "John Doe, jane@example.com",
    subjectLabel: "Subject / Title",
    descriptionLabel: "Notes / Outcome",
    pastVerb: "Meeting held",
    preposition: "with",
  },
};

const FORMAT_DATE_OPTS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
};

/**
 * Build the final description string sent to the audit-log API.
 * Exported for unit-testability + reuse by the hook.
 */
export function buildLogActivityDescription(
  payload: LogActivityPayload,
  recordName?: string,
): string {
  const cfg = KIND_CONFIG[payload.kind];
  const whenLocal = new Date(payload.activityDate).toLocaleString(
    undefined,
    FORMAT_DATE_OPTS,
  );
  const targetPart = payload.target.trim()
    ? ` ${cfg.preposition} ${payload.target.trim()}`
    : "";
  const recordPart = recordName ? ` for ${recordName}` : "";
  const subjectPart = payload.subject.trim()
    ? ` with subject "${payload.subject.trim()}"`
    : "";
  const descPart = payload.description.trim()
    ? ` — ${payload.description.trim()}`
    : "";
  return `${cfg.pastVerb}${targetPart}${recordPart} on ${whenLocal}${subjectPart}${descPart}`;
}

const LogActivityModal: React.FC<LogActivityModalProps> = ({
  isOpen,
  onClose,
  kind,
  recordName,
  defaultTarget = "",
  defaultSubject = "",
  onSave,
}) => {
  const cfg = useMemo(() => KIND_CONFIG[kind], [kind]);

  const [activityDate, setActivityDate] = useState(() =>
    toDatetimeLocalValue(new Date()),
  );
  const [target, setTarget] = useState(defaultTarget);
  const [subject, setSubject] = useState(defaultSubject);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const subjectRef = useRef<HTMLInputElement>(null);

  // Reset form whenever the modal is (re)opened so it doesn't show stale state
  // from a previous "Log a ___" invocation on a different record.
  useEffect(() => {
    if (!isOpen) return;
    setActivityDate(toDatetimeLocalValue(new Date()));
    setTarget(defaultTarget);
    setSubject(defaultSubject);
    setDescription("");
    setSubmitting(false);
    setTimeout(() => subjectRef.current?.focus(), 60);
  }, [isOpen, defaultTarget, defaultSubject]);

  const handleSave = async () => {
    if (!activityDate) return;
    if (!subject.trim() && !description.trim()) {
      // Require at least one of subject/description so the history entry
      // isn't an empty "WhatsApp sent on ... " row.
      subjectRef.current?.focus();
      return;
    }
    const localDate = new Date(activityDate);
    const payload: LogActivityPayload = {
      kind,
      activityDate,
      activityDateUtcIso: Number.isNaN(localDate.getTime())
        ? new Date().toISOString()
        : localDate.toISOString(),
      target: target.trim(),
      subject: subject.trim(),
      description: description.trim(),
    };
    try {
      setSubmitting(true);
      await onSave(payload);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const canSave = !submitting && !!activityDate &&
    (subject.trim().length > 0 || description.trim().length > 0);

  return (
    <Modal show={isOpen} onHide={onClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          {cfg.title}
          {recordName ? ` — ${recordName}` : ""}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSave();
          }}
        >
          <Form.Group className="mb-3" controlId="logActivityWhen">
            <Form.Label>When *</Form.Label>
            <Form.Control
              type="datetime-local"
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
              required
            />
            <Form.Text className="text-muted">
              When did this {kind} actually take place?
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3" controlId="logActivityTarget">
            <Form.Label>{cfg.targetLabel}</Form.Label>
            <Form.Control
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={cfg.targetPlaceholder}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="logActivitySubject">
            <Form.Label>{cfg.subjectLabel}</Form.Label>
            <Form.Control
              ref={subjectRef}
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={`Brief ${cfg.subjectLabel.toLowerCase()}…`}
              maxLength={255}
            />
          </Form.Group>

          <Form.Group className="mb-2" controlId="logActivityDescription">
            <Form.Label>{cfg.descriptionLabel}</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`Anything else worth recording about this ${kind}…`}
              maxLength={1800}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => void handleSave()}
          disabled={!canSave}
        >
          {submitting ? "Saving…" : "Log to history"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default LogActivityModal;
