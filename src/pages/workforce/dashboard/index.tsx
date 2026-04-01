import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useCallback, useEffect, useState } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

import {
  getEmployeeDashboardGraphDepartmentHeadcount,
  getEmployeeDashboardGraphApprovalsAging,
  getEmployeeDashboardLeaveCalendar,
  type EmployeeDashboardParams,
} from "@utils/staffManagement";
import { useMainAppLookups } from "@hooks/useMainAppLookups";
import DashboardStats from "./partials/DashboardStats";
import AddEmployeeModal from "@pages/workforce/AddEmployeeModal";
import NewRequestModal from "@pages/workforce/NewRequestModal";

import { 
  Plus,
  Calendar,
  Upload,
  MoreHorizontal,
  ChevronDown,
  Circle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

export interface LeaveCalendarEmployee {
  user_id: string;
  employee_name: string;
  leave_type: string;
  request_id: number;
}

export interface LeaveCalendarDay {
  date: string;
  on_leave_count: number;
  employees: LeaveCalendarEmployee[];
}

const EmployeesDashboard = () => {
    const { mainAppUsers, companyIdentifier } = useMainAppLookups();
    const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
    const [showNewRequestModal, setShowNewRequestModal] = useState(false);

    const getDisplayName = useCallback(
      (userId: string | number | null | undefined, fallback?: string): string => {
        if (userId == null || userId === "") return fallback ?? "—";
        const u = mainAppUsers?.find((x) => String(x.id) === String(userId));
        return u?.name ?? fallback ?? String(userId);
      },
      [mainAppUsers]
    );

    const [selectedDays, setSelectedDays] = useState('30');
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [periodType, setPeriodType] = useState<'Monthly' | 'Date' | 'Range'>('Monthly');
    const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
    const [rangeStartDate, setRangeStartDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
    const [rangeEndDate, setRangeEndDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
    const [showCalendar, setShowCalendar] = useState(false);
    const [showDocumentUpload, setShowDocumentUpload] = useState(false);
    const [leaveCalendarData, setLeaveCalendarData] = useState<LeaveCalendarDay[]>([]);
    const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
    const [departmentHeadcountData, setDepartmentHeadcountData] = useState<{ name: string; count: number }[]>([]);
    const [approvalsAgingData, setApprovalsAgingData] = useState<{ "0_3_days"?: number; "4_7_days"?: number; "8_plus_days"?: number }>({});

    const dashboardParams: EmployeeDashboardParams = (() => {
      const base: EmployeeDashboardParams = { days: selectedDays };
      if (periodType === 'Monthly') {
        base.period_type = 'monthly';
        return base;
      }
      if (periodType === 'Date') {
        base.period_type = 'date';
        base.date = selectedDate;
        return base;
      }
      base.period_type = 'range';
      base.start_date = rangeStartDate;
      base.end_date = rangeEndDate;
      return base;
    })();

    useEffect(() => {
      const fetchDashboardData = async () => {
        try {
          const [departmentHeadcount, approvalsAging, leaveCalendar] =
            await Promise.all([
              getEmployeeDashboardGraphDepartmentHeadcount(dashboardParams),
              getEmployeeDashboardGraphApprovalsAging(dashboardParams),
              getEmployeeDashboardLeaveCalendar(),
            ]);
          setLeaveCalendarData(Array.isArray(leaveCalendar) ? (leaveCalendar as LeaveCalendarDay[]) : []);
          setDepartmentHeadcountData(
            Array.isArray(departmentHeadcount)
              ? (departmentHeadcount as { name?: string; count?: number }[]).map((d) => ({
                  name: String(d?.name ?? "—"),
                  count: Number(d?.count ?? 0),
                }))
              : []
          );
          setApprovalsAgingData(
            approvalsAging && typeof approvalsAging === "object"
              ? (approvalsAging as { "0_3_days"?: number; "4_7_days"?: number; "8_plus_days"?: number })
              : {}
          );
        } catch (e) {
          console.error("[EmployeesDashboard] fetchDashboardData error", e);
        }
      };
      fetchDashboardData();
    }, [selectedDays, periodType, selectedDate, rangeStartDate, rangeEndDate]);
  
    const daysOptions = ['7', '30', '60'];
  
    const toggleDropdown = (dropdown: string) => {
      setOpenDropdown(openDropdown === dropdown ? null : dropdown);
    };
  
    const leaveByDate = React.useMemo(() => {
      const map: Record<string, LeaveCalendarDay> = {};
      leaveCalendarData.forEach((d) => {
        map[d.date] = d;
      });
      return map;
    }, [leaveCalendarData]);

    const calendarMonthInfo = React.useMemo(() => {
      if (leaveCalendarData.length === 0) {
        const now = new Date();
        return {
          year: now.getFullYear(),
          month: now.getMonth(),
          monthLabel: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
          daysInMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
          startWeekday: new Date(now.getFullYear(), now.getMonth(), 1).getDay(),
        };
      }
      const firstDate = new Date(leaveCalendarData[0].date);
      const year = firstDate.getFullYear();
      const month = firstDate.getMonth();
      return {
        year,
        month,
        monthLabel: firstDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
        daysInMonth: new Date(year, month + 1, 0).getDate(),
        startWeekday: new Date(year, month, 1).getDay(),
      };
    }, [leaveCalendarData]);

    const selectedDayLeave = leaveByDate[selectedCalendarDate];

    const DEPARTMENT_CHART_COLORS = ['#6366F1', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#84CC16', '#F97316'];

    const departmentData = React.useMemo(() => {
      const list = departmentHeadcountData;
      if (!list.length) return [];
      const total = list.reduce((sum, d) => sum + d.count, 0);
      return list.map((d, idx) => ({
        name: d.name,
        value: d.count,
        color: DEPARTMENT_CHART_COLORS[idx % DEPARTMENT_CHART_COLORS.length],
        percentage: total > 0 ? Math.round((d.count / total) * 1000) / 10 : 0,
      }));
    }, [departmentHeadcountData]);
  
    const approvalsAgingChartData = React.useMemo(() => {
      const d = approvalsAgingData;
      return [
        { name: "0-3 days", value: d["0_3_days"] ?? 0, fill: "#10B981" },
        { name: "4-7 days", value: d["4_7_days"] ?? 0, fill: "#F59E0B" },
        { name: "8+ days", value: d["8_plus_days"] ?? 0, fill: "#EF4444" },
      ];
    }, [approvalsAgingData]);

    const approvalsAgingTotal = (approvalsAgingData["0_3_days"] ?? 0) + (approvalsAgingData["4_7_days"] ?? 0) + (approvalsAgingData["8_plus_days"] ?? 0);
  
    // Handler functions
    const handleAddEmployee = () => {
      setShowAddEmployeeModal(true);
    };

    const handleNewRequest = () => {
      setShowNewRequestModal(true);
    };
  
    const handleUploadDocument = () => {
      setShowDocumentUpload(true);
    };
  
    const handleViewCalendar = (e: React.MouseEvent) => {
      e.preventDefault();
      setShowCalendar(true);
    };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Employees Dashboard" />

      <div
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
          }}>Employee Management</h1>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {/* Period Dropdown: Monthly | Date | Range (default Monthly) */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown('period');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    background: '#FFFFFF',
                    border: '0px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#374151',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <span>{periodType}</span>
                  <ChevronDown size={14} color="#9CA3AF" />
                </button>
                {openDropdown === 'period' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: '4px',
                      background: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      minWidth: '140px',
                      zIndex: 1000,
                      overflow: 'hidden',
                    }}
                  >
                    {(['Monthly', 'Date', 'Range'] as const).map((option) => (
                      <button
                        type="button"
                        key={option}
                        onClick={() => {
                          setPeriodType(option);
                          setOpenDropdown(null);
                        }}
                        style={{
                          padding: '10px 14px',
                          margin: 0,
                          cursor: 'pointer',
                          fontSize: '13px',
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          border: 'none',
                          outline: 'none',
                          boxShadow: 'none',
                          appearance: 'none',
                          WebkitAppearance: 'none',
                          color: periodType === option ? '#6366F1' : '#374151',
                          fontWeight: periodType === option ? '600' : '500',
                          background: periodType === option ? '#F0F9FF' : 'transparent',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          if (periodType !== option) e.currentTarget.style.background = '#F9FAFB';
                        }}
                        onMouseLeave={(e) => {
                          if (periodType !== option) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {periodType === 'Date' && (
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#374151',
                  }}
                />
              )}
              {periodType === 'Range' && (
                <>
                  <input
                    type="date"
                    value={rangeStartDate}
                    onChange={(e) => setRangeStartDate(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#374151',
                    }}
                  />
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>–</span>
                  <input
                    type="date"
                    value={rangeEndDate}
                    onChange={(e) => setRangeEndDate(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#374151',
                    }}
                  />
                </>
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
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  left: 'auto',
                  marginTop: '4px',
                  background: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  minWidth: '160px',
                  zIndex: 1000,
                  overflow: 'hidden'
                }}>
                  {daysOptions.map((option) => (
                    <button
                      type="button"
                      key={option}
                      onClick={() => {
                        setSelectedDays(option);
                        setOpenDropdown(null);
                      }}
                      style={{
                        padding: '10px 14px',
                        margin: 0,
                        cursor: 'pointer',
                        fontSize: '13px',
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        border: 'none',
                        outline: 'none',
                        boxShadow: 'none',
                        appearance: 'none',
                        WebkitAppearance: 'none',
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
                     Last {option} days
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <DashboardStats onViewCalendar={handleViewCalendar} params={dashboardParams} />

        {/* Action Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '12px',
          marginBottom: '16px'
        }}>
          {[
            { icon: Plus, color: '#6366F1', text: 'Add Employee', onClick: handleAddEmployee },
            { icon: Calendar, color: '#10B981', text: 'New Request', onClick: handleNewRequest },
            { icon: Upload, color: '#8B5CF6', text: 'Upload Document', onClick: handleUploadDocument }
          ].map((action) => (
            <button 
              key={action.text}
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
              {departmentData.length === 0 ? (
                <div style={{ fontSize: '14px', color: '#9CA3AF', padding: '12px 0' }}>No department data for the selected period.</div>
              ) : (
                departmentData.map((dept) => (
                  <div key={dept.name} style={{
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
                ))
              )}
            </div>

            <div style={{ height: '160px', marginTop: '12px' }}>
              {departmentData.length > 0 ? (
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
                      domain={[0, departmentData.length ? Math.max(...departmentData.map((d) => d.value), 0) + 1 : 5]}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: '#FFFFFF', 
                        border: '1px solid #E5E7EB', 
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value: number, _name: unknown, props: { payload?: { percentage?: number } }) => {
                        const percentage = props.payload?.percentage;
                        const hasPercentage = typeof percentage === "number";
                        const percentageText = hasPercentage ? ` (${percentage}%)` : "";
                        return [`${value} employees${percentageText}`, 'Count'];
                      }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={45}>
                      {departmentData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9CA3AF', fontSize: '14px' }}>No chart data</div>
              )}
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
                {departmentData.length > 0 && (
                  <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: '#EFF6FF',
                    border: '1px solid #DBEAFE'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px'
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#1E40AF' }}>
                        Total headcount
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#2563EB' }}>
                        {departmentData.reduce((sum, d) => sum + d.value, 0)} employees
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#1E40AF', lineHeight: '1.4' }}>
                      {(() => {
                        const hasMultipleDepartments = departmentData.length > 1;
                        const departmentSuffix = hasMultipleDepartments ? 's' : '';
                        return `${departmentData.length} department${departmentSuffix} in scope`;
                      })()}
                    </div>
                  </div>
                )}

                {/* <div style={{
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
                </div> */}

                {/* <div style={{
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
                </div> */}
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
              <div style={{ position: 'relative' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <div style={{
                  fontSize: '42px',
                  fontWeight: '700',
                  color: '#111827',
                  lineHeight: '1'
                }}>{approvalsAgingTotal}</div>
                <span style={{
                  fontSize: '14px',
                  color: '#6366F1',
                  fontWeight: '500'
                }}>Pending</span>
              </div>
            </div>

            <div style={{ height: '180px' }}>
              {approvalsAgingChartData.some((d) => d.value > 0) || approvalsAgingTotal === 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={approvalsAgingChartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
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
                      domain={[0, Math.max(...approvalsAgingChartData.map((d) => d.value), 0) + 1]}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '12px',
                        padding: '8px 12px'
                      }}
                      formatter={(value: number) => [`${value} pending`, 'Count']}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={48}>
                      {approvalsAgingChartData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9CA3AF', fontSize: '14px' }}>No aging data</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Modal */}
      {showCalendar && (
        <dialog
          open
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
            <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>{calendarMonthInfo.monthLabel}</div>
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
              {Array.from({ length: calendarMonthInfo.startWeekday }, (_, i) => (
                <div key={`pad-${i}`} style={{ padding: '12px' }} />
              ))}
              {Array.from({ length: calendarMonthInfo.daysInMonth }, (_, i) => {
                const day = i + 1;
                const dateStr = `${calendarMonthInfo.year}-${String(calendarMonthInfo.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayData = leaveByDate[dateStr];
                const hasLeave = (dayData?.on_leave_count ?? 0) > 0;
                const isSelected = dateStr === selectedCalendarDate;
                const todayStr = new Date().toISOString().slice(0, 10);
                const isToday = dateStr === todayStr;
                let dayBackground = '#F9FAFB';
                if (hasLeave) {
                  dayBackground = '#FEF3C7';
                }
                if (isToday) {
                  dayBackground = '#E0E7FF';
                }
                if (isSelected) {
                  dayBackground = '#EEF2FF';
                }
                const dayBorder = isSelected || isToday ? '2px solid #6366F1' : '1px solid #E5E7EB';
                const dayColor = isSelected || isToday ? '#6366F1' : '#374151';
                const dayWeight = isSelected || isToday ? '600' : '400';
                const leaveCountText = dayData?.on_leave_count ? `(${dayData.on_leave_count})` : '';
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => setSelectedCalendarDate(dateStr)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      padding: '12px',
                      borderRadius: '8px',
                      background: dayBackground,
                      border: dayBorder,
                      fontSize: '14px',
                      fontWeight: dayWeight,
                      color: dayColor,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      minHeight: '56px'
                    }}
                  >
                    {day}
                    {hasLeave && <div style={{ fontSize: '10px', color: '#92400E', marginTop: '4px' }}>On Leave {leaveCountText}</div>}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: '24px', padding: '16px', background: '#F9FAFB', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                Employees on Leave {selectedCalendarDate === new Date().toISOString().slice(0, 10) ? 'Today' : ''} ({selectedCalendarDate})
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.8' }}>
                {selectedDayLeave?.employees?.length ? (
                  selectedDayLeave.employees.map((emp) => (
                    <div key={`${emp.user_id}-${emp.request_id}`}>
                      • {getDisplayName(emp.user_id, emp.employee_name)} - {emp.leave_type}
                    </div>
                  ))
                ) : (
                  <span style={{ color: '#9CA3AF' }}>No employees on leave this day.</span>
                )}
              </div>
            </div>
          </div>
        </dialog>
      )}

      <AddEmployeeModal
        show={showAddEmployeeModal}
        onHide={() => setShowAddEmployeeModal(false)}
        tenantId={companyIdentifier ?? undefined}
      />

      <NewRequestModal
        show={showNewRequestModal}
        onHide={() => setShowNewRequestModal(false)}
      />

      {/* Document Upload Modal */}
      {showDocumentUpload && (
        <dialog
          open
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
        </dialog>
      )}
    </div>

    </React.Fragment>
  );
};

EmployeesDashboard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default EmployeesDashboard;
