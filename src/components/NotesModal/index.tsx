import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Maximize2,
  Bold,
  Italic,
  Underline,
  Link,
  List,
  Image,
  Paperclip,
  ChevronDown,
  MessageSquare,
  Plus,
} from 'lucide-react';

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordName: string;
  onSave: (note: string, createTask: boolean, taskDueDate?: string) => void;
}

const NotesModal: React.FC<NotesModalProps> = ({ isOpen, onClose, recordName, onSave }) => {
  const [noteText, setNoteText] = useState('');
  const [createTask, setCreateTask] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // Auto-save draft simulation
  useEffect(() => {
    if (noteText.trim()) {
      const timer = setTimeout(() => {
        setIsDraftSaved(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [noteText]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(noteText, createTask, createTask ? 'In 3 business days (Friday)' : undefined);
    setNoteText('');
    setCreateTask(false);
    setIsDraftSaved(false);
    setIsMaximized(false);
    setAttachments([]);
    onClose();
  };

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  // Text formatting functions with toggle support
  const toggleFormatting = (prefix: string, suffix: string = prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = noteText.substring(start, end);
    
    if (selectedText) {
      // Check if text is already formatted
      const beforeText = noteText.substring(Math.max(0, start - prefix.length), start);
      const afterText = noteText.substring(end, end + suffix.length);
      
      if (beforeText === prefix && afterText === suffix) {
        // Remove formatting
        const newText = 
          noteText.substring(0, start - prefix.length) + 
          selectedText + 
          noteText.substring(end + suffix.length);
        setNoteText(newText);
        
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start - prefix.length, end - prefix.length);
        }, 0);
      } else {
        // Add formatting
        const newText = noteText.substring(0, start) + prefix + selectedText + suffix + noteText.substring(end);
        setNoteText(newText);
        
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + prefix.length, end + prefix.length);
        }, 0);
      }
    } else {
      // No selection, insert at cursor with placeholder
      const placeholder = 'text';
      const newText = noteText.substring(0, start) + prefix + placeholder + suffix + noteText.substring(end);
      setNoteText(newText);
      
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
    
    const newText = noteText.substring(0, start) + text + noteText.substring(end);
    setNoteText(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const handleBold = () => {
    toggleFormatting('**');
  };

  const handleItalic = () => {
    toggleFormatting('*');
  };

  const handleUnderline = () => {
    toggleFormatting('__');
  };

  const handleLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = noteText.substring(start, end);
    
    const linkText = selectedText || 'link text';
    const linkUrl = 'https://';
    const markdown = `[${linkText}](${linkUrl})`;
    
    const newText = noteText.substring(0, start) + markdown + noteText.substring(end);
    setNoteText(newText);
    
    setTimeout(() => {
      textarea.focus();
      const urlStart = start + linkText.length + 3;
      textarea.setSelectionRange(urlStart, urlStart + linkUrl.length);
    }, 0);
  };

  const handleList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lines = noteText.substring(0, start).split('\n');
    const isAtLineStart = lines[lines.length - 1].trim() === '';
    
    if (isAtLineStart) {
      insertText('- ');
    } else {
      insertText('\n- ');
    }
  };

  const handleCode = () => {
    toggleFormatting('`');
  };

  const handleImage = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = noteText.substring(start, end);
    
    const altText = selectedText || 'image description';
    const imageUrl = 'https://';
    const markdown = `![${altText}](${imageUrl})`;
    
    const newText = noteText.substring(0, start) + markdown + noteText.substring(end);
    setNoteText(newText);
    
    setTimeout(() => {
      textarea.focus();
      const urlStart = start + altText.length + 4;
      textarea.setSelectionRange(urlStart, urlStart + imageUrl.length);
    }, 0);
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

  // Keyboard shortcuts handler
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
        <div style={{ padding: '20px', flex: 1 }}>
          <textarea
            ref={textareaRef}
            placeholder="Start typing to leave a note..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
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
            }}
          />
        </div>

        {/* Formatting Toolbar */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #e2e8f0',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <button
            onClick={handleBold}
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
            title="Bold (Ctrl+B)"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f8fa')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Bold size={16} />
          </button>
          <button
            onClick={handleItalic}
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
            title="Italic (Ctrl+I)"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f8fa')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Italic size={16} />
          </button>
          <button
            onClick={handleUnderline}
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
            title="Underline (Ctrl+U)"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f8fa')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Underline size={16} />
          </button>
          <div
            style={{
              width: '1px',
              height: '20px',
              backgroundColor: '#cbd5e0',
              margin: '0 4px',
            }}
          />
          <button
            style={{
              background: 'transparent',
              border: 'none',
              padding: '6px 10px',
              cursor: 'pointer',
              color: '#141414',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '3px',
              fontSize: '13px',
              fontWeight: '500',
              gap: '4px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f8fa')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            More
            <ChevronDown size={14} />
          </button>
          <button
            onClick={handleLink}
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
            title="Link (Ctrl+K)"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f8fa')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Link size={16} />
          </button>
          <button
            onClick={handleImage}
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
            title="Insert Image"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f8fa')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Image size={16} aria-label="Insert Image" />
          </button>
          <button
            onClick={handleCode}
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
            title="Code"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f8fa')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <MessageSquare size={16} />
          </button>
          <button
            onClick={handleList}
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
            title="Bullet List"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f8fa')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <List size={16} />
          </button>
          <button
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
          <button
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
            title="More options"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f8fa')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Plus size={16} />
          </button>
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
          disabled={!noteText.trim()}
          style={{
            padding: '8px 20px',
            backgroundColor: noteText.trim() ? '#141414' : '#cbd5e0',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: noteText.trim() ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            if (noteText.trim()) {
              e.currentTarget.style.backgroundColor = '#ff6347';
            }
          }}
          onMouseLeave={(e) => {
            if (noteText.trim()) {
              e.currentTarget.style.backgroundColor = '#141414';
            }
          }}
        >
          Create note
        </button>
      </div>
    </div>
  );
};

export default NotesModal;
