import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import EmployeeDetailSidebar from "@components/employee-sidebar";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import AddEmployeeModal from "@pages/staff-management/AddEmployeeModal";
import EditEmployeeModal from "@pages/staff-management/EditEmployeeModal";
import {
  getUserProfiles,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  getEmployeeDashboardCounters,
  getLocations,
  getEmployeeDashboardGraphDepartmentHeadcount,
  createJourney,
  type UserProfile,
  type UserProfileAddress,
  type UserProfilePayload,
  type Location,
} from "@utils/staffManagement";
import { useMainAppLookups } from "@hooks/useMainAppLookups";
import { toast } from "react-toastify";
import { Button, Form, Modal } from "react-bootstrap";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

import { Search, ChevronDown, Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileText, Plus, Pencil, Trash2, User, Calendar } from "lucide-react";
import moment from "moment";
import { GlobalDateTimeFormat } from "@utils/Helper";
import Select, { SingleValue } from "react-select";

const EMPLOYMENT_TYPES = ["Full-Time", "Part-Time", "Contract", "Internship", "Freelance", "Temporary"];
const CONTRACT_TYPES = ["Permanent", "Temporary", "Freelance", "Fixed-term", "Probation"];

/** Dashboard counters API response shape */
interface EmployeeDashboardCountersData {
  employees?: { total?: number; active?: number; inactive?: number };
  approvals?: {
    pending?: number;
    aging?: { "0_3_days"?: number; "4_7_days"?: number; "8_plus_days"?: number };
    avg_aging?: number;
    pending_leave?: number;
    pending_other?: number;
  };
  leave?: { on_leave_today?: number; upcoming_7_days?: number };
  journey?: { total?: number; in_progress?: number; on_track?: number; overdue?: number; completed?: number };
  attendance?: {
    today?: { with_record?: number; checked_in?: number; checked_out?: number; no_record_estimate?: number };
  };
  compliance_alerts?: { high?: number; medium?: number; low?: number; total?: number };
}
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useSession } from "next-auth/react";
import { Country, State, City } from "country-state-city";

interface Document {
  id: string;
  name: string;
  uploadedBy: string;
  uploadedDate: string;
  tags: string[];
  role?: string;
  location?: string;
}

interface MainAppDepartment {
  id: number;
  name?: string;
  [key: string]: unknown;
}

interface MainAppUser {
  id: string | number;
  user_id?: string;
  name?: string;
  email?: string;
  phone?: string;
  department_id?: number;
  [key: string]: unknown;
}

/** Address form row with country-state-city cascade fields */
type AddressFormItem = UserProfileAddress & { state?: string; countryCode?: string; stateCode?: string };

function displayProfileName(p: UserProfile): string {
  return String((p as UserProfile & { name?: string }).name ?? p.user_id ?? p.employee_code ?? p.id ?? "—");
}

const ITEMS_PER_PAGE = 15;

const E164_MAX_DIGITS = 15;

/** Format phone input to E.164: optional leading +, then digits only, max 15 digits */
function toE164Phone(value: string): string {
  const hasPlus = value.trimStart().startsWith("+");
  const digits = value.replace(/\D/g, "").slice(0, E164_MAX_DIGITS);
  const prefix = hasPlus ? "+" : "";
  return digits.length ? prefix + digits : prefix;
}

// Custom styles to match Bootstrap form control height and styling (same as UserProfileTab)
const selectStyles = {
  control: (provided: Record<string, unknown>, state: { isFocused?: boolean }) => ({
    ...provided,
    minHeight: "48px",
    height: "48px",
    fontSize: "0.875rem",
    borderColor: state.isFocused ? "#86b7fe" : "#dee2e6",
    boxShadow: state.isFocused ? "0 0 0 0.2rem rgba(13, 110, 253, 0.25)" : "none",
    borderRadius: "0.375rem",
    "&:hover": {
      borderColor: state.isFocused ? "#86b7fe" : "#DBE0E5",
    },
  }),
  valueContainer: (provided: Record<string, unknown>) => ({
    ...provided,
    height: "48px",
    padding: "0 8px",
  }),
  input: (provided: Record<string, unknown>) => ({
    ...provided,
    margin: "0px",
    padding: "0px",
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  indicatorsContainer: (provided: Record<string, unknown>) => ({
    ...provided,
    height: "48px",
  }),
  placeholder: (provided: Record<string, unknown>) => ({
    ...provided,
    color: "#6c757d",
    fontSize: "0.875rem",
  }),
  singleValue: (provided: Record<string, unknown>) => ({
    ...provided,
    fontSize: "0.875rem",
    lineHeight: "1.5",
  }),
  multiValue: (provided: Record<string, unknown>) => ({
    ...provided,
    backgroundColor: "#e7f1ff",
    borderRadius: "0.25rem",
  }),
  multiValueLabel: (provided: Record<string, unknown>) => ({
    ...provided,
    color: "#0d6efd",
    fontSize: "0.875rem",
    padding: "2px 6px",
  }),
  multiValueRemove: (provided: Record<string, unknown>) => ({
    ...provided,
    color: "#0d6efd",
    "&:hover": {
      backgroundColor: "#b6d4fe",
      color: "#0d6efd",
    },
  }),
};

/** Normalize hierarchy list item to string for display (handles both string and { name?, id? } shapes) */
function hierarchyLabel(item: unknown): string {
  if (item == null) return "—";
  if (typeof item === "string") return item;
  if (typeof item === "object" && item !== null) {
    const o = item as { name?: string; id?: string | number; [key: string]: unknown };
    return String(o.name ?? o.id ?? "—");
  }
  return String(item);
}

const Employees = () => {
  const { data: session } = useSession();
  const { mainAppDepartments, mainAppUsers, loadingDepartments, loadingUsers, companyIdentifier } = useMainAppLookups();


  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedManagerIds, setSelectedManagerIds] = useState<string[]>([]);
  const [selectedEmploymentType, setSelectedEmploymentType] = useState("");
  const [selectedContract, setSelectedContract] = useState("");
  /** Applied filter values (sent to API) – only updated when Apply is clicked */
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedDepartment, setAppliedDepartment] = useState("");
  const [appliedLocationId, setAppliedLocationId] = useState<number | null>(null);
  const [appliedStatus, setAppliedStatus] = useState("");
  const [appliedEmploymentType, setAppliedEmploymentType] = useState("");
  const [appliedContract, setAppliedContract] = useState("");
  const [appliedManagerIds, setAppliedManagerIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState("");
  const [statusSearchTerm, setStatusSearchTerm] = useState("");
  const [managerSearchTerm, setManagerSearchTerm] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState("Personal");

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; last_page: number } | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [showJourneyModal, setShowJourneyModal] = useState(false);
  const [journeyModalProfile, setJourneyModalProfile] = useState<UserProfile | null>(null);
  const [journeyForm, setJourneyForm] = useState<{ startDate: string; status: string }>({ startDate: "", status: "in_progress" });
  const [journeySubmitting, setJourneySubmitting] = useState(false);

  const [addressCountries, setAddressCountries] = useState<{ isoCode: string; name: string }[]>([]);

  useEffect(() => {
    try {
      setAddressCountries(Country.getAllCountries());
    } catch {
      setAddressCountries([]);
    }
  }, []);

  const DEPARTMENT_CHART_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316"];

  useEffect(() => {
    const fetchDepartmentHeadcount = async () => {
      try {
        const data = await getEmployeeDashboardGraphDepartmentHeadcount();
        console.log("[Employees] department headcount graph", data);
        const raw = Array.isArray(data) ? data : (data && typeof data === "object" && Array.isArray((data as { data?: unknown[] }).data) ? (data as { data: unknown[] }).data : []);
        const list = (raw as { name?: string; count?: number }[]).map((item, i) => ({
          name: String(item.name ?? "—"),
          count: Number(item.count ?? 0),
          color: DEPARTMENT_CHART_COLORS[i % DEPARTMENT_CHART_COLORS.length],
        }));
        setDepartmentHeadcountData(list);
      } catch (e) {
        console.error("[Employees] getEmployeeDashboardGraphDepartmentHeadcount error", e);
        setDepartmentHeadcountData([]);
      }
    };
    fetchDepartmentHeadcount();
  }, []);

  useEffect(() => {
    const fetchCounters = async () => {
      try {
        const data = await getEmployeeDashboardCounters();
        console.log("[Employees] dashboard counters", data);
        setDashboardCounters((data as EmployeeDashboardCountersData) ?? null);
      } catch (e) {
        console.error("[Employees] getEmployeeDashboardCounters error", e);
        setDashboardCounters(null);
      }
    };
    fetchCounters();
  }, []);

  const [locationsList, setLocationsList] = useState<Location[]>([]);
  const [filterLocations, setFilterLocations] = useState<Location[]>([]);
  const [loadingFilterLocations, setLoadingFilterLocations] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [departmentHeadcountData, setDepartmentHeadcountData] = useState<{ name: string; count: number; color: string }[]>([]);
  const [dashboardCounters, setDashboardCounters] = useState<EmployeeDashboardCountersData | null>(null);


  const loadProfiles = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: { page: number; limit: number; employment_type?: string; contract_type?: string; status?: string; location_id?: number; department?: string; search?: string; user_ids?: string[] } = {
        page,
        limit: ITEMS_PER_PAGE,
      };
      if (appliedEmploymentType?.trim()) params.employment_type = appliedEmploymentType.trim();
      if (appliedContract?.trim()) params.contract_type = appliedContract.trim();
      if (appliedStatus?.trim()) params.status = appliedStatus.trim().toLowerCase();
      if (appliedLocationId != null) params.location_id = appliedLocationId;
      if (appliedDepartment?.trim()) params.department = appliedDepartment.trim();
      if (appliedSearch?.trim()) params.search = appliedSearch.trim();
      if (appliedManagerIds.length > 0) params.user_ids = appliedManagerIds;
      const { data, pagination: p } = await getUserProfiles(params);
      setProfiles(data ?? []);
      if (p) setPagination({ page: p.page, limit: p.limit, total: p.total, last_page: p.last_page });
      else setPagination(null);
    } catch {
      setProfiles([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [appliedEmploymentType, appliedContract, appliedStatus, appliedLocationId, appliedDepartment, appliedSearch, appliedManagerIds]);

  useEffect(() => {
    loadProfiles(currentPage);
  }, [currentPage, loadProfiles]);

  const loadProfilesRef = useRef(loadProfiles);
  loadProfilesRef.current = loadProfiles;

  const loadFilterLocations = useCallback(async () => {
    setLoadingFilterLocations(true);
    try {
      const { data } = await getLocations({ limit: 500 });
      setFilterLocations(Array.isArray(data) ? data : []);
    } catch {
      setFilterLocations([]);
    } finally {
      setLoadingFilterLocations(false);
    }
  }, []);

  useEffect(() => {
    loadFilterLocations();
  }, [loadFilterLocations]);

  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const handleClickOutside = () => {
    setOpenDropdown(null);
  };

  const handleProfileClick = async (profile: UserProfile) => {
    try {
      const fullProfile = await getUserProfile(profile.id);
      console.log(fullProfile);
      setSelectedProfile(fullProfile);
    } catch {
      setSelectedProfile(profile);
    }
  };

  const closeSidebar = () => {
    setSelectedProfile(null);
    setActiveTab("Personal");
  };

  const loadLocationsForModal = useCallback(async () => {
    setLoadingLocations(true);
    try {
      const { data } = await getLocations({ limit: 500 });
      setLocationsList(Array.isArray(data) ? data : []);
    } catch {
      setLocationsList([]);
    } finally {
      setLoadingLocations(false);
    }
  }, []);

  const openCreateModal = () => {
    setShowCreateModal(true);
  };

  const openJourneyModal = (profile: UserProfile, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setJourneyModalProfile(profile);
    setJourneyForm({
      startDate: moment().format("YYYY-MM-DD"),
      status: "in_progress",
    });
    setShowJourneyModal(true);
  };

  const closeJourneyModal = () => {
    setShowJourneyModal(false);
    setJourneyModalProfile(null);
    setJourneyForm({ startDate: "", status: "in_progress" });
  };

  const handleCreateJourney = async () => {
    if (!journeyModalProfile) return;
    if (!journeyForm.startDate.trim()) {
      toast.warning("Please select a start date.");
      return;
    }
    const departmentName =
      journeyModalProfile.department_id != null
        ? (mainAppDepartments.find((d) => Number(d.id) === Number(journeyModalProfile.department_id))?.name ?? "")
        : "";
    const payload = {
      user_profile_id: journeyModalProfile.id,
      user_id: String(journeyModalProfile.user_id ?? ""),
      job_title: journeyModalProfile.job_title ?? "",
      department_name: departmentName,
      start_date: journeyForm.startDate,
      status: journeyForm.status,
 
    };
    setJourneySubmitting(true);
    try {
      await createJourney(payload);
      toast.success("Journey created successfully.");
      closeJourneyModal();
    } catch {
      // createJourney handles error toast via handleApiError
    } finally {
      setJourneySubmitting(false);
    }
  };

  /** Single list of user options for both Create and Edit modals; value is user id (stored as user_id in form) */
  const mainAppUserOptions = useMemo(
    () => mainAppUsers.map((u) => ({ value: String(u.id), label: u.name })),
    [mainAppUsers]
  );

  /** Resolve display name from MainAppUser (by user_id), then profile fields */
  const getDisplayName = useCallback((p: UserProfile): string => {
    const userId = p.user_id ?? (p as UserProfile & { extension_number?: string }).extension_number ?? p.employee_code;
    if (userId != null && mainAppUsers.length > 0) {
      const mainUser = mainAppUsers.find((u) => String(u.id) === String(userId));
      if (mainUser?.name) return mainUser.name;
    }
    return String((p as UserProfile & { name?: string }).name ?? p.user_id ?? p.employee_code ?? p.id ?? "—");
  }, [mainAppUsers]);


  const openEditModal = (profile: UserProfile, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingProfile(profile);
    setShowEditModal(true);
  };

  const handleDeleteClick = (profile: UserProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    setProfileToDelete(profile);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!profileToDelete) return;
    setDeleting(true);
    try {
      await deleteUserProfile(profileToDelete.id);
      toast.success("Employee deleted");
      setShowDeleteModal(false);
      setProfileToDelete(null);
      loadProfiles(currentPage);
      if (selectedProfile?.id === profileToDelete.id) setSelectedProfile(null);
    } catch {
      // toast handled in API
    } finally {
      setDeleting(false);
    }
  };
  
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
  
  /** API returns data for applied filters; no extra client-side filter */
  const filteredProfiles = profiles;

  const totalPages = pagination?.last_page ?? 1;
  const totalCount = pagination?.total ?? filteredProfiles.length;
  const departments = mainAppDepartments ?? [];
  const statuses = ["Active", "Inactive"];
  const selectedLocationName = selectedLocationId != null
    ? (filterLocations.find((l) => l.id === selectedLocationId)?.name ?? String(selectedLocationId))
    : "";
  const appliedLocationName = appliedLocationId != null
    ? (filterLocations.find((l) => l.id === appliedLocationId)?.name ?? String(appliedLocationId))
    : "";
  const managers = mainAppUsers ?? [];

  
  /** Single list of department options for both Create and Edit modals; value is department id */
  const mainAppDepartmentOptions = useMemo(() => {
    return (mainAppDepartments ?? []).map((d) => ({
      value: String(d.id),
      label: String(d.name ?? "—"),
    }));
  }, [mainAppDepartments]);

  const handleExport = () => {
      console.log('Exporting data...');
      alert('Export functionality triggered');
    };
  
    const handleApply = () => {
      setAppliedSearch(searchTerm);
      setAppliedDepartment(selectedDepartment);
      setAppliedLocationId(selectedLocationId);
      setAppliedStatus(selectedStatus);
      setAppliedEmploymentType(selectedEmploymentType);
      setAppliedContract(selectedContract);
      setAppliedManagerIds(selectedManagerIds);
      setCurrentPage(1);
      // Don't call loadProfilesRef.current(1) here: the useEffect([currentPage, loadProfiles])
      // will run once after state updates, using the new applied filters. Calling it here would
      // use the old filters and cause a duplicate API call.
    };

    const resetFilters = () => {
      setSelectedDepartment("");
      setSelectedLocationId(null);
      setSelectedStatus("");
      setSelectedManagerIds([]);
      setSelectedEmploymentType("");
      setSelectedContract("");
      setSearchTerm("");
      setAppliedSearch("");
      setAppliedDepartment("");
      setAppliedLocationId(null);
      setAppliedStatus("");
      setAppliedEmploymentType("");
      setAppliedContract("");
      setAppliedManagerIds([]);
      setCurrentPage(1);
      // loadProfilesRef.current(1);
    };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Employees" />


      <div 
      onClick={handleClickOutside}
      style={{ 
        
        backgroundColor: '#F9FAFB',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        overflow: selectedProfile ? "hidden" : "auto",
        
      }}>
      <div >
        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}>
          <h1 style={{ fontSize: "28px", fontWeight: "600", color: "#111827", margin: 0 }}>
            Employees
          </h1>

          {session?.user?.permissions?.includes('add-employee-staff-management') && (
          <button
            type="button"
            onClick={openCreateModal}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              backgroundColor: "#6366f1",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            <Plus size={18} />
            Add Employee
          </button>
          )}
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
              placeholder="Search by phone, cnic/id, title, designation "
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
              <span>{selectedDepartment || 'Department'}</span>
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
                minWidth: '200px',
                maxHeight: '280px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                  <input
                    type="text"
                    placeholder="Search department..."
                    value={departmentSearchTerm}
                    onChange={(e) => setDepartmentSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  <div
                    onClick={() => {
                      setSelectedDepartment('');
                      setOpenDropdown(null);
                      setDepartmentSearchTerm('');
                    }}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      backgroundColor: !selectedDepartment ? '#f3f4f6' : 'white',
                      borderBottom: '1px solid #e5e7eb',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = !selectedDepartment ? '#f3f4f6' : 'white'}
                  >
                    All departments
                  </div>
                  {departments
                    .filter((dept) => {
                      const label = hierarchyLabel(dept);
                      return !departmentSearchTerm.trim() || label.toLowerCase().includes(departmentSearchTerm.trim().toLowerCase());
                    })
                    .map((dept, idx) => {
                      const label = hierarchyLabel(dept);
                      return (
                        <div
                          key={typeof dept === "object" && dept !== null && "id" in (dept as object) ? String((dept as { id?: number }).id ?? idx) : label}
                          onClick={() => {
                            setSelectedDepartment(label);
                            setOpenDropdown(null);
                            setDepartmentSearchTerm('');
                          }}
                          style={{
                            padding: '10px 16px',
                            cursor: 'pointer',
                            backgroundColor: selectedDepartment === label ? '#f3f4f6' : 'white'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedDepartment === label ? '#f3f4f6' : 'white'}
                        >
                          {label}
                        </div>
                      );
                    })}
                </div>
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
              <span>{selectedLocationName || 'Location'}</span>
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
                {loadingFilterLocations ? (
                  <div style={{ padding: '12px 16px', color: '#6b7280', fontSize: '14px' }}>Loading locations…</div>
                ) : (
                  <>
                    <div
                      onClick={() => {
                        setSelectedLocationId(null);
                        setOpenDropdown(null);
                      }}
                      style={{
                        padding: '10px 16px',
                        cursor: 'pointer',
                        backgroundColor: selectedLocationId === null ? '#f3f4f6' : 'white',
                        borderBottom: '1px solid #e5e7eb',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedLocationId === null ? '#f3f4f6' : 'white'}
                    >
                      All locations
                    </div>
                    {filterLocations.length === 0 ? (
                      <div style={{ padding: '12px 16px', color: '#6b7280', fontSize: '14px' }}>No locations</div>
                    ) : (
                  filterLocations.map((loc) => {
                    const label = loc.name ?? String(loc.id);
                    const isSelected = selectedLocationId === loc.id;
                    return (
                      <div
                        key={loc.id}
                        onClick={() => {
                          setSelectedLocationId(loc.id);
                          setOpenDropdown(null);
                        }}
                        style={{
                          padding: '10px 16px',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#f3f4f6' : 'white'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isSelected ? '#f3f4f6' : 'white'; }}
                      >
                        {label}
                      </div>
                    );
                  })
                )}
                  </>
                )}
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
              <span>{selectedStatus || 'Status'}</span>
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
                <div
                  onClick={() => {
                    setSelectedStatus('');
                    setOpenDropdown(null);
                  }}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    backgroundColor: !selectedStatus ? '#f3f4f6' : 'white',
                    borderBottom: '1px solid #e5e7eb',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = !selectedStatus ? '#f3f4f6' : 'white'}
                >
                  All Statuses
                </div>
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

          {/* Manager Filter (multi-select); API receives user_ids: ["id1", "id2"] */}
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
              <span>{selectedManagerIds.length > 0 ? `Users (${selectedManagerIds.length})` : 'Users'}</span>
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
                minWidth: '200px',
                maxHeight: '280px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                  <input
                    type="text"
                    placeholder="Search user..."
                    value={managerSearchTerm}
                    onChange={(e) => setManagerSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  <div
                    onClick={() => {
                      setSelectedManagerIds([]);
                      setOpenDropdown(null);
                    }}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      backgroundColor: selectedManagerIds.length === 0 ? '#f3f4f6' : 'white',
                      borderBottom: '1px solid #e5e7eb',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedManagerIds.length === 0 ? '#f3f4f6' : 'white'}
                  >
                    All users
                  </div>
                  {managers
                    .filter((mgr) => {
                      const label = hierarchyLabel(mgr);
                      return !managerSearchTerm.trim() || label.toLowerCase().includes(managerSearchTerm.trim().toLowerCase());
                    })
                    .map((mgr, idx) => {
                      const label = hierarchyLabel(mgr);
                      const idStr = String((mgr as { id?: number }).id ?? idx);
                      const isSelected = selectedManagerIds.includes(idStr);
                      return (
                        <div
                          key={idStr}
                          onClick={() => {
                            setSelectedManagerIds((prev) =>
                              isSelected ? prev.filter((id) => id !== idStr) : [...prev, idStr]
                            );
                          }}
                          style={{
                            padding: '10px 16px',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? '#e0e7ff' : 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isSelected ? '#c7d2fe' : '#f3f4f6'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isSelected ? '#e0e7ff' : 'white'}
                        >
                          {isSelected && <span style={{ color: '#6366f1', fontWeight: 600 }}>✓</span>}
                          {label}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Employment Type Filter */}
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
              <span>{selectedEmploymentType || 'Employment'}</span>
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
                <div
                  onClick={() => {
                    setSelectedEmploymentType("");
                    setOpenDropdown(null);
                  }}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    backgroundColor: !selectedEmploymentType ? '#f3f4f6' : 'white',
                    borderBottom: '1px solid #e5e7eb'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = !selectedEmploymentType ? '#f3f4f6' : 'white'}
                >
                  All employment types
                </div>
                {EMPLOYMENT_TYPES.map(type => (
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

          {/* Contract Type Filter */}
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
              <span>{selectedContract || 'Contract'}</span>
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
                <div
                  onClick={() => {
                    setSelectedContract("");
                    setOpenDropdown(null);
                  }}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    backgroundColor: !selectedContract ? '#f3f4f6' : 'white',
                    borderBottom: '1px solid #e5e7eb'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = !selectedContract ? '#f3f4f6' : 'white'}
                >
                  All contract types
                </div>
                {CONTRACT_TYPES.map(type => (
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
            {/* <button
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
            </button> */}
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

        {/* Active Filters - show when any applied filter is set */}
        {(appliedSearch.trim() || appliedDepartment || appliedLocationId != null || appliedStatus || appliedEmploymentType || appliedContract || appliedManagerIds.length > 0) && (
          <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Active filters:</span>
            {appliedSearch.trim() && (
              <span style={{
                padding: '4px 12px',
                backgroundColor: '#e0e7ff',
                borderRadius: '16px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                Search: {appliedSearch}
                <button
                  onClick={() => { setSearchTerm(''); setAppliedSearch(''); setCurrentPage(1); loadProfilesRef.current(1); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '16px' }}
                >
                  ×
                </button>
              </span>
            )}
            {appliedDepartment && (
              <span style={{
                padding: '4px 12px',
                backgroundColor: '#e0e7ff',
                borderRadius: '16px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                {appliedDepartment}
                <button
                  onClick={() => { setSelectedDepartment(''); setAppliedDepartment(''); setCurrentPage(1); loadProfilesRef.current(1); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '16px' }}
                >
                  ×
                </button>
              </span>
            )}
            {appliedLocationId != null && (
              <span style={{
                padding: '4px 12px',
                backgroundColor: '#e0e7ff',
                borderRadius: '16px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                {appliedLocationName}
                <button
                  onClick={() => { setSelectedLocationId(null); setAppliedLocationId(null); setCurrentPage(1); loadProfilesRef.current(1); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '16px' }}
                >
                  ×
                </button>
              </span>
            )}
            {appliedStatus && (
              <span style={{
                padding: '4px 12px',
                backgroundColor: '#e0e7ff',
                borderRadius: '16px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                {appliedStatus}
                <button
                  onClick={() => { setSelectedStatus(''); setAppliedStatus(''); setCurrentPage(1); loadProfilesRef.current(1); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '16px' }}
                >
                  ×
                </button>
              </span>
            )}
            {appliedEmploymentType && (
              <span style={{
                padding: '4px 12px',
                backgroundColor: '#e0e7ff',
                borderRadius: '16px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                {appliedEmploymentType}
                <button
                  onClick={() => { setSelectedEmploymentType(''); setAppliedEmploymentType(''); setCurrentPage(1); loadProfilesRef.current(1); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '16px' }}
                >
                  ×
                </button>
              </span>
            )}
            {appliedContract && (
              <span style={{
                padding: '4px 12px',
                backgroundColor: '#e0e7ff',
                borderRadius: '16px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                {appliedContract}
                <button
                  onClick={() => { setSelectedContract(''); setAppliedContract(''); setCurrentPage(1); loadProfilesRef.current(1); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '16px' }}
                >
                  ×
                </button>
              </span>
            )}
            {appliedManagerIds.length > 0 && (
              <span
                title={appliedManagerIds.map((id) => mainAppUsers.find((u) => String(u.id) === id)?.name ?? id).join(", ")}
                style={{
                  padding: '4px 12px',
                  backgroundColor: '#e0e7ff',
                  borderRadius: '16px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                Managers: {appliedManagerIds.map((id) => mainAppUsers.find((u) => String(u.id) === id)?.name ?? id).join(", ")}
                <button
                  onClick={() => { setSelectedManagerIds([]); setAppliedManagerIds([]); setCurrentPage(1); loadProfilesRef.current(1); }}
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
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Phone</th>
                  {/* <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Location</th> */}
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Status</th>
                  <th style={{ padding: "16px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#6b7280" }}>
                    Last Updated
                  </th>
                  <th style={{ padding: "16px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#6b7280" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} style={{ padding: "32px", textAlign: "center", color: "#6b7280" }}>
                      Loading...
                    </td>
                  </tr>
                ) : filteredProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: "32px", textAlign: "center", color: "#6b7280" }}>
                      No employees found.
                    </td>
                  </tr>
                ) : (
                  filteredProfiles.map((profile, index) => (
                    <tr
                      key={profile.id}
                      onClick={() => handleProfileClick(profile)}
                      style={{
                        borderBottom: index < filteredProfiles.length - 1 ? "1px solid #f3f4f6" : "none",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                    >
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              backgroundColor: "#e0e7ff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <User size={20} color="#6366f1" />
                          </div>
                          <div>
                            <div style={{ fontSize: "14px", fontWeight: "500", color: "#1f2937" }}>
                              {getDisplayName(profile)}
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#6b7280",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                marginTop: "2px",
                              }}
                            >
                              <span
                                style={{
                                  width: "8px",
                                  height: "8px",
                                  borderRadius: "50%",
                                  backgroundColor: "#10b981",
                                  display: "inline-block",
                                }}
                              />
                              {String(profile.status ?? "Active")}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px", fontSize: "14px", color: "#1f2937" }}>
                        {profile.identification_number ?? "—"}
                      </td>
                      <td style={{ padding: "16px", fontSize: "14px", color: "#1f2937" }}>
                        {profile.job_title ?? "—"}
                      </td>
                      <td style={{ padding: "16px", fontSize: "14px", color: "#1f2937" }}>
                        {profile.department_id != null
                          ? (mainAppDepartments.find((d) => Number(d.id) === Number(profile.department_id))?.name ?? String(profile.department_id))
                          : "—"}
                      </td>
                      <td style={{ padding: "16px", fontSize: "14px", color: "#1f2937" }}>{profile.phone ?? "—"}</td>
                      {/* <td style={{ padding: "16px", fontSize: "14px", color: "#1f2937" }}>
                        {(profile as UserProfile & { location?: string }).location ??
                          (profile.location_id != null ? String((profile as { address_locations?: { name?: string } }).address_locations?.name ?? profile.location_id) : "—")}
                      </td> */}
                      <td style={{ padding: "16px" }}>
                        <span
                          style={{
                            padding: "4px 12px",
                            backgroundColor: String(profile.status ?? "").toLowerCase() === "active" ? "#d1fae5" : "#fee2e2",
                            color: String(profile.status ?? "").toLowerCase() === "active" ? "#065f46" : "#991b1b",
                            borderRadius: "16px",
                            fontSize: "13px",
                            fontWeight: "500",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            textTransform: "capitalize",
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              backgroundColor: String(profile.status ?? "").toLowerCase() === "active" ? "#10b981" : "#ef4444",
                            }}
                          />
                          {String(profile.status ?? "")}
                        </span>
                      </td>
                      <td style={{ padding: "16px", fontSize: "14px", color: "#6b7280" }}>
                        {(profile as UserProfile & { updated_at?: string }).updated_at
                          ? moment((profile as UserProfile & { updated_at?: string }).updated_at).format(GlobalDateTimeFormat)
                          : "—"}
                      </td>
                      <td style={{ padding: "16px" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          {session?.user?.permissions?.includes('update-employee-staff-management') && (
                          <button
                            type="button"
                            onClick={(e) => openEditModal(profile, e)}
                            style={{
                              padding: "6px",
                              border: "1px solid #e5e7eb",
                              borderRadius: "6px",
                              background: "white",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            title="Edit"
                          >
                            <Pencil size={16} color="#6366f1" />
                          </button>
                          )}

{session?.user?.permissions?.includes('update-employee-staff-management') && (
                          <button
                            type="button"
                            onClick={(e) => openJourneyModal(profile, e)}
                            style={{
                              padding: "6px",
                              border: "1px solid #e5e7eb",
                              borderRadius: "6px",
                              background: "white",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            title="Create Journey"
                          >
                            <Calendar size={16} color="#6366f1" /> Create Journey
                          </button>
                          )}


                          {session?.user?.permissions?.includes('delete-employee-staff-management') && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteClick(profile, e)}
                            style={{
                              padding: "6px",
                              border: "1px solid #fecaca",
                              borderRadius: "6px",
                              background: "#fef2f2",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            title="Delete"
                          >
                            <Trash2 size={16} color="#dc2626" />
                          </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
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
            <div style={{ fontSize: "14px", color: "#6b7280" }}>
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} employees
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
              {/* <button
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
              </button> */}
            </div>

            {/* Legend */}
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              marginBottom: '20px',
              flexWrap: 'wrap'
            }}>
              {departmentHeadcountData.map(dept => (
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
              <BarChart data={departmentHeadcountData}>
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
                  {departmentHeadcountData.map((entry, index) => (
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

          {/* Dashboard counters */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '20px' }}>
              Dashboard overview
            </h2>

            {dashboardCounters == null ? (
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Loading…</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Employees */}
                {dashboardCounters.employees && (
                  <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Employees</div>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Total: <strong style={{ color: '#1f2937' }}>{dashboardCounters.employees.total ?? 0}</strong></span>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Active: <strong style={{ color: '#059669' }}>{dashboardCounters.employees.active ?? 0}</strong></span>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Inactive: <strong style={{ color: '#dc2626' }}>{dashboardCounters.employees.inactive ?? 0}</strong></span>
                    </div>
                  </div>
                )}

                {/* Approvals */}
                {dashboardCounters.approvals && (
                  <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fffbeb' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Approvals</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Pending: <strong style={{ color: '#1f2937' }}>{dashboardCounters.approvals.pending ?? 0}</strong></span>
                      {dashboardCounters.approvals.aging && (
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                          Aging: 0–3d: {dashboardCounters.approvals.aging["0_3_days"] ?? 0}, 4–7d: {dashboardCounters.approvals.aging["4_7_days"] ?? 0}, 8+d: {dashboardCounters.approvals.aging["8_plus_days"] ?? 0}
                        </span>
                      )}
                      {typeof dashboardCounters.approvals.avg_aging === 'number' && (
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Avg aging: <strong>{dashboardCounters.approvals.avg_aging.toFixed(1)}</strong> days</span>
                      )}
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Pending leave: {dashboardCounters.approvals.pending_leave ?? 0}, Pending other: {dashboardCounters.approvals.pending_other ?? 0}</span>
                    </div>
                  </div>
                )}

                {/* Leave */}
                {dashboardCounters.leave && (
                  <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#f0fdf4' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Leave</div>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>On leave today: <strong style={{ color: '#1f2937' }}>{dashboardCounters.leave.on_leave_today ?? 0}</strong></span>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Upcoming 7 days: <strong style={{ color: '#1f2937' }}>{dashboardCounters.leave.upcoming_7_days ?? 0}</strong></span>
                    </div>
                  </div>
                )}

                {/* Journey */}
                {dashboardCounters.journey && (
                  <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#eff6ff' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Journey</div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: '#6b7280' }}>
                      <span>Total: <strong style={{ color: '#1f2937' }}>{dashboardCounters.journey.total ?? 0}</strong></span>
                      <span>In progress: <strong style={{ color: '#2563eb' }}>{dashboardCounters.journey.in_progress ?? 0}</strong></span>
                      <span>On track: {dashboardCounters.journey.on_track ?? 0}</span>
                      <span>Overdue: <strong style={{ color: '#dc2626' }}>{dashboardCounters.journey.overdue ?? 0}</strong></span>
                      <span>Completed: {dashboardCounters.journey.completed ?? 0}</span>
                    </div>
                  </div>
                )}

                {/* Attendance */}
                {dashboardCounters.attendance?.today && (
                  <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#faf5ff' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Attendance (today)</div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: '#6b7280' }}>
                      <span>With record: {dashboardCounters.attendance.today.with_record ?? 0}</span>
                      <span>Checked in: {dashboardCounters.attendance.today.checked_in ?? 0}</span>
                      <span>Checked out: {dashboardCounters.attendance.today.checked_out ?? 0}</span>
                      <span>No record (est.): {dashboardCounters.attendance.today.no_record_estimate ?? 0}</span>
                    </div>
                  </div>
                )}

                {/* Compliance alerts */}
                {dashboardCounters.compliance_alerts && (
                  <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fef2f2' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Compliance alerts</div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: '#6b7280' }}>
                      <span>High: <strong style={{ color: '#dc2626' }}>{dashboardCounters.compliance_alerts.high ?? 0}</strong></span>
                      <span>Medium: <strong style={{ color: '#d97706' }}>{dashboardCounters.compliance_alerts.medium ?? 0}</strong></span>
                      <span>Low: <strong style={{ color: '#059669' }}>{dashboardCounters.compliance_alerts.low ?? 0}</strong></span>
                      <span>Total: <strong style={{ color: '#1f2937' }}>{dashboardCounters.compliance_alerts.total ?? 0}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <AddEmployeeModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onSuccess={() => loadProfiles(currentPage)}
        tenantId={companyIdentifier ?? undefined}
      />

      {/* Create Journey Modal */}
      <Modal show={showJourneyModal} onHide={closeJourneyModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create Journey</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {journeyModalProfile && (
            <>
              <Form.Group className="mb-3">
                {/* <Form.Label className="text-muted small">Employee</Form.Label> */}
                <div style={{ fontWeight: 600, color: "#1f2937", marginBottom: "2px" }}>
                  {getDisplayName(journeyModalProfile)}
                </div>
                <div className="text-muted small">
                  Phone: {journeyModalProfile.extension_number ?? journeyModalProfile.phone ?? "—"}
                </div>
                <div className="text-muted small">
                  Department: {mainAppDepartments.find((d) => Number(d.id) === Number(journeyModalProfile.department_id))?.name ?? "—"}
                </div>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  value={journeyForm.startDate}
                  onChange={(e) => setJourneyForm((f) => ({ ...f, startDate: e.target.value }))}
                  
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={journeyForm.status}
                  onChange={(e) => setJourneyForm((f) => ({ ...f, status: e.target.value }))}
                 
                >
                  <option value="in_progress">In Progress</option>
                  <option value="on_track">On Track</option>
                  <option value="overdue">Overdue</option>
                  <option value="completed">Completed</option>
                </Form.Select>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeJourneyModal} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="button" onClick={handleCreateJourney} disabled={journeySubmitting}>
            {journeySubmitting ? "Creating…" : "Create"}
          </Button>
        </Modal.Footer>
      </Modal>

      <EditEmployeeModal
        show={showEditModal}
        onHide={() => { setShowEditModal(false); setEditingProfile(null); }}
        profile={editingProfile}
        onSuccess={(id) => {
          loadProfiles(currentPage);
          if (id != null && selectedProfile?.id === id) setSelectedProfile(null);
        }}
      />

      {/* Delete confirmation */}
      <DeleteConfirmationModal
        show={showDeleteModal && !!profileToDelete}
        onHide={() => { setShowDeleteModal(false); setProfileToDelete(null); }}
        onConfirm={handleDeleteConfirm}
        itemName={profileToDelete ? getDisplayName(profileToDelete) : undefined}
        itemType="employee"
        loading={deleting}
      />

      {/* Employee Detail Sidebar */}
      {selectedProfile && (
        <div
          onClick={closeSidebar}
          style={{
            position: "fixed",
            top: "80px",
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <EmployeeDetailSidebar
              profile={selectedProfile}
              departments={mainAppDepartments}
              users={mainAppUsers}
              onClose={closeSidebar}
            />
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
