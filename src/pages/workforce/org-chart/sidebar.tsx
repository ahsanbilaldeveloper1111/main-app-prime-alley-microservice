import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  X,
  User,
  Phone,
  Calendar,
  Briefcase,
  Clock,
  Building2,
  UserCheck,
  Search,
} from 'lucide-react';
import { putUserProfileParent, putUserProfileBulkReports, type UserProfileMinified } from '@utils/staffManagement';

interface Employee {
  id: string;
  /** App user id (when known from org-chart tree); used to exclude manager from subordinate pickers. */
  userId?: string;
  name: string;
  title: string;
  department: string;
  avatar: string;
  status?: 'On Leave' | 'Active' | 'Inactive';
  children?: Employee[];
}

/** Full API profile from org-chart-tree (optional, for real phone, employee_code, etc.) */
interface RawOrgChartProfile {
  id?: number;
  user_id?: string;
  employee_code?: string;
  identification_number?: string;
  job_title?: string;
  phone?: string;
  employment_type?: string;
  contract_type?: string;
  status?: string;
  designation?: string;
  created_at?: string;
  attendance?: { status?: string; check_in_at?: string | null; check_out_at?: string | null };
  [key: string]: unknown;
}

interface UserOption {
  id: number;
  name: string;
}

interface OrganizationEmployeeSidebarProps {
  employee: Employee;
  onClose: () => void;
  allEmployees: Employee;
  rawProfile?: RawOrgChartProfile | null;
  /** List of users for "Reports to" dropdown (excluding current employee). */
  users?: UserOption[];
  /** Minified profiles for initial direct-report checkboxes and manager id fallback. */
  userProfilesMinified?: UserProfileMinified[];
  /** Called after parent is updated successfully (e.g. to refetch org chart). */
  onRefresh?: () => void | Promise<void>;
}

function findEmployeeParent(tree: Employee, targetId: string, parent: Employee | null = null): Employee | null {
  if (tree.id === targetId) {
    return parent;
  }
  const children = tree.children;
  if (!children) {
    return null;
  }
  for (const child of children) {
    const result = findEmployeeParent(child, targetId, tree);
    if (result !== null) {
      return result;
    }
  }
  return null;
}

type SidebarEmployeeStatus = Employee['status'];

function getCurrentStatusVisuals(status: SidebarEmployeeStatus): {
  panelBg: string;
  iconBg: string;
  text: string;
  subtitle: string;
} {
  if (status === 'On Leave') {
    return {
      panelBg: '#fef3c7',
      iconBg: '#fbbf24',
      text: '#92400e',
      subtitle: 'Currently away from office',
    };
  }
  if (status === 'Inactive') {
    return {
      panelBg: '#f3f4f6',
      iconBg: '#9ca3af',
      text: '#6b7280',
      subtitle: 'No longer active',
    };
  }
  return {
    panelBg: '#d1fae5',
    iconBg: '#10b981',
    text: '#065f46',
    subtitle: 'Available and working',
  };
}

const OrganizationEmployeeSidebar: React.FC<OrganizationEmployeeSidebarProps> = ({ employee, onClose, allEmployees, rawProfile, users = [], userProfilesMinified = [], onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Reporting'>('Overview');
  const [updatingParent, setUpdatingParent] = useState(false);
  const [childUserIds, setChildUserIds] = useState<string[]>([]);
  const [updatingBulkReports, setUpdatingBulkReports] = useState(false);
  const [directReportSearch, setDirectReportSearch] = useState('');

  const manager = findEmployeeParent(allEmployees, employee.id);
  const directReports = employee.children || [];
  const totalTeamSize = directReports.length;

  const managerUserId = useMemo(() => {
    if (!manager) return undefined;
    if (manager.userId != null && String(manager.userId) !== '') {
      return String(manager.userId);
    }
    const prof = userProfilesMinified.find((p) => String(p.id) === String(manager.id));
    if (prof?.user_id == null) {
      return undefined;
    }
    return String(prof.user_id);
  }, [manager, userProfilesMinified]);

  const dropdownUsers = useMemo(
    () => users.filter((u) => String(u.id) !== String(rawProfile?.user_id)),
    [users, rawProfile?.user_id]
  );

  const directReportOptionUsers = useMemo(
    () =>
      users.filter((u) => {
        if (String(u.id) === String(rawProfile?.user_id)) return false;
        if (managerUserId != null && String(u.id) === managerUserId) return false;
        return true;
      }),
    [users, rawProfile?.user_id, managerUserId]
  );

  const initialChildUserIds = useMemo(
    () =>
      (userProfilesMinified ?? []).filter((p) => String(p.parent_id) === String(rawProfile?.user_id)).map((p) => String(p.user_id)),
    [userProfilesMinified, rawProfile?.user_id]
  );
  useEffect(() => {
    setChildUserIds(initialChildUserIds);
  }, [initialChildUserIds]);

  const joinDateFormatted = rawProfile?.created_at
    ? new Date(rawProfile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : '—';

  const employeeDetails = {
    email: rawProfile?.user_id
      ? `${rawProfile.user_id}@company.com`
      : `${employee.name.toLowerCase().replaceAll(/\s+/g, '.')}@company.com`,
    phone: rawProfile?.phone ?? '—',
    location: '—',
    employeeId: rawProfile?.employee_code ?? (employee.id ? `EMP-${String(employee.id).padStart(5, '0')}` : '—'),
    joinDate: joinDateFormatted,
    employmentType: rawProfile?.employment_type ?? '—',
    workSchedule: rawProfile?.contract_type ? `${rawProfile.contract_type}` : 'Mon - Fri, 9:00 AM - 5:00 PM',
    identificationNumber: rawProfile?.identification_number ?? '—',
    attendance: rawProfile?.attendance,
  };

  const statusUi = getCurrentStatusVisuals(employee.status);

  const handleParentSelectChange = useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      setUpdatingParent(true);
      try {
        await putUserProfileParent(employee.id, { parent_id: value });
        toast.success('Reporting manager updated');
        await onRefresh?.();
      } catch (error) {
        console.error('[OrganizationEmployeeSidebar] putUserProfileParent failed:', error);
        toast.error('Failed to update reporting manager');
      } finally {
        setUpdatingParent(false);
      }
    },
    [employee.id, onRefresh]
  );

  const handleDirectReportToggle = useCallback(
    async (uid: string, currentlyChecked: boolean) => {
      const prevIds = childUserIds;
      const newIds = currentlyChecked ? prevIds.filter((id) => id !== uid) : [...prevIds, uid];
      setChildUserIds(newIds);
      setUpdatingBulkReports(true);
      try {
        await putUserProfileBulkReports(employee.id, { child_user_ids: newIds });
        toast.success('Direct reports updated');
        await onRefresh?.();
      } catch (error) {
        console.error('[OrganizationEmployeeSidebar] putUserProfileBulkReports failed:', error);
        toast.error('Failed to update direct reports');
        setChildUserIds(prevIds);
      } finally {
        setUpdatingBulkReports(false);
      }
    },
    [childUserIds, employee.id, onRefresh]
  );

  const filteredDirectReportOptionUsers = useMemo(() => {
    const q = directReportSearch.trim().toLowerCase();
    if (q === '') {
      return directReportOptionUsers;
    }
    return directReportOptionUsers.filter((u) => u.name.toLowerCase().includes(q));
  }, [directReportOptionUsers, directReportSearch]);

  const renderOverviewTab = () => (
    <>
      {/* Employment Information */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          color: '#1f2937',
          margin: '0 0 16px 0'
        }}>
          Employment Information
        </h3>
        
        <div style={{ 
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#e0e7ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Briefcase size={18} color="#6366f1" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '2px' }}>
                Employee ID
              </div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                {employeeDetails.employeeId}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Building2 size={18} color="#3b82f6" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '2px' }}>
                Department
              </div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                {employee.department}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#d1fae5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Calendar size={18} color="#10b981" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '2px' }}>
                Join Date
              </div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                {employeeDetails.joinDate}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Clock size={18} color="#f59e0b" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '2px' }}>
                Work Schedule
              </div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                {employeeDetails.workSchedule}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          color: '#1f2937',
          margin: '0 0 16px 0'
        }}>
          Current Status
        </h3>
        
        <div style={{
          padding: '16px',
          backgroundColor: statusUi.panelBg,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: statusUi.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <UserCheck size={20} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: statusUi.text
            }}>
              {employee.status || 'Active'}
            </div>
            <div style={{
              fontSize: '13px',
              color: statusUi.text
            }}>
              {statusUi.subtitle}
            </div>
          </div>
        </div>
      </div>

      
    </>
  );

  const renderReportingTab = () => (
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: '0 0 16px 0' }}>
          Reporting Structure
        </h3>

        {manager && (
          <button
            type="button"
            style={{
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              marginBottom: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              width: '100%',
              border: 'none',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
            }}
          >
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '500', marginTop: '10px' }}>
            Reports to
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <User size={20} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                  {manager.name}
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  {manager.title}
                </div>
              </div>
            </div>
          </button>
        )}



        

        {dropdownUsers.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: '0 0 12px 0' }}>
              {rawProfile?.parent_id ? 'Change Head' : 'Choose Head'}
            </h3>
            <select
              value={rawProfile?.parent_id == null ? '' : String(rawProfile.parent_id)}
              onChange={handleParentSelectChange}
              disabled={updatingParent}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'white',
                cursor: updatingParent ? 'wait' : 'pointer',
              }}
            >
              <option value="">Select manager</option>
              {dropdownUsers.map((u) => (
                <option key={u.id} value={String(u.id)}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {directReportOptionUsers.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: '0 0 12px 0' }}>
              Choose Subordinates
            </h3>
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Search users..."
                value={directReportSearch}
                onChange={(e) => setDirectReportSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: 'white',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {filteredDirectReportOptionUsers.map((u) => {
                const uid = String(u.id);
                const checked = childUserIds.includes(uid);
                return (
                  <label
                    key={u.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: updatingBulkReports ? 'wait' : 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={updatingBulkReports}
                      onChange={() => {
                        handleDirectReportToggle(uid, checked);
                      }}
                      style={{ cursor: updatingBulkReports ? 'wait' : 'pointer' }}
                    />
                    <span style={{ color: '#1f2937' }}>{u.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {totalTeamSize > 0 && (
          <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Direct Reports ({totalTeamSize})</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {directReports.slice(0, 3).map((report) => (
                <button
                  key={report.id}
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: 'none',
                    width: '100%',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <User size={16} color="white" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {report.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {report.title}
                    </div>
                  </div>
                  {report.status === 'On Leave' && (
                    <div style={{ padding: '2px 8px', backgroundColor: '#fef3c7', borderRadius: '12px', fontSize: '10px', fontWeight: '500', color: '#92400e' }}>
                      On Leave
                    </div>
                  )}
                  {report.status === 'Inactive' && (
                    <div style={{ padding: '2px 8px', backgroundColor: '#f3f4f6', borderRadius: '12px', fontSize: '10px', fontWeight: '500', color: '#6b7280' }}>
                      Inactive
                    </div>
                  )}
                </button>
              ))}
              {totalTeamSize > 3 && (
                <div style={{ padding: '8px', textAlign: 'center', fontSize: '13px', color: '#6366f1', fontWeight: '500', cursor: 'pointer' }}>
                  View all {totalTeamSize} reports
                </div>
              )}
            </div>
          </div>
        )}

        {!manager && totalTeamSize === 0 && (
          <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
            No reporting structure information available
          </div>
        )}
      </div>
  );

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
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid #e5e7eb'
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
            Employee Details
          </h2>
          <button
            type="button"
            aria-label="Close employee details"
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

        {/* Employee Header Info */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <User size={32} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#1f2937',
              margin: '0 0 4px 0'
            }}>
              {employee.name}
            </h3>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
              {rawProfile?.designation}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} color="#9ca3af" />
                <span style={{ fontSize: '13px', color: '#6b7280' }}>
                  {employeeDetails.phone}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '16px 24px',
        borderBottom: '1px solid #e5e7eb',
        overflowX: 'auto'
      }}>
        {(['Overview', 'Reporting'] as const).map((tab) => (
          <button
            type="button"
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              backgroundColor: activeTab === tab ? '#8b5cf6' : 'white',
              color: activeTab === tab ? 'white' : '#6b7280',
              border: activeTab === tab ? 'none' : '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Scrollable Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px'
      }}>
        {activeTab === 'Overview' && renderOverviewTab()}
        {activeTab === 'Reporting' && renderReportingTab()}
      </div>


      




    </div>
  );
};

export default OrganizationEmployeeSidebar;
