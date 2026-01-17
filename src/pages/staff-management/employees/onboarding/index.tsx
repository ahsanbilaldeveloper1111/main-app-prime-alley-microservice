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

import  { useState, useMemo } from 'react';
import { 
  Search, 
  ChevronDown, 
  FileText, 
  User,
  Settings,
  Info,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronRightIcon
} from 'lucide-react';
import OnboardingDetailSidebar from './sidebar';

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


const EmployeesOnboarding = () => {
    const [activeTab, setActiveTab] = useState<'Onboarding' | 'Audit & Risk Center'>('Onboarding');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedEmployee, setSelectedEmployee] = useState<OnboardingEmployee | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
    const employees: OnboardingEmployee[] = [
      {
        id: '1',
        name: 'Anum Malik',
        avatar: '',
        startDate: 'Apr 24, 2024',
        stages: ['document', 'profile', 'settings'],
        progress: 25,
        status: 'In Progress',
        role: 'Junior Developer',
        department: 'Engineering'
      },
      {
        id: '2',
        name: 'Hassan Ali',
        avatar: '',
        startDate: 'Apr 22, 2024',
        stages: ['document', 'profile'],
        progress: 50,
        status: 'On Track',
        role: 'Senior Developer',
        department: 'Engineering'
      },
      {
        id: '3',
        name: 'Madiha Khan',
        avatar: '',
        startDate: 'Apr 15, 2024',
        stages: ['document', 'profile', 'info', 'settings'],
        progress: 75,
        status: 'Overdue',
        role: 'Product Manager',
        department: 'Product'
      },
      {
        id: '4',
        name: 'Hamza Ahmed',
        avatar: '',
        startDate: 'Apr 10, 2024',
        stages: ['document', 'profile', 'check'],
        progress: 100,
        status: 'Completed',
        role: 'UI/UX Designer',
        department: 'Design'
      }
    ];
  
    const itemsPerPage = 10;
  
    const filteredEmployees = useMemo(() => {
      return employees.filter(emp => {
        const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             emp.startDate.includes(searchTerm);
        return matchesSearch;
      });
    }, [searchTerm, employees]);
  
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
    const paginatedEmployees = filteredEmployees.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  
    const getStageIcon = (stage: string) => {
      switch (stage) {
        case 'document':
          return <FileText size={16} color="#8b5cf6" />;
        case 'profile':
          return <User size={16} color="#8b5cf6" />;
        case 'settings':
          return <Settings size={16} color="#8b5cf6" />;
        case 'info':
          return <Info size={16} color="#ec4899" />;
        case 'check':
          return <CheckCircle size={16} color="#8b5cf6" />;
        default:
          return <FileText size={16} color="#8b5cf6" />;
      }
    };
  
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'In Progress':
          return { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af' };
        case 'On Track':
          return { bg: '#fef3c7', color: '#92400e', dot: '#fbbf24' };
        case 'Overdue':
          return { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' };
        case 'Completed':
          return { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af' };
        default:
          return { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af' };
      }
    };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Employees Onboarding" />
      <div >
        
        <div >
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
            }}>Employees Onboarding</h1>
          
          </div>
          {/* Tabs */}
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            marginBottom: '24px',
            borderBottom: '2px solid #e5e7eb',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['Onboarding', 'Audit & Risk Center'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '12px 24px',
                    background: activeTab === tab ? '#6366f1' : '#e5e7eb',
                    color: activeTab === tab ? 'white' : '#6b7280',
                    border: 'none',
                    borderRadius: '8px 8px 0 0',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
  
            {/* Search Bar */}
            <div style={{ position: 'relative', width: '350px', marginBottom: '-2px' }}>
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
                placeholder="Search employees, documents, au..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 48px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: 'white',
                }}
              />
              <ChevronDown 
                size={16} 
                style={{ 
                  position: 'absolute', 
                  right: '16px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#9ca3af'
                }} 
              />
            </div>
          </div>
  
          {/* Onboarding Table */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>New Hire</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Start Date</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Stages</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Progress</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Status</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>View</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEmployees.map((employee, index) => {
                    const statusColors = getStatusColor(employee.status);
                    return (
                      <tr 
                        key={employee.id}
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setIsSidebarOpen(true);
                        }}
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
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#1f2937' }}>
                          {employee.startDate}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {employee.stages.map((stage, idx) => (
                              <div
                                key={idx}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  backgroundColor: '#f3e8ff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                {getStageIcon(stage)}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ 
                              flex: 1, 
                              height: '8px', 
                              backgroundColor: '#e5e7eb', 
                              borderRadius: '4px',
                              overflow: 'hidden',
                              maxWidth: '120px'
                            }}>
                              <div style={{
                                width: `${employee.progress}%`,
                                height: '100%',
                                backgroundColor: '#8b5cf6',
                                borderRadius: '4px',
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', minWidth: '40px' }}>
                              {employee.progress}%
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 12px',
                            backgroundColor: statusColors.bg,
                            borderRadius: '16px'
                          }}>
                            <span style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: statusColors.dot
                            }} />
                            <span style={{ 
                              fontSize: '13px', 
                              fontWeight: '500', 
                              color: statusColors.color 
                            }}>
                              {employee.status}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEmployee(employee);
                              setIsSidebarOpen(true);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 12px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '500',
                              color: '#6b7280',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f3f4f6';
                              e.currentTarget.style.color = '#1f2937';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#6b7280';
                            }}
                          >
                            View
                            <ChevronRight size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
  
            {/* Footer */}
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
                Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of 21 documents
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
                          backgroundColor: currentPage === pageNum ? '#8b5cf6' : 'white',
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
        </div>
  
        {/* Sidebar Overlay */}
        {isSidebarOpen && selectedEmployee && (
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
              setIsSidebarOpen(false);
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
              <OnboardingDetailSidebar
                employee={selectedEmployee}
                onClose={() => {
                  setIsSidebarOpen(false);
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

EmployeesOnboarding.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default EmployeesOnboarding;
