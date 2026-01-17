import React, { useState } from 'react';
import { 
  X, 
  Briefcase,
  Calendar,
  Clock,
  Check,
  ChevronDown,
  Bell,
  MoreVertical,
  Lightbulb,
  User
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

interface Suggestion {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface OnboardingEmployee {
  id: string;
  name: string;
  avatar: string;
  startDate: string;
  stages: string[];
  progress: number;
  status: 'In Progress' | 'On Track' | 'Overdue' | 'Completed';
  role?: string;
  department?: string;
}

interface OnboardingDetailSidebarProps {
  employee: OnboardingEmployee;
  onClose: () => void;
}

const OnboardingDetailSidebar: React.FC<OnboardingDetailSidebarProps> = ({ employee, onClose }) => {
  const [activeTab, setActiveTab] = useState<'Onboarding' | 'Audit & Risk Center'>('Onboarding');
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  // Dynamic checklist based on employee progress
  const allChecklistItems = [
    { id: '1', label: 'HR documentation submitted', threshold: 0 },
    { id: '2', label: 'Offer letter signed', threshold: 25 },
    { id: '3', label: 'Documents received and verified', threshold: 50 },
    { id: '4', label: 'IT equipment assigned', threshold: 75 },
    { id: '5', label: 'Workspace setup completed', threshold: 100 }
  ];

  const checklistItems: ChecklistItem[] = allChecklistItems.map(item => ({
    id: item.id,
    label: item.label,
    completed: employee.progress >= item.threshold
  }));

  const completedCount = checklistItems.filter(item => item.completed).length;
  const totalCount = checklistItems.length;
  const checklistProgress = Math.round((completedCount / totalCount) * 100);

  const suggestions: Suggestion[] = [
    {
      id: '1',
      icon: <Lightbulb size={20} color="#f59e0b" />,
      title: 'Onboarding delay Likely',
      description: 'IT tasks may face a 2-day delay'
    },
    {
      id: '2',
      icon: <Lightbulb size={20} color="#f59e0b" />,
      title: 'Checklist auto-generated',
      description: 'Pre-made onboarding list tailored for roles'
    }
  ];

  const handleSubmit = () => {
    console.log('Submit clicked');
    alert('Onboarding submitted successfully');
  };

  const handleCancel = () => {
    console.log('Cancel clicked');
    alert('Onboarding cancelled');
  };

  const handleSendReminder = () => {
    console.log('Send reminder clicked');
    alert(`Reminder sent to ${employee.name}`);
  };

  return (
    <div style={{
      width: '420px',
      height: '100vh',
      backgroundColor: '#ffffff',
      boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header Section */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid #e9d5ff'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: '#1f2937',
            margin: 0
          }}>
            Onboarding Detail
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={24} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#1f2937',
              margin: '0 0 8px 0'
            }}>
              {employee.name}
            </h3>
            <div style={{ marginBottom: '12px' }}>
              <p style={{ 
                fontSize: '14px', 
                color: '#6b7280',
                margin: '0 0 4px 0',
                fontWeight: '500'
              }}>
                New Hire
              </p>
              {employee.role && (
                <p style={{ 
                  fontSize: '14px', 
                  color: '#6b7280',
                  margin: '0 0 12px 0'
                }}>
                  {employee.role}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {employee.department && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase size={14} color="#9ca3af" />
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>
                    {employee.department}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={14} color="#9ca3af" />
                <span style={{ fontSize: '13px', color: '#6b7280' }}>
                  {employee.startDate}
                </span>
              </div>
            </div>
          </div>

          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <User size={40} color="white" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '16px 24px',
        borderBottom: '1px solid #e9d5ff'
      }}>
        <button
          onClick={() => setActiveTab('Onboarding')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'Onboarding' ? '#6366f1' : 'white',
            color: activeTab === 'Onboarding' ? 'white' : '#6b7280',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
        >
          <User size={16} />
          Onboarding
        </button>
        <button
          onClick={() => setActiveTab('Audit & Risk Center')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'Audit & Risk Center' ? '#8b5cf6' : 'white',
            color: activeTab === 'Audit & Risk Center' ? 'white' : '#6b7280',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Audit & Risk Center
        </button>
      </div>

      {/* Scrollable Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px'
      }}>
        {/* Hir-date Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
  <Calendar size={18} color="#8b5cf6" />
  <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
    Hire date
  </span>
  <span style={{ fontSize: '14px', color: '#9ca3af' }}>
    Mar 2, 2023
  </span>
</div>

          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: '#9ca3af'
            }}
          >
            <MoreVertical size={18} />
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              {completedCount} of {totalCount} completed ({checklistProgress}%)
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e9d5ff',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${checklistProgress}%`,
              height: '100%',
              backgroundColor: '#8b5cf6',
              borderRadius: '4px',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Checklist Items */}
        <div style={{ marginBottom: '24px' }}>
          {checklistItems.map(item => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 0',
                borderBottom: '1px solid #e9d5ff'
              }}
            >
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                backgroundColor: item.completed ? '#8b5cf6' : '#e9d5ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {item.completed && <Check size={14} color="white" />}
              </div>
              <span style={{ 
                fontSize: '14px', 
                color: '#4b5563',
                textDecoration: item.completed ? 'line-through' : 'none'
              }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Assignee and Reminder Section */}
        <div style={{ 
          display: 'flex', 
          gap: '12px',
          marginBottom: '24px'
        }}>
          <div style={{ position: 'relative', flex: '1 1 0' }}>
            <button
              onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
              style={{
                width: '100%',
                padding: '10px 16px',
                border: '1px solid #e9d5ff',
                borderRadius: '8px',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <User size={14} color="white" />
                </div>
                <span>Hassan Mir</span>
              </div>
              <ChevronDown size={16} />
            </button>
            {showAssigneeDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '4px',
                backgroundColor: 'white',
                border: '1px solid #e9d5ff',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                zIndex: 10
              }}>
                {['Hassan Mir', 'Adeel Raza', 'Farah Ahmed'].map(person => (
                  <div
                    key={person}
                    onClick={() => {
                      setShowAssigneeDropdown(false);
                      console.log('Selected:', person);
                    }}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <User size={14} color="white" />
                    </div>
                    {person}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={handleSendReminder}
            style={{
              flex: '1 1 0',
              padding: '10px 0px',
              backgroundColor: 'white',
              color: '#6b7280',
              border: '1px solid #e9d5ff',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            <Bell size={16} />
            Send reminder
          </button>
        </div>

        {/* AI Suggestions Section */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h4 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#1f2937',
              margin: 0
            }}>
              AI Suggestions
            </h4>
            <button
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: '#9ca3af'
              }}
            >
              <MoreVertical size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {suggestions.map(suggestion => (
              <div
                key={suggestion.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: '1px solid #e9d5ff'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fefcff'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {suggestion.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#1f2937',
                    marginBottom: '4px'
                  }}>
                    {suggestion.title}
                  </div>
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#6b7280',
                    lineHeight: '1.5'
                  }}>
                    {suggestion.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Action Buttons */}
      <div style={{
        padding: '20px 24px',
        borderTop: '1px solid #e9d5ff',
        display: 'flex',
        gap: '12px',
        backgroundColor: '#f5f3ff'
      }}>
        <button
          onClick={handleCancel}
          style={{
            flex: 1,
            padding: '12px 20px',
            backgroundColor: 'white',
            color: '#6b7280',
            border: '1px solid #e9d5ff',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          style={{
            flex: 1,
            padding: '12px 20px',
            backgroundColor: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8b5cf6'}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default OnboardingDetailSidebar;