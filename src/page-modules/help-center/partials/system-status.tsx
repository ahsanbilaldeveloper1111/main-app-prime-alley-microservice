import React, { useId, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronLeft, ChevronRight, CheckCircle, Clock, TrendingUp, Activity, Database, Satellite, CreditCard } from 'lucide-react';

type SystemStatusProps = {
  onBack: () => void;
};


type SubscriptionType = 'portal' | 'email' | 'sms' | 'webhook';

const OPERATIONAL_COLOR = '#10b981';
const DEGRADED_COLOR = '#ef4444';

function statusIndicatorColor(status: string): string {
  if (status === 'Operational') {
    return OPERATIONAL_COLOR;
  }
  return DEGRADED_COLOR;
}

type IncidentIconId = 'database' | 'satellite' | 'creditCard';

const INCIDENT_ICONS: Record<IncidentIconId, LucideIcon> = {
  database: Database,
  satellite: Satellite,
  creditCard: CreditCard
};

const SystemStatus: React.FC<SystemStatusProps> = ({ onBack }) => {
  const chartGradientId = useId().replaceAll(':', '');
  const chartShadowId = `${chartGradientId}-shadow`;

  const [subscriptions, setSubscriptions] = useState<Record<SubscriptionType, boolean>>({
    portal: true,
    email: true,
    sms: true,
    webhook: true
  });

  const components = [
    { name: 'API', status: 'Operational', uptime: '99.99%' },
    { name: 'Voice', status: 'Operational', uptime: '99.95%' },
    { name: 'Messaging', status: 'Operational', uptime: '99.98%' },
    { name: 'Billing', status: 'Operational', uptime: '99.99%' },
    { name: 'Portal', status: 'Operational', uptime: '99.97%' },
    { name: 'Web Dialer', status: 'Operational', uptime: '99.96%' },
    { name: 'AI Services', status: 'Operational', uptime: '99.94%' },
    { name: 'Integrations', status: 'Operational', uptime: '99.98%' }
  ];

  const incidents: {
    title: string;
    description: string;
    date: string;
    iconId: IncidentIconId;
    color: string;
    status: string;
  }[] = [
    {
      title: 'Database Migration',
      description: 'Successfully completed maintenance window',
      date: 'Dec 15, 2025',
      iconId: 'database',
      color: '#10b981',
      status: 'Resolved'
    },
    {
      title: 'API Rate Limiting',
      description: 'Temporary service degradation',
      date: 'Dec 10, 2025',
      iconId: 'satellite',
      color: '#f59e0b',
      status: 'Monitoring'
    },
    {
      title: 'Payment Gateway',
      description: 'Brief interruption in payment processing',
      date: 'Dec 5, 2025',
      iconId: 'creditCard',
      color: '#3b82f6',
      status: 'Resolved'
    }
  ];

  const faqs = [
    { question: 'How do I recover my account?', category: 'Account' },
    { question: 'How do I change my billing plan?', category: 'Billing' },
    { question: 'What are the SLA guarantees?', category: 'Service' },
    { question: 'How to enable two-factor authentication?', category: 'Security' }
  ];


  const toggleSubscription = (type: SubscriptionType) => {
    setSubscriptions(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '24px' }}>
        <button
          type="button"
          aria-label="Back to Help Center"
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            textDecoration: 'none',
            color: '#6b7280',
            fontSize: '14px',
            padding: '6px 12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            borderRadius: '6px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
            e.currentTarget.style.color = '#374151';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#6b7280';
          }}
        >
          <ChevronLeft aria-hidden size={16} /> Back to Help Center
        </button>
      </div>


  {/* Hero Section */}
  <div style={{
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#2c3e50',
          marginBottom: '8px'
        }}>
          System Status
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#6c757d',
          marginBottom: 0
        }}>
         Real-time monitoring of all services and infrastructure
        </p>
      </div>


     

      {/* Stats Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TrendingUp aria-hidden size={24} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>99.98%</div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>Overall Uptime</div>
          </div>
        </div>

        <div style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Activity aria-hidden size={24} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>8</div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>Active Services</div>
          </div>
        </div>

        <div style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Clock aria-hidden size={24} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>{'< 2ms'}</div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>Avg Response</div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Left Section - 66% width */}
        <div style={{ flex: '1 1 65%', minWidth: '300px' }}>
          {/* Components Card */}
          <div style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '24px',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #f3f4f6',
              background: 'linear-gradient(to right, #f9fafb, #fff)'
            }}>
              <h4 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#1f2937',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Activity aria-hidden size={22} color="#667eea" />
                Service Components
              </h4>
            </div>

            <div style={{ padding: '0' }}>
              {components.map((component, index) => (
                <button
                  key={component.name}
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '18px 24px',
                    borderBottom: index < components.length - 1 ? '1px solid #f3f4f6' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: '#fff',
                    width: '100%',
                    border: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    borderTop: 'none',
                    textAlign: 'left',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.paddingLeft = '28px';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.paddingLeft = '24px';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    flex: 1
                  }}>
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: statusIndicatorColor(component.status),
                      boxShadow: `0 0 0 3px ${statusIndicatorColor(component.status)}20`,
                      animation: 'pulse 2s infinite'
                    }} />
                    <span style={{
                      fontSize: '15px',
                      color: '#1f2937',
                      fontWeight: '600'
                    }}>{component.name}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}>
                    <div style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      fontWeight: '500'
                    }}>
                      {component.uptime} uptime
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#ecfdf5',
                      padding: '6px 12px',
                      borderRadius: '6px'
                    }}>
                      <CheckCircle aria-hidden size={14} color="#10b981" />
                      <span style={{
                        fontSize: '13px',
                        color: '#059669',
                        fontWeight: '600'
                      }}>{component.status}</span>
                    </div>
                    <ChevronRight aria-hidden size={18} color="#9ca3af" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Incident History */}
          <div style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #f3f4f6',
              background: 'linear-gradient(to right, #f9fafb, #fff)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h4 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#1f2937',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Clock aria-hidden size={22} color="#667eea" />
                Recent Incidents
              </h4>
              <button
                type="button"
                style={{
                  fontSize: '14px',
                  color: '#667eea',
                  textDecoration: 'none',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  padding: 0
                }}
              >
                View all <ChevronRight aria-hidden size={14} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                {incidents.map((incident) => {
                  const IncidentIcon = INCIDENT_ICONS[incident.iconId];
                  return (
                  <button
                    key={incident.title}
                    type="button"
                    aria-label={`${incident.title}, ${incident.status}`}
                    style={{
                      background: 'linear-gradient(135deg, #f9fafb 0%, #fff 100%)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      position: 'relative',
                      overflow: 'hidden',
                      width: '100%',
                      textAlign: 'left',
                      fontFamily: 'inherit'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = incident.color;
                      e.currentTarget.style.boxShadow = `0 8px 24px ${incident.color}20`;
                      e.currentTarget.style.transform = 'translateY(-4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '4px',
                      height: '100%',
                      background: incident.color
                    }} />
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: `${incident.color}15`,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '14px'
                    }}>
                      <IncidentIcon aria-hidden size={28} color={incident.color} />
                    </div>
                    <h6 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1f2937',
                      marginBottom: '8px'
                    }}>{incident.title}</h6>
                    <p style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      marginBottom: '12px',
                      lineHeight: '1.5'
                    }}>{incident.description}</p>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{
                        fontSize: '12px',
                        color: '#9ca3af',
                        fontWeight: '500'
                      }}>{incident.date}</span>
                      <span style={{
                        fontSize: '12px',
                        color: incident.color,
                        fontWeight: '600',
                        background: `${incident.color}10`,
                        padding: '4px 10px',
                        borderRadius: '6px'
                      }}>{incident.status}</span>
                    </div>
                  </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - 33% width */}
        <div style={{ flex: '1 1 30%', minWidth: '280px' }}>
          {/* Uptime Card */}
          <div style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '20px',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #f3f4f6',
              background: 'linear-gradient(to right, #f9fafb, #fff)'
            }}>
              <h5 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#1f2937',
                margin: 0
              }}>90-Day Uptime</h5>
            </div>
            <div style={{ padding: '20px' }}>
              {/* Graph Visualization */}
              <div style={{ 
                position: 'relative', 
                height: '140px',
                marginBottom: '30px',
                background: 'linear-gradient(to bottom, #f9fafb, #fff)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                {/* Y-axis labels */}
                <div style={{
                  position: 'absolute',
                  left: '16px',
                  top: '16px',
                  bottom: '36px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: '#9ca3af',
                  fontWeight: '600'
                }}>
                  <span>100%</span>
                  <span>98%</span>
                  <span>95%</span>
                </div>

                {/* Graph area */}
                <div style={{
                  position: 'absolute',
                  left: '52px',
                  right: '16px',
                  top: '16px',
                  bottom: '36px'
                }}>
                  {/* Background grid lines */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ height: '1px', background: '#e5e7eb', opacity: 0.5 }} />
                    <div style={{ height: '1px', background: '#e5e7eb', opacity: 0.5 }} />
                    <div style={{ height: '1px', background: '#e5e7eb', opacity: 0.5 }} />
                  </div>

                  {/* Uptime area chart */}
                  <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id={chartGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.3 }} />
                        <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 0.05 }} />
                      </linearGradient>
                      <filter id={chartShadowId}>
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#10b981" floodOpacity="0.3"/>
                      </filter>
                    </defs>
                    
                    {/* Area fill */}
                    <polygon
                      points="0,100 0,15 16,10 33,18 50,15 66,17 83,12 100,15 100,100"
                      fill={`url(#${chartGradientId})`}
                    />
                    
                    {/* Line */}
                    <polyline
                      points="0,15 16,10 33,18 50,15 66,17 83,12 100,15"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="1"
                      vectorEffect="non-scaling-stroke"
                      filter={`url(#${chartShadowId})`}
                    />
                  </svg>

                  {/* Data points */}
                  <div style={{ position: 'absolute', inset: 0 }}>
                    {[
                      { left: '0%', top: '15%' },
                      { left: '16%', top: '10%' },
                      { left: '33%', top: '18%' },
                      { left: '50%', top: '15%' },
                      { left: '66%', top: '17%' },
                      { left: '83%', top: '12%' },
                      { left: '100%', top: '15%' }
                    ].map((point) => (
                      <div
                        key={`${point.left}-${point.top}`}
                        style={{
                          position: 'absolute',
                          left: point.left,
                          top: point.top,
                          width: '8px',
                          height: '8px',
                          background: '#fff',
                          border: '2px solid #10b981',
                          borderRadius: '50%',
                          transform: 'translate(-50%, -50%)',
                          boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* X-axis labels */}
                <div style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '52px',
                  right: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: '#9ca3af',
                  fontWeight: '600'
                }}>
                  <span>30d</span>
                  <span>60d</span>
                  <span>90d</span>
                </div>
              </div>
            </div>
          </div>

          {/* Subscribe for Notifications */}
          <div style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '20px',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #f3f4f6',
              background: 'linear-gradient(to right, #f9fafb, #fff)'
            }}>
              <h5 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#1f2937',
                margin: 0
              }}>Status Notifications</h5>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '18px',
                lineHeight: '1.6'
              }}>Get notified about incidents and scheduled maintenance</p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '18px'
              }}>
                {([
                  { key: 'portal', label: 'Portal', icon: '🌐' },
                  { key: 'email', label: 'Email', icon: '📧' },
                  { key: 'sms', label: 'SMS', icon: '💬' },
                  { key: 'webhook', label: 'Webhook', icon: '🔗' }
                ] as { key: SubscriptionType; label: string; icon: string }[]).map(item => (
                  <label
                    key={item.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#374151',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: `2px solid ${subscriptions[item.key] ? '#667eea' : '#e5e7eb'}`,
                      background: subscriptions[item.key] ? '#f5f7ff' : '#fff',
                      transition: 'all 0.2s',
                      fontWeight: '500'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={subscriptions[item.key]}
                      onChange={() => toggleSubscription(item.key)}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer',
                        accentColor: '#667eea'
                      }}
                    />
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>

              <button
                type="button"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #667eea 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  width: '100%',
                  padding: '12px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                }}
              >
                Manage Subscriptions
              </button>
            </div>
          </div>

          {/* FAQs */}
          <div style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #f3f4f6',
              background: 'linear-gradient(to right, #f9fafb, #fff)'
            }}>
              <h5 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#1f2937',
                margin: 0
              }}>Common Questions</h5>
            </div>
            <div style={{ padding: '0' }}>
              {faqs.map((faq, index) => (
                <button
                  key={faq.question}
                  type="button"
                  aria-label={faq.question}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderBottom: index < faqs.length - 1 ? '1px solid #f3f4f6' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: '#fff',
                    width: '100%',
                    border: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    borderTop: 'none',
                    textAlign: 'left',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.paddingLeft = '24px';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.paddingLeft = '20px';
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      color: '#1f2937',
                      fontWeight: '500',
                      marginBottom: '4px'
                    }}>{faq.question}</div>
                    <div style={{
                      fontSize: '12px',
                      color: '#9ca3af',
                      fontWeight: '500'
                    }}>{faq.category}</div>
                  </div>
                  <ChevronRight aria-hidden size={18} color="#9ca3af" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}} />
    </div>
  );
};

export default SystemStatus;