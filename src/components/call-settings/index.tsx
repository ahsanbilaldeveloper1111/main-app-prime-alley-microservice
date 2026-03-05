import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  BarChart3,
  Copy,
  TrendingUp,
  Phone,
  Users,
  Activity
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface QueueItem {
  id: number;
  name: string;
  number: string;
  status: 'Queued' | 'Dialing' | 'Connected' | 'Failed';
  attempt: number;
  callTime: string;
  waitTime?: string;
}

interface CampaignStats {
  activeCalls: number;
  callsMade: number;
  completed: number;
  transfer: number;
  failed: number;
  queued: number;
}

const CallSettingsScreen: React.FC = () => {
  const [scheduleType, setScheduleType] = useState<'now' | 'scheduled'>('now');
  const [businessHours, setBusinessHours] = useState<string>('9 AM - 5 PM (Mon-Fri)');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [maxConcurrency, setMaxConcurrency] = useState<number>(10);
  const [callRateLimit, setCallRateLimit] = useState<number>(30);
  
  const [queueItems] = useState<QueueItem[]>([
    { id: 1, name: 'John Doe', number: '+19876543210', status: 'Queued', attempt: 1, callTime: '—', waitTime: '2 min' },
    { id: 2, name: 'Jane Smith', number: '+19876654321', status: 'Dialing', attempt: 1, callTime: '6 sec', waitTime: '—' },
    { id: 3, name: 'Alice Johnson', number: '+19876565432', status: 'Connected', attempt: 1, callTime: '1:24', waitTime: '—' },
    { id: 4, name: 'Bob Lee', number: '+19876876543', status: 'Queued', attempt: 2, callTime: '—', waitTime: '5 min' },
    { id: 5, name: 'Carol White', number: '+19876987654', status: 'Failed', attempt: 3, callTime: '—', waitTime: '—' },
    { id: 6, name: 'David Brown', number: '+19877098765', status: 'Connected', attempt: 1, callTime: '2:15', waitTime: '—' }
  ]);

  const [campaignStats] = useState<CampaignStats>({
    activeCalls: 3,
    callsMade: 45,
    completed: 28,
    transfer: 5,
    failed: 6,
    queued: 12
  });

  const pieData = [
    { name: 'Completed', value: campaignStats.completed, color: '#10b981' },
    { name: 'Active', value: campaignStats.activeCalls, color: '#3b82f6' },
    { name: 'Queued', value: campaignStats.queued, color: '#f59e0b' },
    { name: 'Failed', value: campaignStats.failed, color: '#ef4444' }
  ];

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Queued': return '#f59e0b';
      case 'Dialing': return '#3b82f6';
      case 'Connected': return '#10b981';
      case 'Failed': return '#ef4444';
      default: return '#6c757d';
    }
  };

  const getStatusBgColor = (status: string): string => {
    switch (status) {
      case 'Queued': return '#fef3c7';
      case 'Dialing': return '#dbeafe';
      case 'Connected': return '#d1fae5';
      case 'Failed': return '#fee2e2';
      default: return '#f3f4f6';
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '2rem', color: '#1f2937' }}>
        Call Settings & Queue Management
      </h2>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {/* Left Section - Call Schedule & Live Queue */}
        <div style={{ flex: 1, minWidth: '600px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {/* Call Schedule Section */}
            <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #f3f4f6' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1f2937' }}>
                Schedule Configuration
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Start Now Option */}
                <div
                  onClick={() => setScheduleType('now')}
                  style={{
                    padding: '1.5rem',
                    border: `2px solid ${scheduleType === 'now' ? '#0d6efd' : '#e9ecef'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: scheduleType === 'now' ? '#f0f7ff' : 'white'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: `2px solid ${scheduleType === 'now' ? '#0d6efd' : '#ced4da'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: scheduleType === 'now' ? '#0d6efd' : 'transparent'
                    }}>
                      {scheduleType === 'now' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'white' }} />}
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937' }}>Start Immediately</div>
                  </div>
                  <div style={{ fontSize: '0.95rem', color: '#6c757d', paddingLeft: '32px' }}>
                    Campaign will begin calling immediately after launch
                  </div>
                </div>

                {/* Schedule Option */}
                <div
                  onClick={() => setScheduleType('scheduled')}
                  style={{
                    padding: '1.5rem',
                    border: `2px solid ${scheduleType === 'scheduled' ? '#0d6efd' : '#e9ecef'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: scheduleType === 'scheduled' ? '#f0f7ff' : 'white'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: `2px solid ${scheduleType === 'scheduled' ? '#0d6efd' : '#ced4da'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: scheduleType === 'scheduled' ? '#0d6efd' : 'transparent'
                    }}>
                      {scheduleType === 'scheduled' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'white' }} />}
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937' }}>Schedule Launch</div>
                  </div>
                  <div style={{ paddingLeft: '32px' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#495057', marginBottom: '0.5rem' }}>
                      Start Date & Time:
                    </label>
                    <input
                      type="datetime-local"
                      disabled={scheduleType !== 'scheduled'}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #ced4da',
                        borderRadius: '6px',
                        fontSize: '0.95rem',
                        backgroundColor: scheduleType === 'scheduled' ? 'white' : '#f8f9fa'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Business Hours Configuration */}
            <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #f3f4f6' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1f2937' }}>
                Operating Hours
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#495057' }}>
                    Business Hours:
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Clock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
                    <select
                      value={businessHours}
                      onChange={(e) => setBusinessHours(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                        border: '1px solid #ced4da',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        backgroundColor: 'white'
                      }}
                    >
                      <option>24/7 Operation</option>
                      <option>9 AM - 5 PM (Mon-Fri)</option>
                      <option>8 AM - 6 PM (Mon-Fri)</option>
                      <option>9 AM - 5 PM (Mon-Sat)</option>
                      <option>Custom Schedule</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#495057' }}>
                    Timezone:
                  </label>
                  <select
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ced4da',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      backgroundColor: 'white'
                    }}
                  >
                    <option>Pacific Time (GMT-7)</option>
                    <option>Eastern Time (GMT-5)</option>
                    <option>Central Time (GMT-6)</option>
                    <option>Mountain Time (GMT-7)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dialer Configuration */}
            <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #f3f4f6' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1f2937' }}>
                Dialer Settings
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#495057' }}>
                    Max Concurrency:
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={maxConcurrency}
                      onChange={(e) => setMaxConcurrency(parseInt(e.target.value))}
                      style={{ flex: 1 }}
                    />
                    <div style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#e7f1ff',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#0d6efd',
                      minWidth: '60px',
                      textAlign: 'center'
                    }}>
                      {maxConcurrency}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6c757d', marginTop: '0.5rem' }}>
                    Parallel active calls
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#495057' }}>
                    Call Rate Limit:
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="10"
                      value={callRateLimit}
                      onChange={(e) => setCallRateLimit(parseInt(e.target.value))}
                      style={{ flex: 1 }}
                    />
                    <div style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#e7f1ff',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#0d6efd',
                      minWidth: '60px',
                      textAlign: 'center'
                    }}>
                      {callRateLimit}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6c757d', marginTop: '0.5rem' }}>
                    Calls per minute
                  </div>
                </div>
              </div>
            </div>

            {/* Live Queue Section */}
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1f2937' }}>
                Live Call Queue
              </h3>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6c757d', borderBottom: '2px solid #e9ecef' }}>Contact</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6c757d', borderBottom: '2px solid #e9ecef' }}>Number</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6c757d', borderBottom: '2px solid #e9ecef' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#6c757d', borderBottom: '2px solid #e9ecef' }}>Attempt</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6c757d', borderBottom: '2px solid #e9ecef' }}>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queueItems.map((item) => (
                      <tr 
                        key={item.id}
                        style={{ 
                          transition: 'background-color 0.2s',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '14px 16px', fontSize: '0.95rem', fontWeight: '500', color: '#1f2937', borderBottom: '1px solid #f3f4f6' }}>
                          {item.name}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.95rem', color: '#6c757d', fontFamily: 'monospace', borderBottom: '1px solid #f3f4f6' }}>
                          {item.number}
                        </td>
                        <td style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            backgroundColor: getStatusBgColor(item.status),
                            color: getStatusColor(item.status),
                            borderRadius: '20px',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                          }}>
                            <div style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: getStatusColor(item.status)
                            }} />
                            {item.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '0.95rem', color: '#1f2937', borderBottom: '1px solid #f3f4f6' }}>
                          {item.attempt}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.95rem', color: '#6c757d', borderBottom: '1px solid #f3f4f6' }}>
                          {item.callTime}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                <div style={{ fontSize: '0.95rem', color: '#6c757d' }}>
                  Showing 1-{queueItems.length} of {queueItems.length} contacts
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button style={{
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #e9ecef',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    color: '#6c757d'
                  }}>
                    <ChevronLeft size={16} />
                  </button>
                  <button style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #0d6efd',
                    borderRadius: '6px',
                    backgroundColor: '#0d6efd',
                    cursor: 'pointer',
                    color: 'white',
                    fontWeight: '500'
                  }}>
                    1
                  </button>
                  <button style={{
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #e9ecef',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    color: '#6c757d'
                  }}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Campaign Summary */}
        <div style={{ width: '380px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Campaign Stats Card */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Campaign Stats
              </h3>
              <button style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6c757d'
              }}>
                <MoreHorizontal size={20} />
              </button>
            </div>

            {/* Campaign Name and Cost */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                Follow-Up Campaign
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1f2937' }}>~$8</span>
                <span style={{ fontSize: '0.95rem', color: '#6c757d' }}>/ day estimated</span>
              </div>
            </div>

            {/* Status Distribution Chart */}
            <div style={{ marginBottom: '1.5rem' }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                    formatter={(value, entry: any) => (
                      <span style={{ fontSize: '0.875rem', color: '#495057' }}>
                        {value}: {entry.payload.value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ 
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #0d6efd'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem' }}>
                  Total Calls
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
                  {campaignStats.callsMade}
                </div>
              </div>
              <div style={{ 
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #10b981'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem' }}>
                  Completed
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
                  {campaignStats.completed}
                </div>
              </div>
              <div style={{ 
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #f59e0b'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem' }}>
                  In Queue
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
                  {campaignStats.queued}
                </div>
              </div>
              <div style={{ 
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #3b82f6'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem' }}>
                  Transfers
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
                  {campaignStats.transfer}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
              Quick Actions
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#495057',
                fontSize: '0.95rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
                e.currentTarget.style.borderColor = '#ced4da';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#e9ecef';
              }}
              >
                <BarChart3 size={18} />
                View Detailed Reports
              </button>
              <button style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#495057',
                fontSize: '0.95rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
                e.currentTarget.style.borderColor = '#ced4da';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#e9ecef';
              }}
              >
                <Copy size={18} />
                Duplicate Campaign
              </button>
              <button style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#495057',
                fontSize: '0.95rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
                e.currentTarget.style.borderColor = '#ced4da';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#e9ecef';
              }}
              >
                <TrendingUp size={18} />
                Performance Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallSettingsScreen;