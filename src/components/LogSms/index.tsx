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
//        console.log(data.message, data.contacts, data.activityDate, data.createTask);
//      }}
//    />
//
// PROPS:
//   isOpen           — boolean to control visibility
//   onClose          — callback when modal is closed
//   associatedRecords — string[] of record names to associate (default: [])
//   onSave           — callback with { message, contacts, activityDate, createTask, taskDueDate, attachments }
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Maximize2,
  X,
  Sparkles,
} from 'lucide-react';
import { generateSms } from '@utils/communication';

// ── Types ────────────────────────────────────────────────────────────────────

interface Contact {
  id: string;
  name: string;
  email?: string;
}

interface smsMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  associatedRecords?: string[];
  /** Optional context for AI generation (e.g. lead, deal, order from CRM). */
  contextPayload?: { lead?: unknown; deal?: unknown; order?: unknown };
  onSave: (data: {
    message: string;
    contacts: Contact[];
    activityDate: string;
    createTask: boolean;
    taskDueDate?: string;
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

// ── Component ─────────────────────────────────────────────────────────────────

const DEFAULT_GENERATE_QUERY = 'Write a short, professional SMS message (concise, suitable for text).';

const SmsMessageModal: React.FC<smsMessageModalProps> = ({
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

  // Focus textarea on open
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // Auto-save draft
  useEffect(() => {
    if (messageText.trim()) {
      const timer = setTimeout(() => setIsDraftSaved(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsDraftSaved(false);
    }
  }, [messageText]);

  // Focus contact input when shown
  useEffect(() => {
    if (showContactInput && contactInputRef.current) {
      contactInputRef.current.focus();
    }
  }, [showContactInput]);

  if (!isOpen) return null;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSave = () => {
    onSave({
      message: messageText,
      contacts,
      activityDate,
      createTask,
      taskDueDate: createTask ? 'In 3 business days (Wednesday)' : undefined,
      attachments: [],
    });
    // Reset state
    setMessageText('');
    setContacts([]);
    setActivityDate(formatDateTimeLocal(new Date()));
    setCreateTask(false);
    setIsDraftSaved(false);
    setIsMaximized(false);
    setShowContactInput(false);
    setContactSearch('');
    setGeneratePrompt('');
    onClose();
  };

  const handleAutoGenerate = async () => {
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
      if (generated) setMessageText(generated);
    } catch (err) {
      console.error('SMS auto-generate failed:', err);
    } finally {
      setGenerateLoading(false);
    }
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

  // ── Text formatting ──────────────────────────────────────────────────────────

  const toggleFormatting = (prefix: string, suffix: string = prefix) => {
    const textarea = textareaRef.current;
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
  };

  const insertText = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = messageText.substring(0, start) + text + messageText.substring(end);
    setMessageText(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const handleBold = () => toggleFormatting('**');
  const handleItalic = () => toggleFormatting('*');
  const handleUnderline = () => toggleFormatting('__');
  const handleStrikethrough = () => toggleFormatting('~~');
  const handleCode = () => toggleFormatting('`');

  const handleLink = () => {
    const textarea = textareaRef.current;
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
  };

  const handleImage = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = messageText.substring(start, end);
    const altText = selectedText || 'image description';
    const imageUrl = 'https://';
    const markdown = `![${altText}](${imageUrl})`;
    const newText = messageText.substring(0, start) + markdown + messageText.substring(end);
    setMessageText(newText);
    setTimeout(() => {
      textarea.focus();
      const urlStart = start + altText.length + 4;
      textarea.setSelectionRange(urlStart, urlStart + imageUrl.length);
    }, 0);
  };

  const handleList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const lines = messageText.substring(0, start).split('\n');
    const isAtLineStart = lines[lines.length - 1].trim() === '';
    if (isAtLineStart) {
      insertText('- ');
    } else {
      insertText('\n- ');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          handleBold();
          break;
        case 'i':
          e.preventDefault();
          handleItalic();
          break;
        case 'u':
          e.preventDefault();
          handleUnderline();
          break;
        case 'k':
          e.preventDefault();
          handleLink();
          break;
      }
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        position: 'fixed',
        inset: isMaximized ? '60px 20px 20px 20px' : 'auto 15vh 0.5vh auto',
        height: isMaximized ? 'auto' : 'auto',
        width: isMaximized ? 'auto' : '650px',
        backgroundColor: '#ffffff',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
        borderRadius: '8px',
        border: '1px solid #cbd5e0',
        overflow: 'hidden',
        animation: 'slideInUp 0.3s ease-out',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: '#141414',
              padding: '4px',
            }}
          >
            <ChevronDown size={20} style={{ transform: 'rotate(90deg)' }} />
          </button>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#141414', margin: 0 }}>
            Send SMS
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', color: '#141414' }}
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            <Maximize2 size={18} />
          </button>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', color: '#141414' }}
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
          <div style={{ fontSize: '12px', color: '#718096', marginBottom: '6px', fontWeight: '500' }}>
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
          <div style={{ fontSize: '12px', color: '#718096', marginBottom: '6px', fontWeight: '500' }}>
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

      {/* ── Generate SMS (AI) ── */}
      <div
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ fontSize: '12px', color: '#718096', fontWeight: '500' }}>
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
            onClick={() => void handleAutoGenerate()}
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
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                Generating...
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

        {/* ── Associated Records ── */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <button
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
            Associated with {associatedRecords.length > 0 ? associatedRecords.length : 2} record
            {(associatedRecords.length !== 1) ? 's' : ''}
            <ChevronDown size={14} />
          </button>
        </div>

        {/* ── Task Creation Option ── */}
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
            <span>
              Create a{' '}
              <button
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#141414',
                  cursor: 'pointer',
                  padding: '0 2px',
                  fontSize: '13px',
                  fontWeight: '700',
                  textDecoration: 'underline',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                To-do
                <ChevronDown size={12} />
              </button>{' '}
              task to follow up{' '}
              <button
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#141414',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                In 3 business days (Wednesday)
              </button>
              <ChevronDown size={14} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
            </span>
          </label>
        </div>
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
          {isDraftSaved && (
            <>
              <span style={{ fontSize: '13px', color: '#0c9960', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13.5 4.5L6 12L2.5 8.5" stroke="#0c9960" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Draft saved
              </span>
              <button
                onClick={() => setIsDraftSaved(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: '#cbd5e0' }}
              >
                <X size={16} />
              </button>
            </>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={!messageText.trim()}
          style={{
            padding: '8px 20px',
            backgroundColor: messageText.trim() ? '#141414' : '#cbd5e0',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: messageText.trim() ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            if (messageText.trim()) e.currentTarget.style.backgroundColor = '#ff6347';
          }}
          onMouseLeave={(e) => {
            if (messageText.trim()) e.currentTarget.style.backgroundColor = '#141414';
          }}
        >
          Log sms message
        </button>
      </div>
    </div>
  );
};

export default SmsMessageModal;
