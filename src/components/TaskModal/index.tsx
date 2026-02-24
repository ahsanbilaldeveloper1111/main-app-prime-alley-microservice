import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, X, Link, Image, List, Clock } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignedTo?: string;
  assignedToName?: string;
  onSave: (taskData: {
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
  }) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ 
  isOpen, 
  onClose, 
  assignedTo = '',
  assignedToName = 'Unassigned',
  onSave 
}) => {
  const [title, setTitle] = useState('');
  const [activityDate, setActivityDate] = useState('In 3 business days (Friday)');
  const [activityTime, setActivityTime] = useState('08:00');
  const [reminder, setReminder] = useState('No reminder');
  const [repeat, setRepeat] = useState(false);
  const [taskType, setTaskType] = useState('To-do');
  const [priority, setPriority] = useState('None');
  const [queue, setQueue] = useState('None');
  const [assignedToState, setAssignedToState] = useState(assignedToName);
  const [notes, setNotes] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [showTaskTypeDropdown, setShowTaskTypeDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showQueueDropdown, setShowQueueDropdown] = useState(false);
  const [showAssignedToDropdown, setShowAssignedToDropdown] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [customDate, setCustomDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [customTime, setCustomTime] = useState('08:00');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Text formatting functions with toggle support
  const toggleFormatting = (prefix: string, suffix: string = prefix) => {
    const textarea = notesRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = notes.substring(start, end);
    
    if (selectedText) {
      // Check if text is already formatted
      const beforeText = notes.substring(Math.max(0, start - prefix.length), start);
      const afterText = notes.substring(end, end + suffix.length);
      
      if (beforeText === prefix && afterText === suffix) {
        // Remove formatting
        const newText = 
          notes.substring(0, start - prefix.length) + 
          selectedText + 
          notes.substring(end + suffix.length);
        setNotes(newText);
        
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start - prefix.length, end - prefix.length);
        }, 0);
      } else {
        // Add formatting
        const newText = notes.substring(0, start) + prefix + selectedText + suffix + notes.substring(end);
        setNotes(newText);
        
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + prefix.length, end + prefix.length);
        }, 0);
      }
    } else {
      // No selection, insert at cursor with placeholder
      const placeholder = 'text';
      const newText = notes.substring(0, start) + prefix + placeholder + suffix + notes.substring(end);
      setNotes(newText);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + placeholder.length);
      }, 0);
    }
  };

  const insertText = (text: string) => {
    const textarea = notesRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const newText = notes.substring(0, start) + text + notes.substring(end);
    setNotes(newText);
    
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
    const textarea = notesRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = notes.substring(start, end);
    
    const linkText = selectedText || 'link text';
    const linkUrl = 'https://';
    const markdown = `[${linkText}](${linkUrl})`;
    
    const newText = notes.substring(0, start) + markdown + notes.substring(end);
    setNotes(newText);
    
    setTimeout(() => {
      textarea.focus();
      const urlStart = start + linkText.length + 3;
      textarea.setSelectionRange(urlStart, urlStart + linkUrl.length);
    }, 0);
  };

  const handleList = () => {
    const textarea = notesRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lines = notes.substring(0, start).split('\n');
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
    const textarea = notesRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = notes.substring(start, end);
    
    const altText = selectedText || 'image description';
    const imageUrl = 'https://';
    const markdown = `![${altText}](${imageUrl})`;
    
    const newText = notes.substring(0, start) + markdown + notes.substring(end);
    setNotes(newText);
    
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

  const handleSave = () => {
    if (!title.trim()) {
      alert('Please enter a task title');
      return;
    }

    const dateToSend = activityDate === 'Custom...' ? customDate : activityDate;
    const timeToSend = activityDate === 'Custom...' ? customTime : activityTime;

    onSave({
      title,
      activityDate: dateToSend,
      activityTime: timeToSend,
      reminder,
      repeat,
      taskType,
      priority,
      queue,
      assignedTo: assignedToState,
      notes,
    });

    // Reset form
    const today = new Date().toISOString().slice(0, 10);
    setTitle('');
    setActivityDate('In 3 business days (Friday)');
    setActivityTime('08:00');
    setCustomDate(today);
    setCustomTime('08:00');
    setReminder('No reminder');
    setRepeat(false);
    setTaskType('To-do');
    setPriority('None');
    setQueue('None');
    setNotes('');
    setAttachments([]);
    setIsMaximized(false);
    onClose();
  };

  const taskTypes = ['To-do', 'Call', 'Email', 'Meeting'];
  const priorities = ['None', 'Low', 'Medium', 'High'];
  const queues = ['None', 'Sales Queue', 'Support Queue', 'Marketing Queue'];
  const dateOptions = [
    'Today',
    'Tomorrow', 
    'In 3 business days (Friday)',
    'In 1 week',
    'In 2 weeks',
    'In 1 month',
    'Custom...'
  ];
  const reminderOptions = [
    'No reminder',
    'At time of task',
    '5 minutes before',
    '15 minutes before',
    '30 minutes before',
    '1 hour before',
    '1 day before'
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: isMaximized ? '60px 20px 20px 20px' : 'auto 15vh 7.5vh auto',
        height: isMaximized ? 'auto' : '650px',
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
          padding: '12px 16px',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
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
            Task
          </h2>
        </div>
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

      {/* Task Content */}
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#ffffff', padding: '20px' }}>
        {/* Task Title Input */}
        <div style={{ marginBottom: '20px' }}>
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter your task 456"
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              color: '#141414',
              padding: '12px 16px',
              borderRadius: '4px',
            }}
          />
        </div>

        {/* Activity Date and Reminder Row */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '20px',
          marginBottom: '20px' 
        }}>
          {/* Activity Date */}
          <div style={{ position: 'relative' }}>
            <label style={{ 
              fontSize: '13px', 
              color: '#141414', 
              fontWeight: '400',
              display: 'block',
              marginBottom: '8px'
            }}>
              Activity date
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                style={{
                  padding: '8px 2px',
                  backgroundColor: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#141414',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {activityDate === 'Custom...' ? customDate : activityDate}
              </button>
              <button
                onClick={() => setShowTimePicker(!showTimePicker)}
                style={{
                  padding: '8px 2px',
                  backgroundColor: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#141414',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '300',
                }}
              >
                <Clock size={16} />
                {activityDate === 'Custom...' ? customTime : activityTime}
              </button>
            </div>
            
            {/* Date Picker Dropdown */}
            {showDatePicker && (
              <div style={{
                position: 'absolute',
                marginTop: '4px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '5px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                minWidth: '200px',
                zIndex: 1001,
                overflow: 'hidden'
              }}>
                {dateOptions.map((option) => (
                  <button
                    key={option}
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
                      transition: 'background-color 0.2s'
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
            )}

            {/* Custom date/time inputs when Custom is selected */}
            {activityDate === 'Custom...' && (
              <div style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                marginTop: '10px',
                flexWrap: 'wrap',
              }}>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '5px',
                    fontSize: '14px',
                    color: '#141414',
                    backgroundColor: '#ffffff',
                  }}
                />
                <input
                  type="time"
                  value={customTime}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCustomTime(v);
                    setActivityTime(v);
                  }}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '5px',
                    fontSize: '14px',
                    color: '#141414',
                    backgroundColor: '#ffffff',
                  }}
                />
              </div>
            )}
          </div>

          {/* Send Reminder */}
          <div>
            <label style={{ 
              fontSize: '13px', 
              color: '#141414', 
              fontWeight: '400',
              display: 'block',
              marginBottom: '8px'
            }}>
              Send reminder
            </label>
            <button
              onClick={() => setShowReminderPicker(!showReminderPicker)}
              style={{
                width: '100%',
                padding: '8px 3px',
                backgroundColor: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#141414',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {reminder}
            </button>

            {/* Reminder Picker Dropdown */}
            {showReminderPicker && (
              <div style={{
                position: 'absolute',
                marginTop: '4px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '5px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                minWidth: '200px',
                zIndex: 1001,
                overflow: 'hidden'
              }}>
                {reminderOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setReminder(option);
                      setShowReminderPicker(false);
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
                      transition: 'background-color 0.2s'
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
            )}
          </div>
        </div>

        {/* Set to Repeat Checkbox */}
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#141414',
            }}
          >
            <input
              type="checkbox"
              checked={repeat}
              onChange={(e) => setRepeat(e.target.checked)}
              style={{
                width: '16px',
                height: '16px',
                cursor: 'pointer',
              }}
            />
            Set to repeat
          </label>
        </div>

        {/* Task Properties Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          marginBottom: '20px',
          paddingBottom: '20px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          {/* Task Type */}
          <div style={{ position: 'relative' }}>
            <label style={{ 
              fontSize: '13px', 
              color: '#718096', 
              fontWeight: '400',
              display: 'block',
              marginBottom: '8px'
            }}>
              Task Type
            </label>
            <button
              onClick={() => setShowTaskTypeDropdown(!showTaskTypeDropdown)}
              style={{
                width: '100%',
                padding: '4px 0',
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                color: '#141414',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {taskType}
            </button>
            {showTaskTypeDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '5px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                minWidth: '150px',
                zIndex: 1001,
                overflow: 'hidden'
              }}>
                {taskTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setTaskType(type);
                      setShowTaskTypeDropdown(false);
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
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f7fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Priority */}
          <div style={{ position: 'relative' }}>
            <label style={{ 
              fontSize: '13px', 
              color: '#718096', 
              fontWeight: '400',
              display: 'block',
              marginBottom: '8px'
            }}>
              Priority
            </label>
            <button
              onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
              style={{
                width: '100%',
                padding: '4px 0',
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                color: '#141414',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {priority}
            </button>
            {showPriorityDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '5px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                minWidth: '150px',
                zIndex: 1001,
                overflow: 'hidden'
              }}>
                {priorities.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPriority(p);
                      setShowPriorityDropdown(false);
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
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f7fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Queue */}
          <div style={{ position: 'relative' }}>
            <label style={{ 
              fontSize: '13px', 
              color: '#718096', 
              fontWeight: '400',
              display: 'block',
              marginBottom: '8px'
            }}>
              Queue
            </label>
            <button
              onClick={() => setShowQueueDropdown(!showQueueDropdown)}
              style={{
                width: '100%',
                padding: '4px 0',
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                color: '#141414',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {queue}
            </button>
            {showQueueDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '5px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                minWidth: '180px',
                zIndex: 1001,
                overflow: 'hidden'
              }}>
                {queues.map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setQueue(q);
                      setShowQueueDropdown(false);
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
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f7fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Activity Assigned To */}
          <div style={{ position: 'relative' }}>
            <label style={{ 
              fontSize: '13px', 
              color: '#718096', 
              fontWeight: '400',
              display: 'block',
              marginBottom: '8px'
            }}>
              Activity assigned to
            </label>
            <button
              onClick={() => setShowAssignedToDropdown(!showAssignedToDropdown)}
              style={{
                width: '100%',
                padding: '4px 0',
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                color: '#141414',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {assignedToState}
            </button>
          </div>
        </div>

        {/* Notes Section */}
        <div style={{ marginBottom: '20px' }}>
          <textarea
            ref={notesRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Notes..."
            style={{
              width: '100%',
              height: isMaximized ? '300px' : '75px',
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              color: '#141414',
              fontFamily: 'inherit',
              resize: 'none',
              lineHeight: '1.6',
              padding: '0',
            }}
          />
        </div>

        {/* Formatting Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                fontSize: '14px',
                fontWeight: '600',
              }}
              title="Bold"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f8fa')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              B
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
                fontSize: '14px',
                fontWeight: '600',
                fontStyle: 'italic',
              }}
              title="Italic"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f8fa')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              I
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
                fontSize: '14px',
                fontWeight: '600',
                textDecoration: 'underline',
              }}
              title="Underline"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f8fa')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              U
            </button>
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
              title="Link"
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
              title="Image"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f8fa')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Image size={16} aria-label="Insert Image" />
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
              title="List"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f8fa')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <List size={16} />
            </button>
          </div>
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
            Associated with 1 record
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          backgroundColor: '#ffffff',
        }}
      >
        <button
          onClick={handleSave}
          disabled={!title.trim()}
          style={{
            padding: '8px 24px',
            backgroundColor: title.trim() ? '#cbd5e0' : '#e2e8f0',
            color: '#141414',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: title.trim() ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            if (title.trim()) {
              e.currentTarget.style.backgroundColor = '#b8c5d0';
            }
          }}
          onMouseLeave={(e) => {
            if (title.trim()) {
              e.currentTarget.style.backgroundColor = '#cbd5e0';
            }
          }}
        >
          Create
        </button>
      </div>
    </div>
  );
};

export default TaskModal;
