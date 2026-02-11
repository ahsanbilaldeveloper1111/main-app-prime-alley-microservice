import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { 
  X, 
  User,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  MapPin,
  Users,
  ChevronRight,
  Clock,
  Shield,
  Building2,
  UserCheck
} from 'lucide-react';
import { putUserProfileParent } from '@utils/staffManagement';

interface Employee {
  id: string;
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
  /** Called after parent is updated successfully (e.g. to refetch org chart). */
  onRefresh?: () => void | Promise<void>;
}

const OrganizationEmployeeSidebar: React.FC<OrganizationEmployeeSidebarProps> = ({ employee, onClose, allEmployees, rawProfile, users = [], onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Team' | 'Performance'>('Overview');
  const [parentId, setParentId] = useState<string>('');
  const [updatingParent, setUpdatingParent] = useState(false);

  const dropdownUsers = users.filter((u) => String(u.id) !== String(rawProfile?.user_id));

  // Find parent (manager) of current employee
  const findParent = (tree: Employee, targetId: string, parent: Employee | null = null): Employee | null => {
    if (tree.id === targetId) {
      return parent;
    }
    if (tree.children) {
      for (const child of tree.children) {
        const result = findParent(child, targetId, tree);
        if (result) return result;
      }
    }
    return null;
  };

  const manager = findParent(allEmployees, employee.id);
  const directReports = employee.children || [];
  const totalTeamSize = directReports.length;

  const joinDateFormatted = rawProfile?.created_at
    ? new Date(rawProfile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : '—';

  const employeeDetails = {
    email: rawProfile?.user_id ? `${rawProfile.user_id}@company.com` : `${employee.name.toLowerCase().replace(/\s+/g, '.')}@company.com`,
    phone: rawProfile?.phone ?? '—',
    location: '—',
    employeeId: rawProfile?.employee_code ?? (employee.id ? `EMP-${String(employee.id).padStart(5, '0')}` : '—'),
    joinDate: joinDateFormatted,
    employmentType: rawProfile?.employment_type ?? '—',
    workSchedule: rawProfile?.contract_type ? `${rawProfile.contract_type}` : 'Mon - Fri, 9:00 AM - 5:00 PM',
    identificationNumber: rawProfile?.identification_number ?? '—',
    attendance: rawProfile?.attendance,
  };

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

      {/* Reporting Structure */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          color: '#1f2937',
          margin: '0 0 16px 0'
        }}>
          Reporting Structure
        </h3>

        {/* Manager */}
        {manager && (
          <div style={{
            padding: '12px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            marginBottom: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
          >
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '500',marginTop: '10px' }}>
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
              <ChevronRight size={16} color="#9ca3af" />
            </div>
          </div>
        )}

        {/* Reports to (manager) dropdown */}
      {dropdownUsers.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: '0 0 12px 0' }}>
            Reports to
          </h3>
          <select
            value={parentId}
            onChange={async (e) => {
              const value = e.target.value;
              setParentId(value);
              if (!value) return;
              setUpdatingParent(true);
              try {
                await putUserProfileParent(employee.id, { parent_id: value });
                toast.success('Reporting manager updated');
                await onRefresh?.();
              } catch (err) {
                toast.error('Failed to update reporting manager');
                setParentId(parentId);
              } finally {
                setUpdatingParent(false);
              }
            }}
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

        {/* Direct Reports */}
        {totalTeamSize > 0 && (
          <div style={{
            padding: '12px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px'
          }}>
            <div style={{ 
              fontSize: '12px', 
              color: '#6b7280', 
              marginBottom: '8px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>Direct Reports ({totalTeamSize})</span>
              <ChevronRight size={14} color="#9ca3af" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {directReports.slice(0, 3).map(report => (
                <div 
                  key={report.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
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
                    <div style={{
                      padding: '2px 8px',
                      backgroundColor: '#fef3c7',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: '500',
                      color: '#92400e'
                    }}>
                      On Leave
                    </div>
                  )}
                  {report.status === 'Inactive' && (
                    <div style={{
                      padding: '2px 8px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: '500',
                      color: '#6b7280'
                    }}>
                      Inactive
                    </div>
                  )}
                </div>
              ))}
              {totalTeamSize > 3 && (
                <div style={{
                  padding: '8px',
                  textAlign: 'center',
                  fontSize: '13px',
                  color: '#6366f1',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}>
                  View all {totalTeamSize} reports
                </div>
              )}
            </div>
          </div>
        )}

        {!manager && totalTeamSize === 0 && (
          <div style={{
            padding: '20px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '13px'
          }}>
            No reporting structure information available
          </div>
        )}
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
          backgroundColor: employee.status === 'On Leave' ? '#fef3c7' : employee.status === 'Inactive' ? '#f3f4f6' : '#d1fae5',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: employee.status === 'On Leave' ? '#fbbf24' : employee.status === 'Inactive' ? '#9ca3af' : '#10b981',
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
              color: employee.status === 'On Leave' ? '#92400e' : employee.status === 'Inactive' ? '#6b7280' : '#065f46'
            }}>
              {employee.status || 'Active'}
            </div>
            <div style={{ 
              fontSize: '13px', 
              color: employee.status === 'On Leave' ? '#92400e' : employee.status === 'Inactive' ? '#6b7280' : '#065f46'
            }}>
              {employee.status === 'On Leave' ? 'Currently away from office' : employee.status === 'Inactive' ? 'No longer active' : 'Available and working'}
            </div>
          </div>
        </div>
      </div>

      
    </>
  );

  const renderTeamTab = () => (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
      <Users size={48} color="#9ca3af" style={{ margin: '0 auto 16px' }} />
      <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
        Team Information
      </h4>
      <p style={{ fontSize: '14px', margin: 0 }}>
        Detailed team structure and collaboration info
      </p>
    </div>
  );

  const renderPerformanceTab = () => (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
      <Shield size={48} color="#9ca3af" style={{ margin: '0 auto 16px' }} />
      <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
        Performance Metrics
      </h4>
      <p style={{ fontSize: '14px', margin: 0 }}>
        Performance reviews and achievements
      </p>
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
              {employee.title}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {/* <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} color="#9ca3af" />
                <span style={{ fontSize: '13px', color: '#6b7280' }}>
                  {employeeDetails.email}
                </span>
              </div> */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} color="#9ca3af" />
                <span style={{ fontSize: '13px', color: '#6b7280' }}>
                  {employeeDetails.phone}
                </span>
              </div>
              {/* <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} color="#9ca3af" />
                <span style={{ fontSize: '13px', color: '#6b7280' }}>
                  {employeeDetails.location}
                </span>
              </div> */}
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
        {(['Overview', 'Team', 'Performance'] as const).map(tab => (
          <button
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
        {activeTab === 'Team' && renderTeamTab()}
        {activeTab === 'Performance' && renderPerformanceTab()}
      </div>


      




    </div>
  );
};

export default OrganizationEmployeeSidebar;
