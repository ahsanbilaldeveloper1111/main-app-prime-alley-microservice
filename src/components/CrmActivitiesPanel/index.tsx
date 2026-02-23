/**
 * CrmActivitiesPanel – reusable Activities tab content for CRM record detail pages
 * (prospect, lead, deal, order). Renders activity sub-tabs and their content.
 */
import React, { useState, useRef, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import {
  X, ChevronDown, ChevronRight, Mail, Calendar, MessageSquare, ClipboardList,
  FileText, Pencil, Trash2, MessageCircle, AlertCircle, Phone,
} from 'lucide-react';
import { getCrmNotes, updateCrmNote, deleteCrmNote, getCrmMeetingsForRecord, updateMeeting, deleteMeeting, getCampaigns, getTasks, createTask, updateTask, deleteTask, createTaskNote, type CrmNoteItem, type CrmMeetingListItem, type AuditTrailEntry, type TaskData } from '@utils/crm';
import { getSmsList, getChats, getWhatsAppChatMessages, sendWhatsApp, getEmails, type SmsListItem, type SmsListMeta } from '@utils/communication';
import { GlobalDateTimeFormat, ModuleSlug } from '@utils/Helper';
import { ListCallLogs } from '@utils/calls';
import axiosInstance from '@utils/axios';
import CallLog from '@components/CallLogNew';
import AudioPlayer, { AudioPlayerRef } from '@components/AudioPlayer';
import NotesModal from '@components/NotesModal';
import EmailModal from '@components/EmailModal';
import TaskModal from '@components/TaskModal';
import MeetingModal from '@components/MeetingModal';
import DeleteConfirmationModal from '@pages/partial/DeleteConfirmationModal';
import { useHierarchyData } from '@components/filters/useHierarchyData';
import { useSession } from 'next-auth/react';
import moment from 'moment-timezone';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
interface ActivityItem {
  id: string;
  type: 'invoice' | 'email' | 'subscription' | 'note' | 'call' | 'meeting' | 'task';
  title: string;
  description: string;
  timestamp: string;
  user?: string;
  expanded?: boolean;
  auditEvent?: 'created' | 'updated';
  auditDescription?: string;
  auditChanges?: Array<{ field: string; oldVal: string; newVal: string }>;
}

interface WhatsAppChatItem {
  id: number;
  phone_number: string;
  last_message_preview?: string;
  last_message_at?: string;
  window_started_at?: string;
}

interface WhatsAppMessage {
  id: number;
  direction: 'inbound' | 'outbound';
  message: string;
  message_type?: string;
  created_at: string;
  status?: string;
}

/** Email item from GET emails response (matches API structure) */
interface EmailListItem {
  id: number | string;
  created_by?: string;
  to?: string[];
  subject?: string;
  content?: string;
  content_type?: string;
  cc?: string[] | null;
  bcc?: string[] | null;
  reply_to?: string | null;
  attachments?: string[];
  status?: string;
  error_message?: string | null;
  status_code?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  tenant_id?: string;
}

/** Pagination meta from GET emails response */
interface EmailsMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}

export interface CrmActivitiesRecord {
  id?: number;
  data?: { id?: number; name?: string; phone?: string; data?: Record<string, any> };
  audit_trail?: AuditTrailEntry[];
}

/** Extract HTML from email content (strip markdown code fence if present) */
function getEmailPreviewHtml(content: string | undefined): string {
  if (!content || typeof content !== 'string') return '';
  const raw = content.trim();
  const htmlMatch = raw.match(/^```html?\s*([\s\S]*?)```$/im) ?? raw.match(/^```\s*([\s\S]*?)```$/im);
  return htmlMatch ? htmlMatch[1].trim() : raw;
}

/** Format raw audit value for display (pure, no hooks). */
function formatValForAudit(v: unknown): string {
  if (v == null) return '—';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

/** Resolve assigned_to ID/extension to display label (pure). */
function resolveAssignedToLabel(
  val: unknown,
  extensions: Array<{ id?: number; extension?: string; display_name?: string; name?: string }> | null | undefined,
  fallback: (v: unknown) => string,
): string {
  if (val == null) return fallback(val);
  if (!extensions?.length) return fallback(val);
  const str = String(val);
  const num = Number(val);
  const ext = extensions.find(
    (e) =>
      (e?.id != null && (Number(e.id) === num || String(e.id) === str)) ||
      (e?.extension != null && String(e.extension) === str),
  );
  if (ext) return (ext.display_name ?? ext.name ?? fallback(val)).trim() || fallback(val);
  return fallback(val);
}

/** Resolve campaign_id to campaign name (pure). */
function resolveCampaignLabel(
  val: unknown,
  campaigns: Array<{ id: number; name: string }> | null | undefined,
  fallback: (v: unknown) => string,
): string {
  if (val == null) return fallback(val);
  if (!campaigns?.length) return fallback(val);
  const id = typeof val === 'number' ? val : Number(val);
  if (Number.isNaN(id)) return fallback(val);
  const c = campaigns.find((c) => c.id === id);
  return c?.name ?? fallback(val);
}

/** Audit trail field names that store user/extension ID – resolved to display name via extensions list */
const AUDIT_FIELDS_EXTENSION = new Set<string>(['assigned_to', 'contact_owner']);

const ACTIVITY_TYPE_TABS = [
  { id: 'activity', label: 'Activity' },
  { id: 'notes', label: 'Notes' },
  { id: 'emails', label: 'Emails' },
  { id: 'calls', label: 'Calls' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'meetings', label: 'Meetings' },
  { id: 'sms', label: 'SMS' },
  { id: 'whatsapp', label: 'WhatsApp' },
] as const;

/** Extension item for resolving assigned_to IDs to labels in audit trail */
export type AuditTrailExtension = { id?: number; extension?: string; display_name?: string; name?: string };
/** Campaign item for resolving campaign_id to label in audit trail */
export type AuditTrailCampaign = { id: number; name: string };

export interface CrmActivitiesPanelProps {
  recordType: 'prospect' | 'lead' | 'deal' | 'order';
  recordId: number;
  record: CrmActivitiesRecord | null;
  recordLoading?: boolean;
  recordName?: string;
  canSendWhatsApp?: boolean;
  /** Optional: used to show assignee name instead of ID in Activity audit trail */
  extensions?: AuditTrailExtension[] | null;
  /** Optional: used to show campaign name instead of ID in Activity audit trail */
  campaigns?: AuditTrailCampaign[] | null;
  /** When provided, "Add" buttons open these modals instead of panel-owned modals (parent renders modals). */
  onOpenNote?: () => void;
  onOpenEmail?: () => void;
  onOpenTask?: () => void;
  onOpenMeeting?: () => void;
  /** Called with refetch function so parent can trigger tasks refetch (e.g. after creating task from sidebar modal). */
  onTasksRefetchReady?: (fetchTasks: () => void) => void;
}

export interface CrmActivitiesPanelRef {
  refetchTasks?: () => void;
  refetchNotes?: () => void;
  refetchEmails?: () => void;
  refetchMeetings?: () => void;
}

const CrmActivitiesPanelInnerRender: React.ForwardRefRenderFunction<CrmActivitiesPanelRef, CrmActivitiesPanelProps> = (
  {
    recordType,
    recordId,
    record,
    recordLoading = false,
    recordName = 'Record',
    canSendWhatsApp = false,
    extensions: extensionsProp,
    campaigns,
    onOpenNote,
    onOpenEmail,
    onOpenTask,
    onOpenMeeting,
    onTasksRefetchReady,
  },
  ref,
) => {
  const { data: session } = useSession();
  const extension = (session?.user as { extension?: string; phone?: string } | undefined)?.extension
    ?? (session?.user as { extension?: string; phone?: string } | undefined)?.phone
    ?? '';
  const useExternalModals = Boolean(onOpenNote ?? onOpenEmail ?? onOpenTask ?? onOpenMeeting);
  const [activityFilter, setActivityFilter] = useState('activity');
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());
  const [notesList, setNotesList] = useState<CrmNoteItem[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [noteToDelete, setNoteToDelete] = useState<CrmNoteItem | null>(null);
  const [noteDeleteLoading, setNoteDeleteLoading] = useState(false);
  const [meetingsList, setMeetingsList] = useState<CrmMeetingListItem[]>([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [meetingsError, setMeetingsError] = useState<string | null>(null);
  const [meetingToDelete, setMeetingToDelete] = useState<CrmMeetingListItem | null>(null);
  const [meetingDeleteLoading, setMeetingDeleteLoading] = useState(false);
  const [editingMeetingId, setEditingMeetingId] = useState<number | null>(null);
  const [editingMeetingForm, setEditingMeetingForm] = useState({ name: '', meeting_date: '', meeting_time: '', meeting_type: 'Video' });
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [tasksList, setTasksList] = useState<TaskData[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TaskData | null>(null);
  const [taskDeleteLoading, setTaskDeleteLoading] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTaskForm, setEditingTaskForm] = useState({ name: '', due_date: '', time: '', status: 'pending' as 'pending' | 'completed' | 'failed', urgency: 'med' as 'low' | 'med' | 'high' });
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [smsList, setSmsList] = useState<SmsListItem[]>([]);
  const [smsLoading, setSmsLoading] = useState(false);
  const [smsError, setSmsError] = useState<string | null>(null);
  const [smsMeta, setSmsMeta] = useState<SmsListMeta | null>(null);
  const [smsPage, setSmsPage] = useState(1);
  const [smsPerPage, setSmsPerPage] = useState(15);
  const [selectedSmsId, setSelectedSmsId] = useState<number | null>(null);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [whatsappChats, setWhatsappChats] = useState<WhatsAppChatItem[]>([]);
  const [whatsappChatsLoading, setWhatsappChatsLoading] = useState(false);
  const [whatsappChatsError, setWhatsappChatsError] = useState<string | null>(null);
  const [selectedWhatsAppChatId, setSelectedWhatsAppChatId] = useState<number | null>(null);
  const [selectedWhatsAppChat, setSelectedWhatsAppChat] = useState<WhatsAppChatItem | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappMessages, setWhatsappMessages] = useState<WhatsAppMessage[]>([]);
  const [whatsappMessagesLoading, setWhatsappMessagesLoading] = useState(false);
  const [whatsappChatWindowInfo, setWhatsappChatWindowInfo] = useState<{
    is_within_24h_window?: boolean;
    window_started_at?: string;
    window_minutes_remaining?: number;
  } | null>(null);
  const [whatsappReplyMessage, setWhatsappReplyMessage] = useState('');
  const [whatsappReplySendLoading, setWhatsappReplySendLoading] = useState(false);
  const [emailsList, setEmailsList] = useState<EmailListItem[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [emailsError, setEmailsError] = useState<string | null>(null);
  const [emailsMeta, setEmailsMeta] = useState<EmailsMeta | null>(null);
  const [emailsPage, setEmailsPage] = useState(1);
  const [emailsPerPage, setEmailsPerPage] = useState(15);
  const [selectedEmailId, setSelectedEmailId] = useState<number | string | null>(null);
  const [callRecordings, setCallRecordings] = useState<any[]>([]);
  const [callRecordingsLoading, setCallRecordingsLoading] = useState(false);
  const [callRecordingsTotal, setCallRecordingsTotal] = useState(0);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [recordingModalAudioUrl, setRecordingModalAudioUrl] = useState('');
  const [recordingModalLoading, setRecordingModalLoading] = useState(false);
  const [recordingModalError, setRecordingModalError] = useState<string | null>(null);
  const [selectedRecordingForPlay, setSelectedRecordingForPlay] = useState<any>(null);
  const whatsappMessagesListRef = useRef<HTMLDivElement>(null);
  const recordingAudioPlayerRef = useRef<AudioPlayerRef>(null);
  const recordingModalAudioUrlRef = useRef<string>('');

  const { hierarchyDataExtensions } = useHierarchyData(ModuleSlug.CALL_RECORDINGS);
  const [campaignsList, setCampaignsList] = useState<AuditTrailCampaign[]>([]);

  useEffect(() => {
    if (recordType !== 'prospect' && recordType !== 'lead') return;
    getCampaigns({ per_page: 1000 })
      .then((res) => setCampaignsList(res?.data ?? []))
      .catch(() => setCampaignsList([]));
  }, [recordType]);

  const extensionNameMap = useMemo(() => {
    const list = (hierarchyDataExtensions as { id?: string; name?: string }[]) ?? [];
    return list.reduce<Record<string, string>>((acc, ext) => {
      if (ext?.id != null) acc[String(ext.id)] = ext.name ?? String(ext.id);
      return acc;
    }, {});
  }, [hierarchyDataExtensions]);

  const fetchNotes = useCallback(() => {
    if (recordId == null || Number.isNaN(recordId)) return;
    setNotesLoading(true);
    setNotesError(null);
    getCrmNotes(recordType, recordId)
      .then((res: { data: CrmNoteItem[] }) => {
        setNotesList(res.data ?? []);
        setNotesError(null);
      })
      .catch(() => {
        setNotesList([]);
        setNotesError('Failed to load notes');
      })
      .finally(() => setNotesLoading(false));
  }, [recordType, recordId]);

  useEffect(() => {
    if (activityFilter !== 'notes' || recordId == null) return;
    fetchNotes();
  }, [activityFilter, recordId, fetchNotes]);

  const fetchMeetings = useCallback(() => {
    if (recordId == null || Number.isNaN(recordId)) return;
    setMeetingsLoading(true);
    setMeetingsError(null);
    getCrmMeetingsForRecord(recordType, recordId)
      .then((res: { data: CrmMeetingListItem[] }) => {
        setMeetingsList(res.data ?? []);
        setMeetingsError(null);
      })
      .catch(() => {
        setMeetingsList([]);
        setMeetingsError('Failed to load meetings');
      })
      .finally(() => setMeetingsLoading(false));
  }, [recordType, recordId]);

  useEffect(() => {
    if (activityFilter !== 'meetings' || recordId == null) return;
    fetchMeetings();
  }, [activityFilter, recordId, fetchMeetings]);

  const fetchTasks = useCallback(() => {
    if (recordId == null || Number.isNaN(recordId)) return;
    setTasksLoading(true);
    setTasksError(null);
    getTasks({ record_type: recordType, record_id: recordId, per_page: 100 })
      .then((res: { data?: TaskData[] }) => {
        setTasksList(Array.isArray(res?.data) ? res.data : []);
        setTasksError(null);
      })
      .catch(() => {
        setTasksList([]);
        setTasksError('Failed to load tasks');
      })
      .finally(() => setTasksLoading(false));
  }, [recordType, recordId]);

  useEffect(() => {
    if (activityFilter !== 'tasks' || recordId == null) return;
    fetchTasks();
  }, [activityFilter, recordId, fetchTasks]);

  useEffect(() => {
    onTasksRefetchReady?.(fetchTasks);
  }, [onTasksRefetchReady, fetchTasks]);

  const fetchSms = useCallback(() => {
    if (recordId == null || Number.isNaN(recordId)) return;
    setSmsLoading(true);
    setSmsError(null);
    getSmsList({
      page: String(smsPage),
      per_page: String(smsPerPage),
      record_type: recordType,
      record_id: recordId,
    })
      .then((res) => {
        setSmsList(Array.isArray(res?.data) ? res.data : []);
        setSmsMeta(res?.meta ?? null);
        setSmsError(null);
      })
      .catch((e) => {
        console.error('Failed to fetch SMS list', e);
        setSmsList([]);
        setSmsMeta(null);
        setSmsError('Failed to load SMS');
      })
      .finally(() => setSmsLoading(false));
  }, [recordType, recordId, smsPage, smsPerPage]);

  useEffect(() => {
    if (activityFilter !== 'sms' || recordId == null) return;
    fetchSms();
  }, [activityFilter, recordId, fetchSms]);

  const fetchWhatsAppChats = useCallback(() => {
    setWhatsappChatsLoading(true);
    setWhatsappChatsError(null);
    getChats()
      .then((res: unknown) => {
        const data = (res as { data?: WhatsAppChatItem[] })?.data;
        const list = Array.isArray(data) ? data : [];
        const recordPhone = (record?.data?.phone ?? '').replace(/\s/g, '');
        const filtered = recordPhone ? list.filter((c) => (c.phone_number ?? '').replace(/\s/g, '') === recordPhone) : list;
        setWhatsappChats(filtered);
        setWhatsappChatsError(null);
      })
      .catch((e) => {
        console.error('Failed to fetch WhatsApp chats', e);
        setWhatsappChats([]);
        setWhatsappChatsError('Failed to load WhatsApp chats');
      })
      .finally(() => setWhatsappChatsLoading(false));
  }, [record?.data?.phone]);

  useEffect(() => {
    if (activityFilter !== 'whatsapp') return;
    fetchWhatsAppChats();
  }, [activityFilter, fetchWhatsAppChats]);

  const fetchEmails = useCallback(() => {
    if (recordId == null || Number.isNaN(recordId)) return;
    setEmailsLoading(true);
    setEmailsError(null);
    getEmails({
      page: String(emailsPage),
      per_page: String(emailsPerPage),
      record_type: recordType,
      record_id: String(recordId),
    })
      .then((res: unknown) => {
        const data = (res as { data?: EmailListItem[] })?.data;
        const meta = (res as { meta?: EmailsMeta })?.meta;
        setEmailsList(Array.isArray(data) ? data : []);
        setEmailsMeta(meta ?? null);
        setEmailsError(null);
      })
      .catch((e) => {
        console.error('Failed to fetch emails', e);
        setEmailsList([]);
        setEmailsMeta(null);
        setEmailsError('Failed to load emails');
      })
      .finally(() => setEmailsLoading(false));
  }, [recordType, recordId, emailsPage, emailsPerPage]);

  useEffect(() => {
    if (activityFilter !== 'emails' || recordId == null) return;
    fetchEmails();
  }, [activityFilter, recordId, fetchEmails]);

  useImperativeHandle(
    ref,
    () => ({
      refetchTasks: fetchTasks,
      refetchNotes: fetchNotes,
      refetchEmails: fetchEmails,
      refetchMeetings: fetchMeetings,
    }),
    [fetchTasks, fetchNotes, fetchEmails, fetchMeetings],
  );

  const fetchCallRecordings = useCallback(async (phoneNumber: string) => {
    const normalizedPhone = (phoneNumber || '').replace(/\s/g, '');
    if (!normalizedPhone) {
      setCallRecordings([]);
      setCallRecordingsTotal(0);
      return;
    }
    setCallRecordingsLoading(true);
    try {
      const response = await ListCallLogs(
        {
          page: 1,
          perPage: 20,
          search: '',
          filters: { remote_party_number: [String(normalizedPhone)] },
          reportType: 'recordings',
          moduleSlug: ModuleSlug.CALL_RECORDINGS,
        },
        'call-logs/recordings',
      );
      const data = (response as { dataList?: any[]; total?: number }) ?? {};
      setCallRecordings(Array.isArray(data.dataList) ? data.dataList : []);
      setCallRecordingsTotal(typeof data.total === 'number' ? data.total : 0);
    } catch (err) {
      console.error('Failed to fetch call recordings:', err);
      setCallRecordings([]);
      setCallRecordingsTotal(0);
    } finally {
      setCallRecordingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activityFilter !== 'calls') return;
    const phone = record?.data?.phone;
    if (phone) fetchCallRecordings(phone);
    else {
      setCallRecordings([]);
      setCallRecordingsTotal(0);
    }
  }, [activityFilter, record?.data?.phone, fetchCallRecordings]);

  const loadAuthenticatedRecordingAudio = useCallback(async (audioTrackId: string, agentExtension: string, node?: string) => {
    if (!audioTrackId) return;
    setRecordingModalLoading(true);
    setRecordingModalError(null);
    setShowRecordingModal(true);
    try {
      const response = await axiosInstance.get(`call-logs/recordings/download/${audioTrackId}`, {
        responseType: 'blob',
        params: { extension_number: agentExtension, node },
        headers: { Accept: 'audio/*, application/octet-stream, */*' },
      });
      if (response.status === 200) {
        const blob = new Blob([response.data], { type: 'audio/mpeg' });
        const url = window.URL.createObjectURL(blob);
        recordingModalAudioUrlRef.current = url;
        setRecordingModalAudioUrl(url);
        setRecordingModalError(null);
      } else {
        setRecordingModalError(response.status === 204 ? 'Audio file not found' : `Unexpected status: ${response.status}`);
      }
    } catch {
      setRecordingModalError('Failed to load audio');
    } finally {
      setRecordingModalLoading(false);
    }
  }, []);

  const handlePlayRecording = useCallback((rec: any) => {
    if (!rec?.Id) return;
    setSelectedRecordingForPlay(rec);
    loadAuthenticatedRecordingAudio(rec.Id, rec.AgentExtension ?? '', rec.imagicle);
  }, [loadAuthenticatedRecordingAudio]);

  const closeRecordingModal = useCallback(() => {
    setShowRecordingModal(false);
    setSelectedRecordingForPlay(null);
    setRecordingModalLoading(false);
    setRecordingModalError(null);
    const url = recordingModalAudioUrlRef.current;
    if (url) {
      window.URL.revokeObjectURL(url);
      recordingModalAudioUrlRef.current = '';
      setRecordingModalAudioUrl('');
    }
    recordingAudioPlayerRef.current?.pause();
  }, []);

  useEffect(() => {
    if (!showWhatsAppModal || selectedWhatsAppChatId == null) {
      setWhatsappMessages([]);
      setWhatsappChatWindowInfo(null);
      return;
    }
    setWhatsappMessagesLoading(true);
    setWhatsappChatWindowInfo(null);
    getWhatsAppChatMessages({ chat_id: String(selectedWhatsAppChatId) })
      .then((res: unknown) => {
        const data = res as { messages?: WhatsAppMessage[]; chat?: { is_within_24h_window?: boolean; window_started_at?: string; window_minutes_remaining?: number } };
        setWhatsappMessages(Array.isArray(data?.messages) ? data.messages : []);
        setWhatsappChatWindowInfo(data?.chat ?? null);
      })
      .catch(() => {
        setWhatsappMessages([]);
        setWhatsappChatWindowInfo(null);
      })
      .finally(() => setWhatsappMessagesLoading(false));
  }, [showWhatsAppModal, selectedWhatsAppChatId]);

  useEffect(() => {
    if (whatsappMessagesLoading || whatsappMessages.length === 0) return;
    const el = whatsappMessagesListRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    const t = setTimeout(() => {
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
    return () => clearTimeout(t);
  }, [whatsappMessagesLoading, whatsappMessages]);

  const handleNoteCreate = useCallback((note: string) => {
    fetchNotes();
    setShowNotesModal(false);
  }, [fetchNotes]);

  const handleMeetingSchedule = useCallback(async () => {
    await fetchMeetings();
    setShowMeetingModal(false);
  }, [fetchMeetings]);

  const parseTaskDueDate = useCallback((activityDate: string, activityTime: string): string => {
    const today = new Date();
    const addDays = (n: number) => {
      const t = new Date(today);
      t.setDate(t.getDate() + n);
      return t.toISOString().slice(0, 10);
    };
    if (activityDate === 'Today') return addDays(0);
    if (activityDate === 'Tomorrow') return addDays(1);
    if (activityDate?.includes('3 business') || activityDate?.includes('Friday')) return addDays(3);
    if (activityDate === 'In 1 week') return addDays(7);
    if (activityDate === 'In 2 weeks') return addDays(14);
    if (activityDate === 'In 1 month') return addDays(30);
    return addDays(3);
  }, []);

  const handleTaskSave = useCallback(async (taskData: {
    title: string;
    activityDate: string;
    activityTime: string;
    reminder: string;
    repeat: boolean;
    taskType: string;
    priority: string;
    queue: string;
    assignedTo: string;
    notes: string;
  }) => {
    if (recordId == null || Number.isNaN(Number(recordId))) return;
    const due_date = parseTaskDueDate(taskData.activityDate, taskData.activityTime);
    const urgency = taskData.priority === 'High' ? 'high' : taskData.priority === 'Medium' ? 'med' : 'low';
    try {
      await createTask({
        name: taskData.title.trim() || 'Task',
        user_extension: extension,
        created_by: extension,
        urgency,
        due_date,
        time: taskData.activityTime?.length >= 5 ? taskData.activityTime.slice(0, 5) : undefined,
        status: 'pending',
        notes: taskData.notes?.trim() ? [{ note: taskData.notes.trim() }] : undefined,
        record_type: recordType,
        record_id: Number(recordId),
      });
      setShowTaskModal(false);
      await fetchTasks();
    } catch {
      // createTask shows toast on error
    }
  }, [recordType, recordId, extension, parseTaskDueDate, fetchTasks]);

  const handleTaskDeleteConfirm = useCallback(async () => {
    if (!taskToDelete || taskToDelete.id == null) return;
    setTaskDeleteLoading(true);
    try {
      await deleteTask(taskToDelete.id);
      setTaskToDelete(null);
      await fetchTasks();
    } finally {
      setTaskDeleteLoading(false);
    }
  }, [taskToDelete, fetchTasks]);

  const handleWhatsAppReplySend = useCallback(async () => {
    if (selectedWhatsAppChatId == null || !whatsappReplyMessage.trim() || !canSendWhatsApp) return;
    setWhatsappReplySendLoading(true);
    try {
      await sendWhatsApp({
        number: (selectedWhatsAppChat?.phone_number ?? '').replace(/\s/g, ''),
        message: whatsappReplyMessage.trim(),
      });
      setWhatsappReplyMessage('');
      const res = await getWhatsAppChatMessages({ chat_id: String(selectedWhatsAppChatId) });
      const data = res as { messages?: WhatsAppMessage[]; chat?: { is_within_24h_window?: boolean; window_started_at?: string; window_minutes_remaining?: number } };
      setWhatsappMessages(Array.isArray(data?.messages) ? data.messages : []);
      setWhatsappChatWindowInfo(data?.chat ?? null);
    } finally {
      setWhatsappReplySendLoading(false);
    }
  }, [selectedWhatsAppChatId, selectedWhatsAppChat?.phone_number, whatsappReplyMessage, canSendWhatsApp]);

  const toggleActivity = useCallback((activityId: string) => {
    setExpandedActivities((prev) => {
      const next = new Set(prev);
      if (next.has(activityId)) next.delete(activityId);
      else next.add(activityId);
      return next;
    });
  }, []);

  const extensionsForAudit = useMemo(
    () => extensionsProp ?? (hierarchyDataExtensions as AuditTrailExtension[] | undefined) ?? null,
    [extensionsProp, hierarchyDataExtensions],
  );

  const campaignsForAudit = useMemo(
    () => campaigns ?? (recordType === 'prospect' || recordType === 'lead' ? campaignsList : null),
    [campaigns, recordType, campaignsList],
  );

  const activitiesData: ActivityItem[] = useMemo(() => {
    const trail = (record?.audit_trail ?? []) as AuditTrailEntry[];
    const fmt = formatValForAudit;
    const resolveFieldVal = (field: string, raw: unknown): string => {
      if (AUDIT_FIELDS_EXTENSION.has(field)) return resolveAssignedToLabel(raw, extensionsForAudit, fmt);
      if (field === 'campaign_id') return resolveCampaignLabel(raw, campaignsForAudit, fmt);
      return fmt(raw);
    };
    return trail.map((entry) => {
      const event = entry.event === 'created' ? 'created' : 'updated';
      const title = event === 'created' ? 'Record created' : 'Record updated';
      const description = entry.description?.trim() || '—';
      const timestamp = entry.created_at
        ? new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '—';
      const auditChanges: Array<{ field: string; oldVal: string; newVal: string }> = [];
      if (event === 'updated' && entry.changes && typeof entry.changes === 'object' && !Array.isArray(entry.changes)) {
        const changesObj = entry.changes as Record<string, { old?: unknown; new?: unknown }>;
        Object.entries(changesObj).forEach(([field, val]) => {
          if (!val || typeof val !== 'object' || !('old' in val || 'new' in val)) return;
          const rawOld = (val as { old?: unknown }).old;
          const rawNew = (val as { new?: unknown }).new;
          if (field === 'data') {
            const oldObj = rawOld && typeof rawOld === 'object' && !Array.isArray(rawOld) ? (rawOld as Record<string, unknown>) : {};
            let newObj: Record<string, unknown> = {};
            if (typeof rawNew === 'string') {
              try { newObj = JSON.parse(rawNew) as Record<string, unknown>; } catch { newObj = {}; }
            } else if (rawNew && typeof rawNew === 'object' && !Array.isArray(rawNew)) {
              newObj = rawNew as Record<string, unknown>;
            }
            const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
            allKeys.forEach((key) => {
              const o = resolveFieldVal(key, oldObj[key]);
              const n = resolveFieldVal(key, newObj[key]);
              if (o !== n) auditChanges.push({ field: key, oldVal: o, newVal: n });
            });
          } else {
            auditChanges.push({ field, oldVal: resolveFieldVal(field, rawOld), newVal: resolveFieldVal(field, rawNew) });
          }
        });
      }
      return {
        id: String(entry.id),
        type: 'note' as const,
        title,
        description,
        timestamp,
        auditEvent: event,
        auditDescription: description,
        auditChanges: auditChanges.length > 0 ? auditChanges : undefined,
      };
    });
  }, [record?.audit_trail, extensionsForAudit, campaignsForAudit]);

  const renderActivityItem = useCallback((activity: ActivityItem) => {
    const isExpanded = expandedActivities.has(activity.id) || activity.expanded;
    return (
      <div
        key={activity.id}
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #eaf0f6',
          borderRadius: '5px',
          padding: '16px 20px',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1 }}>
            {activity.expanded !== undefined && (
              <button
                onClick={() => toggleActivity(activity.id)}
                style={{ background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer', color: '#141414', display: 'flex', alignItems: 'center' }}
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#141414', margin: 0 }}>{activity.title}</h4>
                <FileText size={14} color="#141414" />
              </div>
              <p style={{ fontSize: '14px', color: '#141414', margin: '4px 0', lineHeight: '1.6' }}>
                {activity.auditEvent === 'created' && <>{activity.auditDescription ?? activity.description}</>}
                {activity.auditEvent === 'updated' && (
                  <>
                    {activity.auditChanges?.length
                      ? activity.auditChanges.map((c, i) => (
                          <span key={i} style={{ display: 'block', marginTop: i ? '6px' : 0 }}>
                            <strong>{c.field}</strong>: {c.oldVal} → {c.newVal}
                          </span>
                        ))
                      : (activity.auditDescription ?? activity.description)}
                  </>
                )}
                {!activity.auditEvent && activity.description}
              </p>
            </div>
          </div>
          <div style={{ fontSize: '13px', color: '#141414', whiteSpace: 'nowrap' }}>{activity.timestamp}</div>
        </div>
      </div>
    );
  }, [expandedActivities, toggleActivity]);

  const recordEmail = record?.data?.data?.email;
  const within24h = whatsappChatWindowInfo?.is_within_24h_window !== false;
  let minutesRemaining = whatsappChatWindowInfo?.window_minutes_remaining ?? null;
  if (minutesRemaining == null && whatsappChatWindowInfo?.window_started_at) {
    const start = new Date(whatsappChatWindowInfo.window_started_at).getTime();
    minutesRemaining = Math.max(0, Math.floor((start + 24 * 60 * 60 * 1000 - Date.now()) / 60000));
  }
  const canSend = within24h && (minutesRemaining == null || minutesRemaining > 0);

  return (
    <div>
      <div style={{ display: 'flex', gap: '24px', marginBottom: '16px', borderBottom: '2px solid #eaf0f6' }}>
        {ACTIVITY_TYPE_TABS.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActivityFilter(filter.id)}
            style={{
              padding: '10px 0',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activityFilter === filter.id ? '2px solid #141414' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activityFilter === filter.id ? '600' : '400',
              color: '#141414',
              transition: 'all 0.2s',
              marginBottom: '-2px',
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {activityFilter === 'emails' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginBottom: '20px' }}>
          <button
            style={{
              padding: '8px 16px',
              backgroundColor: '#ffffff',
              border: '1px solid #414141',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '300',
              color: '#141414',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onClick={onOpenEmail ?? (() => setShowEmailModal(true))}
          >
            <Mail size={16} />
            Create email
          </button>
        </div>
      )}
      {activityFilter === 'notes' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginBottom: '20px' }}>
          <button
            style={{
              padding: '8px 16px',
              backgroundColor: '#ffffff',
              border: '1px solid #414141',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '300',
              color: '#141414',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onClick={onOpenNote ?? (() => setShowNotesModal(true))}
          >
            <ClipboardList size={16} />
            Create note
          </button>
        </div>
      )}
      {activityFilter === 'meetings' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginBottom: '20px' }}>
          <button
            style={{
              padding: '8px 16px',
              backgroundColor: '#ffffff',
              border: '1px solid #414141',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '300',
              color: '#141414',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onClick={onOpenMeeting ?? (() => setShowMeetingModal(true))}
          >
            <Calendar size={16} />
            Create meeting
          </button>
        </div>
      )}

      {activityFilter === 'activity' && (
        <>
          {recordLoading ? (
            <div style={{ backgroundColor: '#fff', border: '1px solid #eaf0f6', borderRadius: '8px', padding: '40px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>Loading history…</p>
            </div>
          ) : activitiesData.length === 0 ? (
            <div style={{ backgroundColor: '#fff', border: '1px solid #eaf0f6', borderRadius: '8px', padding: '40px 24px', textAlign: 'center' }}>
              <FileText size={48} style={{ color: '#cbd5e0', marginBottom: '16px' }} />
              <p style={{ fontSize: '14px', color: '#141414', marginBottom: '8px', lineHeight: '1.6' }}>
                {recordName} history will appear here as the record is created and updated.
              </p>
            </div>
          ) : (
            <div>{activitiesData.map((activity) => renderActivityItem(activity))}</div>
          )}
        </>
      )}

      {activityFilter === 'emails' && (
        <>
          {emailsLoading ? (
            <div style={{ backgroundColor: '#fff', border: '1px solid #eaf0f6', borderRadius: '8px', padding: '40px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>Loading emails…</p>
            </div>
          ) : emailsError ? (
            <div style={{ backgroundColor: '#fff', border: '1px solid #eaf0f6', borderRadius: '8px', padding: '40px 24px', textAlign: 'center' }}>
              <AlertCircle size={48} style={{ color: '#cbd5e0', marginBottom: '16px' }} />
              <p style={{ fontSize: '14px', color: '#141414', margin: 0 }}>{emailsError}</p>
            </div>
          ) : emailsList.length === 0 ? (
            <div style={{ backgroundColor: '#fff', border: '1px solid #eaf0f6', borderRadius: '8px', padding: '40px 24px', textAlign: 'center' }}>
              <Mail size={48} style={{ color: '#cbd5e0', marginBottom: '16px' }} />
              <p style={{ fontSize: '14px', color: '#141414', marginBottom: '8px', lineHeight: '1.6' }}>
                Emails sent to this contact will appear here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {emailsList.map((email) => {
                const isSelected = selectedEmailId === email.id;
                const stripped = email.content ? email.content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : '';
                const contentPreview = stripped ? (stripped.length > 120 ? stripped.slice(0, 120) + '…' : stripped) : '—';
                return (
                  <div
                    key={String(email.id)}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedEmailId(email.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedEmailId(email.id); } }}
                    style={{
                      backgroundColor: '#fff',
                      border: `1px solid ${isSelected ? '#141414' : '#eaf0f6'}`,
                      borderRadius: '5px',
                      padding: '16px 20px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#141414' }}>{email.subject || '(No subject)'}</span>
                          {email.status != null && (
                            <span style={{
                              fontSize: '12px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: email.status === 'sent' ? '#d1fae5' : email.status === 'failed' ? '#fee2e2' : '#e2e8f0',
                              color: email.status === 'sent' ? '#065f46' : email.status === 'failed' ? '#991b1b' : '#475569',
                            }}>
                              {email.status}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '14px', color: '#718096', margin: 0, lineHeight: '1.5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {contentPreview}
                        </p>
                      </div>
                      {email.created_at && (
                        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: '13px', color: '#718096', whiteSpace: 'nowrap' }}>
                            {moment(email.created_at).format(GlobalDateTimeFormat)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {emailsMeta && (emailsMeta.total > 0 || emailsList.length > 0) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #eaf0f6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#718096' }}>Per page:</span>
                    <select value={emailsPerPage} onChange={(e) => { setEmailsPerPage(Number(e.target.value)); setEmailsPage(1); }} style={{ padding: '4px 8px', border: '1px solid #cbd5e0', borderRadius: '4px', fontSize: '13px' }}>
                      {[5, 10, 15, 25, 50].map((n) => (<option key={n} value={n}>{n}</option>))}
                    </select>
                    <span style={{ fontSize: '13px', color: '#718096' }}>
                      {emailsMeta.from != null && emailsMeta.to != null ? `Showing ${emailsMeta.from}–${emailsMeta.to} of ${emailsMeta.total}` : `Total ${emailsMeta.total}`}
                    </span>
                  </div>
                  {emailsMeta.last_page > 1 && (
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <button type="button" disabled={emailsPage <= 1} onClick={() => setEmailsPage((p) => Math.max(1, p - 1))} style={{ padding: '6px 12px', border: '1px solid #cbd5e0', borderRadius: '4px', fontSize: '13px', cursor: emailsPage <= 1 ? 'not-allowed' : 'pointer', backgroundColor: '#fff', opacity: emailsPage <= 1 ? 0.6 : 1 }}>Prev</button>
                      {Array.from({ length: Math.min(emailsMeta.last_page, 10) }, (_, i) => i + 1).map((p) => (
                        <button key={p} type="button" onClick={() => setEmailsPage(p)} style={{ padding: '6px 12px', border: '1px solid #cbd5e0', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', backgroundColor: p === emailsPage ? '#141414' : '#fff', color: p === emailsPage ? '#fff' : '#141414' }}>{p}</button>
                      ))}
                      <button type="button" disabled={emailsPage >= emailsMeta.last_page} onClick={() => setEmailsPage((p) => Math.min(emailsMeta.last_page, p + 1))} style={{ padding: '6px 12px', border: '1px solid #cbd5e0', borderRadius: '4px', fontSize: '13px', cursor: emailsPage >= emailsMeta.last_page ? 'not-allowed' : 'pointer', backgroundColor: '#fff', opacity: emailsPage >= emailsMeta.last_page ? 0.6 : 1 }}>Next</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activityFilter === 'notes' && (
        <>
          {notesLoading ? (
            <div style={{ backgroundColor: '#fff', border: '1px solid #eaf0f6', borderRadius: '8px', padding: '40px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>Loading notes…</p>
            </div>
          ) : notesError ? (
            <div style={{ backgroundColor: '#fff', border: '1px solid #eaf0f6', borderRadius: '8px', padding: '40px 24px', textAlign: 'center' }}>
              <AlertCircle size={48} style={{ color: '#cbd5e0', marginBottom: '16px' }} />
              <p style={{ fontSize: '14px', color: '#141414', margin: 0 }}>{notesError}</p>
            </div>
          ) : notesList.length === 0 ? (
            <div style={{ backgroundColor: '#fff', border: '1px solid #eaf0f6', borderRadius: '8px', padding: '40px 24px', textAlign: 'center' }}>
              <FileText size={48} style={{ color: '#cbd5e0', marginBottom: '16px' }} />
              <p style={{ fontSize: '14px', color: '#141414', marginBottom: '8px', lineHeight: '1.6' }}>
                Take notes about this record. You can even @mention a teammate if you need to.
              </p>
            </div>
          ) : (
            <div>
              {notesList.map((note) => {
                const updatedAt = new Date(note.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                const isEditing = editingNoteId === note.id;
                const iconBtnStyle: React.CSSProperties = { background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer', color: '#718096', display: 'flex', alignItems: 'center' };
                return (
                  <div key={note.id} style={{ backgroundColor: '#fff', border: '1px solid #eaf0f6', borderRadius: '5px', padding: '16px 20px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {isEditing ? (
                          <>
                            <textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              style={{ width: '100%', minHeight: '80px', padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: '5px', fontSize: '14px', color: '#141414', lineHeight: '1.6', resize: 'vertical', fontFamily: 'inherit' }}
                              autoFocus
                            />
                            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!editingText.trim() || editingNoteId == null) return;
                                  try {
                                    await updateCrmNote(editingNoteId, { text: editingText.trim() });
                                    setEditingNoteId(null);
                                    setEditingText('');
                                    fetchNotes();
                                  } catch {}
                                }}
                                style={{ padding: '6px 14px', backgroundColor: '#141414', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: '500', color: '#fff', cursor: 'pointer' }}
                              >
                                Save
                              </button>
                              <button type="button" onClick={() => { setEditingNoteId(null); setEditingText(''); }} style={{ padding: '6px 14px', backgroundColor: '#fff', border: '1px solid #8a8a8a', borderRadius: '4px', fontSize: '14px', fontWeight: '500', color: '#141414', cursor: 'pointer' }}>
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <p style={{ fontSize: '14px', color: '#141414', margin: '4px 0', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{note.text}</p>
                        )}
                      </div>
                      {!isEditing && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                          <span style={{ fontSize: '13px', color: '#718096', whiteSpace: 'nowrap', marginRight: '4px' }}>{updatedAt}</span>
                          <button type="button" onClick={() => { setEditingNoteId(note.id); setEditingText(note.text); }} style={iconBtnStyle} title="Edit note"><Pencil size={14} /></button>
                          <button type="button" onClick={() => setNoteToDelete(note)} style={{ ...iconBtnStyle, color: '#e53e3e' }} title="Delete note"><Trash2 size={14} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activityFilter === 'calls' && (
        <>
          {callRecordingsLoading ? (
            <div style={{ backgroundColor: '#fff', border: '1px solid #eaf0f6', borderRadius: '8px', padding: '40px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>Loading call recordings…</p>
            </div>
          ) : callRecordings.length === 0 ? (
            <div style={{ backgroundColor: '#fff', border: '1px solid #eaf0f6', borderRadius: '8px', padding: '40px 24px', textAlign: 'center' }}>
              <Phone size={48} style={{ color: '#cbd5e0', marginBottom: '16px' }} />
              <p style={{ fontSize: '14px', color: '#141414', marginBottom: '8px', lineHeight: '1.6' }}>
                Call recordings with this contact will appear here.
              </p>
            </div>
          ) : (
            <CallLog recordings={callRecordings} onPlayRecording={handlePlayRecording} extensionNameMap={extensionNameMap} />
          )}
        </>
      )}

      {activityFilter === 'tasks' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginBottom: '20px' }}>
            <button
              style={{
                padding: '8px 16px',
                backgroundColor: '#ffffff',
                border: '1px solid #414141',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '300',
                color: '#141414',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onClick={onOpenTask ?? (() => setShowTaskModal(true))}
            >
              <ClipboardList size={16} />
              Create task
            </button>
          </div>
          {tasksLoading ? (
            <div style={{ backgroundColor: '#fff', border: '1px solid #eaf0f6', borderRadius: '8px', padding: '40px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>Loading tasks…</p>
            </div>
          ) : tasksError ? (
            <div style={{ backgroundColor: '#fff', border: '1px solid #eaf0f6', borderRadius: '8px', padding: '40px 24px', textAlign: 'center' }}>
              <AlertCircle size={48} style={{ color: '#cbd5e0', marginBottom: '16px' }} />
              <p style={{ fontSize: '14px', color: '#141414', margin: 0 }}>{tasksError}</p>
            </div>
          ) : tasksList.length === 0 ? (
            <div style={{ backgroundColor: '#fff', border: '1px solid #eaf0f6', borderRadius: '8px', padding: '40px 24px', textAlign: 'center' }}>
              <ClipboardList size={48} style={{ color: '#cbd5e0', marginBottom: '16px' }} />
              <p style={{ fontSize: '14px', color: '#141414', marginBottom: '8px', lineHeight: '1.6' }}>
                Create and manage tasks related to this contact.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tasksList.map((task) => {
                const taskId = task.id!;
                const isEditing = editingTaskId === taskId;
                const dueDate = task.due_date?.slice(0, 10) ?? '';
                const description = task.notes?.length && task.notes[0]?.note ? task.notes[0].note : '—';
                const iconBtnStyle: React.CSSProperties = { background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer', color: '#718096', display: 'flex', alignItems: 'center' };
                return (
                  <div key={taskId} style={{ backgroundColor: '#fff', border: '1px solid #eaf0f6', borderRadius: '5px', padding: '16px 20px', marginBottom: '0' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {isEditing ? (
                          <>
                            <input
                              type="text"
                              value={editingTaskForm.name}
                              onChange={(e) => setEditingTaskForm((p) => ({ ...p, name: e.target.value }))}
                              placeholder="Task name"
                              style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: '5px', fontSize: '14px', marginBottom: '8px' }}
                            />
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                              <input type="date" value={editingTaskForm.due_date} onChange={(e) => setEditingTaskForm((p) => ({ ...p, due_date: e.target.value }))} style={{ padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: '5px', fontSize: '14px' }} />
                              <input type="time" value={editingTaskForm.time} onChange={(e) => setEditingTaskForm((p) => ({ ...p, time: e.target.value }))} style={{ padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: '5px', fontSize: '14px' }} />
                              <select value={editingTaskForm.status} onChange={(e) => setEditingTaskForm((p) => ({ ...p, status: e.target.value as 'pending' | 'completed' | 'failed' }))} style={{ padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: '5px', fontSize: '14px' }}>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                <option value="failed">Failed</option>
                              </select>
                              <select value={editingTaskForm.urgency} onChange={(e) => setEditingTaskForm((p) => ({ ...p, urgency: e.target.value as 'low' | 'med' | 'high' }))} style={{ padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: '5px', fontSize: '14px' }}>
                                <option value="low">Low</option>
                                <option value="med">Medium</option>
                                <option value="high">High</option>
                              </select>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (editingTaskId == null) return;
                                  try {
                                    await updateTask(editingTaskId, {
                                      name: editingTaskForm.name,
                                      due_date: editingTaskForm.due_date || undefined,
                                      time: editingTaskForm.time || undefined,
                                      status: editingTaskForm.status,
                                      urgency: editingTaskForm.urgency,
                                    });
                                    setEditingTaskId(null);
                                    fetchTasks();
                                  } catch {}
                                }}
                                style={{ padding: '6px 14px', backgroundColor: '#141414', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: '500', color: '#fff', cursor: 'pointer' }}
                              >
                                Save
                              </button>
                              <button type="button" onClick={() => setEditingTaskId(null)} style={{ padding: '6px 14px', backgroundColor: '#fff', border: '1px solid #8a8a8a', borderRadius: '4px', fontSize: '14px', fontWeight: '500', color: '#141414', cursor: 'pointer' }}>
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <p style={{ fontSize: '14px', fontWeight: '600', color: '#141414', margin: '0 0 4px 0', lineHeight: '1.4' }}>{task.name}</p>
                            <p style={{ fontSize: '14px', color: '#141414', margin: '4px 0', lineHeight: '1.6' }}>
                              {dueDate ? new Date(task.due_date!).toLocaleDateString('en-US') : '—'}
                              {task.time ? ` ${task.time.slice(0, 5)}` : ''}
                              {task.status ? ` · ${task.status}` : ''}
                              {task.urgency ? ` · ${task.urgency}` : ''}
                            </p>
                            {description !== '—' && (
                              <p style={{ fontSize: '13px', color: '#718096', margin: '8px 0 0 0', lineHeight: '1.5' }}>{description}</p>
                            )}
                          </>
                        )}
                      </div>
                      {!isEditing && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                          <span style={{ fontSize: '13px', color: '#718096', whiteSpace: 'nowrap', marginRight: '4px' }}>
                            {task.updated_at ? new Date(task.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                          <button type="button" onClick={() => { setEditingTaskId(taskId); setEditingTaskForm({ name: task.name, due_date: dueDate, time: task.time?.slice(0, 5) ?? '', status: (task.status as 'pending' | 'completed' | 'failed') || 'pending', urgency: (task.urgency as 'low' | 'med' | 'high') || 'med' }); }} style={iconBtnStyle} title="Edit task"><Pencil size={14} /></button>
                          <button type="button" onClick={() => setTaskToDelete(task)} style={{ ...iconBtnStyle, color: '#e53e3e' }} title="Delete task"><Trash2 size={14} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activityFilter === 'meetings' && (
        <>
          {meetingsLoading ? (
            <div style={{ backgroundColor: '#fff', border: '1px solid #eaf0f6', borderRadius: '8px', padding: '40px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>Loading meetings…</p>
            </div>
          ) : meetingsError ? (
            <div style={{ backgroundColor: '#fff', border: '1px solid #eaf0f6', borderRadius: '8px', padding: '40px 24px', textAlign: 'center' }}>
              <AlertCircle size={48} style={{ color: '#cbd5e0', marginBottom: '16px' }} />
              <p style={{ fontSize: '14px', color: '#141414', margin: 0 }}>{meetingsError}</p>
            </div>
          ) : meetingsList.length === 0 ? (
            <div style={{ backgroundColor: '#fff', border: '1px solid #eaf0f6', borderRadius: '8px', padding: '40px 24px', textAlign: 'center' }}>
              <Calendar size={48} style={{ color: '#cbd5e0', marginBottom: '16px' }} />
              <p style={{ fontSize: '14px', color: '#141414', marginBottom: '8px', lineHeight: '1.6' }}>
                Schedule and track meetings with this contact.
              </p>
            </div>
          ) : (
            <div>
              {meetingsList.map((meeting) => {
                const meetingUpdatedAt = new Date(meeting.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                const meetingDate = meeting.meeting_date?.slice(0, 10) ?? '';
                const isEditingMeeting = editingMeetingId === meeting.id;
                const iconBtnStyle: React.CSSProperties = { background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer', color: '#718096', display: 'flex', alignItems: 'center' };
                return (
                  <div key={meeting.id} style={{ backgroundColor: '#fff', border: '1px solid #eaf0f6', borderRadius: '5px', padding: '16px 20px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {isEditingMeeting ? (
                          <>
                            <input
                              type="text"
                              value={editingMeetingForm.name}
                              onChange={(e) => setEditingMeetingForm((p) => ({ ...p, name: e.target.value }))}
                              placeholder="Meeting name"
                              style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: '5px', fontSize: '14px', marginBottom: '8px' }}
                            />
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                              <input type="date" value={editingMeetingForm.meeting_date} onChange={(e) => setEditingMeetingForm((p) => ({ ...p, meeting_date: e.target.value }))} style={{ padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: '5px', fontSize: '14px' }} />
                              <input type="time" value={editingMeetingForm.meeting_time} onChange={(e) => setEditingMeetingForm((p) => ({ ...p, meeting_time: e.target.value }))} style={{ padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: '5px', fontSize: '14px' }} />
                              <select value={editingMeetingForm.meeting_type} onChange={(e) => setEditingMeetingForm((p) => ({ ...p, meeting_type: e.target.value }))} style={{ padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: '5px', fontSize: '14px' }}>
                                <option value="Video">Video</option>
                                <option value="Phone">Phone</option>
                                <option value="In Person">In Person</option>
                              </select>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (editingMeetingId == null) return;
                                  try {
                                    await updateMeeting(editingMeetingId, {
                                      name: editingMeetingForm.name,
                                      meeting_date: editingMeetingForm.meeting_date ? `${editingMeetingForm.meeting_date}T00:00:00.000Z` : undefined,
                                      meeting_time: editingMeetingForm.meeting_time,
                                      meeting_type: editingMeetingForm.meeting_type,
                                    });
                                    setEditingMeetingId(null);
                                    fetchMeetings();
                                  } catch {}
                                }}
                                style={{ padding: '6px 14px', backgroundColor: '#141414', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: '500', color: '#fff', cursor: 'pointer' }}
                              >
                                Save
                              </button>
                              <button type="button" onClick={() => setEditingMeetingId(null)} style={{ padding: '6px 14px', backgroundColor: '#fff', border: '1px solid #8a8a8a', borderRadius: '4px', fontSize: '14px', fontWeight: '500', color: '#141414', cursor: 'pointer' }}>
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <p style={{ fontSize: '14px', fontWeight: '600', color: '#141414', margin: '0 0 4px 0', lineHeight: '1.4' }}>{meeting.name}</p>
                            <p style={{ fontSize: '14px', color: '#141414', margin: '4px 0', lineHeight: '1.6' }}>
                              {meeting.meeting_type} · {meetingDate ? new Date(meeting.meeting_date).toLocaleDateString('en-US') : '—'} {meeting.meeting_time ?? ''}
                              {meeting.status ? ` · ${meeting.status}` : ''}
                            </p>
                          </>
                        )}
                      </div>
                      {!isEditingMeeting && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                          <span style={{ fontSize: '13px', color: '#718096', whiteSpace: 'nowrap', marginRight: '4px' }}>{meetingUpdatedAt}</span>
                          <button type="button" onClick={() => { setEditingMeetingId(meeting.id); setEditingMeetingForm({ name: meeting.name, meeting_date: meeting.meeting_date?.slice(0, 10) ?? '', meeting_time: meeting.meeting_time ?? '', meeting_type: meeting.meeting_type ?? 'Video' }); }} style={iconBtnStyle} title="Edit meeting"><Pencil size={14} /></button>
                          <button type="button" onClick={() => setMeetingToDelete(meeting)} style={{ ...iconBtnStyle, color: '#e53e3e' }} title="Delete meeting"><Trash2 size={14} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activityFilter === 'sms' && (
        <>
          {smsLoading ? (
            <div style={{ backgroundColor: '#fff', border: '1px solid #eaf0f6', borderRadius: '8px', padding: '40px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>Loading SMS…</p>
            </div>
          ) : smsError ? (
            <div style={{ backgroundColor: '#fff', border: '1px solid #eaf0f6', borderRadius: '8px', padding: '40px 24px', textAlign: 'center' }}>
              <AlertCircle size={48} style={{ color: '#cbd5e0', marginBottom: '16px' }} />
              <p style={{ fontSize: '14px', color: '#141414', margin: 0 }}>{smsError}</p>
            </div>
          ) : smsList.length === 0 ? (
            <div style={{ backgroundColor: '#fff', border: '1px solid #eaf0f6', borderRadius: '8px', padding: '40px 24px', textAlign: 'center' }}>
              <MessageSquare size={48} style={{ color: '#cbd5e0', marginBottom: '16px' }} />
              <p style={{ fontSize: '14px', color: '#141414', marginBottom: '8px', lineHeight: '1.6' }}>SMS sent to this contact will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {smsList.map((sms) => {
                const isSelected = selectedSmsId === sms.id;
                return (
                  <div
                    key={sms.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => { setSelectedSmsId(sms.id); setShowSmsModal(true); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedSmsId(sms.id); setShowSmsModal(true); } }}
                    style={{
                      backgroundColor: '#fff',
                      border: `1px solid ${isSelected ? '#141414' : '#eaf0f6'}`,
                      borderRadius: '5px',
                      padding: '16px 20px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#141414' }}>To: {sms.to}</span>
                          {sms.status != null && (
                            <span style={{
                              fontSize: '12px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: sms.status === 'sent' ? '#d1fae5' : sms.status === 'failed' ? '#fee2e2' : '#e2e8f0',
                              color: sms.status === 'sent' ? '#065f46' : sms.status === 'failed' ? '#991b1b' : '#475569',
                            }}>
                              {sms.status}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '14px', color: '#718096', margin: '4px 0', lineHeight: '1.5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sms.message || '—'}</p>
                      </div>
                      {sms.created_at && (
                        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: '13px', color: '#718096', whiteSpace: 'nowrap' }}>
                            {new Date(sms.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {smsMeta && (smsMeta.total > 0 || smsList.length > 0) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #eaf0f6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#718096' }}>Per page:</span>
                    <select value={smsPerPage} onChange={(e) => { setSmsPerPage(Number(e.target.value)); setSmsPage(1); }} style={{ padding: '4px 8px', border: '1px solid #cbd5e0', borderRadius: '4px', fontSize: '13px' }}>
                      {[5, 10, 15, 25, 50].map((n) => (<option key={n} value={n}>{n}</option>))}
                    </select>
                    <span style={{ fontSize: '13px', color: '#718096' }}>
                      {smsMeta.from != null && smsMeta.to != null ? `Showing ${smsMeta.from}–${smsMeta.to} of ${smsMeta.total}` : `Total ${smsMeta.total}`}
                    </span>
                  </div>
                  {smsMeta.last_page > 1 && (
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <button type="button" disabled={smsPage <= 1} onClick={() => setSmsPage((p) => Math.max(1, p - 1))} style={{ padding: '6px 12px', border: '1px solid #cbd5e0', borderRadius: '4px', fontSize: '13px', cursor: smsPage <= 1 ? 'not-allowed' : 'pointer', backgroundColor: '#fff', opacity: smsPage <= 1 ? 0.6 : 1 }}>Prev</button>
                      {Array.from({ length: smsMeta.last_page }, (_, i) => i + 1).map((p) => (
                        <button key={p} type="button" onClick={() => setSmsPage(p)} style={{ padding: '6px 12px', border: '1px solid #cbd5e0', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', backgroundColor: p === smsPage ? '#141414' : '#fff', color: p === smsPage ? '#fff' : '#141414' }}>{p}</button>
                      ))}
                      <button type="button" disabled={smsPage >= smsMeta.last_page} onClick={() => setSmsPage((p) => Math.min(smsMeta.last_page, p + 1))} style={{ padding: '6px 12px', border: '1px solid #cbd5e0', borderRadius: '4px', fontSize: '13px', cursor: smsPage >= smsMeta.last_page ? 'not-allowed' : 'pointer', backgroundColor: '#fff', opacity: smsPage >= smsMeta.last_page ? 0.6 : 1 }}>Next</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activityFilter === 'whatsapp' && (
        <>
          {whatsappChatsLoading ? (
            <div style={{ backgroundColor: '#fff', border: '1px solid #eaf0f6', borderRadius: '8px', padding: '40px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>Loading WhatsApp chats…</p>
            </div>
          ) : whatsappChatsError ? (
            <div style={{ backgroundColor: '#fff', border: '1px solid #eaf0f6', borderRadius: '8px', padding: '40px 24px', textAlign: 'center' }}>
              <AlertCircle size={48} style={{ color: '#cbd5e0', marginBottom: '16px' }} />
              <p style={{ fontSize: '14px', color: '#141414', margin: 0 }}>{whatsappChatsError}</p>
            </div>
          ) : whatsappChats.length === 0 ? (
            <div style={{ backgroundColor: '#fff', border: '1px solid #eaf0f6', borderRadius: '8px', padding: '40px 24px', textAlign: 'center' }}>
              <MessageCircle size={48} style={{ color: '#cbd5e0', marginBottom: '16px' }} />
              <p style={{ fontSize: '14px', color: '#141414', marginBottom: '8px', lineHeight: '1.6' }}>WhatsApp chats with this contact will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {whatsappChats.map((chat) => {
                const isSelected = selectedWhatsAppChatId === chat.id;
                return (
                  <div
                    key={chat.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => { setSelectedWhatsAppChatId(chat.id); setSelectedWhatsAppChat(chat); setShowWhatsAppModal(true); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedWhatsAppChatId(chat.id); setSelectedWhatsAppChat(chat); setShowWhatsAppModal(true); } }}
                    style={{
                      backgroundColor: '#fff',
                      border: `1px solid ${isSelected ? '#141414' : '#eaf0f6'}`,
                      borderRadius: '5px',
                      padding: '16px 20px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#141414' }}>{chat.phone_number}</span>
                        </div>
                        {chat.last_message_preview && (
                          <p style={{ fontSize: '14px', color: '#718096', margin: '4px 0', lineHeight: '1.5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.last_message_preview}</p>
                        )}
                      </div>
                      {chat.last_message_at && (
                        <div style={{ flexShrink: 0 }}>
                          <span style={{ fontSize: '13px', color: '#718096', whiteSpace: 'nowrap' }}>{new Date(chat.last_message_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {!useExternalModals && (
        <>
          <NotesModal isOpen={showNotesModal} onClose={() => setShowNotesModal(false)} recordName={recordName} onSave={handleNoteCreate} />
          <EmailModal isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} recipientEmail={recordEmail} recipientName={recordName} senderEmail="user@example.com" senderName="Your Name" onSend={async () => { await fetchEmails(); setShowEmailModal(false); }} />
          <TaskModal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} assignedToName="Unassigned" onSave={handleTaskSave} />
          <MeetingModal isOpen={showMeetingModal} onClose={() => setShowMeetingModal(false)} hostEmail="user@example.com" hostName="Your Name" attendeeEmail={recordEmail} attendeeName={recordName} onSchedule={handleMeetingSchedule} />
        </>
      )}

      {taskToDelete != null && (
        <DeleteConfirmationModal
          show={true}
          onHide={() => setTaskToDelete(null)}
          onConfirm={() => handleTaskDeleteConfirm()}
          itemName={taskToDelete.name}
          itemType="task"
          additionalInfo={`Are you sure you want to delete "${taskToDelete.name}"?`}
          loading={taskDeleteLoading}
        />
      )}

      {showRecordingModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={closeRecordingModal}>
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', maxWidth: '90vw', width: 480, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Call recording</h3>
              <button type="button" onClick={closeRecordingModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}><X size={20} /></button>
            </div>
            {recordingModalLoading ? <p style={{ margin: 0, color: '#64748b' }}>Loading audio…</p> : recordingModalError ? <p style={{ margin: 0, color: '#b91c1c' }}>{recordingModalError}</p> : recordingModalAudioUrl ? <AudioPlayer ref={recordingAudioPlayerRef} audioSrc={recordingModalAudioUrl} title={selectedRecordingForPlay?.Id ? `Recording ${selectedRecordingForPlay.Id}` : 'Recording'} showWaveform autoPlay /> : null}
          </div>
        </div>
      )}

      {showSmsModal && selectedSmsId != null && (() => {
        const selectedSms = smsList.find((s) => s.id === selectedSmsId);
        if (!selectedSms) return null;
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => { setShowSmsModal(false); setSelectedSmsId(null); }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '8px', maxWidth: '560px', width: '90%', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#141414', margin: 0 }}>SMS to {selectedSms.to}</h3>
                <button type="button" onClick={() => { setShowSmsModal(false); setSelectedSmsId(null); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', color: '#718096' }}><X size={20} /></button>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ fontSize: '13px', color: '#718096', marginBottom: '8px' }}>To: {selectedSms.to}</div>
                <div style={{ fontSize: '13px', color: '#718096', marginBottom: '12px' }}>{selectedSms.created_at && moment(selectedSms.created_at).format(GlobalDateTimeFormat)}</div>
                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '6px', whiteSpace: 'pre-wrap', fontSize: '14px', color: '#141414', lineHeight: '1.6' }}>{selectedSms.message || '—'}</div>
              </div>
            </div>
          </div>
        );
      })()}

      {selectedEmailId != null && (() => {
        const selectedEmail = emailsList.find((e) => e.id === selectedEmailId);
        if (!selectedEmail) return null;
        const html = getEmailPreviewHtml(selectedEmail.content);
        const toDisplay = Array.isArray(selectedEmail.to) ? selectedEmail.to.join(', ') : '—';
        const fromDisplay = extensionNameMap[selectedEmail.created_by ?? ''] ?? selectedEmail.created_by ?? '—';
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setSelectedEmailId(null)}>
            <div style={{ backgroundColor: '#fff', borderRadius: '8px', maxWidth: '640px', width: '90%', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#141414', margin: 0 }}>{selectedEmail.subject || '(No subject)'}</h3>
                <button type="button" onClick={() => setSelectedEmailId(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', color: '#718096' }}><X size={20} /></button>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ fontSize: '13px', color: '#718096', marginBottom: '4px' }}>From: {fromDisplay}</div>
                <div style={{ fontSize: '13px', color: '#718096', marginBottom: '8px' }}>To: {toDisplay}</div>
                <div style={{ fontSize: '13px', color: '#718096', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {selectedEmail.created_at && moment(selectedEmail.created_at).format(GlobalDateTimeFormat)}
                  {selectedEmail.status != null && (
                    <span style={{
                      fontSize: '12px', padding: '2px 8px', borderRadius: '4px',
                      backgroundColor: selectedEmail.status === 'sent' ? '#d1fae5' : selectedEmail.status === 'failed' ? '#fee2e2' : '#e2e8f0',
                      color: selectedEmail.status === 'sent' ? '#065f46' : selectedEmail.status === 'failed' ? '#991b1b' : '#475569',
                    }}>{selectedEmail.status}</span>
                  )}
                </div>
                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '6px', fontSize: '14px', color: '#141414', lineHeight: '1.6', minHeight: '80px', maxHeight: '60vh', overflow: 'auto' }}>
                  {html ? (
                    <div dangerouslySetInnerHTML={{ __html: html }} />
                  ) : (
                    <span style={{ color: '#718096' }}>No content</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {showWhatsAppModal && selectedWhatsAppChat != null && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => { setShowWhatsAppModal(false); setSelectedWhatsAppChatId(null); setSelectedWhatsAppChat(null); }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', maxWidth: '480px', width: '90%', maxHeight: '65vh', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#141414', margin: 0 }}>WhatsApp – {selectedWhatsAppChat.phone_number}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {canSend && (
                    <>
                      <span style={{ fontSize: '12px', color: '#718096' }}>Real-time updates active</span>
                      {minutesRemaining != null && minutesRemaining > 0 && <span style={{ fontSize: '12px', color: '#718096' }}>{Math.floor(minutesRemaining / 60)}h {minutesRemaining % 60}m remaining</span>}
                    </>
                  )}
                  {!canSend && whatsappChatWindowInfo != null && <span style={{ fontSize: '12px', color: '#94a3b8' }}>24h window expired</span>}
                </div>
              </div>
              <button type="button" onClick={() => { setShowWhatsAppModal(false); setSelectedWhatsAppChatId(null); setSelectedWhatsAppChat(null); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', color: '#718096' }}><X size={20} /></button>
            </div>
            <div ref={whatsappMessagesListRef} style={{ padding: '16px', overflowY: 'auto', flex: 1, minHeight: 0, maxHeight: canSendWhatsApp ? '280px' : '320px' }}>
              {whatsappMessagesLoading ? <p style={{ fontSize: '14px', color: '#718096', margin: 0 }}>Loading messages…</p> : whatsappMessages.length === 0 ? <p style={{ fontSize: '14px', color: '#718096', margin: 0 }}>No messages in this chat</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {whatsappMessages.map((msg) => {
                    const isOutbound = msg.direction === 'outbound';
                    const displayText = msg.message?.trim() || (msg.message_type === 'template' ? 'Template sent' : '—');
                    return (
                      <div key={msg.id} style={{ display: 'flex', justifyContent: isOutbound ? 'flex-end' : 'flex-start' }}>
                        <div style={{ maxWidth: '85%', padding: '10px 14px', borderRadius: '12px', backgroundColor: isOutbound ? '#141414' : '#f1f5f9', color: isOutbound ? '#fff' : '#141414', border: isOutbound ? 'none' : '1px solid #e2e8f0' }}>
                          <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: '1.5' }}>{displayText}</div>
                          <div style={{ marginTop: '6px', fontSize: '12px', color: isOutbound ? 'rgba(255,255,255,0.7)' : '#718096' }}>{msg.created_at ? moment(msg.created_at).format(GlobalDateTimeFormat) : ''} {msg.status && ` · ${msg.status}`}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {canSendWhatsApp && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0' }}>
                <textarea value={whatsappReplyMessage} onChange={(e) => setWhatsappReplyMessage(e.target.value)} placeholder="Type your message..." rows={2} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '14px', resize: 'vertical', minHeight: '56px', boxSizing: 'border-box', marginBottom: '10px' }} />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  {whatsappReplyMessage.trim() && <button type="button" onClick={() => setWhatsappReplyMessage('')} style={{ padding: '8px 14px', backgroundColor: '#fff', border: '1px solid #94a3b8', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', color: '#475569' }}>Clear</button>}
                  <button type="button" onClick={() => void handleWhatsAppReplySend()} disabled={!canSend || whatsappReplySendLoading || !whatsappReplyMessage.trim()} style={{ padding: '8px 16px', backgroundColor: canSend && whatsappReplyMessage.trim() && !whatsappReplySendLoading ? '#25D366' : '#cbd5e0', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '500', color: '#fff', cursor: canSend && whatsappReplyMessage.trim() && !whatsappReplySendLoading ? 'pointer' : 'not-allowed' }}>{whatsappReplySendLoading ? 'Sending…' : 'Send'}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <DeleteConfirmationModal show={noteToDelete != null} onHide={() => setNoteToDelete(null)} onConfirm={async () => { if (!noteToDelete) return; setNoteDeleteLoading(true); try { await deleteCrmNote(noteToDelete.id); setNoteToDelete(null); fetchNotes(); } catch {} finally { setNoteDeleteLoading(false); } }} itemName={noteToDelete ? (noteToDelete.text.length > 50 ? `note "${noteToDelete.text.slice(0, 50)}…"` : `note "${noteToDelete.text}"`) : undefined} itemType="note" loading={noteDeleteLoading} />
      <DeleteConfirmationModal show={meetingToDelete != null} onHide={() => setMeetingToDelete(null)} onConfirm={async () => { if (!meetingToDelete) return; setMeetingDeleteLoading(true); try { await deleteMeeting(meetingToDelete.id); setMeetingToDelete(null); fetchMeetings(); } catch {} finally { setMeetingDeleteLoading(false); } }} itemName={meetingToDelete ? `meeting "${meetingToDelete.name}"` : undefined} itemType="meeting" loading={meetingDeleteLoading} />
    </div>
  );
};

export const CrmActivitiesPanel = forwardRef<CrmActivitiesPanelRef, CrmActivitiesPanelProps>(CrmActivitiesPanelInnerRender);
export default CrmActivitiesPanel;
