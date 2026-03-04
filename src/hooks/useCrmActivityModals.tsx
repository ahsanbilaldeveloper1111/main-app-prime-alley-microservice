/**
 * Shared hook for CRM activity modals (Note, Email, Task, Meeting, SMS, WhatsApp)
 * used on prospect, lead, deal, and order detail pages. Provides modal state,
 * openers for the sidebar icon bar, and props for CrmActivitiesPanel.
 */
import React, { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { createCrmNote, createMeeting, createTask } from "@utils/crm";
import { sendEmail, sendSms, sendWhatsApp } from "@utils/communication";
import NotesModal from "@components/NotesModal";
import EmailModal from "@components/EmailModal";
import TaskModal from "@components/TaskModal";
import MeetingModal from "@components/MeetingModal";
import LogSmsModal from "@components/LogSms";
import WhatsAppMessageModal from "@components/WhatsAppMessageModalNew";
import { toast } from "react-toastify";

export type CrmRecordType = "prospect" | "lead" | "deal" | "order" | "company";

export interface UseCrmActivityModalsParams {
  recordType: CrmRecordType;
  recordId: number;
  recordName: string;
  recordEmail?: string;
  /** Phone number for SMS / WhatsApp (e.g. prospect.data.phone). */
  recordPhone?: string;
  /** Called after a task is created (e.g. from sidebar modal) so the Activities panel can refetch tasks. */
  onTaskCreated?: () => void;
  /** Called after a note is created so CrmActivitiesPanel can refetch notes. */
  onNoteCreated?: () => void;
  /** Called after an email is sent so CrmActivitiesPanel can refetch emails. */
  onEmailSent?: () => void;
  /** Called after a meeting is scheduled so CrmActivitiesPanel can refetch meetings. */
  onMeetingScheduled?: () => void;
}

export interface UseCrmActivityModalsReturn {
  openNote: () => void;
  openEmail: () => void;
  openTask: () => void;
  openMeeting: () => void;
  openSms: () => void;
  openWhatsApp: () => void;
  /** Spread onto CrmActivitiesPanel so its "Add" buttons open these modals */
  crmActivitiesPanelProps: {
    onOpenNote: () => void;
    onOpenEmail: () => void;
    onOpenTask: () => void;
    onOpenMeeting: () => void;
  };
  /** Render this in the page so the modals are mounted */
  modals: React.ReactNode;
}

export function useCrmActivityModals({
  recordType,
  recordId,
  recordName,
  recordEmail = "",
  recordPhone = "",
  onTaskCreated,
  onNoteCreated,
  onEmailSent,
  onMeetingScheduled,
}: UseCrmActivityModalsParams): UseCrmActivityModalsReturn {
  const { data: session } = useSession();
  const userEmail =
    (session?.user as { email?: string } | undefined)?.email ?? "user@example.com";
  const userName =
    (session?.user as { name?: string } | undefined)?.name ?? "Your Name";
  const extension =
    (session?.user as { extension?: string; phone?: string } | undefined)?.extension ??
    (session?.user as { extension?: string; phone?: string } | undefined)?.phone ??
    "unknown";
  const tenantId =
    (session?.user as { tenant_id?: string; tenant?: string } | undefined)?.tenant_id ??
    (session?.user as { tenant_id?: string; tenant?: string } | undefined)?.tenant ??
    "default";

  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  const openNote = useCallback(() => setShowNotesModal(true), []);
  const openEmail = useCallback(() => setShowEmailModal(true), []);
  const openTask = useCallback(() => setShowTaskModal(true), []);
  const openMeeting = useCallback(() => setShowMeetingModal(true), []);
  const openSms = useCallback(() => setShowSmsModal(true), []);
  const openWhatsApp = useCallback(() => setShowWhatsAppModal(true), []);

  const handleNoteSave = useCallback(
    async (
      note: string,
      _createTask: boolean,
      _taskDueDate?: string,
    ) => {
      const text = note.trim();
      if (!text) return;
      try {
        await createCrmNote({
          record_type: recordType,
          record_id: recordId,
          text,
        });
        setShowNotesModal(false);
        toast.success("Note created successfully");
        onNoteCreated?.();
      } catch {
        // createCrmNote shows toast on error
      }
    },
    [recordType, recordId, onNoteCreated],
  );

  const handleMeetingSchedule = useCallback(
    async (meetingData: {
      title: string;
      hostEmail: string;
      startDate: string;
      startTime: string;
      endTime: string;
      attendees: string[];
      location: string;
      reminders: string[];
      summary: string;
    }) => {
      const meeting_date = meetingData.startDate.slice(0, 10);
      const meeting_time =
        meetingData.startTime.length === 5
          ? meetingData.startTime
          : meetingData.startTime.slice(0, 5);
      const end_time =
        meetingData.endTime.length === 5
          ? meetingData.endTime
          : meetingData.endTime.slice(0, 5);
      const extensions = [extension.slice(0, 15) || meetingData.hostEmail?.slice(0, 15) || "0"];
      const start_date_time = `${meeting_date}T${meeting_time}:00`;
      const end_date_time = `${meeting_date}T${end_time}:00`;
      try {
        await createMeeting({
          name: meetingData.title.trim(),
          meeting_type: "Video",
          meeting_date,
          meeting_time,
          record_type: recordType as "prospect" | "lead" | "deal" | "order",
          record_id: recordId,
          extensions,
          tenant_id: tenantId,
          extension_user: extension,
          start_date_time,
          end_date_time,
          ...(meetingData.attendees?.length > 0 && {
            emails: meetingData.attendees,
            attendees: meetingData.attendees,
          }),
          ...(meetingData.reminders?.length > 0 && { reminders: meetingData.reminders }),
          ...(meetingData.summary?.trim()
            ? { summary: meetingData.summary.trim().slice(0, 255) }
            : {}),
        });
        setShowMeetingModal(false);
        onMeetingScheduled?.();
      } catch {
        // createMeeting shows toast on error
      }
    },
    [recordType, recordId, onMeetingScheduled, extension, tenantId],
  );

  const handleEmailSend = useCallback(
    async (emailData: {
      to: string[];
      cc: string[];
      bcc: string[];
      subject: string;
      body: string;
      createTask: boolean;
      taskDueDate?: string;
      attachments?: File[];
    }) => {
      if (!emailData.to?.length) return;
      try {
        await sendEmail({
          to: emailData.to,
          cc: emailData.cc?.length ? emailData.cc : undefined,
          bcc: emailData.bcc?.length ? emailData.bcc : undefined,
          subject: emailData.subject ?? "",
          content: emailData.body ?? "",
          ...(recordId != null && { record_id: Number(recordId) }),
          ...(recordType && { record_type: recordType }),
        });
        setShowEmailModal(false);
        onEmailSent?.();
      } catch {
        // sendEmail shows toast on error
      }
    },
    [recordType, recordId, onEmailSent],
  );

  const parseTaskDueDate = useCallback(
    (activityDate: string, _activityTime: string): string => {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, "0");
      const d = String(today.getDate()).padStart(2, "0");
      const base = `${y}-${m}-${d}`;
      if (activityDate === "Today") return base;
      const addDays = (n: number) => {
        const t = new Date(today);
        t.setDate(t.getDate() + n);
        return t.toISOString().slice(0, 10);
      };
      if (activityDate === "Tomorrow") return addDays(1);
      if (activityDate?.includes("3 business") || activityDate?.includes("Friday"))
        return addDays(3);
      if (activityDate === "In 1 week") return addDays(7);
      if (activityDate === "In 2 weeks") return addDays(14);
      if (activityDate === "In 1 month") return addDays(30);
      return addDays(3);
    },
    [],
  );

  const handleTaskSave = useCallback(
    async (taskForm: {
      title: string;
      activityDate: string;
      activityTime: string;
      priority: string;
      notes: string;
    }) => {
      const due_date = parseTaskDueDate(
        taskForm.activityDate,
        taskForm.activityTime,
      );
      const urgency =
        taskForm.priority === "High"
          ? "high"
          : taskForm.priority === "Medium"
            ? "med"
            : "low";
      try {
        await createTask({
          name: taskForm.title.trim(),
          user_extension: extension,
          created_by: extension,
          urgency,
          due_date,
          time:
            taskForm.activityTime?.length >= 5
              ? taskForm.activityTime.slice(0, 5)
              : undefined,
          status: "pending",
          notes: taskForm.notes?.trim()
            ? [{ note: taskForm.notes.trim() }]
            : undefined,
          record_type: recordType,
          record_id: recordId,
        });
        setShowTaskModal(false);
        onTaskCreated?.();
      } catch {
        // createTask shows toast
      }
    },
    [
      recordType,
      recordId,
      extension,
      parseTaskDueDate,
      onTaskCreated,
    ],
  );

  const handleSmsLog = useCallback(
    async (smsData: {
      message: string;
      contacts: Array<{ id: string; name: string; email?: string }>;
      activityDate: string;
      createTask: boolean;
      taskDueDate?: string;
      attachments: File[];
    }) => {
      const to = (recordPhone ?? "").replace(/\s/g, "").trim();
      const body = smsData.message?.trim() ?? "";
      if (!to) {
        toast.error("No phone number available for this record.");
        return;
      }
      if (!body) {
        toast.error("Please enter a message.");
        return;
      }
      try {
        await sendSms({
          to,
          message: body,
          tenant_id: tenantId || "default",
          extension,
          ...(recordType && { record_type: recordType }),
          ...(recordId != null && { record_id: Number(recordId) }),
        });
        setShowSmsModal(false);
      } catch {
        // sendSms shows toast on error
      }
    },
    [recordType, recordId, recordPhone, tenantId, extension],
  );

  const handleWhatsAppLog = useCallback(
    async (whatsappData: {
      content_sid: string;
      content_variables: Record<string, string>;
    }) => {
      const number = (recordPhone ?? "").replace(/\s/g, "").trim();
      if (!number) {
        toast.error("No phone number available for this record.");
        return;
      }
      try {
        await sendWhatsApp({
          number,
          content_sid: whatsappData.content_sid,
          content_variables:
            Object.keys(whatsappData.content_variables || {}).length > 0
              ? whatsappData.content_variables
              : undefined,
        });
        setShowWhatsAppModal(false);
      } catch {
        // sendWhatsApp shows toast on error
      }
    },
    [recordPhone],
  );

  const modals = (
    <>
      <NotesModal
        isOpen={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        recordName={recordName}
        onSave={handleNoteSave}
      />
      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        recipientEmail={recordEmail}
        recipientName={recordName}
        senderEmail={userEmail}
        senderName={userName}
        onSend={handleEmailSend}
      />
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        assignedToName="Unassigned"
        onSave={handleTaskSave}
      />
      <MeetingModal
        isOpen={showMeetingModal}
        onClose={() => setShowMeetingModal(false)}
        hostEmail={userEmail}
        hostName={userName}
        attendeeEmail={recordEmail}
        attendeeName={recordName}
        recordType={recordType}
        recordId={recordId}
        onSchedule={handleMeetingSchedule}
      />
      <LogSmsModal
        isOpen={showSmsModal}
        onClose={() => setShowSmsModal(false)}
        associatedRecords={recordName ? [recordName] : []}
        onSave={handleSmsLog}
      />
      <WhatsAppMessageModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        associatedRecords={recordName ? [recordName] : []}
        onSave={handleWhatsAppLog}
      />
    </>
  );

  return {
    openNote,
    openEmail,
    openTask,
    openMeeting,
    openSms,
    openWhatsApp,
    crmActivitiesPanelProps: {
      onOpenNote: openNote,
      onOpenEmail: openEmail,
      onOpenTask: openTask,
      onOpenMeeting: openMeeting,
    },
    modals,
  };
}
