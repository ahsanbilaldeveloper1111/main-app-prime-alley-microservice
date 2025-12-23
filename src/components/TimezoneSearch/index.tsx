import React, { useState, useRef, useEffect } from 'react';
import { Search, Clock, X } from 'lucide-react';

const TimezoneSearch = () => {
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);
  const [timezoneSearch, setTimezoneSearch] = useState('');
  const [selectedTimezone, setSelectedTimezone] = useState({
    name: 'London',
    offset: 'GMT',
    offsetHours: 0
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sample timezones - you can expand this list
  const timezones = [
    { name: 'London', offset: 'GMT', offsetHours: 0 },
    { name: 'Dubai', offset: 'GMT+4', offsetHours: 4 },
    { name: 'New York', offset: 'GMT-5', offsetHours: -5 },
    { name: 'Tokyo', offset: 'GMT+9', offsetHours: 9 },
    { name: 'Sydney', offset: 'GMT+11', offsetHours: 11 },
    { name: 'Los Angeles', offset: 'GMT-8', offsetHours: -8 },
    { name: 'Paris', offset: 'GMT+1', offsetHours: 1 },
    { name: 'Mumbai', offset: 'GMT+5:30', offsetHours: 5.5 },
    { name: 'Singapore', offset: 'GMT+8', offsetHours: 8 },
    { name: 'Hong Kong', offset: 'GMT+8', offsetHours: 8 },
  ];

  const [currentTime, setCurrentTime] = useState(new Date());

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

  const getTimeForTimezone = (offsetHours: number) => {
    const utcTime = new Date(currentTime.getTime() + currentTime.getTimezoneOffset() * 60000);
    const timezoneTime = new Date(utcTime.getTime() + offsetHours * 3600000);
    return timezoneTime;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date, offset: string) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} ${offset !== 'GMT' ? `(${offset})` : ''}`;
  };

  const filteredTimezones = timezones.filter(tz => 
    tz.name.toLowerCase().includes(timezoneSearch.toLowerCase()) ||
    tz.offset.toLowerCase().includes(timezoneSearch.toLowerCase())
  );

  const getCurrentDateTime = () => {
    const time = getTimeForTimezone(selectedTimezone.offsetHours);
    return formatTime(time);
  };

  const getCurrentDate = () => {
    const time = getTimeForTimezone(selectedTimezone.offsetHours);
    return formatDate(time, selectedTimezone.offset);
  };
  const getCurrentDateTimeGMT = (timeZone: string = 'Asia/Dubai') => {
    const date = new Date();
  
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',   // "short" | "long" | "narrow"
      year: 'numeric',
      month: 'short',     // "numeric" | "2-digit" | "long" | "short" | "narrow"
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone,           // string
      timeZoneName: 'short' // "short" | "long"
    };
  
    return new Intl.DateTimeFormat('en-US', options).format(date);
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
        <span>{getCurrentDateTimeGMT('Asia/Dubai')} • Dubai</span>
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
            {filteredTimezones.map((tz, index) => {
              const tzTime = getTimeForTimezone(tz.offsetHours);
              return (
                <div
                  key={index}
                  className="timezone-item"
                  onClick={() => {
                    setSelectedTimezone(tz);
                    setShowTimezoneDropdown(false);
                  }}
                >
                  <div className="timezone-item-header">
                    <div className="timezone-clock-icon">
                      <Clock size={16} style={{ color: '#0d6efd' }} />
                    </div>
                    <span className="timezone-item-name">
                      ({tz.offset}) {tz.name}
                    </span>
                    <span className="timezone-item-time">
                      {formatTime(tzTime)}
                    </span>
                  </div>
                  <div className="timezone-item-date">
                    {formatDate(tzTime, tz.offset)}
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