import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useEffect, useState, useMemo } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import { useSession } from "next-auth/react";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";

import { getJourneys } from "@utils/staffManagement";
import { useMainAppLookups } from "@hooks/useMainAppLookups";
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
} from "lucide-react";
import OnboardingDetailSidebar from "./sidebar";

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
  total_steps_count?: string | number;
  completed_steps_count?: string | number;
}


/** API journey item shape (matches API response) */
interface JourneyRecord {
  id?: number;
  user_profile_id?: string | number;
  user_id?: string | number;
  job_title?: string;
  department_name?: string;
  start_date?: string;
  status?: string;
  total_steps_count?: string | number;
  completed_steps_count?: string | number;
  steps?: { name?: string; [key: string]: unknown }[];
  user_profile?: { id?: number; user_id?: string; job_title?: string; [key: string]: unknown };
  [key: string]: unknown;
}

/** API pagination shape */
interface JourneysPagination {
  total?: number;
  limit?: number;
  page?: number;
  last_page?: number;
  from?: number;
  to?: number;
}

const STATUS_DISPLAY: Record<string, "In Progress" | "On Track" | "Overdue" | "Completed"> = {
  in_progress: "In Progress",
  on_track: "On Track",
  overdue: "Overdue",
  completed: "Completed",
};

const EmployeesOnboarding = () => {
  const { data: session } = useSession();
  const { mainAppDepartments, mainAppUsers, companyIdentifier } = useMainAppLookups();
  const [activeTab, setActiveTab] = useState<"Onboarding" | "Audit & Risk Center">("Onboarding");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState<OnboardingEmployee | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const itemsPerPage = 15;
  const [journeysData, setJourneysData] = useState<JourneyRecord[]>([]);
  const [journeysPagination, setJourneysPagination] = useState<JourneysPagination | null>(null);
  const [loadingJourneys, setLoadingJourneys] = useState(true);
  const [refreshJourneysKey, setRefreshJourneysKey] = useState(0);

  useEffect(() => {
    if (!companyIdentifier) {
      setLoadingJourneys(false);
      return;
    }
    const fetchJourneys = async () => {
      setLoadingJourneys(true);
      try {
        const journeysResult = await getJourneys({ page: currentPage, limit: itemsPerPage });
        console.log("[Onboarding] getJourneys response (page " + currentPage + "):", journeysResult);
        const data = Array.isArray(journeysResult?.data) ? (journeysResult.data as JourneyRecord[]) : [];
        setJourneysData(data);
        setJourneysPagination((journeysResult?.pagination as JourneysPagination) ?? null);
      } catch (e) {
        console.error("[Onboarding] fetch journeys error:", e);
        setJourneysData([]);
        setJourneysPagination(null);
      } finally {
        setLoadingJourneys(false);
      }
    };
    fetchJourneys();
  }, [companyIdentifier, currentPage, refreshJourneysKey]);

  const employees: OnboardingEmployee[] = useMemo(() => {
    return journeysData.map((j) => {
      const userId = j.user_id != null ? String(j.user_id) : "";
      const name = mainAppUsers.find((u) => String(u.id) === userId)?.name ?? (userId || "—");
      const statusKey = (j.status ?? "in_progress").toLowerCase().replace(/\s/g, "_");
      const status: OnboardingEmployee["status"] =
        STATUS_DISPLAY[statusKey] ?? "In Progress";
      const totalSteps = Math.max(1, Number(j.total_steps_count ?? 0));
      const completedSteps = Number(j.completed_steps_count ?? 0);
      const progress = Math.round((completedSteps / totalSteps) * 100);
      const steps = Array.isArray(j.steps) ? j.steps : [];
      const stepNames = steps.length
        ? steps.map((s) => (s.name ?? "document").toLowerCase())
        : ["document", "profile"];
      const startDateFormatted = j.start_date
        ? new Date(j.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "—";
      return {
        id: String(j.id ?? j.user_profile_id ?? (userId || "unknown")),
        name,
        avatar: "",
        startDate: startDateFormatted,
        stages: stepNames,
        progress,
        status,
        role: j.job_title ?? j.user_profile?.job_title ?? undefined,
        department: j.department_name ?? undefined,
        total_steps_count: j.total_steps_count,
        completed_steps_count: j.completed_steps_count,
      };
    });
  }, [journeysData, mainAppUsers]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.startDate.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [searchTerm, employees]);

  const totalPages = Math.max(1, journeysPagination?.last_page ?? 1);
  const paginatedEmployees = filteredEmployees;
  const paginationFrom = journeysPagination?.from ?? 0;
  const paginationTo = journeysPagination?.to ?? 0;
  const paginationTotal = journeysPagination?.total ?? 0;
  
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
            // marginBottom: '24px',
            // borderBottom: '2px solid #e5e7eb',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            {/* <div style={{ display: 'flex', gap: '8px' }}>
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
            </div> */}
  
            {/* Search Bar */}
            {/* <div style={{ position: 'relative', width: '350px', marginBottom: '-2px' }}>
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
            </div> */}
          </div>
  
          {/* Onboarding Table */}
          <div style={{
            backgroundColor: "white",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            overflow: "hidden",
          }}>
            {loadingJourneys ? (
              <div style={{ padding: "24px", textAlign: "center", color: "#6b7280" }}>
                Loading onboarding data…
              </div>
            ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Employee Name</th>
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
                            {employee?.completed_steps_count ?? 0}/{employee?.total_steps_count ?? 0}
                            {/* {employee.stages.map((stage, idx) => (
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
                            ))} */}
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
            )}

            {/* Footer */}
            <div style={{
              padding: "16px 24px",
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}>
              <div style={{ fontSize: "14px", color: "#6b7280" }}>
                Showing {paginationFrom}-{paginationTo} of {paginationTotal} documents
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
                onRefreshJourneys={() => setRefreshJourneysKey((k) => k + 1)}
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
