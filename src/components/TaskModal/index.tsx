import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, X, Link, Image, List } from 'lucide-react';
import Select from 'react-select';
import { ModuleSlug } from '@utils/Helper';
import { GetHierarchyData } from '@utils/users';
import {
  buildFollowUpTaskFields,
  type FollowUpTaskFields,
  buildIn3BusinessDaysLabel,
} from '@utils/crmFollowUpTaskDue';

// ============================================================================
// URL INPUT MODAL (for link/image URL entry)
// ============================================================================

interface UrlInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  defaultValue: string;
  placeholder?: string;
  submitLabel?: string;
  onSubmit: (value: string) => void;
}

const UrlInputModal: React.FC<UrlInputModalProps> = ({
  isOpen,
  onClose,
  title,
  defaultValue,
  placeholder = 'https://',
  submitLabel = 'Insert',
  onSubmit,
}) => {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const url = (value || '').trim() || defaultValue;
    onSubmit(url);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '400px',
        backgroundColor: '#ffffff',
        zIndex: 1002,
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
        borderRadius: '8px',
        border: '1px solid #cbd5e0',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#141414',
            margin: 0,
          }}
        >
          {title}
        </h3>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            color: '#718096',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f5f8fa';
            e.currentTarget.style.color = '#141414';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#718096';
          }}
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
      <div style={{ padding: '20px' }}>
        <input
          ref={inputRef}
          type="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #cbd5e0',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#141414',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#0091ae';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#cbd5e0';
          }}
        />
      </div>
      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#141414',
            border: '1px solid #cbd5e0',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f7fafc';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          style={{
            padding: '8px 16px',
            backgroundColor: '#0091ae',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#007a8c';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#0091ae';
          }}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// TASK MODAL
// ============================================================================

/** Payload from Task modal save; includes aligned follow-up keys (always true for this flow). */
export type TaskModalSaveTaskData = {
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
} & FollowUpTaskFields;

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignedTo?: string;
  assignedToName?: string;
  /** Optional HTML string used to prefill the notes editor (e.g. when editing an existing task). */
  initialNotesHtml?: string;
  onSave: (taskData: TaskModalSaveTaskData) => void;
}

type UrlModalType = 'link' | 'image' | null;

type NoteEditorShortcutHandlers = {
  bold: () => void;
  italic: () => void;
  underline: () => void;
  link: () => void;
};

function runNoteEditorShortcut(
  e: React.KeyboardEvent<HTMLDivElement>,
  handlers: NoteEditorShortcutHandlers,
) {
  if (!(e.ctrlKey || e.metaKey)) return;
  const handlerByKey: Record<string, () => void> = {
    b: handlers.bold,
    i: handlers.italic,
    u: handlers.underline,
    k: handlers.link,
  };
  const handler = handlerByKey[e.key.toLowerCase()];
  if (!handler) return;
  e.preventDefault();
  handler();
}

function focusEditorAndOpenUrlModal(
  notesElement: HTMLDivElement | null,
  setUrlModalType: React.Dispatch<React.SetStateAction<'link' | 'image' | null>>,
  modalType: 'link' | 'image',
) {
  if (!notesElement) return;
  notesElement.focus();
  setUrlModalType(modalType);
}

function getSelectedUserExtensionOption(
  assignedTo: string,
  extensions: any[],
): { value: string; label: string } | null {
  if (!assignedTo || extensions.length === 0) {
    return null;
  }

  const assignedId = assignedTo.split(',')[0]?.trim() || '';
  const matchedExtension = extensions.find(
    (extension: any) =>
      extension.id?.toString() === assignedId ||
      extension.extension?.toString() === assignedId,
  );
  if (!matchedExtension) {
    return null;
  }

  return {
    value:
      matchedExtension.id?.toString() ||
      matchedExtension.extension?.toString() ||
      '',
    label:
      matchedExtension.display_name ||
      matchedExtension.name ||
      `Extension ${matchedExtension.id || matchedExtension.extension}`,
  };
}

function useTaskPropertiesOutsideClick(
  showTaskTypeDropdown: boolean,
  showPriorityDropdown: boolean,
  showQueueDropdown: boolean,
  taskPropertiesRef: React.RefObject<HTMLDivElement | null>,
  setShowTaskTypeDropdown: React.Dispatch<React.SetStateAction<boolean>>,
  setShowPriorityDropdown: React.Dispatch<React.SetStateAction<boolean>>,
  setShowQueueDropdown: React.Dispatch<React.SetStateAction<boolean>>,
) {
  useEffect(() => {
    const anyOpen =
      showTaskTypeDropdown || showPriorityDropdown || showQueueDropdown;
    if (!anyOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        taskPropertiesRef.current &&
        !taskPropertiesRef.current.contains(e.target as Node)
      ) {
        setShowTaskTypeDropdown(false);
        setShowPriorityDropdown(false);
        setShowQueueDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [
    showTaskTypeDropdown,
    showPriorityDropdown,
    showQueueDropdown,
    taskPropertiesRef,
    setShowTaskTypeDropdown,
    setShowPriorityDropdown,
    setShowQueueDropdown,
  ]);
}

function useMoreFormattingOutsideClick(
  showMoreFormattingDropdown: boolean,
  moreFormattingRef: React.RefObject<HTMLDivElement | null>,
  setShowMoreFormattingDropdown: React.Dispatch<React.SetStateAction<boolean>>,
) {
  useEffect(() => {
    if (!showMoreFormattingDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        moreFormattingRef.current &&
        !moreFormattingRef.current.contains(e.target as Node)
      ) {
        setShowMoreFormattingDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMoreFormattingDropdown, moreFormattingRef, setShowMoreFormattingDropdown]);
}

interface TaskUrlInputOverlayProps {
  urlModalType: UrlModalType;
  onClose: () => void;
  onInsertHtml: (html: string) => void;
}

function TaskUrlInputOverlay({
  urlModalType,
  onClose,
  onInsertHtml,
}: Readonly<TaskUrlInputOverlayProps>) {
  if (!urlModalType) return null;
  const isLink = urlModalType === 'link';
  return (
    <UrlInputModal
      isOpen
      onClose={onClose}
      title={isLink ? 'Enter URL' : 'Enter image URL'}
      defaultValue="https://"
      placeholder="https://"
      submitLabel={isLink ? 'Insert link' : 'Insert image'}
      onSubmit={(url) => {
        const safeUrl = url.trim();
        if (!safeUrl) return;
        if (isLink) {
          onInsertHtml(
            `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>`,
          );
          return;
        }
        onInsertHtml(`<img src="${safeUrl}" alt="Inserted image" />`);
      }}
    />
  );
}

function getTaskModalPanelStyle(isMaximized: boolean): React.CSSProperties {
  const shared: React.CSSProperties = {
    position: 'fixed',
    inset: 'unset',
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

  if (isMaximized) {
    return {
      ...shared,
      top: '74px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'min(900px, calc(100vw - 84px))',
      maxHeight: 'calc(100vh - 94px)',
      height: 'auto',
    };
  }

  return {
    ...shared,
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'min(650px, calc(100vw - 120px))',
    height: '650px',
  };
}

const TaskModal: React.FC<TaskModalProps> = ({ // NOSONAR
  isOpen,
  onClose,
  assignedTo = '',
  assignedToName = 'Unassigned',
  initialNotesHtml,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [activityDate, setActivityDate] = useState(() => buildIn3BusinessDaysLabel());
  const [activityTime, setActivityTime] = useState(() =>
    new Date().toTimeString().slice(0, 5),
  );
  const [reminder, setReminder] = useState('No reminder');
  const [repeat, setRepeat] = useState(false);
  const [taskType, setTaskType] = useState('To-do');
  const [priority, setPriority] = useState('None');
  const [queue, setQueue] = useState('None');
  const [notes, setNotes] = useState(initialNotesHtml || '');
  const [isMaximized, setIsMaximized] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [showTaskTypeDropdown, setShowTaskTypeDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showQueueDropdown, setShowQueueDropdown] = useState(false);
  const [showMoreFormattingDropdown, setShowMoreFormattingDropdown] =
    useState(false);
  const [activityAssignedExtensions, setActivityAssignedExtensions] = useState<
    any[]
  >([]);
  const [selectedUserExtension, setSelectedUserExtension] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [customDate, setCustomDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [customTime, setCustomTime] = useState(() =>
    new Date().toTimeString().slice(0, 5),
  );
  const [urlModalType, setUrlModalType] = useState<UrlModalType>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLDivElement>(null);
  const moreFormattingRef = useRef<HTMLDivElement>(null);
  const taskPropertiesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isOpen]);

  // When the modal is opened for editing, ensure the rich-text editor
  // shows the HTML notes exactly as provided from the API response.
  useEffect(() => {
    if (!isOpen) return;
    if (typeof initialNotesHtml === 'string') {
      setNotes(initialNotesHtml);
    }
  }, [isOpen, initialNotesHtml]);

  useTaskPropertiesOutsideClick(
    showTaskTypeDropdown,
    showPriorityDropdown,
    showQueueDropdown,
    taskPropertiesRef,
    setShowTaskTypeDropdown,
    setShowPriorityDropdown,
    setShowQueueDropdown,
  );

  useEffect(() => {
    const fetchExtensions = async () => {
      try {
        const hierarchyData = await GetHierarchyData(
          ModuleSlug.CRM_DATA_MANAGEMENT,
        );
        const exts = hierarchyData?.extensions || [];
        setActivityAssignedExtensions(exts);
        setSelectedUserExtension(getSelectedUserExtensionOption(assignedTo, exts));
      } catch (error) {
        console.error('Failed to fetch activity assigned extensions:', error);
      }
    };
    if (isOpen) fetchExtensions();
  }, [isOpen, assignedTo]);

  useMoreFormattingOutsideClick(
    showMoreFormattingDropdown,
    moreFormattingRef,
    setShowMoreFormattingDropdown,
  );

  // Sync contentEditable content to state when modal opens
  useEffect(() => {
    if (isOpen && notesRef.current) {
      notesRef.current.innerHTML = notes || '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only set initial content when modal opens
  }, [isOpen]);

  if (!isOpen) return null;

  const syncNotesFromEditor = () => {
    if (notesRef.current) setNotes(notesRef.current.innerHTML || '');
  };

  const getActiveEditorRange = () => {
    const el = notesRef.current;
    const selection = globalThis.getSelection?.();
    if (
      !el ||
      !selection ||
      selection.rangeCount === 0 ||
      !el.contains(selection.anchorNode)
    ) {
      return null;
    }
    return selection.getRangeAt(0);
  };

  const wrapSelectionWithTag = (tagName: 'b' | 'i' | 'u' | 'code') => {
    const range = getActiveEditorRange();
    const el = notesRef.current;
    if (!el) return;
    el.focus();
    if (!range) return;
    const selectedText = range.toString();
    const tag = document.createElement(tagName);
    tag.textContent = selectedText || (tagName === 'code' ? 'code' : 'text');
    range.deleteContents();
    range.insertNode(tag);
    range.setStartAfter(tag);
    range.setEndAfter(tag);
    syncNotesFromEditor();
  };

  const insertHtmlAtSelection = (html: string) => {
    const range = getActiveEditorRange();
    const el = notesRef.current;
    if (!el) return;
    el.focus();
    if (!range) return;
    const fragment = range.createContextualFragment(html);
    range.deleteContents();
    range.insertNode(fragment);
    syncNotesFromEditor();
  };

  const handleBold = () => wrapSelectionWithTag('b');
  const handleItalic = () => wrapSelectionWithTag('i');
  const handleUnderline = () => wrapSelectionWithTag('u');

  const handleLink = () => {
    focusEditorAndOpenUrlModal(notesRef.current, setUrlModalType, 'link');
  };

  const handleList = () => {
    insertHtmlAtSelection('<ul><li>List item</li></ul>');
  };

  const handleCode = () => {
    wrapSelectionWithTag('code');
  };

  const handleImage = () => {
    focusEditorAndOpenUrlModal(notesRef.current, setUrlModalType, 'image');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    runNoteEditorShortcut(e, {
      bold: handleBold,
      italic: handleItalic,
      underline: handleUnderline,
      link: handleLink,
    });
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Please enter a task title');
      return;
    }

    const dateToSend = activityDate === 'Custom...' ? customDate : activityDate;
    const timeToSend = activityDate === 'Custom...' ? customTime : activityTime;
    const followUp = buildFollowUpTaskFields(
      true,
      activityDate,
      customDate,
      timeToSend,
    );

    onSave({
      title,
      activityDate: dateToSend,
      activityTime: timeToSend,
      reminder,
      repeat,
      taskType,
      priority,
      queue,
      assignedTo: selectedUserExtension?.value ?? '',
      notes,
      ...followUp,
    });

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5);
    setTitle('');
    setActivityDate(buildIn3BusinessDaysLabel());
    setActivityTime(timeStr);
    setCustomDate(today);
    setCustomTime(timeStr);
    setReminder('No reminder');
    setRepeat(false);
    setTaskType('To-do');
    setPriority('None');
    setQueue('None');
    setSelectedUserExtension(null);
    setNotes('');
    setIsMaximized(false);
    onClose();
  };

  const taskModalSelectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      minHeight: '36px',
      fontSize: '14px',
      fontWeight: '600',
      borderColor: state.isFocused ? '#0091ae' : '#e2e8f0',
      borderRadius: '6px',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(0, 145, 174, 0.2)' : 'none',
      '&:hover': { borderColor: state.isFocused ? '#0091ae' : '#cbd5e0' },
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: '#718096',
      fontWeight: '400',
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: '#141414',
      fontWeight: '600',
    }),
    menu: (provided: any) => ({ ...provided, fontSize: '14px' }),
  };

  const taskPropertyFieldStyle = {
    padding: '8px 12px',
    minHeight: '36px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    cursor: 'pointer',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  } as const;

  const taskTypes = [
    'To-do',
    'Call',
    'Email',
    'Meeting',
    'Task',
    'SMS',
    'WhatsApp',
  ];
  const priorities = ['None', 'Low', 'Medium', 'High'];
  const queues = ['None', 'Sales Queue', 'Support Queue', 'Marketing Queue'];
  const dateOptions = [
    'Today',
    'Tomorrow',
    buildIn3BusinessDaysLabel(),
    'In 1 week',
    'In 2 weeks',
    'In 1 month',
    'Custom...',
  ];
  const reminderOptions = [
    'No reminder',
    'At time of task',
    '5 minutes before',
    '15 minutes before',
    '30 minutes before',
    '1 hour before',
    '1 day before',
  ];

  return (
    <>
      <TaskUrlInputOverlay
        urlModalType={urlModalType}
        onClose={() => setUrlModalType(null)}
        onInsertHtml={insertHtmlAtSelection}
      />
      <button
        type="button"
        aria-label="Close task modal"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
          zIndex: 999,
          border: 'none',
          padding: 0,
          margin: 0,
          cursor: 'default',
        }}
      />
      <div style={getTaskModalPanelStyle(isMaximized)}>
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
              type="button"
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
            <h2
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#141414',
                margin: 0,
              }}
            >
              Task
            </h2>
          </div>
          <button
            type="button"
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
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            backgroundColor: '#ffffff',
            padding: '20px',
          }}
        >
          {/* Task Title Input */}
          <div style={{ marginBottom: '20px' }}>
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your task"
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: '20px',
              marginBottom: '20px',
            }}
          >
            {/* Activity Date */}
            <div style={{ position: 'relative' }}>
              <label
                style={{
                  fontSize: '13px',
                  color: '#141414',
                  fontWeight: '400',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Activity date
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDatePicker(!showDatePicker);
                      // setShowTimePicker(false);
                    }}
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
                  {showDatePicker && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '100%',
                        marginTop: '4px',
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
                      padding: '8px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '5px',
                      fontSize: '14px',
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
                    gap: '12px',
                    alignItems: 'center',
                    marginTop: '10px',
                    flexWrap: 'wrap',
                  }}
                >
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
                </div>
              )}
            </div>

            {/* Send Reminder */}
            <div>
              <label
                style={{
                  fontSize: '13px',
                  color: '#141414',
                  fontWeight: '400',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Send reminder
              </label>
              <button
                type="button"
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

              {showReminderPicker && (
                <div
                  style={{
                    position: 'absolute',
                    marginTop: '4px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '5px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    minWidth: '200px',
                    zIndex: 1001,
                    overflow: 'hidden',
                  }}
                >
                  {reminderOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
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
          <div
            ref={taskPropertiesRef}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '20px',
              marginBottom: '20px',
              paddingBottom: '20px',
              borderBottom: '1px solid #e2e8f0',
            }}
          >
            {/* Task Type */}
            <div style={{ position: 'relative' }}>
              <label
                style={{
                  fontSize: '13px',
                  color: '#718096',
                  fontWeight: '400',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Task Type
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowTaskTypeDropdown(!showTaskTypeDropdown);
                  setShowPriorityDropdown(false);
                  setShowQueueDropdown(false);
                }}
                style={{
                  ...taskPropertyFieldStyle,
                  width: '100%',
                  textAlign: 'left',
                  font: 'inherit',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#141414',
                  }}
                >
                  {taskType}
                </span>
                <ChevronDown
                  size={16}
                  style={{
                    color: '#718096',
                    flexShrink: 0,
                    transform: showTaskTypeDropdown
                      ? 'rotate(180deg)'
                      : 'none',
                    transition: 'transform 0.2s',
                  }}
                />
              </button>
              {showTaskTypeDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '6px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                    minWidth: '150px',
                    zIndex: 1001,
                    overflow: 'hidden',
                  }}
                >
                  {taskTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
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
                        transition: 'background-color 0.2s',
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
              <label
                style={{
                  fontSize: '13px',
                  color: '#718096',
                  fontWeight: '400',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Priority
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowPriorityDropdown(!showPriorityDropdown);
                  setShowTaskTypeDropdown(false);
                  setShowQueueDropdown(false);
                }}
                style={{
                  ...taskPropertyFieldStyle,
                  width: '100%',
                  textAlign: 'left',
                  font: 'inherit',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#141414',
                  }}
                >
                  {priority}
                </span>
                <ChevronDown
                  size={16}
                  style={{
                    color: '#718096',
                    flexShrink: 0,
                    transform: showPriorityDropdown
                      ? 'rotate(180deg)'
                      : 'none',
                    transition: 'transform 0.2s',
                  }}
                />
              </button>
              {showPriorityDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '6px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                    minWidth: '150px',
                    zIndex: 1001,
                    overflow: 'hidden',
                  }}
                >
                  {priorities.map((p) => (
                    <button
                      key={p}
                      type="button"
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
                        transition: 'background-color 0.2s',
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
              <label
                style={{
                  fontSize: '13px',
                  color: '#718096',
                  fontWeight: '400',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Queue
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowQueueDropdown(!showQueueDropdown);
                  setShowTaskTypeDropdown(false);
                  setShowPriorityDropdown(false);
                }}
                style={{
                  ...taskPropertyFieldStyle,
                  width: '100%',
                  textAlign: 'left',
                  font: 'inherit',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#141414',
                  }}
                >
                  {queue}
                </span>
                <ChevronDown
                  size={16}
                  style={{
                    color: '#718096',
                    flexShrink: 0,
                    transform: showQueueDropdown ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                  }}
                />
              </button>
              {showQueueDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '6px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                    minWidth: '180px',
                    zIndex: 1001,
                    overflow: 'hidden',
                  }}
                >
                  {queues.map((q) => (
                    <button
                      key={q}
                      type="button"
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
                        transition: 'background-color 0.2s',
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
              <label
                style={{
                  fontSize: '13px',
                  color: '#718096',
                  fontWeight: '400',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Activity assigned to
              </label>
              <Select
                options={activityAssignedExtensions.map((ext: any) => ({
                  value:
                    ext.id?.toString() || ext.extension?.toString() || '',
                  label:
                    ext.display_name ||
                    ext.name ||
                    `Extension ${ext.id || ext.extension}`,
                }))}
                value={selectedUserExtension}
                onChange={(selected) =>
                  setSelectedUserExtension(selected || null)
                }
                placeholder="Select user"
                styles={taskModalSelectStyles}
              />
            </div>
          </div>

          {/* Notes Section - contentEditable for rich text */}
          <div style={{ marginBottom: '20px' }}>
            <style>{`.notes-content-editable:empty::before { content: attr(data-placeholder); color: #a0aec0; }`}</style>
            <div
              ref={notesRef}
              contentEditable
              suppressContentEditableWarning
              onInput={syncNotesFromEditor}
              onKeyDown={handleKeyDown}
              data-placeholder="Notes..."
              style={{
                width: '100%',
                minHeight: isMaximized ? '300px' : '75px',
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                color: '#141414',
                fontFamily: 'inherit',
                lineHeight: '1.6',
                padding: '0',
              }}
              className="notes-content-editable"
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
                type="button"
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
                onClick={handleBold}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = '#f5f8fa')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'transparent')
                }
              >
                B
              </button>
              <button
                type="button"
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
                onClick={handleItalic}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = '#f5f8fa')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'transparent')
                }
              >
                I
              </button>
              <button
                type="button"
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
                onClick={handleUnderline}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = '#f5f8fa')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'transparent')
                }
              >
                U
              </button>
              <div style={{ position: 'relative' }} ref={moreFormattingRef}>
                <button
                  type="button"
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
                  title="More formatting"
                  onClick={() => setShowMoreFormattingDropdown((v) => !v)}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = '#f5f8fa')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = 'transparent')
                  }
                >
                  More
                  <ChevronDown size={14} />
                </button>
                {showMoreFormattingDropdown && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '100%',
                      marginTop: '4px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '5px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      zIndex: 1001,
                      minWidth: '120px',
                    }}
                  >
                    <button
                      type="button"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: 'none',
                        background: 'transparent',
                        fontSize: '14px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontFamily: 'monospace',
                      }}
                      onClick={() => {
                        handleCode();
                        setShowMoreFormattingDropdown(false);
                      }}
                    >
                      Code
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
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
                onClick={handleLink}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = '#f5f8fa')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'transparent')
                }
              >
                <Link size={16} />
              </button>
              <button
                type="button"
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
                onClick={handleImage}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = '#f5f8fa')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'transparent')
                }
              >
                <Image size={16} aria-label="Insert Image" />
              </button>
              <button
                type="button"
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
                onClick={handleList}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = '#f5f8fa')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'transparent')
                }
              >
                <List size={16} />
              </button>
            </div>
            <button
              type="button"
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
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = '#f5f8fa')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'transparent')
              }
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
            type="button"
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
    </>
  );
};

export default TaskModal;
