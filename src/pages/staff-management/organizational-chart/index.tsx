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

import { useState } from 'react';
import dynamic from 'next/dynamic';
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

// Dynamically import react-organizational-chart to avoid SSR issues
const Tree = dynamic(
    () => import('react-organizational-chart').then((mod) => mod.Tree),
    { ssr: false }
  );
  const TreeNode = dynamic(
    () => import('react-organizational-chart').then((mod) => mod.TreeNode),
    { ssr: false }
  );
  
  interface Employee {
    id: string;
    name: string;
    title: string;
    department: string;
    avatar: string;
    status?: 'On Leave' | 'Active';
    children?: Employee[];
  }
  
  interface TeamMember {
    id: string;
    name: string;
    title: string;
    avatar: string;
    status: 'On Leave' | 'Active';
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
    const [activeTab, setActiveTab] = useState<'All Department' | 'Org Chart' | 'My Team'>('Org Chart');
    const [searchTerm, setSearchTerm] = useState('');
    const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState('All Department');
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
  
    const departments = ['All Department', 'Engineering', 'Marketing', 'HR', 'Analytics', 'Sales'];
  
    // Hierarchical data structure for the org chart (now as state)
    const [orgData, setOrgData] = useState<Employee>({
      id: '1',
      name: 'Hassan Ali',
      title: 'CEO',
      department: 'Executive',
      avatar: '',
      status: 'Active',
      children: [
        {
          id: '2',
          name: 'Farah Ahmed',
          title: 'Marketing',
          department: 'Marketing',
          avatar: '',
          status: 'Active',
          children: [
            {
              id: '5',
              name: 'Zohaib Rehman',
              title: 'Marketing Lead',
              department: 'Marketing',
              avatar: '',
              status: 'On Leave'
            }
          ]
        },
        {
          id: '3',
          name: 'Sarah Malik',
          title: 'HR Specialist',
          department: 'HR',
          avatar: '',
          status: 'Active'
        },
        {
          id: '4',
          name: 'Hassan Mir',
          title: 'Analytics',
          department: 'Analytics',
          avatar: '',
          status: 'Active',
          children: [
            {
              id: '7',
              name: 'Saira Khan',
              title: 'Data Analyst',
              department: 'Analytics',
              avatar: '',
              status: 'On Leave'
            },
            {
              id: '8',
              name: 'Sarah Ahmed',
              title: 'Business Analyst',
              department: 'Analytics',
              avatar: '',
              status: 'On Leave'
            },
            {
              id: '9',
              name: 'Faisal Ansari',
              title: 'Data Scientist',
              department: 'Analytics',
              avatar: '',
              status: 'On Leave'
            }
          ]
        }
      ]
    });
  
    const myTeam: TeamMember[] = [
      {
        id: '1',
        name: 'Ali Nawaz',
        title: 'Data Analyst',
        avatar: '',
        status: 'On Leave',
        leaveDates: 'Mon - Wed'
      },
      {
        id: '2',
        name: 'Saira Khan',
        title: 'Business Analyst',
        avatar: '',
        status: 'On Leave',
        leaveDates: 'Mon - Wed'
      },
      {
        id: '3',
        name: 'Faisal Ansari',
        title: 'Data Scientist',
        avatar: '',
        status: 'On Leave',
        leaveDates: 'Mon - Fri'
      }
    ];
  
    // Render org chart node
    const renderNode = (employee: Employee) => {
      return (
        <div
          onClick={() => {
            console.log('Clicked:', employee.name);
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
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
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
          {employee.status === 'Active' && employee.id !== '1' && (
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
            <Search 
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
            />
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
        <div style={{
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
        </div>

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
                  onClick={handleAddEmployee}
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
                  Add Employee
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
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>8</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>3</span>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>On Leave Today</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>3</span>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>Pending Approvals</span>
                </div>
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

      {/* Add Employee Modal */}
      {showAddDialog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowAddDialog(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', margin: '0 0 8px 0' }}>
                Add New Employee
              </h2>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                Fill in the details to add a new employee to the organizational chart
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Employee Name */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Employee Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  placeholder="Enter employee name"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Job Title */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Job Title <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={newEmployee.title}
                  onChange={(e) => setNewEmployee({ ...newEmployee, title: e.target.value })}
                  placeholder="Enter job title"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Department */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Department <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={newEmployee.department}
                  onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                >
                  <option value="">Select a department</option>
                  {departments.filter(d => d !== 'All Department').map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Reports To (Parent) */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Reports To <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={newEmployee.parentId}
                  onChange={(e) => setNewEmployee({ ...newEmployee, parentId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                >
                  <option value="">Select reporting manager</option>
                  {getAllEmployees(orgData).map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} - {emp.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Status
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      value="Active"
                      checked={newEmployee.status === 'Active'}
                      onChange={(e) => setNewEmployee({ ...newEmployee, status: 'Active' })}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '14px', color: '#374151' }}>Active</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      value="On Leave"
                      checked={newEmployee.status === 'On Leave'}
                      onChange={(e) => setNewEmployee({ ...newEmployee, status: 'On Leave' })}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '14px', color: '#374151' }}>On Leave</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '32px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddDialog(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'white',
                  color: '#6b7280',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitEmployee}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8b5cf6'}
              >
                Add Employee
              </button>
            </div>
          </div>
        </div>
      )}

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
              allEmployees={orgData}
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
