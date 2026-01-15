import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

import  { useState } from 'react';
import { 
  Users, 
  CheckCircle, 
  MessageSquare, 
  Send, 
  AlertTriangle,
  Plus,
  Calendar,
  Upload,
  MoreHorizontal,
  FileText,
  Mail,
  RefreshCw,
  FileBarChart,
  ChevronRight,
  Search,
  ChevronDown,
  Circle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';


const EmployeesDashboard = () => {
    const [selectedTimeframe, setSelectedTimeframe] = useState('Last 7 Days');
    const [selectedDays, setSelectedDays] = useState('Last 30 Days');
    const [selectedChartPeriod, setSelectedChartPeriod] = useState('Last 14 Days');
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState('HR Admin');
    const [showCalendar, setShowCalendar] = useState(false);
    const [showEmployeeForm, setShowEmployeeForm] = useState(false);
    const [showLeaveForm, setShowLeaveForm] = useState(false);
    const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  
    const timeframeOptions = ['Today', 'Last 7 Days', 'Last 14 Days', 'Last 30 Days', 'Last 90 Days'];
    const daysOptions = ['Last 7 Days', 'Last 30 Days', 'Last 60 Days', 'Last 90 Days', 'Last 180 Days', 'Last Year'];
    const chartPeriodOptions = ['Last 7 Days', 'Last 14 Days', 'Last 30 Days', 'Last 60 Days', 'Last 90 Days'];
    const roleOptions = ['HR Admin', 'Manager', 'Employee', 'Admin'];
  
    const toggleDropdown = (dropdown: string) => {
      setOpenDropdown(openDropdown === dropdown ? null : dropdown);
    };
  
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };
  
    const departmentData = [
      { name: 'Engineering', value: 18, color: '#6366F1', percentage: 34.6 },
      { name: 'Sales', value: 15, color: '#10B981', percentage: 28.8 },
      { name: 'Marketing', value: 8, color: '#8B5CF6', percentage: 15.4 },
      { name: 'Finance', value: 6, color: '#F59E0B', percentage: 11.5 },
      { name: 'HR', value: 5, color: '#EC4899', percentage: 9.6 }
    ];
  
    const approvalsData = [
      { day: 'Jan 15', value: 12 },
      { day: 'Jan 16', value: 14 },
      { day: 'Jan 17', value: 13 },
      { day: 'Jan 18', value: 16 },
      { day: 'Jan 19', value: 15 },
      { day: 'Jan 20', value: 18 },
      { day: 'Jan 21', value: 17 },
      { day: 'Jan 22', value: 19 },
      { day: 'Jan 23', value: 21 }
    ];
  
    const documents = [
      { 
        name: 'Data Protection Policy', 
        badge: 'Public',
        badgeColor: '#FEF3C7',
        badgeTextColor: '#92400E',
        uploadedBy: 'Admin',
        uploadedDate: 'Jan 12, 2026'
      },
      { 
        name: 'Employment Contract Template', 
        badge: 'Role-Based',
        badgeColor: '#FED7AA',
        badgeTextColor: '#9A3412',
        uploadedBy: 'HR Admin',
        uploadedDate: 'Jan 10, 2026'
      },
      { 
        name: 'Remote Work Agreement', 
        badge: 'Role-Based',
        badgeColor: '#FED7AA',
        badgeTextColor: '#9A3412',
        uploadedBy: 'Legal Team',
        uploadedDate: 'Jan 8, 2026'
      }
    ];
  
    // Handler functions
    const handleAddEmployee = () => {
      setShowEmployeeForm(true);
    };
  
    const handleRequestLeave = () => {
      setShowLeaveForm(true);
    };
  
    const handleUploadDocument = () => {
      setShowDocumentUpload(true);
    };
  
    const handleImportCSV = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          console.log('CSV file selected:', file.name);
          // In production: process the CSV file
        }
      };
      input.click();
    };
  
    const handleBulkUpdate = () => {
      // In production: navigate to bulk update page
      window.location.hash = '#/bulk-update';
    };
  
    const handleSendReminder = () => {
      // In production: open reminder modal or navigate
      console.log('Opening reminder configuration...');
    };
  
    const handleExportReport = () => {
      // In production: trigger actual report generation
      const blob = new Blob(['Employee Report Data'], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employee-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    };
  
    const handleViewCalendar = (e: React.MouseEvent) => {
      e.preventDefault();
      setShowCalendar(true);
    };
  
    const handleDocumentClick = (docName: string) => {
      // In production: open document viewer or download
      window.open(`/documents/${encodeURIComponent(docName)}`, '_blank');
    };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Employees Dashboard" />

      <div 
      onClick={handleClickOutside}
      style={{
        backgroundColor: '#F9FAFB',
        minHeight: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }}>
     

      <div>
        {/* Page Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '600',
            color: '#111827',
            margin: 0
          }}>Employee Management Home</h1>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {/* Role Dropdown */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDropdown('role');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#374151',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                <Users size={16} color="#6366F1" />
                <span>{selectedRole}</span>
                <ChevronDown size={14} color="#9CA3AF" />
              </button>
              {openDropdown === 'role' && (
                <div onClick={(e) => e.stopPropagation()} style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  minWidth: '160px',
                  zIndex: 1000,
                  overflow: 'hidden'
                }}>
                  {roleOptions.map((option) => (
                    <div
                      key={option}
                      onClick={() => {
                        setSelectedRole(option);
                        setOpenDropdown(null);
                      }}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: selectedRole === option ? '#6366F1' : '#374151',
                        fontWeight: selectedRole === option ? '600' : '500',
                        background: selectedRole === option ? '#F0F9FF' : 'transparent',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedRole !== option) {
                          e.currentTarget.style.background = '#F9FAFB';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedRole !== option) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Manager Button (no dropdown) */}
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#374151',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              <Users size={16} color="#6B7280" />
              <span>Manager</span>
            </button>

            {/* Timeframe Dropdown */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDropdown('timeframe');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#374151',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                <span>{selectedTimeframe}</span>
                <ChevronDown size={14} color="#9CA3AF" />
              </button>
              {openDropdown === 'timeframe' && (
                <div onClick={(e) => e.stopPropagation()} style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  minWidth: '160px',
                  zIndex: 1000,
                  overflow: 'hidden'
                }}>
                  {timeframeOptions.map((option) => (
                    <div
                      key={option}
                      onClick={() => {
                        setSelectedTimeframe(option);
                        setOpenDropdown(null);
                      }}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: selectedTimeframe === option ? '#6366F1' : '#374151',
                        fontWeight: selectedTimeframe === option ? '600' : '500',
                        background: selectedTimeframe === option ? '#F0F9FF' : 'transparent',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedTimeframe !== option) {
                          e.currentTarget.style.background = '#F9FAFB';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedTimeframe !== option) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Days Dropdown */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDropdown('days');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#374151',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                <span>{selectedDays}</span>
                <ChevronDown size={14} color="#9CA3AF" />
              </button>
              {openDropdown === 'days' && (
                <div onClick={(e) => e.stopPropagation()} style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  minWidth: '160px',
                  zIndex: 1000,
                  overflow: 'hidden'
                }}>
                  {daysOptions.map((option) => (
                    <div
                      key={option}
                      onClick={() => {
                        setSelectedDays(option);
                        setOpenDropdown(null);
                      }}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: selectedDays === option ? '#6366F1' : '#374151',
                        fontWeight: selectedDays === option ? '600' : '500',
                        background: selectedDays === option ? '#F0F9FF' : 'transparent',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedDays !== option) {
                          e.currentTarget.style.background = '#F9FAFB';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedDays !== option) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '16px'
        }}>
          {/* Total Employees */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #F3F4F6'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#EEF2FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Users size={24} color="#6366F1" strokeWidth={2} />
              </div>
              <div style={{
                fontSize: '36px',
                fontWeight: '700',
                color: '#111827',
                lineHeight: '1'
              }}>52</div>
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6B7280',
              fontWeight: '500',
              marginBottom: '12px'
            }}>Total Employees</div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: '#374151'
            }}>
              <Circle size={8} fill="#6366F1" color="#6366F1" />
              <span>46 Active / 6 Inactive</span>
            </div>
            <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px' }}>Total:</div>
          </div>

          {/* Pending Approvals */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #F3F4F6'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#D1FAE5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle size={24} color="#10B981" strokeWidth={2} />
              </div>
              <div style={{
                fontSize: '36px',
                fontWeight: '700',
                color: '#111827',
                lineHeight: '1'
              }}>7</div>
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6B7280',
              fontWeight: '500',
              marginBottom: '12px'
            }}>Pending Approvals</div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              background: '#FEF3C7',
              color: '#92400E'
            }}>⏰ 3 overdue</span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: '#374151',
              marginTop: '8px'
            }}>
              <Circle size={8} fill="#F59E0B" color="#F59E0B" />
              <span>Avg age: 2.5 days</span>
            </div>
          </div>

          {/* On Leave Today */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #F3F4F6'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#FEF3C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <MessageSquare size={24} color="#F59E0B" strokeWidth={2} />
              </div>
              <div style={{
                fontSize: '36px',
                fontWeight: '700',
                color: '#111827',
                lineHeight: '1'
              }}>5</div>
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6B7280',
              fontWeight: '500',
              marginBottom: '12px'
            }}>On Leave Today</div>
            <a href="#" onClick={handleViewCalendar} style={{
              fontSize: '13px',
              color: '#6366F1',
              textDecoration: 'none',
              fontWeight: '500',
              cursor: 'pointer'
            }}>View calendar →</a>
          </div>

          {/* Pending Acknowledgments */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #F3F4F6'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#EDE9FE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Send size={24} color="#8B5CF6" strokeWidth={2} />
              </div>
              <div style={{
                fontSize: '36px',
                fontWeight: '700',
                color: '#111827',
                lineHeight: '1'
              }}>4</div>
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6B7280',
              fontWeight: '500',
              marginBottom: '12px'
            }}>Pending Acknowledgments</div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: '#374151',
              marginTop: '8px'
            }}>
              <Circle size={8} fill="#F59E0B" color="#F59E0B" />
              <span>2 Due Soon</span>
            </div>
          </div>

          {/* Compliance Alerts */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #F3F4F6'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertTriangle size={24} color="#EF4444" strokeWidth={2} />
              </div>
              <div style={{
                fontSize: '36px',
                fontWeight: '700',
                color: '#111827',
                lineHeight: '1'
              }}>3</div>
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6B7280',
              fontWeight: '500',
              marginBottom: '12px'
            }}>Compliance Alerts</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                background: '#FEE2E2',
                color: '#991B1B'
              }}>High 1</span>
              <span style={{
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                background: '#FEF3C7',
                color: '#92400E'
              }}>Med 1</span>
              <span style={{
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                background: '#F3F4F6',
                color: '#374151'
              }}>Low 1</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '12px',
          marginBottom: '16px'
        }}>
          {[
            { icon: Plus, color: '#6366F1', text: 'Add Employee', onClick: handleAddEmployee },
            { icon: Calendar, color: '#10B981', text: 'Request Leave', onClick: handleRequestLeave },
            { icon: Upload, color: '#8B5CF6', text: 'Upload Document', onClick: handleUploadDocument }
          ].map((action, idx) => (
            <button 
              key={idx} 
              onClick={action.onClick}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#D1D5DB';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: action.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <action.icon size={24} color="#FFFFFF" strokeWidth={2.5} />
              </div>
              <span style={{
                fontSize: '15px',
                fontWeight: '500',
                color: '#111827'
              }}>{action.text}</span>
            </button>
          ))}
        </div>

        {/* Charts Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '16px',
          marginBottom: '16px'
        }}>
          {/* Department Headcount */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #F3F4F6'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>Department Headcount</h3>
              <MoreHorizontal size={20} color="#9CA3AF" style={{ cursor: 'pointer' }} />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              {departmentData.map((dept, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '10px',
                  fontSize: '14px'
                }}>
                  <Circle size={12} fill={dept.color} color={dept.color} />
                  <span style={{ flex: 1, color: '#374151', fontWeight: '500' }}>{dept.name}</span>
                  <span style={{ fontWeight: '700', color: '#111827', fontSize: '15px' }}>{dept.value}</span>
                  <span style={{ fontSize: '12px', color: '#9CA3AF', minWidth: '45px', textAlign: 'right' }}>({dept.percentage}%)</span>
                </div>
              ))}
            </div>

            <div style={{ height: '160px', marginTop: '12px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={departmentData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                >
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                    domain={[0, 20]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#FFFFFF', 
                      border: '1px solid #E5E7EB', 
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: any, name: any, props: any) => [`${value} employees (${props.payload.percentage}%)`, 'Count']}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={45}>
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Department Insights */}
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #F3F4F6' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>Department Insights</h4>
                
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Insight 1 */}
               

                {/* Insight 2 */}
                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: '#F0FDF4',
                  border: '1px solid #DCFCE7'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#166534' }}>
                      Sales Performance
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#16A34A' }}>
                      94% Target
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#15803D', lineHeight: '1.4' }}>
                    Top performing team this quarter
                  </div>
                </div>

                {/* Insight 3 */}
                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: '#FEF3C7',
                  border: '1px solid #FDE68A'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#92400E' }}>
                      HR Capacity
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#D97706' }}>
                      85% Loaded
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#92400E', lineHeight: '1.4' }}>
                    Consider hiring support staff
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Approvals Aging */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #F3F4F6'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>Approvals Aging</h3>
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown('chartPeriod');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}>
                  <span>{selectedChartPeriod}</span>
                  <ChevronDown size={14} color="#9CA3AF" />
                </button>
                {openDropdown === 'chartPeriod' && (
                  <div onClick={(e) => e.stopPropagation()} style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '4px',
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    minWidth: '160px',
                    zIndex: 1000,
                    overflow: 'hidden'
                  }}>
                    {chartPeriodOptions.map((option) => (
                      <div
                        key={option}
                        onClick={() => {
                          setSelectedChartPeriod(option);
                          setOpenDropdown(null);
                        }}
                        style={{
                          padding: '10px 14px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: selectedChartPeriod === option ? '#6366F1' : '#374151',
                          fontWeight: selectedChartPeriod === option ? '600' : '500',
                          background: selectedChartPeriod === option ? '#F0F9FF' : 'transparent',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedChartPeriod !== option) {
                            e.currentTarget.style.background = '#F9FAFB';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedChartPeriod !== option) {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <div style={{
                  fontSize: '42px',
                  fontWeight: '700',
                  color: '#111827',
                  lineHeight: '1'
                }}>21</div>
                <span style={{
                  fontSize: '14px',
                  color: '#6366F1',
                  fontWeight: '500'
                }}>This Week</span>
              </div>
            </div>

            <div style={{ height: '180px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={approvalsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    stroke="#E5E7EB" 
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <YAxis 
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 25]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#FFFFFF', 
                      border: '1px solid #E5E7EB', 
                      borderRadius: '8px',
                      fontSize: '12px',
                      padding: '8px 12px'
                    }}
                    formatter={(value: any) => [`${value} approvals`, 'Count']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#6366F1" 
                    strokeWidth={3} 
                    dot={{ fill: '#6366F1', r: 4 }}
                    activeDot={{ r: 6, fill: '#6366F1', stroke: '#FFFFFF', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Recently Uploaded Docs */}
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #F3F4F6' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>Recently Uploaded Docs</h4>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    background: '#EEF2FF',
                    color: '#4F46E5'
                  }}>📄 {documents.length} docs</span>
                </div>
              </div>

              {documents.map((doc, idx) => (
                <div 
                  key={idx} 
                  onClick={() => handleDocumentClick(doc.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 8px',
                    margin: '0 -8px',
                    borderBottom: idx < documents.length - 1 ? '1px solid #F3F4F6' : 'none',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F9FAFB';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={18} color="#6366F1" strokeWidth={2} />
                    <div>
                      <div style={{
                        fontSize: '14px',
                        color: '#111827',
                        fontWeight: '500'
                      }}>{doc.name}</div>
                      <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                        <span>{doc.uploadedBy}</span>
                        <span> • </span>
                        <span>{doc.uploadedDate}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: doc.badgeColor,
                      color: doc.badgeTextColor
                    }}>{doc.badge}</span>
                    <ChevronRight size={16} color="#D1D5DB" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '16px'
        }}>
          {/* More Actions */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #F3F4F6'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MoreHorizontal size={20} color="#6B7280" />
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>More Actions</h3>
              </div>
              <ChevronRight size={20} color="#9CA3AF" />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px'
            }}>
              {[
                { icon: Mail, text: 'Import CSV', onClick: handleImportCSV },
                { icon: RefreshCw, text: 'Bulk Update', onClick: handleBulkUpdate },
                { icon: Send, text: 'Send Reminder', onClick: handleSendReminder },
                { icon: FileBarChart, text: 'Export Report', onClick: handleExportReport }
              ].map((action, idx) => (
                <button 
                  key={idx} 
                  onClick={action.onClick}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '14px',
                    color: '#374151',
                    background: '#FAFAFA',
                    border: '1px solid #F3F4F6'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F3F4F6';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#FAFAFA';
                    e.currentTarget.style.borderColor = '#F3F4F6';
                  }}
                >
                  <action.icon size={18} color="#6B7280" strokeWidth={2} />
                  <span>{action.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #F3F4F6'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>AI Insights</h3>
              <a href="#" style={{
                fontSize: '13px',
                color: '#6366F1',
                textDecoration: 'none',
                fontWeight: '500'
              }}>All →</a>
            </div>

            <div style={{
              padding: '16px',
              borderRadius: '10px',
              marginBottom: '12px',
              borderLeft: '3px solid #F59E0B',
              background: '#FEF3C7'
            }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>💡</span>
                <div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#92400E',
                    marginBottom: '4px'
                  }}>Access anomaly detected</div>
                  <div style={{
                    fontSize: '13px',
                    color: '#92400E',
                    lineHeight: '1.5'
                  }}>2 employees have unusual access permissions.</div>
                </div>
              </div>
            </div>

            <div style={{
              padding: '16px',
              borderRadius: '10px',
              borderLeft: '3px solid #10B981',
              background: '#D1FAE5'
            }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>✅</span>
                <div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#065F46',
                    marginBottom: '4px'
                  }}>Leave conflict risk next week</div>
                  <div style={{
                    fontSize: '13px',
                    color: '#065F46',
                    lineHeight: '1.5'
                  }}>5 key employees are planning to be off next week.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Modal */}
      {showCalendar && (
        <div 
          onClick={() => setShowCalendar(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}>
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '900px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', margin: 0 }}>Employee Leave Calendar</h2>
              <button 
                onClick={() => setShowCalendar(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#9CA3AF',
                  padding: '4px',
                  lineHeight: '1'
                }}>×</button>
            </div>
            <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>January 2026</div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '8px',
              marginBottom: '16px'
            }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} style={{ textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6B7280', padding: '8px' }}>
                  {day}
                </div>
              ))}
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                const isToday = day === 15;
                const hasLeave = [8, 12, 15, 20, 23].includes(day);
                return (
                  <div key={day} style={{
                    textAlign: 'center',
                    padding: '12px',
                    borderRadius: '8px',
                    background: isToday ? '#EEF2FF' : hasLeave ? '#FEF3C7' : '#F9FAFB',
                    border: isToday ? '2px solid #6366F1' : '1px solid #E5E7EB',
                    fontSize: '14px',
                    fontWeight: isToday ? '600' : '400',
                    color: isToday ? '#6366F1' : '#374151',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}>
                    {day}
                    {hasLeave && <div style={{ fontSize: '10px', color: '#92400E', marginTop: '4px' }}>On Leave</div>}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: '24px', padding: '16px', background: '#F9FAFB', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Employees on Leave Today (Jan 15)</div>
              <div style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.8' }}>
                • John Smith - Annual Leave<br/>
                • Sarah Johnson - Sick Leave<br/>
                • Mike Williams - Personal Leave<br/>
                • Emily Davis - Annual Leave<br/>
                • David Brown - Sick Leave
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Form Modal */}
      {showEmployeeForm && (
        <div 
          onClick={() => setShowEmployeeForm(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}>
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '600px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', margin: 0 }}>Add New Employee</h2>
              <button 
                onClick={() => setShowEmployeeForm(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#9CA3AF',
                  padding: '4px'
                }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input placeholder="Full Name" style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px' }} />
              <input placeholder="Email" type="email" style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px' }} />
              <select style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', color: '#374151' }}>
                <option>Select Department</option>
                <option>Engineering</option>
                <option>Sales</option>
                <option>Marketing</option>
                <option>Finance</option>
                <option>HR</option>
              </select>
              <input placeholder="Job Title" style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px' }} />
              <input placeholder="Start Date" type="date" style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px' }} />
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button 
                  onClick={() => setShowEmployeeForm(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#F3F4F6',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    cursor: 'pointer'
                  }}>Cancel</button>
                <button style={{
                  flex: 1,
                  padding: '12px',
                  background: '#6366F1',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#FFFFFF',
                  cursor: 'pointer'
                }}>Add Employee</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave Request Form Modal */}
      {showLeaveForm && (
        <div 
          onClick={() => setShowLeaveForm(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}>
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '600px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', margin: 0 }}>Request Leave</h2>
              <button 
                onClick={() => setShowLeaveForm(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#9CA3AF',
                  padding: '4px'
                }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <select style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', color: '#374151' }}>
                <option>Leave Type</option>
                <option>Annual Leave</option>
                <option>Sick Leave</option>
                <option>Personal Leave</option>
                <option>Maternity/Paternity Leave</option>
              </select>
              <input placeholder="Start Date" type="date" style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px' }} />
              <input placeholder="End Date" type="date" style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px' }} />
              <textarea placeholder="Reason (optional)" rows={4} style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', resize: 'vertical' }} />
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button 
                  onClick={() => setShowLeaveForm(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#F3F4F6',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    cursor: 'pointer'
                  }}>Cancel</button>
                <button style={{
                  flex: 1,
                  padding: '12px',
                  background: '#10B981',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#FFFFFF',
                  cursor: 'pointer'
                }}>Submit Request</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      {showDocumentUpload && (
        <div 
          onClick={() => setShowDocumentUpload(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}>
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '600px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', margin: 0 }}>Upload Document</h2>
              <button 
                onClick={() => setShowDocumentUpload(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#9CA3AF',
                  padding: '4px'
                }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input placeholder="Document Name" style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px' }} />
              <select style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', color: '#374151' }}>
                <option>Access Level</option>
                <option>Public</option>
                <option>Role-Based</option>
                <option>Private</option>
              </select>
              <div style={{
                padding: '48px 24px',
                border: '2px dashed #E5E7EB',
                borderRadius: '8px',
                textAlign: 'center',
                cursor: 'pointer',
                background: '#F9FAFB'
              }}>
                <Upload size={32} color="#9CA3AF" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: '14px', color: '#6B7280' }}>Click to upload or drag and drop</div>
                <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>PDF, DOC, DOCX up to 10MB</div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button 
                  onClick={() => setShowDocumentUpload(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#F3F4F6',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    cursor: 'pointer'
                  }}>Cancel</button>
                <button style={{
                  flex: 1,
                  padding: '12px',
                  background: '#8B5CF6',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#FFFFFF',
                  cursor: 'pointer'
                }}>Upload</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    </React.Fragment>
  );
};

EmployeesDashboard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default EmployeesDashboard;
