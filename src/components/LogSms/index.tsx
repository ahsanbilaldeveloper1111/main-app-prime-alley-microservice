// ============================================================================
// sms MESSAGE MODAL COMPONENT
// ============================================================================
//
// USAGE:
// 1. Import the component:
//    import smsMessageModal from './smsMessageModal';
//
// 2. Add state in your parent component:
//    const [issmsModalOpen, setIssmsModalOpen] = useState(false);
//
// 3. Use it in JSX:
//    <button onClick={() => setIssmsModalOpen(true)}>Log sms</button>
//
//    <smsMessageModal
//      isOpen={issmsModalOpen}
//      onClose={() => setIssmsModalOpen(false)}
//      associatedRecords={['Acme Corp', 'John Doe']}  // optional
//      onSave={(data) => {
//        console.log(data.message, data.createFollowUpTask, data.followUpTaskDueDate, data.followUpTaskDueTime);
//      }}
//    />
//
// PROPS:
//   isOpen           — boolean to control visibility
//   onClose          — callback when modal is closed
//   associatedRecords — string[] of record names to associate (default: [])
//   onSave           — callback with { message, contacts, activityDate, createFollowUpTask, followUpTaskDueDate, followUpTaskDueTime, attachments }
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Maximize2,
  X,
  Sparkles,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { generateSms } from '@utils/communication';
import { buildFollowUpTaskFields, buildIn3BusinessDaysLabel } from '@utils/crmFollowUpTaskDue';

// ── Shared styles (local only, to reduce duplication) ─────────────────────────

const modalContainerStyle: React.CSSProperties = {
  position: 'fixed',
  height: 'auto',
  backgroundColor: '#ffffff',
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
  borderRadius: '8px',
  border: '1px solid #cbd5e0',
  overflow: 'hidden',
  animation: 'none',
};

const headerContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 20px',
  borderBottom: '1px solid #e2e8f0',
};

const iconButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: '6px',
  color: '#141414',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const closeChevronButtonStyle: React.CSSProperties = {
  ...iconButtonStyle,
  padding: '4px',
};

const headerTitleStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: '#141414',
  margin: 0,
};

const smallLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#718096',
  marginBottom: '6px',
  fontWeight: '500',
};

const sectionRowBorderedStyle: React.CSSProperties = {
  padding: '16px 20px',
  borderBottom: '1px solid #e2e8f0',
};

const primaryButtonStyle: React.CSSProperties = {
  padding: '8px 20px',
  color: '#ffffff',
  border: 'none',
  borderRadius: '4px',
  fontSize: '14px',
  fontWeight: '500',
  transition: 'background-color 0.2s',
};

const dropdownItemButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 16px',
  backgroundColor: 'transparent',
  border: 'none',
  textAlign: 'left',
  fontSize: '14px',
  cursor: 'pointer',
};

// ── Types ────────────────────────────────────────────────────────────────────

interface Contact {
  id: string;
  name: string;
  email?: string;
}

interface SmsMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  associatedRecords?: string[];
  /** Optional context for AI generation (e.g. lead, deal, order from CRM). */
  contextPayload?: { lead?: unknown; deal?: unknown; order?: unknown };
  onSave: (data: {
    message: string;
    contacts: Contact[];
    activityDate: string;
    createFollowUpTask: boolean;
    followUpTaskDueDate: string | null;
    followUpTaskDueTime: string | null;
    attachments: File[];
  }) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDisplayDate(isoLocal: string): string {
  if (!isoLocal) return '';
  const d = new Date(isoLocal);
  const pad = (n: number) => String(n).padStart(2, '0');
  const offset = -d.getTimezoneOffset() / 60;
  const sign = offset >= 0 ? '+' : '-';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())} GMT${sign}${Math.abs(offset)}`;
}

const DEFAULT_GENERATE_QUERY =
  'Write a short, professional SMS message (concise, suitable for text).';

function toggleSmsFormatting(
  textarea: HTMLTextAreaElement | null,
  messageText: string,
  setMessageText: React.Dispatch<React.SetStateAction<string>>,
  prefix: string,
  suffix: string = prefix,
): void {
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = messageText.substring(start, end);

  if (selectedText) {
    const beforeText = messageText.substring(Math.max(0, start - prefix.length), start);
    const afterText = messageText.substring(end, end + suffix.length);
    if (beforeText === prefix && afterText === suffix) {
      const newText =
        messageText.substring(0, start - prefix.length) +
        selectedText +
        messageText.substring(end + suffix.length);
      setMessageText(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start - prefix.length, end - prefix.length);
      }, 0);
    } else {
      const newText =
        messageText.substring(0, start) + prefix + selectedText + suffix + messageText.substring(end);
      setMessageText(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
      }, 0);
    }
  } else {
    const placeholder = 'text';
    const newText =
      messageText.substring(0, start) + prefix + placeholder + suffix + messageText.substring(end);
    setMessageText(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + placeholder.length);
    }, 0);
  }
}

function insertSmsMarkdownLink(
  textarea: HTMLTextAreaElement | null,
  messageText: string,
  setMessageText: React.Dispatch<React.SetStateAction<string>>,
): void {
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = messageText.substring(start, end);
  const linkText = selectedText || 'link text';
  const linkUrl = 'https://';
  const markdown = `[${linkText}](${linkUrl})`;
  const newText = messageText.substring(0, start) + markdown + messageText.substring(end);
  setMessageText(newText);
  setTimeout(() => {
    textarea.focus();
    const urlStart = start + linkText.length + 3;
    textarea.setSelectionRange(urlStart, urlStart + linkUrl.length);
  }, 0);
}

function createSmsTextareaHotkeyHandler(
  onBold: () => void,
  onItalic: () => void,
  onUnderline: () => void,
  onLink: () => void,
): (e: React.KeyboardEvent<HTMLTextAreaElement>) => void {
  return (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!e.ctrlKey && !e.metaKey) return;
    const key = e.key.toLowerCase();
    if (key === 'b') {
      e.preventDefault();
      onBold();
      return;
    }
    if (key === 'i') {
      e.preventDefault();
      onItalic();
      return;
    }
    if (key === 'u') {
      e.preventDefault();
      onUnderline();
      return;
    }
    if (key === 'k') {
      e.preventDefault();
      onLink();
    }
  };
}

function clearSmsDraftStorage(draftStorageKey: string | null): void {
  if (!draftStorageKey || globalThis.window === undefined) return;
  try {
    globalThis.localStorage.removeItem(draftStorageKey);
  } catch {
    /* ignore */
  }
}

type SmsModalFormResetSetters = {
  setMessageText: React.Dispatch<React.SetStateAction<string>>;
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  setActivityDate: React.Dispatch<React.SetStateAction<string>>;
  setCreateTask: React.Dispatch<React.SetStateAction<boolean>>;
  setTaskActivityDate: React.Dispatch<React.SetStateAction<string>>;
  setTaskActivityTime: React.Dispatch<React.SetStateAction<string>>;
  setTaskCustomDate: React.Dispatch<React.SetStateAction<string>>;
  setTaskCustomTime: React.Dispatch<React.SetStateAction<string>>;
  setShowTaskDatePicker: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDraftSaved: React.Dispatch<React.SetStateAction<boolean>>;
  setIsMaximized: React.Dispatch<React.SetStateAction<boolean>>;
  setShowContactInput: React.Dispatch<React.SetStateAction<boolean>>;
  setContactSearch: React.Dispatch<React.SetStateAction<string>>;
  setGeneratePrompt: React.Dispatch<React.SetStateAction<string>>;
};

function resetSmsFormFields(s: SmsModalFormResetSetters): void {
  s.setMessageText('');
  s.setContacts([]);
  s.setActivityDate(formatDateTimeLocal(new Date()));
  s.setCreateTask(false);
  s.setTaskActivityDate(buildIn3BusinessDaysLabel());
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 5);
  s.setTaskActivityTime(timeStr);
  s.setTaskCustomDate(today);
  s.setTaskCustomTime(timeStr);
  s.setShowTaskDatePicker(false);
  s.setIsDraftSaved(false);
  s.setIsMaximized(false);
  s.setShowContactInput(false);
  s.setContactSearch('');
  s.setGeneratePrompt('');
}

async function runSmsAutoGenerate(params: {
  generatePrompt: string;
  messageText: string;
  contextPayload?: { lead?: unknown; deal?: unknown; order?: unknown };
  setGenerateLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setMessageText: React.Dispatch<React.SetStateAction<string>>;
}): Promise<void> {
  const { generatePrompt, messageText, contextPayload, setGenerateLoading, setMessageText } = params;
  const query = generatePrompt.trim() || DEFAULT_GENERATE_QUERY;
  setGenerateLoading(true);
  try {
    const res = await generateSms({
      query,
      previous_content: messageText.trim() || undefined,
      ...(contextPayload?.lead != null && { lead: contextPayload.lead }),
      ...(contextPayload?.deal != null && { deal: contextPayload.deal }),
      ...(contextPayload?.order != null && { order: contextPayload.order }),
      tone: 'professional',
      language: 'en',
    });
    const generated = (res?.result ?? '').trim();
    if (generated) {
      setMessageText(generated);
    } else {
      toast.info('No SMS message was generated. Try a different prompt.');
    }
  } catch (err) {
    console.error('SMS auto-generate failed:', err);
    toast.error('Failed to auto-generate SMS. Please try again.');
  } finally {
    setGenerateLoading(false);
  }
}

/** Restore and auto-save SMS modal draft; isolated to keep modal complexity low. */
function usePersistedSmsDraft(
  isOpen: boolean,
  draftStorageKey: string | null,
  draft: {
    messageText: string;
    contacts: Contact[];
    activityDate: string;
    createTask: boolean;
    taskActivityDate: string;
    taskActivityTime: string;
    taskCustomDate: string;
    taskCustomTime: string;
    generatePrompt: string;
  },
  setters: {
    setMessageText: React.Dispatch<React.SetStateAction<string>>;
    setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
    setActivityDate: React.Dispatch<React.SetStateAction<string>>;
    setCreateTask: React.Dispatch<React.SetStateAction<boolean>>;
    setTaskActivityDate: React.Dispatch<React.SetStateAction<string>>;
    setTaskActivityTime: React.Dispatch<React.SetStateAction<string>>;
    setTaskCustomDate: React.Dispatch<React.SetStateAction<string>>;
    setTaskCustomTime: React.Dispatch<React.SetStateAction<string>>;
    setGeneratePrompt: React.Dispatch<React.SetStateAction<string>>;
    setIsDraftSaved: React.Dispatch<React.SetStateAction<boolean>>;
  },
) {
  const {
    messageText,
    contacts,
    activityDate,
    createTask,
    taskActivityDate,
    taskActivityTime,
    taskCustomDate,
    taskCustomTime,
    generatePrompt,
  } = draft;

  const settersRef = useRef(setters);
  settersRef.current = setters;

  useEffect(() => {
    if (!isOpen || !draftStorageKey) return;
    const s = settersRef.current;
    try {
      const raw = globalThis.localStorage.getItem(draftStorageKey);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return;
      const p = parsed as Record<string, unknown>;
      if (typeof p.messageText === 'string') s.setMessageText(p.messageText);
      if (Array.isArray(p.contacts)) s.setContacts(p.contacts as Contact[]);
      if (typeof p.activityDate === 'string') s.setActivityDate(p.activityDate);
      if (typeof p.createTask === 'boolean') s.setCreateTask(p.createTask);
      if (typeof p.taskActivityDate === 'string') s.setTaskActivityDate(p.taskActivityDate);
      if (typeof p.taskActivityTime === 'string') s.setTaskActivityTime(p.taskActivityTime);
      if (typeof p.taskCustomDate === 'string') s.setTaskCustomDate(p.taskCustomDate);
      if (typeof p.taskCustomTime === 'string') s.setTaskCustomTime(p.taskCustomTime);
      if (typeof p.generatePrompt === 'string') s.setGeneratePrompt(p.generatePrompt);
      s.setIsDraftSaved(true);
    } catch {
      // ignore malformed draft
    }
  }, [isOpen, draftStorageKey]);

  useEffect(() => {
    if (!isOpen || !draftStorageKey) return;

    const payload = {
      messageText,
      contacts,
      activityDate,
      createTask,
      taskActivityDate,
      taskActivityTime,
      taskCustomDate,
      taskCustomTime,
      generatePrompt,
    };

    const hasAnyDraftContent =
      messageText.trim() ||
      contacts.length > 0 ||
      createTask ||
      generatePrompt.trim();

    const timer = globalThis.setTimeout(() => {
      try {
        const s = settersRef.current;
        if (!hasAnyDraftContent) {
          globalThis.localStorage.removeItem(draftStorageKey);
          s.setIsDraftSaved(false);
          return;
        }
        globalThis.localStorage.setItem(draftStorageKey, JSON.stringify(payload));
        s.setIsDraftSaved(true);
      } catch {
        settersRef.current.setIsDraftSaved(false);
      }
    }, 800);

    return () => globalThis.clearTimeout(timer);
  }, [
    isOpen,
    draftStorageKey,
    messageText,
    contacts,
    activityDate,
    createTask,
    taskActivityDate,
    taskActivityTime,
    taskCustomDate,
    taskCustomTime,
    generatePrompt,
  ]);
}

interface SmsFollowUpTaskSectionProps {
  createTask: boolean;
  setCreateTask: React.Dispatch<React.SetStateAction<boolean>>;
  taskActivityDate: string;
  setTaskActivityDate: React.Dispatch<React.SetStateAction<string>>;
  taskCustomDate: string;
  setTaskCustomDate: React.Dispatch<React.SetStateAction<string>>;
  taskCustomTime: string;
  setTaskCustomTime: React.Dispatch<React.SetStateAction<string>>;
  taskActivityTime: string;
  setTaskActivityTime: React.Dispatch<React.SetStateAction<string>>;
  showTaskDatePicker: boolean;
  setShowTaskDatePicker: React.Dispatch<React.SetStateAction<boolean>>;
  taskDateOptions: readonly string[];
}

function SmsFollowUpTaskSection(props: Readonly<SmsFollowUpTaskSectionProps>) {
  const {
    createTask,
    setCreateTask,
    taskActivityDate,
    setTaskActivityDate,
    taskCustomDate,
    setTaskCustomDate,
    taskCustomTime,
    setTaskCustomTime,
    taskActivityTime,
    setTaskActivityTime,
    showTaskDatePicker,
    setShowTaskDatePicker,
    taskDateOptions,
  } = props;
  return (
    <div style={{ padding: '16px 20px' }}>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          fontSize: '13px',
          color: '#141414',
        }}
      >
        <input
          type="checkbox"
          checked={createTask}
          onChange={(e) => setCreateTask(e.target.checked)}
          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
        />
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <span>
            Create a <strong>To-do</strong> task to follow up
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              position: 'relative',
            }}
          >
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowTaskDatePicker(!showTaskDatePicker)}
                style={{
                  padding: '4px 0',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#141414',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  textDecoration: 'underline',
                }}
              >
                {taskActivityDate === 'Custom...' ? taskCustomDate : taskActivityDate}
                <ChevronDown size={14} />
              </button>
              {showTaskDatePicker ? (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    bottom: '100%',
                    marginBottom: '4px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '5px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    minWidth: '200px',
                    zIndex: 1001,
                    overflow: 'hidden',
                  }}
                >
                  {taskDateOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        if (option === 'Custom...') {
                          setTaskActivityDate('Custom...');
                          setTaskActivityTime(taskCustomTime);
                          setShowTaskDatePicker(false);
                        } else {
                          setTaskActivityDate(option);
                          setShowTaskDatePicker(false);
                        }
                      }}
                      style={{
                        ...dropdownItemButtonStyle,
                        color: '#33475b',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f7fafc';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="time"
                value={taskActivityDate === 'Custom...' ? taskCustomTime : taskActivityTime}
                onChange={(e) => {
                  const v = e.target.value;
                  setTaskActivityTime(v);
                  if (taskActivityDate === 'Custom...') {
                    setTaskCustomTime(v);
                  }
                }}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '5px',
                  fontSize: '13px',
                  color: '#141414',
                  backgroundColor: '#ffffff',
                }}
              />
            </div>
          </div>
          {taskActivityDate === 'Custom...' ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: '6px',
              }}
            >
              <input
                type="date"
                value={taskCustomDate}
                onChange={(e) => setTaskCustomDate(e.target.value)}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '5px',
                  fontSize: '13px',
                  color: '#141414',
                  backgroundColor: '#ffffff',
                }}
              />
            </div>
          ) : null}
        </span>
      </label>
    </div>
  );
}

interface SmsAiGenerateSectionProps {
  generatePrompt: string;
  setGeneratePrompt: React.Dispatch<React.SetStateAction<string>>;
  generateLoading: boolean;
  onAutoGenerate: () => void;
}

function SmsAiGenerateSection(props: Readonly<SmsAiGenerateSectionProps>) {
  const { generatePrompt, setGeneratePrompt, generateLoading, onAutoGenerate } = props;
  return (
    <div
      style={{
        padding: '12px 20px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ ...smallLabelStyle, marginBottom: 0 }}>
        Query for AI (optional)
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          value={generatePrompt}
          onChange={(e) => setGeneratePrompt(e.target.value)}
          placeholder="e.g. Follow-up for a meeting, or confirm appointment time"
          style={{
            flex: 1,
            minWidth: '200px',
            border: '1px solid #cbd5e0',
            borderRadius: '6px',
            padding: '6px 10px',
            fontSize: '13px',
            color: '#141414',
            fontFamily: 'inherit',
          }}
        />
        <button
          type="button"
          onClick={onAutoGenerate}
          disabled={generateLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            border: '1px solid #141414',
            borderRadius: '6px',
            backgroundColor: 'transparent',
            color: '#141414',
            fontSize: '13px',
            fontWeight: '500',
            cursor: generateLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {generateLoading ? (
            <>
              <output aria-live="polite" style={{ display: 'inline-flex', alignItems: 'center', margin: 0, padding: 0 }}>
                <span className="spinner-border spinner-border-sm" aria-hidden="true" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
              </output>
              {' '}
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Auto Generate
            </>
          )}
        </button>
      </div>
      <div style={{ fontSize: '12px', color: '#718096' }}>
        Leave empty to use a default prompt for a short professional SMS.
      </div>
    </div>
  );
}

interface SmsAssociatedRecordsRowProps {
  associatedRecords: readonly string[];
}

function SmsAssociatedRecordsRow(props: Readonly<SmsAssociatedRecordsRowProps>) {
  const { associatedRecords } = props;
  const displayCount = associatedRecords.length > 0 ? associatedRecords.length : 2;
  const recordSuffix = associatedRecords.length === 1 ? '' : 's';
  return (
    <div style={sectionRowBorderedStyle}>
      <button
        type="button"
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          fontWeight: '600',
          color: '#141414',
        }}
      >
        Associated with {displayCount} record{recordSuffix}
        <ChevronDown size={14} />
      </button>
    </div>
  );
}

interface SmsDraftSavedBannerProps {
  isDraftSaved: boolean;
  draftStorageKey: string | null;
  setIsDraftSaved: React.Dispatch<React.SetStateAction<boolean>>;
}

function SmsDraftSavedBanner(props: Readonly<SmsDraftSavedBannerProps>) {
  const { isDraftSaved, draftStorageKey, setIsDraftSaved } = props;
  if (!isDraftSaved) {
    return null;
  }
  return (
    <>
      <span style={{ fontSize: '13px', color: '#0c9960', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M13.5 4.5L6 12L2.5 8.5" stroke="#0c9960" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Draft saved
      </span>
      <button
        type="button"
        onClick={() => {
          clearSmsDraftStorage(draftStorageKey);
          setIsDraftSaved(false);
        }}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: '#cbd5e0' }}
      >
        <X size={16} />
      </button>
    </>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

const SmsMessageModal: React.FC<SmsMessageModalProps> = ({
  isOpen,
  onClose,
  associatedRecords = [],
  contextPayload,
  onSave,
}) => {
  const [messageText, setMessageText] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activityDate, setActivityDate] = useState(formatDateTimeLocal(new Date()));
  const [createTask, setCreateTask] = useState(false);
  const [taskActivityDate, setTaskActivityDate] = useState(() => buildIn3BusinessDaysLabel());
  const [taskActivityTime, setTaskActivityTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [taskCustomDate, setTaskCustomDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [taskCustomTime, setTaskCustomTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [showTaskDatePicker, setShowTaskDatePicker] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showContactInput, setShowContactInput] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [generateLoading, setGenerateLoading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contactInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const draftStorageKey = (() => {
    if (globalThis.window === undefined) return null;
    const recordKey = associatedRecords.filter(Boolean).join('|').trim();
    const safe = recordKey ? recordKey.slice(0, 160) : 'global';
    return `crm:smsDraft:${safe}`;
  })();

  const taskDateOptions = [
    'Today',
    'Tomorrow',
    buildIn3BusinessDaysLabel(),
    'In 1 week',
    'In 2 weeks',
    'In 1 month',
    'Custom...',
  ];

  usePersistedSmsDraft(
    isOpen,
    draftStorageKey,
    {
      messageText,
      contacts,
      activityDate,
      createTask,
      taskActivityDate,
      taskActivityTime,
      taskCustomDate,
      taskCustomTime,
      generatePrompt,
    },
    {
      setMessageText,
      setContacts,
      setActivityDate,
      setCreateTask,
      setTaskActivityDate,
      setTaskActivityTime,
      setTaskCustomDate,
      setTaskCustomTime,
      setGeneratePrompt,
      setIsDraftSaved,
    },
  );

  // Focus textarea on open
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // Focus contact input when shown
  useEffect(() => {
    if (showContactInput && contactInputRef.current) {
      contactInputRef.current.focus();
    }
  }, [showContactInput]);

  if (!isOpen) return null;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSave = () => {
    const timeForFollowUp =
      taskActivityDate === 'Custom...' ? taskCustomTime : taskActivityTime;
    const followUp = buildFollowUpTaskFields(
      createTask,
      taskActivityDate,
      taskCustomDate,
      timeForFollowUp,
    );

    onSave({
      message: messageText,
      contacts,
      activityDate,
      ...followUp,
      attachments: [],
    });
    clearSmsDraftStorage(draftStorageKey);
    resetSmsFormFields({
      setMessageText,
      setContacts,
      setActivityDate,
      setCreateTask,
      setTaskActivityDate,
      setTaskActivityTime,
      setTaskCustomDate,
      setTaskCustomTime,
      setShowTaskDatePicker,
      setIsDraftSaved,
      setIsMaximized,
      setShowContactInput,
      setContactSearch,
      setGeneratePrompt,
    });
    onClose();
  };

  const handleAutoGenerate = () => {
    runSmsAutoGenerate({
      generatePrompt,
      messageText,
      contextPayload,
      setGenerateLoading,
      setMessageText,
    });
  };

  const handleAddContact = () => {
    const trimmed = contactSearch.trim();
    if (trimmed) {
      setContacts((prev) => [
        ...prev,
        { id: `contact-${Date.now()}`, name: trimmed },
      ]);
      setContactSearch('');
      setShowContactInput(false);
    }
  };

  const handleContactKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddContact();
    } else if (e.key === 'Escape') {
      setShowContactInput(false);
      setContactSearch('');
    }
  };

  const removeContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const handleBold = () =>
    toggleSmsFormatting(textareaRef.current, messageText, setMessageText, '**');
  const handleItalic = () =>
    toggleSmsFormatting(textareaRef.current, messageText, setMessageText, '*');
  const handleUnderline = () =>
    toggleSmsFormatting(textareaRef.current, messageText, setMessageText, '__');
  const handleLink = () =>
    insertSmsMarkdownLink(textareaRef.current, messageText, setMessageText);

  const handleKeyDown = createSmsTextareaHotkeyHandler(
    handleBold,
    handleItalic,
    handleUnderline,
    handleLink,
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <React.Fragment>
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 999,
      }} onClick={onClose} />
      <div
      style={{
        ...modalContainerStyle,
        ...(isMaximized
          ? { top: '74px', left: '50%', transform: 'translateX(-50%)', width: 'min(900px, calc(100vw - 84px))', maxHeight: 'calc(100vh - 94px)' }
          : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 'min(650px, calc(100vw - 120px))' }),
      }}
    >
      {/* ── Header ── */}
      <div style={headerContainerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onClose}
            style={closeChevronButtonStyle}
          >
            <ChevronDown size={20} style={{ transform: 'rotate(90deg)' }} />
          </button>
          <h2 style={headerTitleStyle}>
            Send SMS
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            style={iconButtonStyle}
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            <Maximize2 size={18} />
          </button>
          <button
            onClick={onClose}
            style={iconButtonStyle}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* ── Contacted + Activity Date Row ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        {/* Contacted */}
        <div
          style={{
            padding: '12px 20px',
            borderRight: '1px solid #e2e8f0',
          }}
        >
          <div style={smallLabelStyle}>
            Contacted
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', minHeight: '28px' }}>
            {contacts.map((c) => (
              <span
                key={c.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  backgroundColor: '#f5f8fa',
                  border: '1px solid #cbd5e0',
                  borderRadius: '12px',
                  fontSize: '13px',
                  color: '#141414',
                  fontWeight: '500',
                }}
              >
                {c.name}
                <button
                  onClick={() => removeContact(c.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '1px',
                    cursor: 'pointer',
                    color: '#718096',
                    display: 'flex',
                    alignItems: 'center',
                    lineHeight: 1,
                  }}
                >
                  <X size={12} />
                </button>
              </span>
            ))}

            {showContactInput ? (
              <input
                ref={contactInputRef}
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                onKeyDown={handleContactKeyDown}
                onBlur={handleAddContact}
                placeholder="Type name & press Enter"
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '13px',
                  color: '#141414',
                  width: '160px',
                  fontFamily: 'inherit',
                }}
              />
            ) : (
              <button
                onClick={() => setShowContactInput(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: contacts.length === 0 ? '#a0aec0' : '#4a5568',
                  padding: '2px 4px',
                  fontWeight: contacts.length === 0 ? '400' : '600',
                  fontFamily: 'inherit',
                }}
              >
                {contacts.length === 0 ? '0 contacts' : '+ Add'}
              </button>
            )}
          </div>
        </div>

        {/* Activity date */}
        <div style={{ padding: '12px 20px' }}>
          <div style={smallLabelStyle}>
            Activity date
          </div>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setShowDatePicker(true);
                setTimeout(() => dateInputRef.current?.showPicker?.(), 50);
              }}
              style={{
                background: 'transparent',
                border: '1px solid #cbd5e0',
                borderRadius: '6px',
                padding: '5px 10px',
                cursor: 'pointer',
                fontSize: '13px',
                color: '#141414',
                fontFamily: 'inherit',
                textAlign: 'left',
                width: '100%',
              }}
            >
              {formatDisplayDate(activityDate)}
            </button>
            <input
              ref={dateInputRef}
              type="datetime-local"
              value={activityDate}
              onChange={(e) => {
                setActivityDate(e.target.value);
                setShowDatePicker(false);
              }}
              style={{
                position: 'absolute',
                opacity: 0,
                pointerEvents: showDatePicker ? 'auto' : 'none',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
              }}
            />
          </div>
        </div>
      </div>

      <SmsAiGenerateSection
        generatePrompt={generatePrompt}
        setGeneratePrompt={setGeneratePrompt}
        generateLoading={generateLoading}
        onAutoGenerate={handleAutoGenerate}
      />

      {/* ── Message Content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '20px', flex: 1 }}>
          <textarea
            ref={textareaRef}
            placeholder="Describe the sms message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              height: isMaximized ? '400px' : '120px',
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              color: '#141414',
              fontFamily: 'inherit',
              resize: 'none',
              lineHeight: '1.5',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <SmsAssociatedRecordsRow associatedRecords={associatedRecords} />

        <SmsFollowUpTaskSection
          createTask={createTask}
          setCreateTask={setCreateTask}
          taskActivityDate={taskActivityDate}
          setTaskActivityDate={setTaskActivityDate}
          taskCustomDate={taskCustomDate}
          setTaskCustomDate={setTaskCustomDate}
          taskCustomTime={taskCustomTime}
          setTaskCustomTime={setTaskCustomTime}
          taskActivityTime={taskActivityTime}
          setTaskActivityTime={setTaskActivityTime}
          showTaskDatePicker={showTaskDatePicker}
          setShowTaskDatePicker={setShowTaskDatePicker}
          taskDateOptions={taskDateOptions}
        />
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SmsDraftSavedBanner
            isDraftSaved={isDraftSaved}
            draftStorageKey={draftStorageKey}
            setIsDraftSaved={setIsDraftSaved}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!messageText.trim()}
          style={{
            ...primaryButtonStyle,
            backgroundColor: messageText.trim() ? '#141414' : '#cbd5e0',
            cursor: messageText.trim() ? 'pointer' : 'not-allowed',
          }}
          onMouseEnter={(e) => {
            if (messageText.trim()) e.currentTarget.style.backgroundColor = '#ff6347';
          }}
          onMouseLeave={(e) => {
            if (messageText.trim()) e.currentTarget.style.backgroundColor = '#141414';
          }}
        >
          Send SMS
        </button>
      </div>
    </div>
    </React.Fragment>
  );
};

export default SmsMessageModal;
