import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, X, Maximize2, Calendar, Clock, Plus } from 'lucide-react';

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostEmail?: string;
  hostName?: string;
  attendeeEmail?: string;
  attendeeName?: string;
  onSchedule: (meetingData: {
    title: string;
    hostType: 'user' | 'rotation';
    hostEmail: string;
    startDate: string;
    startTime: string;
    endTime: string;
    attendees: string[];
    location: string;
    reminders: string[];
    description: string;
    internalNote: string;
  }) => void | Promise<void>;
}

const MeetingModal: React.FC<MeetingModalProps> = ({ 
  isOpen, 
  onClose, 
  hostEmail = 'user@example.com',
  hostName = 'Your Name',
  attendeeEmail,
  attendeeName,
  onSchedule 
}) => {
  // State management
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [hostType, setHostType] = useState<'user' | 'rotation'>('user');
  const [selectedHost, setSelectedHost] = useState(hostEmail);
  const [startDate, setStartDate] = useState(new Date());
  const [startTime, setStartTime] = useState('01:00');
  const [endTime, setEndTime] = useState('01:30');
  const [attendees, setAttendees] = useState<string[]>(attendeeEmail ? [attendeeEmail] : []);
  const [attendeeCount, setAttendeeCount] = useState(attendeeEmail ? 1 : 2);
  const [location, setLocation] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [reminders, setReminders] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [hideWeekends, setHideWeekends] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showHostDropdown, setShowHostDropdown] = useState(false);
  const [showAttendeesDropdown, setShowAttendeesDropdown] = useState(false);
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isOpen]);

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
    setScheduleLoading(true);
    try {
      await onSchedule({
        title,
        hostType,
        hostEmail: selectedHost,
        startDate: startDate.toISOString(),
        startTime,
        endTime,
        attendees,
        location,
        reminders,
        description,
        internalNote,
      });
      setTitle('');
      setHostType('user');
      setStartDate(new Date());
      setStartTime('01:00');
      setEndTime('01:30');
      setAttendees([]);
      setLocation('');
      setReminders([]);
      setDescription('');
      setInternalNote('');
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
    'Conference Room A',
    'Conference Room B',
    'Video Call',
    'Phone Call',
    'Client Office',
    'Custom Location'
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        height: isMaximized ? 'auto' : '750px',
        width: isMaximized ? 'auto' : '1320px',
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
              
              <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#141414',
                }}>
                  <input
                    type="radio"
                    name="hostType"
                    checked={hostType === 'user'}
                    onChange={() => setHostType('user')}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer',
                    }}
                  />
                  User
                </label>
                
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#141414',
                }}>
                  <input
                    type="radio"
                    name="hostType"
                    checked={hostType === 'rotation'}
                    onChange={() => setHostType('rotation')}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer',
                    }}
                  />
                  Meeting rotation
                </label>
              </div>

              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowHostDropdown(!showHostDropdown)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e0',
                    borderRadius: '4px',
                    fontSize: '14px',
                    color: '#141414',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{hostName} &lt;{selectedHost}&gt;</span>
                  <ChevronDown size={16} />
                </button>
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
                Title
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
                    Start date
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
                    <Calendar size={16} style={{ color: '#718096' }} />
                    <span>{startDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</span>
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
                    Start time
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
                      {timeSlots.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
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
                    End time
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
                      {timeSlots.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
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
              <button
                onClick={() => setShowAttendeesDropdown(!showAttendeesDropdown)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e0',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#141414',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{attendeeCount} attendees</span>
                <ChevronDown size={16} />
              </button>
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
                Location
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

            {/* Scheduled reminder emails */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#141414',
                display: 'block',
                marginBottom: '8px'
              }}>
                Scheduled reminder emails
              </label>
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
              >
                <Plus size={16} />
                Add reminder
              </button>
            </div>

            {/* Attendee description */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#141414',
                display: 'block',
                marginBottom: '8px'
              }}>
                Attendee description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Send a description to your attendees..."
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

            {/* Add internal note */}
            <div>
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
              >
                <Plus size={16} />
                Add internal note
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
              disabled={!title.trim() || scheduleLoading}
              style={{
                padding: '10px 24px',
                backgroundColor: title.trim() && !scheduleLoading ? '#cbd5e0' : '#e2e8f0',
                color: '#141414',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: title.trim() && !scheduleLoading ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onMouseEnter={(e) => {
                if (title.trim() && !scheduleLoading) {
                  e.currentTarget.style.backgroundColor = '#b8c5d0';
                }
              }}
              onMouseLeave={(e) => {
                if (title.trim() && !scheduleLoading) {
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
                'Schedule meeting'
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
                onClick={() => setStartDate(new Date())}
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
                  UTC +05:00 Almaty, Aqtau, Aqtobe, Ashgabat
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
                
                return (
                  <div
                    key={day}
                    style={{
                      padding: '12px',
                      textAlign: 'center',
                      borderRight: index < weekDays.length - 1 ? '1px solid #e2e8f0' : 'none',
                      backgroundColor: '#ffffff',
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
                  </div>
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
                  {weekDays.map((_, dayIndex) => (
                    <div
                      key={dayIndex}
                      style={{
                        borderRight: dayIndex < weekDays.length - 1 ? '1px solid #e2e8f0' : 'none',
                        backgroundColor: '#fafafa',
                        cursor: 'pointer',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f0f4f8';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fafafa';
                      }}
                    >
                      {/* Sample Event on Wednesday at 18:00 */}
                      {dayIndex === 2 && hour === 18 && (
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: '-60px',
                          backgroundColor: '#e3f2fd',
                          border: '1px solid #2196f3',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          color: '#141414',
                          fontWeight: '500',
                          overflow: 'hidden',
                        }}>
                          Prime alley x Hub...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingModal;
