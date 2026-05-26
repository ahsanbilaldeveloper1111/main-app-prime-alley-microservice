// ============================================================================
// LOG CALL MODAL COMPONENT
// ============================================================================
//
// USAGE:
// 1. Import the component:
//    import LogCallModal from './LogCallModal';
//
// 2. Add state in your parent component:
//    const [isLogCallOpen, setIsLogCallOpen] = useState(false);
//
// 3. Wire up the "Log call" button in your CallLog:
//    <button onClick={() => setIsLogCallOpen(true)}>Log call</button>
//
//    <LogCallModal
//      isOpen={isLogCallOpen}
//      onClose={() => setIsLogCallOpen(false)}
//      associatedRecords={['Acme Corp', 'John Doe']}   // optional
//      onSave={(data) => {
//        console.log(data);
//        // data: { callText, contacts, callOutcome, callDirection,
//        //         activityDate, createTask, taskDueDate, attachments }
//      }}
//    />
//
// PROPS:
//   isOpen            — boolean to control visibility
//   onClose           — called when modal is dismissed
//   associatedRecords — string[] shown in "Associated with N records"
//   onSave            — callback with the full form payload
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Maximize2,
  X,
  Bold,
  Italic,
  Underline,
  Link,
  Image as ImageIcon,
  List,
  Paperclip,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { buildIn3BusinessDaysLabel } from '@utils/crmFollowUpTaskDue';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Contact {
  id: string;
  name: string;
}

interface LogCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  associatedRecords?: string[];
  onSave: (data: {
    callText: string;
    contacts: Contact[];
    callOutcome: string;
    callDirection: string;
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

const LogCallModal: React.FC<LogCallModalProps> = ({
  isOpen,
  onClose,
  associatedRecords = [],
  onSave,
}) => {
  const [callText, setCallText] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [callOutcome, setCallOutcome] = useState('');
  const [callDirection, setCallDirection] = useState('');
  const [activityDate, setActivityDate] = useState(formatDateTimeLocal(new Date()));
  const [createTask, setCreateTask] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showContactInput, setShowContactInput] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contactInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (callText.trim()) {
      const timer = setTimeout(() => setIsDraftSaved(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsDraftSaved(false);
    }
  }, [callText]);

  useEffect(() => {
    if (showContactInput && contactInputRef.current) {
      contactInputRef.current.focus();
    }
  }, [showContactInput]);

  if (!isOpen) return null;

  // ── Reset ────────────────────────────────────────────────────────────────────

  const resetForm = () => {
    setCallText('');
    setContacts([]);
    setCallOutcome('');
    setCallDirection('');
    setActivityDate(formatDateTimeLocal(new Date()));
    setCreateTask(false);
    setIsDraftSaved(false);
    setIsMaximized(false);
    setAttachments([]);
    setShowContactInput(false);
    setContactSearch('');
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleSave = () => {
    onSave({
      callText,
      contacts,
      callOutcome,
      callDirection,
      activityDate,
      createTask,
      taskDueDate: createTask ? buildIn3BusinessDaysLabel() : undefined,
      attachments,
    });
    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAddContact = () => {
    const trimmed = contactSearch.trim();
    if (trimmed) {
      setContacts((prev) => [...prev, { id: `c-${Date.now()}`, name: trimmed }]);
      setContactSearch('');
      setShowContactInput(false);
    }
  };

  const handleContactKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddContact(); }
    else if (e.key === 'Escape') { setShowContactInput(false); setContactSearch(''); }
  };

  const removeContact = (id: string) =>
    setContacts((prev) => prev.filter((c) => c.id !== id));

  // ── Text Formatting ───────────────────────────────────────────────────────────

  const toggleFormatting = (prefix: string, suffix: string = prefix) => {
    const el = textareaRef.current;
    if (!el) return;
    const s = el.selectionStart;
    const e = el.selectionEnd;
    const selected = callText.substring(s, e);
    if (selected) {
      const before = callText.substring(Math.max(0, s - prefix.length), s);
      const after = callText.substring(e, e + suffix.length);
      if (before === prefix && after === suffix) {
        const newText = callText.substring(0, s - prefix.length) + selected + callText.substring(e + suffix.length);
        setCallText(newText);
        setTimeout(() => { el.focus(); el.setSelectionRange(s - prefix.length, e - prefix.length); }, 0);
      } else {
        const newText = callText.substring(0, s) + prefix + selected + suffix + callText.substring(e);
        setCallText(newText);
        setTimeout(() => { el.focus(); el.setSelectionRange(s + prefix.length, e + prefix.length); }, 0);
      }
    } else {
      const ph = 'text';
      const newText = callText.substring(0, s) + prefix + ph + suffix + callText.substring(e);
      setCallText(newText);
      setTimeout(() => { el.focus(); el.setSelectionRange(s + prefix.length, s + prefix.length + ph.length); }, 0);
    }
  };

  const insertText = (text: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const s = el.selectionStart;
    const newText = callText.substring(0, s) + text + callText.substring(el.selectionEnd);
    setCallText(newText);
    setTimeout(() => { el.focus(); el.setSelectionRange(s + text.length, s + text.length); }, 0);
  };

  const handleLink = () => {
    const el = textareaRef.current;
    if (!el) return;
    const s = el.selectionStart;
    const e = el.selectionEnd;
    const linkText = callText.substring(s, e) || 'link text';
    const md = `[${linkText}](https://)`;
    const newText = callText.substring(0, s) + md + callText.substring(e);
    setCallText(newText);
    setTimeout(() => { el.focus(); const us = s + linkText.length + 3; el.setSelectionRange(us, us + 8); }, 0);
  };

  const handleImage = () => {
    const el = textareaRef.current;
    if (!el) return;
    const s = el.selectionStart;
    const e = el.selectionEnd;
    const alt = callText.substring(s, e) || 'image';
    const md = `![${alt}](https://)`;
    const newText = callText.substring(0, s) + md + callText.substring(e);
    setCallText(newText);
    setTimeout(() => { el.focus(); const us = s + alt.length + 4; el.setSelectionRange(us, us + 8); }, 0);
  };

  const handleList = () => {
    const el = textareaRef.current;
    if (!el) return;
    const s = el.selectionStart;
    const lines = callText.substring(0, s).split('\n');
    const atStart = lines[lines.length - 1].trim() === '';
    insertText(atStart ? '- ' : '\n- ');
  };

  const handleAttachment = () => fileInputRef.current?.click();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttachments((prev) => [...prev, ...Array.from(e.target.files || [])]);
    e.target.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b': e.preventDefault(); toggleFormatting('**'); break;
        case 'i': e.preventDefault(); toggleFormatting('*'); break;
        case 'u': e.preventDefault(); toggleFormatting('__'); break;
        case 'k': e.preventDefault(); handleLink(); break;
      }
    }
  };

  // ── Shared styles ─────────────────────────────────────────────────────────────

  const toolbarBtn: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    padding: '6px',
    cursor: 'pointer',
    color: '#141414',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '3px',
  };

  const hoverIn = (e: React.MouseEvent<HTMLButtonElement>) =>
    (e.currentTarget.style.backgroundColor = '#f5f8fa');
  const hoverOut = (e: React.MouseEvent<HTMLButtonElement>) =>
    (e.currentTarget.style.backgroundColor = 'transparent');

  const selectStyle: React.CSSProperties = {
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#141414',
    fontFamily: 'inherit',
    paddingRight: '18px',
  };

  const assocCount = associatedRecords.length > 0 ? associatedRecords.length : 2;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop (subtle) */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999,
          backgroundColor: 'transparent',
        }}
      />

      <div
        style={{
          position: 'fixed',
          inset: isMaximized ? 'unset' : 'auto 15vh 0.5vh auto',
          ...(isMaximized ? { top: '74px', left: '50%', transform: 'translateX(-50%)', width: 'min(900px, calc(100vw - 84px))', maxHeight: 'calc(100vh - 94px)' } : {}),
          height: isMaximized ? 'auto' : 'auto',
          width: isMaximized ? 'auto' : 'min(650px, calc(100vw - 120px))',
          backgroundColor: '#ffffff',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
          borderRadius: '8px',
          border: '1px solid #cbd5e0',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
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
              onClick={handleClose}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: '#141414', display: 'flex' }}
            >
              <ChevronDown size={20} style={{ transform: 'rotate(90deg)' }} />
            </button>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#141414', margin: 0 }}>
              Log Call
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', color: '#141414', display: 'flex' }}
              title={isMaximized ? 'Restore' : 'Maximize'}
            >
              <Maximize2 size={18} />
            </button>
            <button
              onClick={handleClose}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', color: '#141414', display: 'flex' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── Three-column row: Contacted | Call outcome | Call direction ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          {/* Contacted */}
          <div style={{ padding: '12px 20px' }}>
            <div style={{ fontSize: '12px', color: '#718096', marginBottom: '6px', fontWeight: '500' }}>
              Contacted
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', alignItems: 'center', minHeight: '26px' }}>
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
                    style={{ background: 'transparent', border: 'none', padding: '1px', cursor: 'pointer', color: '#718096', display: 'flex', lineHeight: 1 }}
                  >
                    <X size={11} />
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
                  placeholder="Name & Enter"
                  style={{
                    border: 'none', outline: 'none', fontSize: '13px',
                    color: '#141414', width: '110px', fontFamily: 'inherit',
                  }}
                />
              ) : (
                <button
                  onClick={() => setShowContactInput(true)}
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontSize: '14px', fontWeight: contacts.length === 0 ? '600' : '600',
                    color: '#141414', padding: '0', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: '2px',
                  }}
                >
                  {contacts.length === 0 ? '0 contacts' : '+ Add'}
                  <ChevronDown size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Call outcome */}
          <div style={{ padding: '12px 20px' }}>
            <div style={{ fontSize: '12px', color: '#718096', marginBottom: '6px', fontWeight: '500' }}>
              Call outcome
            </div>
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <select
                value={callOutcome}
                onChange={(e) => setCallOutcome(e.target.value)}
                style={selectStyle}
              >
                <option value="">Select call outcome</option>
                <option value="connected">Connected</option>
                <option value="left_voicemail">Left voicemail</option>
                <option value="no_answer">No answer</option>
                <option value="busy">Busy</option>
                <option value="wrong_number">Wrong number</option>
                <option value="left_live_message">Left live message</option>
              </select>
              <ChevronDown
                size={14}
                style={{ position: 'absolute', right: 0, pointerEvents: 'none', color: '#141414' }}
              />
            </div>
          </div>

          {/* Call direction */}
          <div style={{ padding: '12px 20px' }}>
            <div style={{ fontSize: '12px', color: '#718096', marginBottom: '6px', fontWeight: '500' }}>
              Call direction
            </div>
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <select
                value={callDirection}
                onChange={(e) => setCallDirection(e.target.value)}
                style={selectStyle}
              >
                <option value="">Select call direction</option>
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
              </select>
              <ChevronDown
                size={14}
                style={{ position: 'absolute', right: 0, pointerEvents: 'none', color: '#141414' }}
              />
            </div>
          </div>
        </div>

        {/* ── Activity date (full width) ── */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', color: '#718096', marginBottom: '8px', fontWeight: '500' }}>
            Activity date
          </div>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              onClick={() => { setShowDatePicker(true); setTimeout(() => dateInputRef.current?.showPicker?.(), 50); }}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e0',
                borderRadius: '6px',
                padding: '7px 12px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '300',
                color: '#141414',
                fontFamily: 'inherit',
                minWidth: '220px',
                textAlign: 'left',
              }}
            >
              {formatDisplayDate(activityDate)}
            </button>
            <input
              ref={dateInputRef}
              type="datetime-local"
              value={activityDate}
              onChange={(e) => { setActivityDate(e.target.value); setShowDatePicker(false); }}
              style={{
                position: 'absolute',
                opacity: 0,
                pointerEvents: showDatePicker ? 'auto' : 'none',
                top: 0, left: 0, width: '100%', height: '100%',
              }}
            />
          </div>
        </div>

        {/* ── Call text area ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', flex: 1 }}>
            <textarea
              ref={textareaRef}
              placeholder="Start typing to log a call..."
              value={callText}
              onChange={(e) => setCallText(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                width: '100%',
                height: isMaximized ? '380px' : '100px',
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

          {/* ── Formatting Toolbar ── */}
          <div
            style={{
              padding: '8px 20px',
              borderTop: '1px solid #e2e8f0',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            <button style={toolbarBtn} title="Bold (Ctrl+B)" onClick={() => toggleFormatting('**')} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
              <Bold size={16} />
            </button>
            <button style={toolbarBtn} title="Italic (Ctrl+I)" onClick={() => toggleFormatting('*')} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
              <Italic size={16} />
            </button>
            <button style={toolbarBtn} title="Underline (Ctrl+U)" onClick={() => toggleFormatting('__')} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
              <Underline size={16} />
            </button>
            {/* Strikethrough (Ix icon) */}
            <button
              style={{ ...toolbarBtn, fontSize: '13px', fontStyle: 'italic', fontWeight: '700', textDecoration: 'line-through', width: '28px' }}
              title="Strikethrough"
              onClick={() => toggleFormatting('~~')}
              onMouseEnter={hoverIn}
              onMouseLeave={hoverOut}
            >
              <span style={{ fontSize: '13px', fontStyle: 'italic', textDecoration: 'line-through', lineHeight: 1 }}>I</span>
              <sub style={{ fontSize: '9px', textDecoration: 'none', fontStyle: 'normal' }}>x</sub>
            </button>

            {/* More */}
            <button
              style={{ ...toolbarBtn, padding: '6px 10px', fontSize: '13px', fontWeight: '500', gap: '3px' }}
              onMouseEnter={hoverIn}
              onMouseLeave={hoverOut}
            >
              More <ChevronDown size={13} />
            </button>

            <div style={{ width: '1px', height: '20px', backgroundColor: '#cbd5e0', margin: '0 2px' }} />

            <button style={toolbarBtn} title="Link (Ctrl+K)" onClick={handleLink} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
              <Link size={16} />
            </button>
            <button style={toolbarBtn} title="Insert Image" onClick={handleImage} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
              <ImageIcon size={16} aria-hidden />
            </button>
            <button style={toolbarBtn} title="Code" onClick={() => toggleFormatting('`')} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
              <MessageSquare size={16} />
            </button>
            <button style={toolbarBtn} title="Bullet List" onClick={handleList} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
              <List size={16} />
            </button>
            <button style={toolbarBtn} title="Attach File" onClick={handleAttachment} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
              <Paperclip size={16} />
            </button>
            <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} style={{ display: 'none' }} />
            {/* AI sparkle */}
            <button style={{ ...toolbarBtn, color: '#718096' }} title="AI assist" onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
              <Sparkles size={16} />
            </button>
          </div>

          {/* ── Attachments ── */}
          {attachments.length > 0 && (
            <div style={{ padding: '10px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px', fontWeight: '600' }}>
                Attachments ({attachments.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {attachments.map((file, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '5px 10px', backgroundColor: '#f5f8fa', borderRadius: '4px', fontSize: '13px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, overflow: 'hidden' }}>
                      <Paperclip size={13} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                      <span style={{ color: '#666', fontSize: '12px', flexShrink: 0 }}>({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button
                      onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                      style={{ background: 'transparent', border: 'none', padding: '3px', cursor: 'pointer', color: '#718096', display: 'flex' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#e53e3e')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#718096')}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Associated Records ── */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0' }}>
            <button
              style={{
                background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '13px', fontWeight: '700', color: '#141414', fontFamily: 'inherit',
              }}
            >
              Associated with {assocCount} record{assocCount !== 1 ? 's' : ''}
              <ChevronDown size={14} />
            </button>
          </div>

          {/* ── Task Creation ── */}
          <div style={{ padding: '14px 20px' }}>
            <label
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#141414' }}
            >
              <input
                type="checkbox"
                checked={createTask}
                onChange={(e) => setCreateTask(e.target.checked)}
                style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#141414' }}
              />
              <span>
                Create a{' '}
                <button
                  style={{
                    background: 'transparent', border: 'none', color: '#141414', cursor: 'pointer',
                    padding: '0 2px', fontSize: '13px', fontWeight: '700',
                    display: 'inline-flex', alignItems: 'center', gap: '2px', fontFamily: 'inherit',
                    textDecoration: 'underline',
                  }}
                >
                  To-do <ChevronDown size={12} />
                </button>{' '}
                task to follow up{' '}
                <button
                  style={{
                    background: 'transparent', border: 'none', color: '#141414',
                    cursor: 'pointer', padding: 0, fontSize: '13px', fontWeight: '700',
                    fontFamily: 'inherit', textDecoration: 'underline',
                  }}
                >
                  {buildIn3BusinessDaysLabel()}
                </button>
                <ChevronDown size={13} style={{ marginLeft: '3px', verticalAlign: 'middle' }} />
              </span>
            </label>
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Draft saved indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minHeight: '24px' }}>
            {isDraftSaved && (
              <>
                <span style={{ fontSize: '13px', color: '#0c9960', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <path d="M13.5 4.5L6 12L2.5 8.5" stroke="#0c9960" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Draft saved
                </span>
                <button
                  onClick={() => setIsDraftSaved(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', color: '#cbd5e0', display: 'flex' }}
                >
                  <X size={14} />
                </button>
              </>
            )}
          </div>

          {/* Log call CTA */}
          <button
            onClick={handleSave}
            disabled={!callText.trim()}
            style={{
              padding: '8px 20px',
              backgroundColor: callText.trim() ? '#141414' : '#cbd5e0',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: callText.trim() ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => { if (callText.trim()) e.currentTarget.style.backgroundColor = '#ff6347'; }}
            onMouseLeave={(e) => { if (callText.trim()) e.currentTarget.style.backgroundColor = '#141414'; }}
          >
            Log call
          </button>
        </div>
      </div>
    </>
  );
};

export default LogCallModal;
