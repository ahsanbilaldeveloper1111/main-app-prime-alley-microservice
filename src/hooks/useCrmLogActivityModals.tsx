/**
 * Shared hook that powers the **"Log a ___"** family of actions in CRM
 * record sidebars (prospects, leads, deals, orders, etc.).
 *
 * Conceptually distinct from `useCrmActivityModals`:
 *   - `useCrmActivityModals` opens dialogs that **actually send / create**
 *     things (real emails, SMS, WhatsApp messages, meetings, tasks, notes).
 *   - `useCrmLogActivityModals` opens a single generic dialog where the user
 *     **records** that something happened out-of-band — they pick the time,
 *     who it was with, a subject, and notes — and we write a single
 *     audit-log entry to the record's history via `POST /crm/audit-logs`.
 */
import React, { useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";
import LogActivityModal, {
  buildLogActivityDescription,
  type LogActivityKind,
  type LogActivityPayload,
} from "@components/LogActivityModal";
import {
  createCrmAuditLog,
  type CrmAuditLogRecordType,
} from "@utils/crm";

export interface UseCrmLogActivityModalsParams {
  recordType: CrmAuditLogRecordType;
  recordId: number;
  recordName?: string;
  recordPhone?: string;
  recordEmail?: string;
  /** Called after a successful log entry is written, e.g. for refetching history. */
  onLogged?: (kind: LogActivityKind) => void;
}

export interface UseCrmLogActivityModalsReturn {
  openLogCall: () => void;
  openLogEmail: () => void;
  openLogSms: () => void;
  openLogWhatsApp: () => void;
  openLogMeeting: () => void;
  /** Render this in the page so the modal is mounted. */
  modals: React.ReactNode;
}

/** Pick the most useful pre-fill for the modal's `target` field per kind. */
function defaultTargetForKind(
  kind: LogActivityKind,
  phone?: string,
  email?: string,
): string {
  switch (kind) {
    case "email":
      return email ?? "";
    case "call":
    case "sms":
    case "whatsapp":
      return phone ?? "";
    case "meeting":
    default:
      return "";
  }
}

/** Maps the activity kind to the audit-log `event` value. */
const EVENT_BY_KIND: Record<LogActivityKind, string> = {
  call: "call_logged",
  email: "email_logged",
  sms: "sms_logged",
  whatsapp: "whatsapp_logged",
  meeting: "meeting_logged",
};

export function useCrmLogActivityModals({
  recordType,
  recordId,
  recordName,
  recordPhone,
  recordEmail,
  onLogged,
}: UseCrmLogActivityModalsParams): UseCrmLogActivityModalsReturn {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<LogActivityKind>("call");

  const openFor = useCallback((nextKind: LogActivityKind) => {
    setKind(nextKind);
    setOpen(true);
  }, []);

  const openLogCall = useCallback(() => openFor("call"), [openFor]);
  const openLogEmail = useCallback(() => openFor("email"), [openFor]);
  const openLogSms = useCallback(() => openFor("sms"), [openFor]);
  const openLogWhatsApp = useCallback(() => openFor("whatsapp"), [openFor]);
  const openLogMeeting = useCallback(() => openFor("meeting"), [openFor]);

  const handleSave = useCallback(
    async (payload: LogActivityPayload) => {
      if (!Number.isFinite(Number(recordId)) || Number(recordId) <= 0) {
        toast.error("Cannot log activity: missing record id.");
        return;
      }
      const description = buildLogActivityDescription(payload, recordName);
      const result = await createCrmAuditLog({
        record_type: recordType,
        record_id: Number(recordId),
        event: EVENT_BY_KIND[payload.kind],
        action: "logged",
        description,
      });
      if (result === null) {
        // createCrmAuditLog already logged to console; tell the user as well
        // since this hook *is* the user-facing log action.
        toast.error("Failed to write history entry.");
        return;
      }
      toast.success("Activity logged to history.");
      onLogged?.(payload.kind);
    },
    [recordType, recordId, recordName, onLogged],
  );

  const defaultTarget = useMemo(
    () => defaultTargetForKind(kind, recordPhone, recordEmail),
    [kind, recordPhone, recordEmail],
  );

  const modals = (
    <LogActivityModal
      isOpen={open}
      onClose={() => setOpen(false)}
      kind={kind}
      recordName={recordName}
      defaultTarget={defaultTarget}
      onSave={handleSave}
    />
  );

  return {
    openLogCall,
    openLogEmail,
    openLogSms,
    openLogWhatsApp,
    openLogMeeting,
    modals,
  };
}
