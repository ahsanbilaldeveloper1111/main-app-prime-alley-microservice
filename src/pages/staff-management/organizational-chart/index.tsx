import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";

import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { getUserProfilesOrgChartTree } from "@utils/staffManagement";
import { useSession } from "next-auth/react";
import { useMainAppLookups } from "@hooks/useMainAppLookups";
import { useUserProfilesMinified } from "@hooks/useUserProfilesMinified";
import { 
  Search, 
  ChevronDown, 
  AlertCircle,
  ChevronRight,
  Grid3x3,
  Plus,
  Users,
  Calendar,
  ExternalLink,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  User
} from 'lucide-react';
import styled from 'styled-components';
import OrgEmployeeSidebar from './sidebar';
import router from "next/router";

// Dynamically import react-organizational-chart to avoid SSR issues
const Tree = dynamic(
    () => import('react-organizational-chart').then((mod) => mod.Tree),
    { ssr: false }
  );
  const TreeNode = dynamic(
    () => import('react-organizational-chart').then((mod) => mod.TreeNode),
    { ssr: false }
  );

  /** API org-chart-tree node shape */
  interface ApiOrgChartNode {
    id?: number;
    user_id?: string;
    parent_id?: number | null;
    parent_profile_id?: number | null;
    department_id?: string;
    job_title?: string;
    status?: string;
    is_on_leave_today?: boolean;
    children?: ApiOrgChartNode[];
    [key: string]: unknown;
  }
  
  type EmployeeStatus = 'On Leave' | 'Active' | 'Inactive';

  interface Employee {
    id: string;
    name: string;
    title: string;
    department: string;
    avatar: string;
    status?: EmployeeStatus;
    children?: Employee[];
  }

  interface TeamMember {
    id: string;
    name: string;
    title: string;
    avatar: string;
    status: EmployeeStatus;
    leaveDates?: string;
  }
  
  const StyledNode = styled.div`
    padding: 20px;
    border-radius: 12px;
    display: inline-block;
    background-color: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    border: 1px solid #e5e7eb;
    min-width: 200px;
    text-align: center;
    transition: all 0.3s ease;
    cursor: pointer;
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
  `;

const OrganizationalChart = () => {
    const { data: session } = useSession();
    const { mainAppDepartments, mainAppUsers } = useMainAppLookups();
    const [activeTab, setActiveTab] = useState<'All Department' | 'Org Chart' | 'My Team'>('Org Chart');
    const [searchTerm, setSearchTerm] = useState('');
    const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState('All Department');
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(100);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [newEmployee, setNewEmployee] = useState({
      name: '',
      title: '',
      department: '',
      status: 'Active' as 'Active' | 'On Leave',
      parentId: ''
    });
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [showEmployeeSidebar, setShowEmployeeSidebar] = useState(false);
    const [orgChartTreeRaw, setOrgChartTreeRaw] = useState<ApiOrgChartNode[] | null>(null);
    const [loadingOrgChart, setLoadingOrgChart] = useState(true);


    const { userProfilesMinified } = useUserProfilesMinified();

    const refetchOrgChart = useCallback(async (departmentId?: string, userIds?: string[]) => {
      setLoadingOrgChart(true);
      try {
        const params: { department_id?: string; user_ids?: string[] } = {};
        if (departmentId != null && departmentId !== '') params.department_id = departmentId;
        if (userIds != null && userIds.length > 0) params.user_ids = userIds;
        const raw = await getUserProfilesOrgChartTree(Object.keys(params).length ? params : undefined);
        const list: ApiOrgChartNode[] =
          Array.isArray(raw)
            ? (raw as ApiOrgChartNode[])
            : raw && typeof raw === "object" && Array.isArray((raw as { data?: unknown }).data)
              ? ((raw as { data: ApiOrgChartNode[] }).data)
              : [];
        setOrgChartTreeRaw(list);
      } catch (e) {
        console.error("[OrganizationalChart] fetch org chart error:", e);
        setOrgChartTreeRaw([]);
      } finally {
        setLoadingOrgChart(false);
      }
    }, []);

    const handleDepartmentChange = useCallback(
      (dept: string, selectedUserId?: string) => {
        const departmentId =
          dept === 'All Department' || !dept
            ? undefined
            : mainAppDepartments?.find((d) => d.name === dept)?.id;
        const userIds = selectedUserId ? [selectedUserId] : undefined;
        refetchOrgChart(departmentId != null ? String(departmentId) : undefined, userIds);
      },
      [mainAppDepartments, refetchOrgChart]
    );

    const handleUserChange = useCallback(
      (userId: string, selectedDept: string) => {
        const departmentId =
          selectedDept === 'All Department' || !selectedDept
            ? undefined
            : mainAppDepartments?.find((d) => d.name === selectedDept)?.id;
        const userIds = userId ? [userId] : undefined;
        refetchOrgChart(departmentId != null ? String(departmentId) : undefined, userIds);
      },
      [mainAppDepartments, refetchOrgChart]
    );

    useEffect(() => {
      refetchOrgChart();
    }, [refetchOrgChart]);

    const departments = ['All Department', ...(mainAppDepartments?.map((d) => d.name).filter(Boolean) as string[])];

    const [orgData, setOrgData] = useState<Employee | null>(null);
    useEffect(() => {
      if (!orgChartTreeRaw || orgChartTreeRaw.length === 0) {
        setOrgData(null);
        return;
      }
      const getName = (userId: string | undefined) => {
        if (!userId) return '—';
        const u = mainAppUsers?.find((x) => String(x.id) === String(userId));
        return u?.name ?? userId;
      };
      const getDeptName = (departmentId: string | undefined) => {
        if (!departmentId) return '—';
        const d = mainAppDepartments?.find((x) => String(x.id) === String(departmentId));
        return d?.name ?? departmentId;
      };
      const apiNodeToEmployee = (node: ApiOrgChartNode): Employee => {
        const rawStatus = (node.status ?? '').toString().toLowerCase();
        const status: EmployeeStatus = node.is_on_leave_today
          ? 'On Leave'
          : rawStatus === 'inactive'
            ? 'Inactive'
            : 'Active';
        return {
          id: String(node.id ?? ''),
          name: getName(node.user_id),
          title: node.job_title ?? '—',
          department: getDeptName(node.department_id),
          avatar: '',
          status,
          children: (node.children && node.children.length > 0)
            ? node.children.map(apiNodeToEmployee)
            : undefined,
        };
      };
      const roots = orgChartTreeRaw.map(apiNodeToEmployee);
      const companyName = (session?.user as { company_name?: string } | undefined)?.company_name ?? 'Organization';
      const built: Employee =
        roots.length === 1
          ? roots[0]
          : {
              id: 'root',
              name: companyName,
              title: '',
              department: '',
              avatar: '',
              status: 'Active',
              children: roots,
            };
      setOrgData(built);
    }, [orgChartTreeRaw, mainAppUsers, mainAppDepartments, session?.user]);

    const rawProfileById = useMemo(() => {
      const map: Record<string, ApiOrgChartNode> = {};
      const walk = (nodes: ApiOrgChartNode[]) => {
        nodes.forEach((n) => {
          if (n.id != null) map[String(n.id)] = n;
          if (n.children?.length) walk(n.children);
        });
      };
      if (orgChartTreeRaw?.length) walk(orgChartTreeRaw);
      return map;
    }, [orgChartTreeRaw]);

    const flattenTeam = (emp: Employee | null, out: Employee[] = []): Employee[] => {
      if (!emp) return out;
      if (emp.id !== 'root') out.push(emp);
      (emp.children ?? []).forEach((c) => flattenTeam(c, out));
      return out;
    };
    const myTeam: TeamMember[] = (orgData ? flattenTeam(orgData) : []).map((e) => ({
      id: e.id,
      name: e.name,
      title: e.title,
      avatar: e.avatar,
      status: (e.status ?? 'Active') as EmployeeStatus,
      leaveDates: e.status === 'On Leave' ? '—' : undefined,
    }));
  
    // Render org chart node
    const renderNode = (employee: Employee) => {
      const isRoot = employee.id === 'root';
      return (
        <div
          onClick={isRoot ? undefined : () => {
            setSelectedEmployee(employee);
            setShowEmployeeSidebar(true);
          }}
          style={{
            padding: '20px',
            borderRadius: '12px',
            display: 'inline-block',
            backgroundColor: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb',
            minWidth: '200px',
            textAlign: 'center',
            transition: 'all 0.3s ease',
            cursor: isRoot ? 'default' : 'pointer',
          }}
          onMouseEnter={isRoot ? undefined : (e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={isRoot ? undefined : (e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
          }}
        >
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px'
          }}>
            <User size={32} color="white" />
          </div>
          <h4 style={{ 
            fontSize: '15px', 
            fontWeight: '600', 
            color: '#1f2937',
            margin: '0 0 4px 0'
          }}>
            {employee.name}
          </h4>
          <div style={{ 
            fontSize: '13px', 
            color: '#6b7280',
            marginBottom: employee.status === 'On Leave' ? '8px' : '0'
          }}>
            {employee.title}
          </div>
          {employee.status === 'On Leave' && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              backgroundColor: '#fef3c7',
              color: '#92400e',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '500',
              marginTop: '8px'
            }}>
              <Calendar size={12} color="#92400e" />
              On Leave
            </span>
          )}
          {employee.status === 'Inactive' && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              backgroundColor: '#f3f4f6',
              color: '#6b7280',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '500',
              marginTop: '8px'
            }}>
              Inactive
            </span>
          )}
          {employee.status === 'Active' && employee.id !== '1' && employee.id !== 'root' && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              backgroundColor: '#d1fae5',
              color: '#065f46',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '500',
              marginTop: '8px'
            }}>
              ● Active
            </span>
          )}
          {(() => {
            if (employee.id === 'root') return null;
            const rawNode = rawProfileById[employee.id];
            const attendance = rawNode?.attendance as { status?: string; check_in_at?: string | null; check_out_at?: string | null } | undefined;
            const attStatus = attendance?.status;
            const label =
              !attStatus || attStatus === 'none'
                ? 'No Attendance'
                : attStatus === 'checked_in'
                  ? 'Checked in'
                  : attStatus === 'checked_out'
                    ? 'Checked out'
                    : attStatus.replace(/_/g, ' ');
            const time = attStatus === 'checked_out' ? attendance?.check_out_at : attendance?.check_in_at;
            const timeStr = time ? new Date(time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '';
            return (
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#6b7280' }}>
                {label}{timeStr ? ` · ${timeStr}` : ''}
              </div>
            );
          })()}
        </div>
      );
    };
  
    // Recursive function to render tree using react-organizational-chart
    const renderTree = (employee: Employee): React.ReactElement => {
      return (
        <TreeNode label={renderNode(employee)}>
          {employee.children?.map((child) => renderTree(child))}
        </TreeNode>
      );
    };
  
    const handleZoomIn = () => {
      setZoomLevel(prev => Math.min(prev + 10, 150));
    };
  
    const handleZoomOut = () => {
      setZoomLevel(prev => Math.max(prev - 10, 50));
    };
  
    const handleResetZoom = () => {
      setZoomLevel(100);
    };
  
    const toggleFullscreen = () => {
      const chartContainer = document.getElementById('org-chart-container');
      if (!document.fullscreenElement && chartContainer) {
        chartContainer.requestFullscreen().catch(err => {
          console.error('Error attempting to enable fullscreen:', err);
        });
        setIsFullscreen(true);
      } else if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    };
  
    const handleAddEmployee = () => {
      setShowAddDialog(true);
      setNewEmployee({
        name: '',
        title: '',
        department: '',
        status: 'Active',
        parentId: ''
      });
    };
  
    // Recursive function to find and add employee to parent
    const addEmployeeToTree = (tree: Employee, parentId: string, newEmp: Employee): Employee => {
      if (tree.id === parentId) {
        return {
          ...tree,
          children: [...(tree.children || []), newEmp]
        };
      }
      if (tree.children) {
        return {
          ...tree,
          children: tree.children.map(child => addEmployeeToTree(child, parentId, newEmp))
        };
      }
      return tree;
    };
  
    // Recursive function to get all employees for parent selection
    const getAllEmployees = (employee: Employee, list: { id: string; name: string; title: string }[] = []): { id: string; name: string; title: string }[] => {
      list.push({ id: employee.id, name: employee.name, title: employee.title });
      if (employee.children) {
        employee.children.forEach(child => getAllEmployees(child, list));
      }
      return list;
    };
  
    const handleSubmitEmployee = () => {
      if (!newEmployee.name || !newEmployee.title || !newEmployee.department || !newEmployee.parentId) {
        alert('Please fill in all required fields');
        return;
      }
      if (!orgData) return;
      const newEmp: Employee = {
        id: Date.now().toString(),
        name: newEmployee.name,
        title: newEmployee.title,
        department: newEmployee.department,
        avatar: '',
        status: newEmployee.status,
        children: []
      };
      const updatedTree = addEmployeeToTree(orgData, newEmployee.parentId, newEmp);
      setOrgData(updatedTree);
      setShowAddDialog(false);
      setNewEmployee({
        name: '',
        title: '',
        department: '',
        status: 'Active',
        parentId: ''
      });
    };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Organizational Chart" />

      <div >
      <div>
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
          }}>Organizational Chart</h1>
        
        </div>
        {/* Header Tabs and Search */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowDepartmentDropdown(!showDepartmentDropdown)}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {selectedDepartment}
                <ChevronDown size={16} />
              </button>
              {showDepartmentDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  zIndex: 10,
                  minWidth: '200px'
                }}>
                  {departments.map(dept => (
                    <div
                      key={dept}
                      onClick={() => {
                        setSelectedDepartment(dept);
                        setShowDepartmentDropdown(false);
                        handleDepartmentChange(dept, selectedUserId || undefined);
                      }}
                      style={{
                        padding: '10px 16px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        backgroundColor: selectedDepartment === dept ? '#f3f4f6' : 'white'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedDepartment === dept ? '#f3f4f6' : 'white'}
                    >
                      {dept}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                {selectedUserId ? (mainAppUsers?.find((u) => String(u.id) === selectedUserId)?.name ?? selectedUserId) : 'All Users'}
                <ChevronDown size={16} />
              </button>
              {showUserDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '4px',
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    zIndex: 10,
                    minWidth: '200px',
                    maxHeight: '280px',
                    overflowY: 'auto',
                  }}
                >
                  <div
                    onClick={() => {
                      setSelectedUserId('');
                      setShowUserDropdown(false);
                      handleUserChange('', selectedDepartment);
                    }}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      backgroundColor: !selectedUserId ? '#f3f4f6' : 'white',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = !selectedUserId ? '#f3f4f6' : 'white'}
                  >
                    All Users
                  </div>
                  {(mainAppUsers ?? []).map((u) => {
                    const uid = String(u.id);
                    const isSelected = selectedUserId === uid;
                    return (
                      <div
                        key={u.id}
                        onClick={() => {
                          setSelectedUserId(uid);
                          setShowUserDropdown(false);
                          handleUserChange(uid, selectedDepartment);
                        }}
                        style={{
                          padding: '10px 16px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          backgroundColor: isSelected ? '#f3f4f6' : 'white',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isSelected ? '#f3f4f6' : 'white'}
                      >
                        {u.name}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveTab('Org Chart')}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: activeTab === 'Org Chart' ? '#6366f1' : 'white',
                color: activeTab === 'Org Chart' ? 'white' : '#6b7280',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Organizational Chart
            </button>

            <button
              onClick={() => setActiveTab('My Team')}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: activeTab === 'My Team' ? '#6366f1' : 'white',
                color: activeTab === 'My Team' ? 'white' : '#6b7280',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              My Team
            </button>
          </div>

          <div style={{ position: 'relative', minWidth: '300px' }}>
            {/* <Search 
              size={18} 
              style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: '#9ca3af'
              }} 
            />
            <input
              type="text"
              placeholder="Search person..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 40px 10px 40px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: 'white'
              }}
            /> */}
            {/* <ChevronDown 
              size={18} 
              style={{ 
                position: 'absolute', 
                right: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: '#9ca3af'
              }} 
            /> */}
          </div>
        </div>

        {/* Alert Banner */}
        {/* <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          backgroundColor: '#fef3c7',
          borderRadius: '12px',
          marginBottom: '24px',
          border: '1px solid #fde68a'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#fbbf24',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertCircle size={24} color="white" />
            </div>
            <div>
              <div style={{ 
                fontSize: '15px', 
                fontWeight: '600', 
                color: '#92400e',
                marginBottom: '2px'
              }}>
                Coverage Risk: Too many key roles will be on leave next week
              </div>
              <div style={{ fontSize: '13px', color: '#92400e' }}>
                3 key employees (2 in critical roles) are scheduled to be on leave from Apr 30 to May 3.
              </div>
            </div>
          </div>
          <button
            style={{
              padding: '8px 16px',
              backgroundColor: 'white',
              border: '1px solid #fbbf24',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              color: '#92400e',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            View Details
            <ChevronRight size={14} />
          </button>
        </div> */}

        {activeTab === 'Org Chart' && (
          <>
            {/* Org Chart Header with Controls */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                
              </h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {/* Zoom Controls */}
                <div style={{ display: 'flex', gap: '4px', marginRight: '8px' }}>
                  <button
                    onClick={handleZoomOut}
                    style={{
                      padding: '8px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Zoom Out"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <div style={{
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    fontSize: '13px',
                    fontWeight: '500',
                    minWidth: '60px',
                    textAlign: 'center'
                  }}>
                    {zoomLevel}%
                  </div>
                  <button
                    onClick={handleZoomIn}
                    style={{
                      padding: '8px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Zoom In"
                  >
                    <ZoomIn size={16} />
                  </button>
                  <button
                    onClick={handleResetZoom}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    Reset
                  </button>
                </div>

                <button
                  onClick={toggleFullscreen}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  {isFullscreen ? 'Exit' : 'Fullscreen'}
                </button>
                <button
                  onClick={() => router.push('/staff-management/employees')}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: '#6366f1',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8b5cf6'}
                  title="Add New Employee"
                >
                  <Plus size={16} />
                  View Employee
                </button>
              </div>
            </div>

            {/* Org Chart Container */}
            <div 
              id="org-chart-container"
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '40px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb',
                minHeight: '600px',
                overflow: 'auto',
                position: 'relative'
              }}>
              {loadingOrgChart ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', color: '#6b7280' }}>
                  Loading chart...
                </div>
              ) : !orgData ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', color: '#6b7280' }}>
                  No organizational data available.
                </div>
              ) : (
              <div style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.3s ease',
                paddingBottom: '40px'
              }}>
                <Tree
                  lineWidth="2px"
                  lineColor="#d1d5db"
                  lineBorderRadius="10px"
                  label={renderNode(orgData)}
                >
                  {orgData.children?.map((child) => renderTree(child))}
                </Tree>
              </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'My Team' && (
          <>
            {/* My Team Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '24px',
              marginBottom: '24px',
              flexWrap: 'wrap'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                My Team
              </h2>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={18} color="#6b7280" />
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>{myTeam.length}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>{myTeam.filter((m) => m.status === 'On Leave').length}</span>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>On Leave Today</span>
                </div>
                {/* <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>0</span>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>Pending Approvals</span>
                </div> */}
              </div>
            </div>

            {/* Team Members Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '16px'
            }}>
              {myTeam.map(member => (
                <div
                  key={member.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'}
                >
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <User size={28} color="white" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h4 style={{ 
                        fontSize: '15px', 
                        fontWeight: '600', 
                        color: '#1f2937',
                        margin: 0
                      }}>
                        {member.name}
                      </h4>
                      <ExternalLink size={14} color="#9ca3af" style={{ cursor: 'pointer' }} />
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                      {member.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '500'
                      }}>
                        <Calendar size={12} color="#92400e" />
                        {member.status}
                      </span>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        fontSize: '12px',
                        color: '#6b7280'
                      }}>
                        <Calendar size={12} />
                        {member.leaveDates}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

     

      {/* Employee Detail Sidebar */}
      {showEmployeeSidebar && selectedEmployee && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
          onClick={() => {
            setShowEmployeeSidebar(false);
            setSelectedEmployee(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              zIndex: 1000
            }}
          >
            <OrgEmployeeSidebar
              employee={selectedEmployee}
              allEmployees={orgData ?? { id: 'root', name: '', title: '', department: '', avatar: '', status: 'Active', children: [] }}
              rawProfile={selectedEmployee ? rawProfileById[selectedEmployee.id] : undefined}
              users={mainAppUsers}
              onRefresh={refetchOrgChart}
              userProfilesMinified={userProfilesMinified}
              onClose={() => {
                setShowEmployeeSidebar(false);
                setSelectedEmployee(null);
              }}
            />
          </div>
        </div>
      )}
    </div>

    </React.Fragment>
  );
};

OrganizationalChart.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default OrganizationalChart;
