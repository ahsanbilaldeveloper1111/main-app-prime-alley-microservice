import React, { useState, useRef, useEffect } from 'react';
import { Search, Clock, X } from 'lucide-react';

interface Timezone {
  iana: string;
  name: string;
  city: string;
}

const TimezoneSearch = () => {
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);
  const [timezoneSearch, setTimezoneSearch] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get user's local timezone
  const getUserTimezone = (): string => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'UTC';
    }
  };

  // Initialize selected timezone with user's local timezone
  const [selectedTimezone, setSelectedTimezone] = useState<string>(() => getUserTimezone());

  // Comprehensive list of real IANA timezones
  const timezones: Timezone[] = [
    { iana: 'America/New_York', name: 'Eastern Time', city: 'New York' },
    { iana: 'America/Chicago', name: 'Central Time', city: 'Chicago' },
    { iana: 'America/Denver', name: 'Mountain Time', city: 'Denver' },
    { iana: 'America/Los_Angeles', name: 'Pacific Time', city: 'Los Angeles' },
    { iana: 'America/Phoenix', name: 'Mountain Time', city: 'Phoenix' },
    { iana: 'America/Anchorage', name: 'Alaska Time', city: 'Anchorage' },
    { iana: 'Pacific/Honolulu', name: 'Hawaii Time', city: 'Honolulu' },
    { iana: 'America/Toronto', name: 'Eastern Time', city: 'Toronto' },
    { iana: 'America/Vancouver', name: 'Pacific Time', city: 'Vancouver' },
    { iana: 'America/Mexico_City', name: 'Central Time', city: 'Mexico City' },
    { iana: 'America/Sao_Paulo', name: 'Brasilia Time', city: 'São Paulo' },
    { iana: 'America/Buenos_Aires', name: 'Argentina Time', city: 'Buenos Aires' },
    { iana: 'America/Lima', name: 'Peru Time', city: 'Lima' },
    { iana: 'Europe/London', name: 'Greenwich Mean Time', city: 'London' },
    { iana: 'Europe/Paris', name: 'Central European Time', city: 'Paris' },
    { iana: 'Europe/Berlin', name: 'Central European Time', city: 'Berlin' },
    { iana: 'Europe/Rome', name: 'Central European Time', city: 'Rome' },
    { iana: 'Europe/Madrid', name: 'Central European Time', city: 'Madrid' },
    { iana: 'Europe/Amsterdam', name: 'Central European Time', city: 'Amsterdam' },
    { iana: 'Europe/Stockholm', name: 'Central European Time', city: 'Stockholm' },
    { iana: 'Europe/Zurich', name: 'Central European Time', city: 'Zurich' },
    { iana: 'Europe/Vienna', name: 'Central European Time', city: 'Vienna' },
    { iana: 'Europe/Prague', name: 'Central European Time', city: 'Prague' },
    { iana: 'Europe/Warsaw', name: 'Central European Time', city: 'Warsaw' },
    { iana: 'Europe/Athens', name: 'Eastern European Time', city: 'Athens' },
    { iana: 'Europe/Istanbul', name: 'Turkey Time', city: 'Istanbul' },
    { iana: 'Europe/Moscow', name: 'Moscow Time', city: 'Moscow' },
    { iana: 'Asia/Dubai', name: 'Gulf Standard Time', city: 'Dubai' },
    { iana: 'Asia/Riyadh', name: 'Arabia Standard Time', city: 'Riyadh' },
    { iana: 'Asia/Kuwait', name: 'Arabia Standard Time', city: 'Kuwait' },
    { iana: 'Asia/Bahrain', name: 'Arabia Standard Time', city: 'Bahrain' },
    { iana: 'Asia/Qatar', name: 'Arabia Standard Time', city: 'Doha' },
    { iana: 'Asia/Muscat', name: 'Gulf Standard Time', city: 'Muscat' },
    { iana: 'Asia/Karachi', name: 'Pakistan Time', city: 'Karachi' },
    { iana: 'Asia/Kolkata', name: 'India Standard Time', city: 'Mumbai' },
    { iana: 'Asia/Dhaka', name: 'Bangladesh Time', city: 'Dhaka' },
    { iana: 'Asia/Bangkok', name: 'Indochina Time', city: 'Bangkok' },
    { iana: 'Asia/Singapore', name: 'Singapore Time', city: 'Singapore' },
    { iana: 'Asia/Kuala_Lumpur', name: 'Malaysia Time', city: 'Kuala Lumpur' },
    { iana: 'Asia/Jakarta', name: 'Western Indonesia Time', city: 'Jakarta' },
    { iana: 'Asia/Manila', name: 'Philippine Time', city: 'Manila' },
    { iana: 'Asia/Hong_Kong', name: 'Hong Kong Time', city: 'Hong Kong' },
    { iana: 'Asia/Shanghai', name: 'China Standard Time', city: 'Shanghai' },
    { iana: 'Asia/Taipei', name: 'Taipei Time', city: 'Taipei' },
    { iana: 'Asia/Seoul', name: 'Korea Standard Time', city: 'Seoul' },
    { iana: 'Asia/Tokyo', name: 'Japan Standard Time', city: 'Tokyo' },
    { iana: 'Australia/Sydney', name: 'Australian Eastern Time', city: 'Sydney' },
    { iana: 'Australia/Melbourne', name: 'Australian Eastern Time', city: 'Melbourne' },
    { iana: 'Australia/Brisbane', name: 'Australian Eastern Time', city: 'Brisbane' },
    { iana: 'Australia/Perth', name: 'Australian Western Time', city: 'Perth' },
    { iana: 'Australia/Adelaide', name: 'Australian Central Time', city: 'Adelaide' },
    { iana: 'Pacific/Auckland', name: 'New Zealand Time', city: 'Auckland' },
    { iana: 'Africa/Cairo', name: 'Eastern European Time', city: 'Cairo' },
    { iana: 'Africa/Johannesburg', name: 'South Africa Time', city: 'Johannesburg' },
    { iana: 'Africa/Lagos', name: 'West Africa Time', city: 'Lagos' },
    { iana: 'Africa/Nairobi', name: 'East Africa Time', city: 'Nairobi' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTimezoneDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get timezone offset string (e.g., "GMT+4", "GMT-5")
  const getTimezoneOffset = (iana: string): string => {
    try {
      const now = new Date();
      
      // Format the same moment in UTC and target timezone
      const utcFormatter = new Intl.DateTimeFormat('en', {
        timeZone: 'UTC',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
      });
      
      const tzFormatter = new Intl.DateTimeFormat('en', {
        timeZone: iana,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
      });
      
      const utcParts = utcFormatter.formatToParts(now);
      const tzParts = tzFormatter.formatToParts(now);
      
      const utcHour = parseInt(utcParts.find(p => p.type === 'hour')?.value || '0');
      const utcMin = parseInt(utcParts.find(p => p.type === 'minute')?.value || '0');
      const utcSec = parseInt(utcParts.find(p => p.type === 'second')?.value || '0');
      
      const tzHour = parseInt(tzParts.find(p => p.type === 'hour')?.value || '0');
      const tzMin = parseInt(tzParts.find(p => p.type === 'minute')?.value || '0');
      const tzSec = parseInt(tzParts.find(p => p.type === 'second')?.value || '0');
      
      // Calculate offset in seconds
      const utcTotalSeconds = utcHour * 3600 + utcMin * 60 + utcSec;
      const tzTotalSeconds = tzHour * 3600 + tzMin * 60 + tzSec;
      
      let offsetSeconds = tzTotalSeconds - utcTotalSeconds;
      
      // Handle day boundaries (if difference is more than 12 hours, assume next/previous day)
      if (offsetSeconds > 43200) offsetSeconds -= 86400;
      if (offsetSeconds < -43200) offsetSeconds += 86400;
      
      const offsetHours = offsetSeconds / 3600;
      
      // Format offset
      if (Math.abs(offsetHours) < 0.1) return 'GMT';
      
      const sign = offsetHours >= 0 ? '+' : '';
      const hours = Math.abs(Math.floor(offsetHours));
      const minutes = Math.abs(Math.floor((offsetHours % 1) * 60));
      
      if (minutes === 0) {
        return `GMT${sign}${hours}`;
      }
      return `GMT${sign}${hours}:${minutes.toString().padStart(2, '0')}`;
    } catch {
      return 'GMT';
    }
  };

  // Get formatted time for a timezone
  const getTimeForTimezone = (iana: string): Date => {
    try {
      const formatter = new Intl.DateTimeFormat('en', {
        timeZone: iana,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      
      const parts = formatter.formatToParts(currentTime);
      const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
      const month = parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1;
      const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
      const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
      const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
      const second = parseInt(parts.find(p => p.type === 'second')?.value || '0');
      
      return new Date(year, month, day, hour, minute, second);
    } catch {
      return currentTime;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date, iana: string) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const offset = getTimezoneOffset(iana);
    
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
  };

  const filteredTimezones = timezones.filter(tz => 
    tz.city.toLowerCase().includes(timezoneSearch.toLowerCase()) ||
    tz.name.toLowerCase().includes(timezoneSearch.toLowerCase()) ||
    tz.iana.toLowerCase().includes(timezoneSearch.toLowerCase()) ||
    getTimezoneOffset(tz.iana).toLowerCase().includes(timezoneSearch.toLowerCase())
  );

  // Get current date/time for selected timezone
  const getCurrentDateTimeGMT = (iana: string) => {
    const date = getTimeForTimezone(iana);
  
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: iana,
      timeZoneName: 'short',
      hour12: true
    };
  
    return new Intl.DateTimeFormat('en-GB', options).format(currentTime);
  };

  // Get selected timezone info
  const getSelectedTimezoneInfo = () => {
    const tz = timezones.find(t => t.iana === selectedTimezone);
    if (tz) {
      return { ...tz, offset: getTimezoneOffset(tz.iana) };
    }
    // Fallback to user's timezone if not found
    return {
      iana: selectedTimezone,
      city: selectedTimezone.split('/').pop()?.replace(/_/g, ' ') || 'Local',
      name: 'Local Time',
      offset: getTimezoneOffset(selectedTimezone)
    };
  };

  return (
    <div className="timezone-search-container" style={{ position: 'relative' }}>
      <style>{`
        .timezone-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          width: 400px;
          max-height: 500px;
          overflow: hidden;
          z-index: 1050;
        }

        .timezone-dropdown-header {
          padding: 20px;
          border-bottom: 1px solid #e0e0e0;
        }

        .timezone-dropdown-title {
          font-size: 18px;
          font-weight: 600;
          color: #2c3e50;
          margin: 0 0 16px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .timezone-search-input-wrapper {
          position: relative;
        }

        .timezone-search-input {
          width: 100%;
          padding: 10px 40px 10px 40px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
        }

        .timezone-search-input:focus {
          border-color: #0d6efd;
        }

        .timezone-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
        }

        .timezone-clear-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
          cursor: pointer;
        }

        .timezone-list {
          max-height: 360px;
          overflow-y: auto;
        }

        .timezone-item {
          padding: 16px 20px;
          border-bottom: 1px solid #f0f0f0;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .timezone-item:hover {
          background-color: #f8f9fa;
        }

        .timezone-item:last-child {
          border-bottom: none;
        }

        .timezone-item-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 6px;
        }

        .timezone-clock-icon {
          width: 32px;
          height: 32px;
          background-color: #e3f2fd;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .timezone-item-name {
          font-size: 15px;
          font-weight: 600;
          color: #2c3e50;
        }

        .timezone-item-time {
          font-size: 16px;
          font-weight: 700;
          color: #2c3e50;
          margin-left: auto;
        }

        .timezone-item-date {
          font-size: 13px;
          color: #6c757d;
          padding-left: 44px;
        }

        .timezone-trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: white;
          
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
          color: #2c3e50;
        }

        .timezone-trigger:hover {
          border-color: #0d6efd;
          background-color: #f8f9fa;
        }

        .timezone-trigger-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .timezone-trigger-date {
          font-size: 12px;
          color: #6c757d;
        }

        @media (max-width: 576px) {
          .timezone-dropdown {
            width: 320px;
            right: -20px;
          }
        }
      `}</style>

      <div 
        className="timezone-trigger"
        onClick={() => setShowTimezoneDropdown(!showTimezoneDropdown)}
      >
        <Clock size={18} />
        <div className="timezone-trigger-text">
          <span>{getCurrentDateTimeGMT(selectedTimezone)} • {getSelectedTimezoneInfo().city}</span>
        </div>
      </div>

      {showTimezoneDropdown && (
        <div className="timezone-dropdown" ref={dropdownRef}>
          <div className="timezone-dropdown-header">
            <div className="timezone-dropdown-title">
              <span>Time & timezone</span>
              <X 
                size={20} 
                style={{ cursor: 'pointer', color: '#6c757d' }}
                onClick={() => setShowTimezoneDropdown(false)}
              />
            </div>
            <div className="timezone-search-input-wrapper">
              <Search className="timezone-search-icon" size={18} />
              <input
                type="text"
                className="timezone-search-input"
                placeholder="(GMT)"
                value={timezoneSearch}
                onChange={(e) => setTimezoneSearch(e.target.value)}
              />
              {timezoneSearch && (
                <X 
                  className="timezone-clear-icon" 
                  size={18}
                  onClick={() => setTimezoneSearch('')}
                />
              )}
            </div>
          </div>

          <div className="timezone-list">
            {filteredTimezones.map((tz) => {
              const tzTime = getTimeForTimezone(tz.iana);
              const offset = getTimezoneOffset(tz.iana);
              const isSelected = selectedTimezone === tz.iana;
              return (
                <div
                  key={tz.iana}
                  className="timezone-item"
                  style={{
                    backgroundColor: isSelected ? '#e3f2fd' : 'transparent',
                    fontWeight: isSelected ? 600 : 'normal'
                  }}
                  onClick={() => {
                    setSelectedTimezone(tz.iana);
                    setShowTimezoneDropdown(false);
                  }}
                >
                  <div className="timezone-item-header">
                    <div className="timezone-clock-icon">
                      <Clock size={16} style={{ color: '#0d6efd' }} />
                    </div>
                    <span className="timezone-item-name">
                      ({offset}) {tz.city}
                    </span>
                    <span className="timezone-item-time">
                      {formatTime(tzTime)}
                    </span>
                  </div>
                  <div className="timezone-item-date">
                    {formatDate(tzTime, tz.iana)}
                  </div>
                </div>
              );
            })}
            {filteredTimezones.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                No timezones found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimezoneSearch;