import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, X, Maximize2, Calendar, Clock, Plus } from 'lucide-react';
import { getCrmMeetingsForRecord } from '@utils/crm';

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostEmail?: string;
  hostName?: string;
  attendeeEmail?: string;
  attendeeName?: string;
  /** Optional: when provided, calendar will show existing meetings */
  recordType?: 'prospect' | 'lead' | 'deal' | 'order' | 'company';
  recordId?: number;
  /** Optional defaults (used for Edit flows) */
  defaultTitle?: string;
  /** YYYY-MM-DD */
  defaultDate?: string;
  /** HH:mm */
  defaultStartTime?: string;
  /** HH:mm */
  defaultEndTime?: string;
  defaultAttendees?: string[];
  defaultLocation?: string;
  /** API format e.g. "YYYY-MM-DD HH:mm:ss" */
  defaultReminders?: string[];
  defaultSummary?: string;
  submitLabel?: string;
  onSchedule: (meetingData: {
    title: string;
    hostEmail: string;
    startDate: string;
    startTime: string;
    endTime: string;
    attendees: string[];
    location: string;
    reminders: string[];
    summary: string;
  }) => void | Promise<void>;
}

type CalendarMeeting = {
  id?: number;
  name?: string;
  meeting_date?: string;
  meeting_time?: string;
};

const findMeetingsAtHour = (
  meetings: ReadonlyArray<CalendarMeeting>,
  dateKey: string,
  hour: number,
): CalendarMeeting[] => {
  const isMatch = (m: CalendarMeeting) => {
    const d = (m.meeting_date || '').slice(0, 10);
    if (d !== dateKey) return false;
    const t = (m.meeting_time || '').slice(0, 2);
    const h = Number(t);
    return !Number.isNaN(h) && h === hour;
  };
  return meetings.filter(isMatch);
};

const MEETING_BADGE_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: 4,
  left: 4,
  right: 4,
  backgroundColor: '#e3f2fd',
  border: '1px solid #2196f3',
  borderRadius: '4px',
  padding: '4px 8px',
  fontSize: '12px',
  color: '#141414',
  fontWeight: '500',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const WeekCellMeetingBadge: React.FC<{
  meetings: ReadonlyArray<CalendarMeeting>;
  cellDate: Date;
  hour: number;
}> = ({ meetings, cellDate, hour }) => {
  const dateKey = cellDate.toISOString().slice(0, 10);
  const matches = findMeetingsAtHour(meetings, dateKey, hour);
  if (matches.length === 0) return null;
  const first = matches[0];
  const extra = matches.length - 1;
  const label = first.name || 'Meeting';
  return (
    <div style={MEETING_BADGE_STYLE} title={label}>
      {label}
      {extra > 0 ? ` (+${extra})` : ''}
    </div>
  );
};

const MeetingModal: React.FC<MeetingModalProps> = ({ 
  isOpen, 
  onClose, 
  hostEmail = 'user@example.com',
  hostName = 'Your Name',
  attendeeEmail,
  attendeeName,
  recordType,
  recordId,
  defaultTitle,
  defaultDate,
  defaultStartTime,
  defaultEndTime,
  defaultAttendees,
  defaultLocation,
  defaultReminders,
  defaultSummary,
  submitLabel = 'Schedule meeting',
  onSchedule 
}) => {
  // State management
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedHost, setSelectedHost] = useState(hostEmail);
  const [startDate, setStartDate] = useState(new Date());
  const [startTime, setStartTime] = useState('01:00');
  const [endTime, setEndTime] = useState('01:30');
  const [attendees, setAttendees] = useState<string[]>(() => {
    const base = [hostEmail, attendeeEmail].filter(Boolean) as string[];
    return Array.from(new Set(base.map((e) => String(e).trim()).filter(Boolean)));
  });
  const [currentAttendeeInput, setCurrentAttendeeInput] = useState('');
  const [location, setLocation] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [reminderInputs, setReminderInputs] = useState<string[]>([]);
  const [summary, setSummary] = useState('');
  const [hideWeekends, setHideWeekends] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showHostDropdown, setShowHostDropdown] = useState(false);
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);
  const userTimezoneLabel = useMemo(() => {
    try {
      if (typeof Intl === 'undefined') return 'Local timezone';
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const now = new Date();
      const offsetMinutes = -now.getTimezoneOffset();
      const sign = offsetMinutes >= 0 ? '+' : '-';
      const abs = Math.abs(offsetMinutes);
      const hours = String(Math.floor(abs / 60)).padStart(2, '0');
      const mins = String(abs % 60).padStart(2, '0');
      return `UTC ${sign}${hours}:${mins} ${tz}`;
    } catch {
      return 'Local timezone';
    }
  }, []);
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const prevHostRef = useRef<string>(hostEmail);

  const attendeeCount = attendees.length;

  const normalizeEmailList = (list: string[]) =>
    Array.from(
      new Set(
        list
          .map((e) => String(e).trim())
          .filter(Boolean)
          .filter((e) => e.includes('@')),
      ),
    );

  const toReminderApiFormat = (dtLocal: string): string | null => {
    // dtLocal is "YYYY-MM-DDTHH:mm"
    const v = (dtLocal || '').trim();
    if (!v) return null;
    const [d, t] = v.split('T');
    if (!d || !t) return null;
    const hhmm = t.length >= 5 ? t.slice(0, 5) : t;
    return `${d} ${hhmm}:00`;
  };

  const weekStartDate = useMemo(() => {
    const d = new Date(currentMonth);
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - d.getDay() + (hideWeekends ? 1 : 0));
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  }, [currentMonth, hideWeekends]);

  const getWeekDayDate = (index: number) => {
    const dt = new Date(weekStartDate);
    dt.setDate(weekStartDate.getDate() + index);
    return dt;
  };

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayDateString = useMemo(() => formatDateForInput(new Date()), []);

  const isSameCalendarDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const isDateTimeInPast = (date: Date, hhmm: string): boolean => {
    const [hStr, mStr] = (hhmm || '').split(':');
    const h = Number(hStr);
    const m = Number(mStr);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return false;
    const candidate = new Date(date);
    candidate.setHours(h, m, 0, 0);
    return candidate.getTime() < Date.now();
  };

  const [meetingsForCalendar, setMeetingsForCalendar] = useState<
    CalendarMeeting[]
  >([]);

  useEffect(() => {
        if (!isOpen) return;
    if (!recordType || !recordId || Number.isNaN(Number(recordId))) {
      setMeetingsForCalendar([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await getCrmMeetingsForRecord(recordType, Number(recordId), {
          per_page: 200,
          page: 1,
        });
        if (!cancelled) {
          setMeetingsForCalendar(res?.data ?? []);
        }
      } catch {
        if (!cancelled) setMeetingsForCalendar([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, recordType, recordId]);

  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isOpen]);

  const toDateOnly = (v?: string): string | null => {
    const s = (v ?? '').trim();
    if (!s) return null;
    return s.length >= 10 ? s.slice(0, 10) : null;
  };

  const reminderApiToLocal = (v: string): string | null => {
    const s = (v ?? '').trim();
    if (!s) return null;
    // "YYYY-MM-DD HH:mm:ss" -> "YYYY-MM-DDTHH:mm"
    if (s.includes(' ')) {
      const [d, t] = s.split(' ');
      if (!d || !t) return null;
      return `${d}T${t.slice(0, 5)}`;
    }
    // if already ISO-ish
    if (s.includes('T')) return s.slice(0, 16);
    return null;
  };

  useEffect(() => {
    if (!isOpen) return;
    setSelectedHost(hostEmail || 'user@example.com');
    prevHostRef.current = hostEmail || 'user@example.com';

    const dateStr = toDateOnly(defaultDate);
    if (dateStr) {
      handleDateSelect(new Date(`${dateStr}T00:00:00`));
    }
    if (defaultStartTime) setStartTime(defaultStartTime);
    if (defaultEndTime) setEndTime(defaultEndTime);
    if (defaultTitle != null) setTitle(defaultTitle);
    if (defaultLocation != null) setLocation(defaultLocation);
    if (defaultSummary != null) setSummary(defaultSummary);

    if (defaultReminders?.length) {
      const next = defaultReminders
        .map(reminderApiToLocal)
        .filter(Boolean) as string[];
      setReminderInputs(next);
    }

    setAttendees(() => {
      const base =
        defaultAttendees?.length
          ? defaultAttendees
          : ([hostEmail, attendeeEmail].filter(Boolean) as string[]);
      return normalizeEmailList(base);
    });
  }, [
    isOpen,
    hostEmail,
    attendeeEmail,
    defaultAttendees,
    defaultDate,
    defaultEndTime,
    defaultLocation,
    defaultReminders,
    defaultStartTime,
    defaultSummary,
    defaultTitle,
  ]);

  useEffect(() => {
    const prev = prevHostRef.current;
    if (prev && selectedHost && prev !== selectedHost) {
      setAttendees((prevList) => {
        const replaced = prevList.map((e) => (e === prev ? selectedHost : e));
        return normalizeEmailList(replaced);
      });
      prevHostRef.current = selectedHost;
    }
  }, [selectedHost]);

  const canSchedule = title.trim() && location.trim();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  // Calendar utilities
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const formatDateRange = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 4); // 5 days for weekdays

    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${startOfWeek.toLocaleDateString('en-US', options)} - ${endOfWeek.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];
    
    // Previous month days
    const prevMonthDays = getDaysInMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        date: new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, prevMonthDays - i)
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i)
      });
    }
    
    // Next month days to fill the grid
    const remainingDays = 35 - days.length; // 5 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, i)
      });
    }
    
    return days;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date: Date) => {
    return date.getDate() === startDate.getDate() &&
           date.getMonth() === startDate.getMonth() &&
           date.getFullYear() === startDate.getFullYear();
  };

  const handleDateSelect = (date: Date) => {
    setStartDate(date);
    setCurrentMonth(date);
  };

  const handlePrevWeek = () => {
    const newDate = new Date(currentMonth);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentMonth(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentMonth);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentMonth(newDate);
  };

  const handleSchedule = async () => {
    if (!title.trim()) {
      alert('Please enter a meeting title');
      return;
    }
    if (!location.trim()) {
      alert('Please select a location');
      return;
    }
    if (isDateTimeInPast(startDate, startTime)) {
      alert('Meetings cannot be scheduled in the past. Please pick a future date and time.');
      return;
    }
    if (endTime <= startTime) {
      alert('End time must be after start time.');
      return;
    }
    const cleanAttendees = normalizeEmailList(attendees);
    const cleanReminders = reminderInputs
      .map(toReminderApiFormat)
      .filter(Boolean) as string[];
    setScheduleLoading(true);
    try {
      await onSchedule({
        title,
        hostEmail: selectedHost,
        startDate: formatDateForInput(startDate),
        startTime,
        endTime,
        attendees: cleanAttendees,
        location,
        reminders: cleanReminders,
        summary: summary.trim(),
      });
      setTitle('');
      setStartDate(new Date());
      setStartTime('01:00');
      setEndTime('01:30');
      setAttendees([]);
      setLocation('');
      setReminderInputs([]);
      setSummary('');
      onClose();
    } finally {
      setScheduleLoading(false);
    }
  };

  const weekDays = hideWeekends 
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const timeSlots = [];
  for (let hour = 0; hour < 24; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
  }

  const locations = [
    'Video Call',
    'Phone Call',
    'In-Person Meeting',
    'Online Meeting',
    'Other',
  ];

  return (
    <React.Fragment>
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
        zIndex: 999,
      }} onClick={onClose} />
      <div
      style={{
        position: 'fixed',
        ...(isMaximized
          ? { top: '74px', left: '50%', transform: 'translateX(-50%)', width: 'min(1200px, calc(100vw - 84px))', maxHeight: 'calc(100vh - 94px)' }
          : {
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(1000px, calc(100vw - 120px))',
              height: 'min(650px, calc(100vh - 120px))',
            }),
        backgroundColor: '#ffffff',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
        borderRadius: '8px',
        border: '1px solid #cbd5e0',
        overflow: 'hidden',
        opacity: 1,
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
            <ChevronDown size={20} />
          </button>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#141414', margin: 0 }}>
            Schedule
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
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

      {/* Main Content Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Panel - Form */}
        <div style={{ 
          width: '480px', 
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
        }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {/* Host Section */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#141414',
                display: 'block',
                marginBottom: '12px'
              }}>
                Host
              </label>

              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e0',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#718096', marginBottom: '6px' }}>
                    {hostName}
                  </div>
                  <input
                    type="email"
                    value={selectedHost}
                    onChange={(e) => setSelectedHost(e.target.value)}
                    placeholder="host@example.com"
                    style={{
                      width: '100%',
                      border: 'none',
                      outline: 'none',
                      fontSize: '14px',
                      color: '#141414',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Title */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#141414',
                display: 'block',
                marginBottom: '8px'
              }}>
                Title <span style={{ color: '#f2545b' }}>*</span>
              </label>
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder=""
                style={{
                  width: '100%',
                  border: '1px solid #cccccc',
                  outline: 'none',
                  fontSize: '14px',
                  color: '#141414',
                  padding: '10px 12px',
                  borderRadius: '4px',
                }}
              />
            </div>

            {/* Date and Time */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ 
                    fontSize: '13px', 
                    fontWeight: '600', 
                    color: '#141414',
                    display: 'block',
                    marginBottom: '8px'
                  }}>
                    Start date <span style={{ color: '#f2545b' }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const el = startDateInputRef.current;
                      if (!el) return;
                      if (typeof el.showPicker === 'function') el.showPicker();
                      else el.click();
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e0',
                      borderRadius: '4px',
                      fontSize: '14px',
                      color: '#141414',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      position: 'relative',
                    }}
                    title="Select date"
                  >
                    <Calendar size={16} style={{ color: '#718096' }} />
                    <span>{startDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</span>
                    <input
                      ref={startDateInputRef}
                      type="date"
                      min={todayDateString}
                      value={formatDateForInput(startDate)}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (!v) return;
                        if (v < todayDateString) return;
                        handleDateSelect(new Date(`${v}T00:00:00`));
                      }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0,
                        pointerEvents: 'none',
                      }}
                      aria-hidden="true"
                      tabIndex={-1}
                    />
                  </button>
                </div>

                <div>
                  <label style={{ 
                    fontSize: '13px', 
                    fontWeight: '600', 
                    color: '#141414',
                    display: 'block',
                    marginBottom: '8px'
                  }}>
                    Start time <span style={{ color: '#f2545b' }}>*</span>
                  </label>
                  <div style={{
                    padding: '8px 12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e0',
                    borderRadius: '4px',
                    fontSize: '14px',
                    color: '#141414',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <Clock size={16} style={{ color: '#718096' }} />
                    <select
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      style={{
                        border: 'none',
                        outline: 'none',
                        fontSize: '14px',
                        color: '#141414',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        width: '100%',
                      }}
                    >
                      {timeSlots.map(time => {
                        const isPast =
                          isSameCalendarDay(startDate, new Date()) &&
                          isDateTimeInPast(startDate, time);
                        return (
                          <option key={time} value={time} disabled={isPast}>
                            {time}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ 
                    fontSize: '13px', 
                    fontWeight: '600', 
                    color: '#141414',
                    display: 'block',
                    marginBottom: '8px'
                  }}>
                    End time <span style={{ color: '#f2545b' }}>*</span>
                  </label>
                  <div style={{
                    padding: '8px 12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e0',
                    borderRadius: '4px',
                    fontSize: '14px',
                    color: '#141414',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <Clock size={16} style={{ color: '#718096' }} />
                    <select
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      style={{
                        border: 'none',
                        outline: 'none',
                        fontSize: '14px',
                        color: '#141414',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        width: '100%',
                      }}
                    >
                      {timeSlots.map(time => {
                        const isPast =
                          isSameCalendarDay(startDate, new Date()) &&
                          isDateTimeInPast(startDate, time);
                        const isBeforeStart = time <= startTime;
                        return (
                          <option
                            key={time}
                            value={time}
                            disabled={isPast || isBeforeStart}
                          >
                            {time}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendees */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#141414',
                display: 'block',
                marginBottom: '8px'
              }}>
                Attendees
              </label>
              <div
                style={{
                  border: '1px solid #cbd5e0',
                  borderRadius: '4px',
                  padding: '8px 10px',
                  backgroundColor: '#ffffff',
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                  {attendees.map((email) => (
                    <span
                      key={email}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 10px',
                        borderRadius: '999px',
                        backgroundColor: '#edf2f7',
                        fontSize: '13px',
                        color: '#141414',
                      }}
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => setAttendees((prev) => prev.filter((e) => e !== email))}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          color: '#718096',
                        }}
                        title="Remove"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="email"
                    value={currentAttendeeInput}
                    onChange={(e) => setCurrentAttendeeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
                        const next = currentAttendeeInput.trim().replace(/,$/, '');
                        if (next) {
                          e.preventDefault();
                          setAttendees((prev) => normalizeEmailList([...prev, next]));
                          setCurrentAttendeeInput('');
                        }
                      }
                    }}
                    placeholder={attendees.length === 0 ? 'Enter attendee emails…' : 'Add another email…'}
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      fontSize: '14px',
                      color: '#141414',
                      padding: '6px 2px',
                    }}
                  />
                  <span style={{ fontSize: '12px', color: '#718096', whiteSpace: 'nowrap' }}>
                    {attendeeCount} total
                  </span>
                </div>
              </div>
            </div>

            {/* Location */}
            <div style={{ marginBottom: '24px', position: 'relative' }} ref={locationDropdownRef}>
              <label style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#141414',
                display: 'block',
                marginBottom: '8px'
              }}>
                Location *
              </label>
              <button
                onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e0',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: location ? '#141414' : '#718096',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{location || 'Select location'}</span>
                <ChevronDown size={16} />
              </button>

              {showLocationDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '4px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '5px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  zIndex: 1001,
                  overflow: 'hidden',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}>
                  {locations.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => {
                        setLocation(loc);
                        setShowLocationDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        fontSize: '14px',
                        color: '#141414',
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
                      {loc}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reminders */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#141414',
                display: 'block',
                marginBottom: '8px'
              }}>
                Reminders
              </label>
              {reminderInputs.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
                  {reminderInputs.map((v, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="datetime-local"
                        value={v}
                        onChange={(e) =>
                          setReminderInputs((prev) =>
                            prev.map((x, i) => (i === idx ? e.target.value : x)),
                          )
                        }
                        style={{
                          flex: 1,
                          border: '1px solid #cbd5e0',
                          borderRadius: '4px',
                          padding: '10px 12px',
                          fontSize: '14px',
                          color: '#141414',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setReminderInputs((prev) => prev.filter((_, i) => i !== idx))
                        }
                        style={{
                          background: 'transparent',
                          border: '1px solid #cbd5e0',
                          borderRadius: '4px',
                          padding: '10px 12px',
                          cursor: 'pointer',
                          color: '#141414',
                        }}
                        title="Remove reminder"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#0091ae',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  padding: '0',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none';
                }}
                onClick={() => setReminderInputs((prev) => [...prev, ''])}
              >
                <Plus size={16} />
                Add reminder
              </button>
            </div>

            {/* Internal note (summary) */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#141414',
                display: 'block',
                marginBottom: '8px'
              }}>
                Internal note
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Add an internal note..."
                style={{
                  width: '100%',
                  minHeight: '80px',
                  border: '1px solid #cbd5e0',
                  borderRadius: '4px',
                  padding: '10px 12px',
                  fontSize: '14px',
                  color: '#141414',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
            </div>

            {/* Associated with */}
            <div style={{ marginBottom: '24px' }}>
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

          </div>

          {/* Footer */}
          <div
            style={{
              padding: '16px 20px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: '12px',
              backgroundColor: '#ffffff',
            }}
          >
            <button
              onClick={handleSchedule}
              disabled={!canSchedule || scheduleLoading}
              style={{
                padding: '10px 24px',
                backgroundColor: canSchedule && !scheduleLoading ? '#cbd5e0' : '#e2e8f0',
                color: '#141414',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: canSchedule && !scheduleLoading ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onMouseEnter={(e) => {
                if (canSchedule && !scheduleLoading) {
                  e.currentTarget.style.backgroundColor = '#b8c5d0';
                }
              }}
              onMouseLeave={(e) => {
                if (canSchedule && !scheduleLoading) {
                  e.currentTarget.style.backgroundColor = '#cbd5e0';
                }
              }}
            >
              {scheduleLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                  Scheduling...
                </>
              ) : (
                submitLabel
              )}
            </button>
            <button
              onClick={onClose}
              disabled={scheduleLoading}
              style={{
                padding: '10px 24px',
                backgroundColor: 'transparent',
                color: '#141414',
                border: '1px solid #cbd5e0',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
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
              Cancel
            </button>
          </div>
        </div>

        {/* Right Panel - Calendar */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#fafafa' }}>
          {/* Calendar Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
          }}>
            {/* First Row - Today Button, Date Range with Arrows */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}>
              {/* Left - Today Button */}
              <button
                onClick={() => handleDateSelect(new Date())}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e0',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '400',
                  color: '#141414',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f7fafc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }}
              >
                Today
              </button>

              {/* Center - Date Range with Navigation Arrows */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
              }}>
                <button
                  onClick={handlePrevWeek}
                  style={{
                    background: 'transparent',
                    border: '1px solid #cbd5e0',
                    borderRadius: '4px',
                    padding: '6px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#141414',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f7fafc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <ChevronDown size={16} style={{ transform: 'rotate(90deg)' }} />
                </button>
                
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  color: '#141414',
                  minWidth: '240px',
                  textAlign: 'center',
                }}>
                  {formatDateRange(currentMonth)}
                </div>
                
                <button
                  onClick={handleNextWeek}
                  style={{
                    background: 'transparent',
                    border: '1px solid #cbd5e0',
                    borderRadius: '4px',
                    padding: '6px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#141414',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f7fafc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />
                </button>
              </div>

              {/* Right - Empty space for alignment */}
              <div style={{ width: '80px' }}></div>
            </div>

            {/* Second Row - Hide Weekends and Timezone */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              {/* Left - Hide Weekends Checkbox */}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#141414',
                fontWeight: '400',
              }}>
                <input
                  type="checkbox"
                  checked={hideWeekends}
                  onChange={(e) => setHideWeekends(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: '#141414',
                  }}
                />
                Hide weekends
              </label>

              {/* Right - Timezone Selector */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowTimezoneDropdown(!showTimezoneDropdown)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '400',
                    color: '#141414',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'background-color 0.2s',
                    borderRadius: '4px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f7fafc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {userTimezoneLabel}
                  <ChevronDown size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div style={{ flex: 1, overflow: 'auto', padding: '0' }}>
            {/* Week Days Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: hideWeekends ? '80px repeat(5, 1fr)' : '80px repeat(7, 1fr)',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              position: 'sticky',
              top: 0,
              zIndex: 10,
            }}>
              <div style={{ padding: '12px', borderRight: '1px solid #e2e8f0' }}></div>
              {weekDays.map((day, index) => {
                const dayDate = new Date(currentMonth);
                const startOfWeek = new Date(dayDate);
                startOfWeek.setDate(dayDate.getDate() - dayDate.getDay() + (hideWeekends ? 1 : 0));
                const currentDayDate = new Date(startOfWeek);
                currentDayDate.setDate(startOfWeek.getDate() + index);
                
                const isCurrentDay = isToday(currentDayDate);
                const isSelectedDay = isSelected(currentDayDate);
                
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dayAtMidnight = new Date(currentDayDate);
                dayAtMidnight.setHours(0, 0, 0, 0);
                const isPastDay = dayAtMidnight.getTime() < today.getTime();
                return (
                  <button
                    key={day}
                    type="button"
                    disabled={isPastDay}
                    onClick={() => {
                      if (isPastDay) return;
                      handleDateSelect(currentDayDate);
                    }}
                    style={{
                      padding: '12px',
                      textAlign: 'center',
                      borderRight: index < weekDays.length - 1 ? '1px solid #e2e8f0' : 'none',
                      borderTop: 'none',
                      borderBottom: 'none',
                      borderLeft: 'none',
                      backgroundColor: isSelectedDay ? '#f7fafc' : '#ffffff',
                      cursor: isPastDay ? 'not-allowed' : 'pointer',
                      opacity: isPastDay ? 0.45 : 1,
                      font: 'inherit',
                      color: 'inherit',
                    }}
                  >
                    <div style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#718096',
                      marginBottom: '4px',
                    }}>
                      {day}
                    </div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: isCurrentDay ? '600' : '400',
                      color: isCurrentDay ? '#ffffff' : '#141414',
                      backgroundColor: isCurrentDay ? '#ff3842' : 'transparent',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto',
                    }}>
                      {currentDayDate.getDate()}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Time Slots */}
            <div style={{ position: 'relative' }}>
              {Array.from({ length: 24 }, (_, hour) => (
                <div
                  key={hour}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: hideWeekends ? '80px repeat(5, 1fr)' : '80px repeat(7, 1fr)',
                    borderBottom: '1px solid #e2e8f0',
                    minHeight: '60px',
                  }}
                >
                  {/* Time Label */}
                  <div style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    color: '#718096',
                    borderRight: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    position: 'sticky',
                    left: 0,
                  }}>
                    {`${hour.toString().padStart(2, '0')}:00`}
                  </div>

                  {/* Day Cells */}
                  {weekDays.map((_, dayIndex) => {
                    const selectWeekCellSlot = () => {
                      const d = getWeekDayDate(dayIndex);
                      const startHourStr = hour.toString().padStart(2, '0');
                      const nextStart = `${startHourStr}:00`;
                      const nextEnd = `${startHourStr}:30`;
                      if (isDateTimeInPast(d, nextStart)) {
                        return;
                      }
                      handleDateSelect(d);
                      setStartTime(nextStart);
                      setEndTime(nextEnd);
                    };
                    return (
                    <button
                      key={dayIndex}
                      type="button"
                      aria-label={`Schedule meeting at ${hour.toString().padStart(2, '0')}:00`}
                      style={{
                        borderRight: dayIndex < weekDays.length - 1 ? '1px solid #e2e8f0' : 'none',
                        borderTop: 'none',
                        borderBottom: 'none',
                        borderLeft: 'none',
                        backgroundColor: '#fafafa',
                        cursor: 'pointer',
                        position: 'relative',
                        padding: 0,
                        font: 'inherit',
                        color: 'inherit',
                        textAlign: 'left',
                      }}
                      onClick={selectWeekCellSlot}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f0f4f8';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fafafa';
                      }}
                    >
                      <WeekCellMeetingBadge
                        meetings={meetingsForCalendar}
                        cellDate={getWeekDayDate(dayIndex)}
                        hour={hour}
                      />
                    </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </React.Fragment>
  );
};

export default MeetingModal;
