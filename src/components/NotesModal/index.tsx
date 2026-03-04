import React, { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Paperclip, ChevronDown } from 'lucide-react';
import RichNoteEditor from '@components/RichNoteEditor';

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordName: string;
  onSave: (note: string, createTask: boolean, taskDueDate?: string) => void;
}

const NotesModal: React.FC<NotesModalProps> = ({ isOpen, onClose, recordName, onSave }) => {
  const [noteHtml, setNoteHtml] = useState('');
  const [createTask, setCreateTask] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) setNoteHtml('');
  }, [isOpen]);

  // Auto-save draft simulation
  useEffect(() => {
    const hasContent = noteHtml.trim() !== '' && noteHtml.trim() !== '<p><br></p>';
    if (hasContent) {
      const timer = setTimeout(() => setIsDraftSaved(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [noteHtml]);

  if (!isOpen) return null;

  const isEmpty = () => {
    const t = noteHtml.trim();
    return t === '' || t === '<p></p>' || t === '<p><br></p>' || t === '<br>';
  };

  const handleSave = () => {
    onSave(noteHtml, createTask, createTask ? 'In 3 business days (Friday)' : undefined);
    setNoteHtml('');
    setCreateTask(false);
    setIsDraftSaved(false);
    setIsMaximized(false);
    setAttachments([]);
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
    setAttachments(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: isMaximized ? '60px 20px 20px 20px' : 'auto 15vh 0.5vh auto',
        height: isMaximized ? 'auto' : '512px',
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '20px', flex: 1, minHeight: 0 }}>
          <RichNoteEditor
            value={noteHtml}
            onChange={setNoteHtml}
            placeholder="Start typing to leave a note..."
            minHeight={isMaximized ? 400 : 120}
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
                  key={index}
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
            <span>
              Create a <strong>To-do</strong> task to follow up{' '}
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
                In 3 business days (Friday)
              </button>
              <ChevronDown size={14} style={{ marginLeft: '4px' }} />
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
            backgroundColor: !isEmpty() ? '#141414' : '#cbd5e0',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: !isEmpty() ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!isEmpty()) e.currentTarget.style.backgroundColor = '#ff6347';
          }}
          onMouseLeave={(e) => {
            if (!isEmpty()) e.currentTarget.style.backgroundColor = '#141414';
          }}
        >
          Create note
        </button>
      </div>
    </div>
  );
};

export default NotesModal;
