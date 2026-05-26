import React, { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Paperclip, ChevronDown } from 'lucide-react';
import RichNoteEditor from '@components/RichNoteEditor';
import { buildFollowUpTaskFields, buildIn3BusinessDaysLabel } from '@utils/crmFollowUpTaskDue';
import { toast } from 'react-toastify';

export interface NotesModalSavePayload {
  note: string;
  createFollowUpTask: boolean;
  followUpTaskDueDate: string | null;
  followUpTaskDueTime: string | null;
}

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordName: string;
  onSave: (payload: NotesModalSavePayload) => void;
}

const NotesModal: React.FC<NotesModalProps> = ({
  isOpen,
  onClose,
  recordName,
  onSave,
}) => {
  const [noteHtml, setNoteHtml] = useState('');
  const [createTask, setCreateTask] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activityDate, setActivityDate] = useState(() => buildIn3BusinessDaysLabel());
  const [activityTime, setActivityTime] = useState(() =>
    new Date().toTimeString().slice(0, 5),
  );
  const [customDate, setCustomDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [customTime, setCustomTime] = useState(() =>
    new Date().toTimeString().slice(0, 5),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  const draftStorageKey = (() => {
    if (globalThis.window === undefined) return null;
    const safe = String(recordName || 'global').slice(0, 160);
    return `crm:notesDraft:${safe}`;
  })();

  const dateOptions = [
    'Today',
    'Tomorrow',
    buildIn3BusinessDaysLabel(),
    'In 1 week',
    'In 2 weeks',
    'In 1 month',
    'Custom...',
  ];

  useEffect(() => {
    if (!isOpen) {
      setNoteHtml('');
      setCreateTask(false);
      setIsDraftSaved(false);
      setIsMaximized(false);
      setAttachments([]);
      setActivityDate(buildIn3BusinessDaysLabel());
      setActivityTime(new Date().toTimeString().slice(0, 5));
      setCustomDate(new Date().toISOString().slice(0, 10));
      setCustomTime(new Date().toTimeString().slice(0, 5));
      setShowDatePicker(false);
    }
  }, [isOpen]);

  // Restore draft when opening
  useEffect(() => {
    if (!isOpen) return;
    if (!draftStorageKey) return;
    try {
      const raw = globalThis.localStorage.getItem(draftStorageKey);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return;
      const p = parsed as Record<string, unknown>;
      if (typeof p.noteHtml === 'string') setNoteHtml(p.noteHtml);
      if (typeof p.createTask === 'boolean') setCreateTask(p.createTask);
      if (typeof p.activityDate === 'string') setActivityDate(p.activityDate);
      if (typeof p.activityTime === 'string') setActivityTime(p.activityTime);
      if (typeof p.customDate === 'string') setCustomDate(p.customDate);
      if (typeof p.customTime === 'string') setCustomTime(p.customTime);
      setIsDraftSaved(true);
    } catch {
      /* ignore malformed draft */
    }
  }, [isOpen, draftStorageKey]);

  // Auto-save draft (persist to localStorage)
  useEffect(() => {
    if (!isOpen) return;
    if (!draftStorageKey) return;
    const t = noteHtml.trim();
    const hasContent = t !== '' && t !== '<p><br></p>' && t !== '<p></p>' && t !== '<br>';
    const hasAnyDraft = hasContent || createTask || attachments.length > 0;
    const timer = globalThis.setTimeout(() => {
      try {
        if (!hasAnyDraft) {
          globalThis.localStorage.removeItem(draftStorageKey);
          setIsDraftSaved(false);
          return;
        }
        globalThis.localStorage.setItem(
          draftStorageKey,
          JSON.stringify({
            noteHtml,
            createTask,
            activityDate,
            activityTime,
            customDate,
            customTime,
          }),
        );
        setIsDraftSaved(true);
      } catch {
        setIsDraftSaved(false);
      }
    }, 800);
    return () => globalThis.clearTimeout(timer);
  }, [
    isOpen,
    draftStorageKey,
    noteHtml,
    createTask,
    attachments.length,
    activityDate,
    activityTime,
    customDate,
    customTime,
  ]);

  if (!isOpen) return null;

  const isEmpty = () => {
    const t = noteHtml.trim();
    return t === '' || t === '<p></p>' || t === '<p><br></p>' || t === '<br>';
  };

  const handleSave = () => {
    const timeForFollowUp =
      activityDate === 'Custom...' ? customTime : activityTime;
    const followUp = buildFollowUpTaskFields(
      createTask,
      activityDate,
      customDate,
      timeForFollowUp,
    );

    onSave({
      note: noteHtml,
      ...followUp,
    });
    if (draftStorageKey && globalThis.window !== undefined) {
      try {
        globalThis.localStorage.removeItem(draftStorageKey);
      } catch {
        /* ignore */
      }
    }
    setNoteHtml('');
    setCreateTask(false);
    setIsDraftSaved(false);
    setIsMaximized(false);
    setAttachments([]);
    setActivityDate(buildIn3BusinessDaysLabel());
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5);
    setActivityTime(timeStr);
    setCustomDate(today);
    setCustomTime(timeStr);
    setShowDatePicker(false);
    onClose();
  };

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const handleAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const blockedExt = new Set([
      '.exe',
      '.msi',
      '.bat',
      '.cmd',
      '.com',
      '.ps1',
      '.vbs',
      '.js',
      '.jar',
    ]);
    const allowed: File[] = [];
    const blocked: File[] = [];
    for (const f of files) {
      const name = String(f?.name ?? '');
      const dot = name.lastIndexOf('.');
      const ext = dot >= 0 ? name.slice(dot).toLowerCase() : '';
      if (ext && blockedExt.has(ext)) {
        blocked.push(f);
      } else {
        allowed.push(f);
      }
    }
    if (blocked.length > 0) {
      toast.error('Executable/script files are not allowed for upload.');
    }
    if (allowed.length > 0) {
      setAttachments(prev => [...prev, ...allowed]);
    }
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      style={{
        position: 'fixed',
        ...(isMaximized
          ? { top: '60px', right: '20px', bottom: '20px', left: '20px' }
          : { right: '15vh', bottom: '7.5vh', width: 'min(650px, calc(100vw - 120px))', height: 'min(512px, calc(100vh - 120px))' }),
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
      {/* Header */}
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
            Note
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleMaximize}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              color: '#141414',
            }}
            title={isMaximized ? "Restore" : "Maximize"}
          >
            <Maximize2 size={18} />
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              color: '#141414',
            }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Record Label */}
      <div
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: '#141414', fontWeight: '400' }}>For</span>
          <span
            style={{
              padding: '4px 12px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e0',
              borderRadius: '16px',
              fontSize: '13px',
              color: '#141414',
              fontWeight: '500',
            }}
          >
            {recordName}
          </span>
        </div>
      </div>

      {/* Note Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          // overflowY: 'auto',
        }}
      >
        <div style={{ padding: '20px', flex: 1, minHeight: 0 }}>
          <RichNoteEditor
            value={noteHtml}
            onChange={setNoteHtml}
            placeholder="Start typing to leave a note..."
            height={isMaximized ? 400 : 90}
          />
        </div>
        <div style={{ padding: '8px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleAttachment}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '6px',
              cursor: 'pointer',
              color: '#141414',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '3px',
            }}
            title="Attach File"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f8fa')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Paperclip size={16} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px', fontWeight: '600' }}>
              Attachments ({attachments.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {attachments.map((file, index) => (
                <div
                  key={`${file.name}-${file.size}-${file.lastModified}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    backgroundColor: '#f5f8fa',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, overflow: 'hidden' }}>
                    <Paperclip size={14} style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.name}
                    </span>
                    <span style={{ color: '#666', fontSize: '12px', flexShrink: 0 }}>
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    onClick={() => removeAttachment(index)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '4px',
                      cursor: 'pointer',
                      color: '#718096',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Remove"
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#f44336')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#718096')}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Associated Records */}
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
            Associated with 1 record
            <ChevronDown size={14} />
          </button>
        </div>

        {/* Task Creation Option */}
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
              style={{
                width: '16px',
                height: '16px',
                cursor: 'pointer',
              }}
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
                    onClick={() => setShowDatePicker(!showDatePicker)}
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
                    {activityDate === 'Custom...' ? customDate : activityDate}
                    <ChevronDown size={14} />
                  </button>
                  {showDatePicker && (
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
                      {dateOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            if (option === 'Custom...') {
                              setActivityDate('Custom...');
                              setActivityTime(customTime);
                              setShowDatePicker(false);
                            } else {
                              setActivityDate(option);
                              setShowDatePicker(false);
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 16px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            textAlign: 'left',
                            fontSize: '14px',
                            color: '#33475b',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f7fafc';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              'transparent';
                          }}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="time"
                    value={
                      activityDate === 'Custom...'
                        ? customTime
                        : activityTime
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      setActivityTime(v);
                      if (activityDate === 'Custom...') {
                        setCustomTime(v);
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
              {activityDate === 'Custom...' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginTop: '6px',
                  }}
                >
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
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
              )}
            </span>
          </label>
        </div>
      </div>

      {/* Footer */}
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
                  <path d="M13.5 4.5L6 12L2.5 8.5" stroke="#0c9960" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Draft saved
              </span>
              <button
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#cbd5e0',
                }}
              >
                <X size={16} />
              </button>
            </>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={isEmpty()}
          style={{
            padding: '8px 20px',
            backgroundColor: isEmpty() ? '#cbd5e0' : '#141414',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: isEmpty() ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            if (isEmpty()) return;
            e.currentTarget.style.backgroundColor = '#ff6347';
          }}
          onMouseLeave={(e) => {
            if (isEmpty()) return;
            e.currentTarget.style.backgroundColor = '#141414';
          }}
        >
          Create note
        </button>
      </div>
    </div>
  );
};

export default NotesModal;
