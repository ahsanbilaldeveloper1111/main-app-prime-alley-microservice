import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import EmployeeDetailSidebar from '@components/employee-sidebar';

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

import  { useState, useMemo } from 'react';
import { Search, ChevronDown, Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileText, X, Phone, Mail, Calendar, Video, List, Grid, Pin, AlertTriangle, User, MoreVertical, MapPin, Clock, Briefcase, DollarSign, TrendingUp, Shield, Award, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Employee {
  id: string;
  name: string;
  cnicId: string;
  title: string;
  department: string;
  manager: string;
  location: string;
  status: 'Active' | 'Inactive';
  lastUpdated: string;
  avatar: string;
  departmentTag?: string;
}

interface Document {
  id: string;
  name: string;
  uploadedBy: string;
  uploadedDate: string;
  tags: string[];
  role?: string;
  location?: string;
}

const Employees = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedManager, setSelectedManager] = useState('');
    const [selectedEmploymentType, setSelectedEmploymentType] = useState('');
    const [selectedContract, setSelectedContract] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [activeTab, setActiveTab] = useState('Personal');
  
    const toggleDropdown = (dropdown: string) => {
      setOpenDropdown(openDropdown === dropdown ? null : dropdown);
    };
  
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };
  
    const handleEmployeeClick = (employee: Employee) => {
      setSelectedEmployee(employee);
    };
  
    const closeSidebar = () => {
      setSelectedEmployee(null);
      setActiveTab('Personal');
    };
  
    const employees: Employee[] = [
      {
        id: '1',
        name: 'Zohaib Rehman',
        cnicId: '42001-5884853',
        title: 'Marketing',
        department: 'Marketing',
        manager: 'Hassan Mir',
        location: 'Toronto',
        status: 'Active',
        lastUpdated: '5 days ago',
        avatar: '',
        departmentTag: 'Hassan'
      },
      {
        id: '2',
        name: 'Farah Ahmed',
        cnicId: '4299-689-853',
        title: 'Marketing',
        department: 'Marketing',
        manager: 'Hassan Mir',
        location: 'Toronto',
        status: 'Active',
        lastUpdated: '5 days ago',
        avatar: '',
        departmentTag: 'Hassan'
      },
      {
        id: '3',
        name: 'Sarah Malik',
        cnicId: '476-980-3859',
        title: 'HR',
        department: 'HR',
        manager: 'Hassan Mir',
        location: 'Toronto',
        status: 'Active',
        lastUpdated: '6 days ago',
        avatar: '',
        departmentTag: 'Generalist'
      },
      {
        id: '4',
        name: 'Hamza Zahid',
        cnicId: '825-866-9767',
        title: 'Sales',
        department: 'Sales',
        manager: 'Apr 15 ago',
        location: 'Toronto',
        status: 'Active',
        lastUpdated: '5 days ago',
        avatar: '',
        departmentTag: 'Finance'
      }
    ];
  
    const documents: Document[] = [
      {
        id: '1',
        name: 'Data Protection Policy',
        uploadedBy: 'HR Admin',
        uploadedDate: '2 days ago',
        tags: ['Role-Based']
      },
      {
        id: '2',
        name: 'Employment Contract Template',
        uploadedBy: 'HR Admin',
        uploadedDate: 'Fully ago',
        tags: ['Role-Based'],
        role: 'HR Admin'
      },
      {
        id: '3',
        name: 'Remote Work Agreement',
        uploadedBy: 'France',
        uploadedDate: 'Recently',
        tags: ['Role-Based'],
        location: 'France'
      }
    ];
  
    const departmentData = [
      { name: 'Engineering', count: 18, color: '#6366f1' },
      { name: 'Marketing', count: 12, color: '#10b981' },
      { name: 'Sales', count: 9, color: '#f59e0b' },
      { name: 'HR', count: 7, color: '#ec4899' },
      { name: 'Finance', count: 6, color: '#8b5cf6' }
    ];
  
    const itemsPerPage = 10;
  
    const filteredEmployees = useMemo(() => {
      return employees.filter(emp => {
        const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             emp.cnicId.includes(searchTerm) ||
                             emp.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDepartment = !selectedDepartment || emp.department === selectedDepartment;
        const matchesLocation = !selectedLocation || emp.location === selectedLocation;
        const matchesStatus = !selectedStatus || emp.status === selectedStatus;
        const matchesManager = !selectedManager || emp.manager === selectedManager;
        
        return matchesSearch && matchesDepartment && matchesLocation && matchesStatus && matchesManager;
      });
    }, [searchTerm, selectedDepartment, selectedLocation, selectedStatus, selectedManager, employees]);
  
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
    const paginatedEmployees = filteredEmployees.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  
    const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance'];
    const locations = ['Toronto', 'New York', 'London', 'Paris'];
    const statuses = ['Active', 'Inactive'];
    const managers = ['Hassan Mir', 'Apr 15 ago'];
  
    const handleExport = () => {
      console.log('Exporting data...');
      alert('Export functionality triggered');
    };
  
    const handleApply = () => {
      console.log('Applying filters...');
      alert('Filters applied successfully');
    };
  
    const resetFilters = () => {
      setSelectedDepartment('');
      setSelectedLocation('');
      setSelectedStatus('');
      setSelectedManager('');
      setSelectedEmploymentType('');
      setSelectedContract('');
      setSearchTerm('');
      setCurrentPage(1);
    };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Employees" />


      <div 
      onClick={handleClickOutside}
      style={{ 
        
        backgroundColor: '#F9FAFB',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        overflow: selectedEmployee ? 'hidden' : 'auto',
        
      }}>
      <div >
        {/* Header */}
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
          }}>Employees</h1>
        
        </div>

        {/* Search Bar & Filters */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '12px', 
          marginBottom: '24px',
          alignItems: 'center'
        }}>
          {/* Search Bar */}
          <div style={{ position: 'relative', flex: '1 1 300px', minWidth: '250px' }}>
            <Search 
              size={20} 
              style={{ 
                position: 'absolute', 
                left: '16px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: '#9ca3af'
              }} 
            />
            <input
              type="text"
              placeholder="Search name, ID, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px 10px 48px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: 'white',
              }}
            />
          </div>

          {/* Department Filter */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleDropdown('department');
              }}
              style={{
                padding: '10px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <span>📋</span>
              <span>Department</span>
              <ChevronDown size={16} />
            </button>
            {openDropdown === 'department' && (
              <div onClick={(e) => e.stopPropagation()} style={{
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
                      setOpenDropdown(null);
                    }}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
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

          {/* Location Filter */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleDropdown('location');
              }}
              style={{
                padding: '10px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <span>📍</span>
              <span>Location</span>
              <ChevronDown size={16} />
            </button>
            {openDropdown === 'location' && (
              <div onClick={(e) => e.stopPropagation()} style={{
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
                {locations.map(loc => (
                  <div
                    key={loc}
                    onClick={() => {
                      setSelectedLocation(loc);
                      setOpenDropdown(null);
                    }}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      backgroundColor: selectedLocation === loc ? '#f3f4f6' : 'white'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedLocation === loc ? '#f3f4f6' : 'white'}
                  >
                    {loc}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleDropdown('status');
              }}
              style={{
                padding: '10px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <span>Status</span>
              <ChevronDown size={16} />
            </button>
            {openDropdown === 'status' && (
              <div onClick={(e) => e.stopPropagation()} style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                zIndex: 10,
                minWidth: '150px'
              }}>
                {statuses.map(status => (
                  <div
                    key={status}
                    onClick={() => {
                      setSelectedStatus(status);
                      setOpenDropdown(null);
                    }}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      backgroundColor: selectedStatus === status ? '#f3f4f6' : 'white'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedStatus === status ? '#f3f4f6' : 'white'}
                  >
                    {status}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manager Filter */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleDropdown('manager');
              }}
              style={{
                padding: '10px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <span>Manager</span>
              <ChevronDown size={16} />
            </button>
            {openDropdown === 'manager' && (
              <div onClick={(e) => e.stopPropagation()} style={{
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
                {managers.map(mgr => (
                  <div
                    key={mgr}
                    onClick={() => {
                      setSelectedManager(mgr);
                      setOpenDropdown(null);
                    }}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      backgroundColor: selectedManager === mgr ? '#f3f4f6' : 'white'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedManager === mgr ? '#f3f4f6' : 'white'}
                  >
                    {mgr}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Full-Time Filter */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleDropdown('employment');
              }}
              style={{
                padding: '10px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <span>Full-Time</span>
              <ChevronDown size={16} />
            </button>
            {openDropdown === 'employment' && (
              <div onClick={(e) => e.stopPropagation()} style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                zIndex: 10,
                minWidth: '150px'
              }}>
                {['Full-Time', 'Part-Time', 'Contract'].map(type => (
                  <div
                    key={type}
                    onClick={() => {
                      setSelectedEmploymentType(type);
                      setOpenDropdown(null);
                    }}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      backgroundColor: selectedEmploymentType === type ? '#f3f4f6' : 'white'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedEmploymentType === type ? '#f3f4f6' : 'white'}
                  >
                    {type}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contract Filter */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleDropdown('contract');
              }}
              style={{
                padding: '10px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <span>Contract</span>
              <ChevronDown size={16} />
            </button>
            {openDropdown === 'contract' && (
              <div onClick={(e) => e.stopPropagation()} style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                zIndex: 10,
                minWidth: '150px'
              }}>
                {['Permanent', 'Temporary', 'Freelance'].map(type => (
                  <div
                    key={type}
                    onClick={() => {
                      setSelectedContract(type);
                      setOpenDropdown(null);
                    }}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      backgroundColor: selectedContract === type ? '#f3f4f6' : 'white'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedContract === type ? '#f3f4f6' : 'white'}
                  >
                    {type}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
            <button
              onClick={handleExport}
              style={{
                padding: '10px 20px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <Download size={16} />
              <span>Export</span>
            </button>
            <button
              onClick={handleApply}
              style={{
                padding: '10px 32px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: '#6366f1',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Apply
            </button>
          </div>
        </div>

        {/* Active Filters */}
        {(selectedDepartment || selectedLocation || selectedStatus || selectedManager) && (
          <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Active filters:</span>
            {selectedDepartment && (
              <span style={{
                padding: '4px 12px',
                backgroundColor: '#e0e7ff',
                borderRadius: '16px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                {selectedDepartment}
                <button
                  onClick={() => setSelectedDepartment('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '16px' }}
                >
                  ×
                </button>
              </span>
            )}
            {selectedLocation && (
              <span style={{
                padding: '4px 12px',
                backgroundColor: '#e0e7ff',
                borderRadius: '16px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                {selectedLocation}
                <button
                  onClick={() => setSelectedLocation('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '16px' }}
                >
                  ×
                </button>
              </span>
            )}
            {selectedStatus && (
              <span style={{
                padding: '4px 12px',
                backgroundColor: '#e0e7ff',
                borderRadius: '16px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                {selectedStatus}
                <button
                  onClick={() => setSelectedStatus('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '16px' }}
                >
                  ×
                </button>
              </span>
            )}
            {selectedManager && (
              <span style={{
                padding: '4px 12px',
                backgroundColor: '#e0e7ff',
                borderRadius: '16px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                {selectedManager}
                <button
                  onClick={() => setSelectedManager('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '16px' }}
                >
                  ×
                </button>
              </span>
            )}
            <button
              onClick={resetFilters}
              style={{
                background: 'none',
                border: 'none',
                color: '#6366f1',
                cursor: 'pointer',
                fontSize: '13px',
                textDecoration: 'underline'
              }}
            >
              Clear all
            </button>
          </div>
        )}

        {/* Employee Table */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '12px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          marginBottom: '24px'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Employee</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>CNIC/ID</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Title</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Dept</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Manager</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Location</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Status</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEmployees.map((employee, index) => (
                  <tr 
                    key={employee.id} 
                    onClick={() => handleEmployeeClick(employee)}
                    style={{ 
                      borderBottom: index < paginatedEmployees.length - 1 ? '1px solid #f3f4f6' : 'none',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: '#e0e7ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px'
                        }}>
                          {employee.avatar}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                            {employee.name}
                          </div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#6b7280',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginTop: '2px'
                          }}>
                            <span style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#10b981',
                              display: 'inline-block'
                            }}></span>
                            Active
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '14px', color: '#1f2937' }}>{employee.cnicId}</div>
                      {employee.departmentTag && (
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#6b7280',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginTop: '2px'
                        }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: '#9ca3af',
                            display: 'inline-block'
                          }}></span>
                          {employee.departmentTag}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#1f2937' }}>{employee.title}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#1f2937' }}>{employee.department}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#1f2937' }}>{employee.manager}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#1f2937' }}>{employee.location}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: '#d1fae5',
                        color: '#065f46',
                        borderRadius: '16px',
                        fontSize: '13px',
                        fontWeight: '500',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: '#10b981'
                        }}></span>
                        {employee.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>{employee.lastUpdated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ 
            padding: '16px 24px', 
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} policies
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  backgroundColor: currentPage === 1 ? '#f9fafb' : 'white',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1
                }}
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  backgroundColor: currentPage === 1 ? '#f9fafb' : 'white',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1
                }}
              >
                <ChevronLeft size={16} />
              </button>
              
              {[...Array(totalPages)].map((_, idx) => {
                const pageNum = idx + 1;
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      style={{
                        padding: '8px 14px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        backgroundColor: currentPage === pageNum ? '#6366f1' : 'white',
                        color: currentPage === pageNum ? 'white' : '#1f2937',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: currentPage === pageNum ? '600' : '400'
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return <span key={pageNum} style={{ padding: '8px 4px', color: '#6b7280' }}>...</span>;
                }
                return null;
              })}

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  backgroundColor: currentPage === totalPages ? '#f9fafb' : 'white',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1
                }}
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  backgroundColor: currentPage === totalPages ? '#f9fafb' : 'white',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1
                }}
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Two Column Layout for Charts and Documents */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '24px',
          marginTop: '24px'
        }}>
          {/* Department Headcount Chart */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Department Headcount
              </h2>
              <button
                onClick={() => console.log('Export chart')}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                <Download size={14} />
                Export
              </button>
            </div>

            {/* Legend */}
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              marginBottom: '20px',
              flexWrap: 'wrap'
            }}>
              {departmentData.map(dept => (
                <div key={dept.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: dept.color
                  }}></div>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>{dept.name}</span>
                </div>
              ))}
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  radius={[8, 8, 0, 0]}
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Additional Info */}
            {/* <div style={{ 
              marginTop: '20px', 
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                backgroundColor: '#6366f1',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                18
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#1f2937' }}>Engineering</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Money12K</div>
              </div>
            </div> */}
          </div>

          {/* Recently Uploaded Docs */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '20px' }}>
              Recently Uploaded Docs
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {documents.map(doc => (
                <div 
                  key={doc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #f3f4f6',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = '#f3f4f6';
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    backgroundColor: '#dbeafe',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <FileText size={18} color="#3b82f6" />
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#1f2937',
                      marginBottom: '4px'
                    }}>
                      {doc.name}
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}>
                      {doc.tags.map((tag, idx) => (
                        <span 
                          key={idx}
                          style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            backgroundColor: '#f3f4f6',
                            color: '#6b7280',
                            borderRadius: '12px'
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                      {doc.role && (
                        <span style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          backgroundColor: '#fef3c7',
                          color: '#92400e',
                          borderRadius: '12px',
                          fontWeight: '500'
                        }}>
                          Role-Based
                        </span>
                      )}
                      {doc.location && (
                        <span style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          backgroundColor: '#fef3c7',
                          color: '#92400e',
                          borderRadius: '12px',
                          fontWeight: '500'
                        }}>
                          Role-Based
                        </span>
                      )}
                      {doc.role && (
                        <span style={{
                          fontSize: '11px',
                          color: '#9ca3af'
                        }}>
                          {doc.role}
                        </span>
                      )}
                      {doc.location && (
                        <span style={{
                          fontSize: '11px',
                          color: '#9ca3af'
                        }}>
                          {doc.location} →
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ 
                    fontSize: '12px', 
                    color: '#9ca3af',
                    whiteSpace: 'nowrap',
                    textAlign: 'right'
                  }}>
                    {doc.uploadedDate}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

       {/* Employee Detail Sidebar */}
       {selectedEmployee && (
        <div
          onClick={closeSidebar}
          style={{
            position: 'fixed',
            top: '80px',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <EmployeeDetailSidebar />
          </div>
        </div>
      )}
    </div>
    

    </React.Fragment>
  );
};

Employees.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default Employees;
