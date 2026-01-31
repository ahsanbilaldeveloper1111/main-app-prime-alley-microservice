import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useCallback, useEffect, useMemo, useState } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import EmployeeDetailSidebar from "@components/employee-sidebar";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import {
  getUserProfiles,
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  deleteUserProfile,
  getMainAppCompanies,
  getMainAppDepartments,
  getMainAppUsers,
  getLocations,
  type UserProfile,
  type UserProfileAddress,
  type UserProfilePayload,
  type Location,
} from "@utils/staffManagement";
import { toast } from "react-toastify";
import { Button, Form, Modal } from "react-bootstrap";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

import { Search, ChevronDown, Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileText, Plus, Pencil, Trash2, User } from "lucide-react";
import moment from "moment";
import { GlobalDateTimeFormat, ModuleSlug } from "@utils/Helper";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import Select, { SingleValue } from "react-select";

const EMPLOYMENT_TYPES = ["Full-Time", "Part-Time", "Contract", "Internship", "Freelance", "Temporary"];
const CONTRACT_TYPES = ["Permanent", "Temporary", "Freelance", "Fixed-term", "Probation"];
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

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

function displayProfileName(p: UserProfile): string {
  return String((p as UserProfile & { name?: string }).name ?? p.user_id ?? p.employee_code ?? p.id ?? "—");
}

const ITEMS_PER_PAGE = 10;

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
  const { hierarchyDataUsers, hierarchyDataDepartments, hierarchyDataCompanies, hierarchyDataExtensions, loading: hierarchyLoading } = useHierarchyData(ModuleSlug.USER_DIRECTORY);

  /** Resolve display name from extensions (user_id/extension_number) then fallback to profile fields */
  const getDisplayName = useCallback((p: UserProfile): string => {
    const extId = (p as UserProfile & { extension_number?: string }).extension_number ?? p.user_id ?? p.employee_code;
    if (extId != null && hierarchyDataExtensions && Array.isArray(hierarchyDataExtensions)) {
      const ext = (hierarchyDataExtensions as { id?: string; extension_number?: string; name?: string; user?: { name?: string }; user_id?: string }[]).find(
        (e) => String(e.extension_number ?? e.id ?? e.user_id) === String(extId)
      );
      if (ext) return String(ext.user?.name ?? ext.name ?? ext.extension_number ?? extId);
    }
    return String((p as UserProfile & { name?: string }).name ?? p.user_id ?? p.employee_code ?? p.id ?? "—");
  }, [hierarchyDataExtensions]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedManager, setSelectedManager] = useState("");
  const [selectedEmploymentType, setSelectedEmploymentType] = useState("");
  const [selectedContract, setSelectedContract] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
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
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [createForm, setCreateForm] = useState<Partial<UserProfilePayload>>({
    user_id: "",
    employee_code: "",
    identification_number: "",
    job_title: "",
    department_id: null,
    location_id: null,
    employment_type: "",
    contract_type: "",
    phone: "",
    status: "active",
  });
  /** Addresses for create form kept in separate state to avoid update loops when editing address fields */
  const [createFormAddresses, setCreateFormAddresses] = useState<NonNullable<UserProfilePayload["addresses"]>>([]);

  const [createModalCompanyUuid, setCreateModalCompanyUuid] = useState<string>("");
  const [createModalCompanies, setCreateModalCompanies] = useState<{ id?: string; uuid?: string; name?: string; [key: string]: unknown }[]>([]);
  const [createModalDepartments, setCreateModalDepartments] = useState<MainAppDepartment[]>([]);
  const [createModalUsers, setCreateModalUsers] = useState<MainAppUser[]>([]);
  const [locationsList, setLocationsList] = useState<Location[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const [editModalCompanyUuid, setEditModalCompanyUuid] = useState<string>("");
  const [editModalCompanies, setEditModalCompanies] = useState<{ id?: string; uuid?: string; name?: string; [key: string]: unknown }[]>([]);
  const [editModalDepartments, setEditModalDepartments] = useState<MainAppDepartment[]>([]);
  const [editModalUsers, setEditModalUsers] = useState<MainAppUser[]>([]);
  const [loadingEditDepartments, setLoadingEditDepartments] = useState(false);
  const [loadingEditUsers, setLoadingEditUsers] = useState(false);
  const [editFormAddresses, setEditFormAddresses] = useState<NonNullable<UserProfilePayload["addresses"]>>([]);

  const [editForm, setEditForm] = useState<Partial<UserProfilePayload>>({
    user_id: "",
    employee_code: "",
    identification_number: "",
    job_title: "",
    department_id: null,
    location_id: null,
    employment_type: "",
    contract_type: "",
    phone: "",
    status: "active",
  });

  const loadProfiles = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data, pagination: p } = await getUserProfiles({ page, limit: ITEMS_PER_PAGE });
      setProfiles(data ?? []);
      if (p) setPagination({ page: p.page, limit: p.limit, total: p.total, last_page: p.last_page });
      else setPagination(null);
    } catch {
      setProfiles([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfiles(currentPage);
  }, [currentPage, loadProfiles]);

  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const handleClickOutside = () => {
    setOpenDropdown(null);
  };

  const handleProfileClick = (profile: UserProfile) => {
    setSelectedProfile(profile);
  };

  const closeSidebar = () => {
    setSelectedProfile(null);
    setActiveTab("Personal");
  };

  const loadCompaniesForCreate = useCallback(async () => {
    try {
      const data = await getMainAppCompanies();
      setCreateModalCompanies(Array.isArray(data) ? (data as { id?: string; uuid?: string; name?: string; [key: string]: unknown }[]) : []);
    } catch {
      setCreateModalCompanies([]);
    }
  }, []);

  const loadDepartmentsForCreate = useCallback(async (companyUuid: string) => {
    if (!companyUuid) {
      setCreateModalDepartments([]);
      return;
    }
    setLoadingDepartments(true);
    // try {
    //   const data = await getMainAppDepartments(companyUuid);
    //   setCreateModalDepartments(Array.isArray(data) ? (data as MainAppDepartment[]) : []);
    // } catch {
    //   setCreateModalDepartments([]);
    // } finally {
    //   setLoadingDepartments(false);
    // }
  }, []);

  const loadUsersForCreate = useCallback(async (companyUuid: string, departmentId?: number | null) => {
    if (!companyUuid) {
      setCreateModalUsers([]);
      return;
    }
    setLoadingUsers(true);
    try {
      const data = await getMainAppUsers(
        companyUuid,
        departmentId != null ? { department_id: departmentId } : undefined
      );
      const rawList: unknown[] = Array.isArray(data)
        ? data
        : data && typeof data === "object" && Array.isArray((data as { users?: unknown[] }).users)
          ? (data as { users: unknown[] }).users
          : data && typeof data === "object" && Array.isArray((data as { data?: unknown[] }).data)
            ? (data as { data: unknown[] }).data
            : [];
      const list: MainAppUser[] = rawList.map((raw: unknown) => {
        const r = raw as { id?: number; ldap_uid?: string; name?: string; email?: string; username?: string; phone?: string; department?: { id?: number; name?: string }; company?: { id?: number; name?: string }; user_id?: string; department_id?: number; [key: string]: unknown };
        return {
          ...r,
          id: r.id ?? r.user_id,
          user_id: r.ldap_uid ?? r.user_id ?? String(r.id ?? ""),
          department_id: r.department_id ?? r.department?.id,
        } as MainAppUser;
      });
      setCreateModalUsers(list);
    } catch {
      setCreateModalUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

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
    setCreateForm({
      user_id: "",
      employee_code: "",
      identification_number: "",
      job_title: "",
      department_id: null,
      location_id: null,
      employment_type: "",
      contract_type: "",
      phone: "",
      status: "active",
      addresses: [],
    });
    setCreateModalCompanyUuid("");
    setCreateModalDepartments([]);
    setCreateModalUsers([]);
    loadCompaniesForCreate();
    loadLocationsForModal();
    setShowCreateModal(true);
  };

  const createModalUsersByDepartment = useMemo(() => {
    if (createForm.department_id == null) return createModalUsers;
    return createModalUsers.filter((u) => Number(u.department_id) === Number(createForm.department_id));
  }, [createModalUsers, createForm.department_id]);

  /** Extensions list for create-modal User dropdown; option value is extension id (sent as user_id) */
  const createModalExtensionsList = useMemo(() => {
    if (!hierarchyDataExtensions || !Array.isArray(hierarchyDataExtensions)) return [];
    return hierarchyDataExtensions as { id?: string | number; extension_number?: string; name?: string; user?: { name?: string }; user_id?: string }[];
  }, [hierarchyDataExtensions]);

  /** React Select options for create-modal User (extensions); value is extension id (user_id) */
  const createModalUserOptions = useMemo(() => {
    return createModalExtensionsList.map((ext) => {
      const value = String(ext.id ?? ext.extension_number ?? ext.user_id ?? "");
      const label = String(ext.user?.name ?? ext.name ?? ext.extension_number ?? ext.user_id ?? "—");
      return { value, label };
    });
  }, [createModalExtensionsList]);

  const loadEditCompanies = useCallback(async () => {
    try {
      const data = await getMainAppCompanies();
      setEditModalCompanies(Array.isArray(data) ? (data as { id?: string; uuid?: string; name?: string; [key: string]: unknown }[]) : []);
    } catch {
      setEditModalCompanies([]);
    }
  }, []);

  const loadEditDepartments = useCallback(async (companyUuid: string) => {
    if (!companyUuid) {
      setEditModalDepartments([]);
      return;
    }
    setLoadingEditDepartments(true);
    try {
      const data = await getMainAppDepartments(companyUuid);
      setEditModalDepartments(Array.isArray(data) ? (data as MainAppDepartment[]) : []);
    } catch {
      setEditModalDepartments([]);
    } finally {
      setLoadingEditDepartments(false);
    }
  }, []);

  const loadEditUsers = useCallback(async (companyUuid: string, departmentId?: number | null) => {
    if (!companyUuid) {
      setEditModalUsers([]);
      return;
    }
    setLoadingEditUsers(true);
    try {
      const data = await getMainAppUsers(
        companyUuid,
        departmentId != null ? { department_id: departmentId } : undefined
      );
      const rawList: unknown[] = Array.isArray(data)
        ? data
        : data && typeof data === "object" && Array.isArray((data as { users?: unknown[] }).users)
          ? (data as { users: unknown[] }).users
          : data && typeof data === "object" && Array.isArray((data as { data?: unknown[] }).data)
            ? (data as { data: unknown[] }).data
            : [];
      const list: MainAppUser[] = rawList.map((raw: unknown) => {
        const r = raw as { id?: number; ldap_uid?: string; name?: string; email?: string; username?: string; phone?: string; department?: { id?: number; name?: string }; company?: { id?: number; name?: string }; user_id?: string; department_id?: number; [key: string]: unknown };
        return {
          ...r,
          id: r.id ?? r.user_id,
          user_id: r.ldap_uid ?? r.user_id ?? String(r.id ?? ""),
          department_id: r.department_id ?? r.department?.id,
        } as MainAppUser;
      });
      setEditModalUsers(list);
    } catch {
      setEditModalUsers([]);
    } finally {
      setLoadingEditUsers(false);
    }
  }, []);

  const editModalUsersByDepartment = useMemo(() => {
    if (editForm.department_id == null) return editModalUsers;
    return editModalUsers.filter((u) => Number(u.department_id) === Number(editForm.department_id));
  }, [editModalUsers, editForm.department_id]);

  const openEditModal = async (profile: UserProfile, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingProfile(profile);
    const tenantId = (profile as UserProfile & { tenant_id?: string }).tenant_id ?? "";
    setEditModalCompanyUuid(tenantId);
    setEditForm({
      user_id: profile.user_id ?? "",
      employee_code: profile.employee_code ?? "",
      identification_number: profile.identification_number ?? "",
      job_title: profile.job_title ?? "",
      department_id: profile.department_id ?? null,
      location_id: profile.location_id ?? null,
      employment_type: profile.employment_type ?? "",
      contract_type: profile.contract_type ?? "",
      phone: profile.phone ?? "",
      status: profile.status ?? "active",
    });
    const addrs = (profile as UserProfile & { addresses?: UserProfileAddress[] }).addresses;
    setEditFormAddresses(Array.isArray(addrs) && addrs.length > 0 ? addrs.map((a) => ({ name: a.name ?? "", zip_code: a.zip_code ?? "", city: a.city ?? "", country: a.country ?? "", address: a.address ?? "" })) : [{ name: "", zip_code: "", city: "", country: "", address: "" }]);
    loadEditCompanies();
    if (tenantId) {
      loadEditDepartments(tenantId);
      loadEditUsers(tenantId);
    } else {
      setEditModalDepartments([]);
      setEditModalUsers([]);
    }
    loadLocationsForModal();
    setShowEditModal(true);
    try {
      const full = await getUserProfile(profile.id);
      const fullAddrs = (full as UserProfile & { addresses?: UserProfileAddress[] }).addresses;
      if (Array.isArray(fullAddrs) && fullAddrs.length > 0) {
        setEditFormAddresses(fullAddrs.map((a) => ({ name: a.name ?? "", zip_code: a.zip_code ?? "", city: a.city ?? "", country: a.country ?? "", address: a.address ?? "" })));
      }
    } catch {
      // keep initial editFormAddresses
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.user_id?.toString().trim()) {
      toast.error("User ID is required");
      return;
    }
    setCreateSubmitting(true);
    try {
      await createUserProfile({
        tenant_id: createModalCompanyUuid ? String(createModalCompanyUuid).trim() : undefined,
        user_id: String(createForm.user_id).trim(),
        employee_code: createForm.employee_code?.toString().trim() || null,
        identification_number: createForm.identification_number?.toString().trim() || null,
        job_title: createForm.job_title?.toString().trim() || null,
        department_id: createForm.department_id ?? null,
        location_id: createForm.location_id ?? null,
        employment_type: createForm.employment_type?.toString().trim() || null,
        contract_type: createForm.contract_type?.toString().trim() || null,
        phone: createForm.phone?.toString().trim() || null,
        status: createForm.status?.toString().trim() || null,
        addresses: (createFormAddresses?.length ? createFormAddresses : undefined) as UserProfileAddress[] | undefined,
      });
      toast.success("Employee created");
      setShowCreateModal(false);
      loadProfiles(currentPage);
    } catch {
      // toast handled in API
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;
    if (!editForm.user_id?.toString().trim()) {
      toast.error("User ID is required");
      return;
    }
    setEditSubmitting(true);
    try {
      await updateUserProfile(editingProfile.id, {
        tenant_id: editModalCompanyUuid ? String(editModalCompanyUuid).trim() : undefined,
        user_id: editForm.user_id?.toString().trim() || null,
        employee_code: editForm.employee_code?.toString().trim() || null,
        identification_number: editForm.identification_number?.toString().trim() || null,
        job_title: editForm.job_title?.toString().trim() || null,
        department_id: editForm.department_id ?? null,
        location_id: editForm.location_id ?? null,
        employment_type: editForm.employment_type?.toString().trim() || null,
        contract_type: editForm.contract_type?.toString().trim() || null,
        phone: editForm.phone?.toString().trim() || null,
        status: editForm.status?.toString().trim() || null,
        addresses: (editFormAddresses?.length ? editFormAddresses : undefined) as UserProfileAddress[] | undefined,
      });
      toast.success("Employee updated");
      setShowEditModal(false);
      setEditingProfile(null);
      loadProfiles(currentPage);
      if (selectedProfile?.id === editingProfile.id) setSelectedProfile(null);
    } catch {
      // toast handled in API
    } finally {
      setEditSubmitting(false);
    }
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
  
    const departmentData = [
      { name: 'Engineering', count: 18, color: '#6366f1' },
      { name: 'Marketing', count: 12, color: '#10b981' },
      { name: 'Sales', count: 9, color: '#f59e0b' },
      { name: 'HR', count: 7, color: '#ec4899' },
      { name: 'Finance', count: 6, color: '#8b5cf6' }
    ];

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const name = getDisplayName(p).toLowerCase();
      const idNum = String(p.identification_number ?? "").toLowerCase();
      const title = String(p.job_title ?? "").toLowerCase();
      const dept = String(p.department_id ?? "").toLowerCase();
      const loc = String((p as UserProfile & { location?: string }).location ?? p.location_id ?? "").toLowerCase();
      const status = String(p.status ?? "").toLowerCase();
      const search = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !search || name.includes(search) || idNum.includes(search) || title.includes(search);
      const matchesDepartment = !selectedDepartment || dept.includes(selectedDepartment.toLowerCase());
      const matchesLocation = !selectedLocation || loc.includes(selectedLocation.toLowerCase());
      const matchesStatus = !selectedStatus || status.includes(selectedStatus.toLowerCase());
      return matchesSearch && matchesDepartment && matchesLocation && matchesStatus;
    });
  }, [profiles, searchTerm, selectedDepartment, selectedLocation, selectedStatus]);

  const totalPages = pagination?.last_page ?? 1;
  const totalCount = pagination?.total ?? filteredProfiles.length;
  const departments = Array.isArray(hierarchyDataDepartments) && hierarchyDataDepartments.length > 0
    ? hierarchyDataDepartments
    : ["Engineering", "Marketing", "Sales", "HR", "Finance"];
  const locations = Array.isArray(hierarchyDataCompanies) && hierarchyDataCompanies.length > 0
    ? hierarchyDataCompanies
    : ["Toronto", "New York", "London", "Paris"];
  const statuses = ["Active", "Inactive"];
  const managers = Array.isArray(hierarchyDataUsers) && hierarchyDataUsers.length > 0
    ? hierarchyDataUsers
    : ["Hassan Mir", "Apr 15 ago"];

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
                {departments.map((dept, idx) => {
                  const label = hierarchyLabel(dept);
                  return (
                    <div
                      key={typeof dept === "object" && dept !== null && "id" in (dept as object) ? (dept as { id?: string }).id ?? idx : label}
                      onClick={() => {
                        setSelectedDepartment(label);
                        setOpenDropdown(null);
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
                {locations.map((loc, idx) => {
                  const label = hierarchyLabel(loc);
                  return (
                    <div
                      key={typeof loc === "object" && loc !== null && "id" in (loc as object) ? (loc as { id?: string }).id ?? idx : label}
                      onClick={() => {
                        setSelectedLocation(label);
                        setOpenDropdown(null);
                      }}
                      style={{
                        padding: '10px 16px',
                        cursor: 'pointer',
                        backgroundColor: selectedLocation === label ? '#f3f4f6' : 'white'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedLocation === label ? '#f3f4f6' : 'white'}
                    >
                      {label}
                    </div>
                  );
                })}
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
                {managers.map((mgr, idx) => {
                  const label = hierarchyLabel(mgr);
                  return (
                    <div
                      key={typeof mgr === "object" && mgr !== null && "id" in (mgr as object) ? (mgr as { id?: string }).id ?? idx : label}
                      onClick={() => {
                        setSelectedManager(label);
                        setOpenDropdown(null);
                      }}
                      style={{
                        padding: '10px 16px',
                        cursor: 'pointer',
                        backgroundColor: selectedManager === label ? '#f3f4f6' : 'white'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedManager === label ? '#f3f4f6' : 'white'}
                    >
                      {label}
                    </div>
                  );
                })}
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
                        {profile.department_id != null ? String(profile.department_id) : "—"}
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
                            backgroundColor: "#d1fae5",
                            color: "#065f46",
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
                              backgroundColor: "#10b981",
                              
                            }}
                          />
                          {String(profile.status ?? "Active")}
                          
                        </span>
                      </td>
                      <td style={{ padding: "16px", fontSize: "14px", color: "#6b7280" }}>
                        {(profile as UserProfile & { updated_at?: string }).updated_at
                          ? moment((profile as UserProfile & { updated_at?: string }).updated_at).format(GlobalDateTimeFormat)
                          : "—"}
                      </td>
                      <td style={{ padding: "16px" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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

      {/* Create Employee Modal */}
      <Modal size="lg" show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Employee</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Company *</Form.Label>
              <Form.Select
                value={createModalCompanyUuid}
                onChange={(e) => {
                  const uuid = e.target.value;
                  setCreateModalCompanyUuid(uuid);
                  setCreateForm((f) => ({ ...f, department_id: null, user_id: "" }));
                  loadDepartmentsForCreate(uuid);
                  //loadUsersForCreate(uuid);
                }}
                required
              >
                <option value="">Select company</option>
                {createModalCompanies.map((c) => (
                  <option key={String(c.identifier ?? c.uuid ?? c.id)} value={String(c.identifier ?? c.uuid ?? c.id ?? "")}>
                    {String(c.name ?? c.uuid ?? c.id ?? "—")}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Department</Form.Label>
              <Form.Select
                value={createForm.department_id ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  const deptId = val === "" ? null : Number(val);
                  setCreateForm((f) => ({ ...f, department_id: deptId, user_id: "" }));
                }}
                
                disabled={!createModalCompanyUuid || loadingDepartments}
              >
                <option value="">Select department</option>
                {createModalDepartments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name ?? `Department ${d.id}`}
                  </option>
                ))}
              </Form.Select>
              {loadingDepartments && <Form.Text className="text-muted">Loading…</Form.Text>}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>User *</Form.Label>
              <Select<{ value: string; label: string }>
                placeholder="Select user"
                isClearable
                isDisabled={hierarchyLoading}
                options={createModalUserOptions}
                value={createModalUserOptions.find((o) => o.value === (createForm.user_id ?? "")) ?? null}
                onChange={(opt) =>
                  setCreateForm((f) => ({ ...f, user_id: opt?.value ?? "" }))
                }
              />
              {hierarchyLoading && <Form.Text className="text-muted">Loading…</Form.Text>}
              {createModalCompanyUuid && createModalExtensionsList.length === 0 && !hierarchyLoading && (
                <Form.Text className="text-muted">No extensions available.</Form.Text>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Employee Code</Form.Label>
              <Form.Control
                value={createForm.employee_code ?? ""}
                onChange={(e) => setCreateForm((f) => ({ ...f, employee_code: e.target.value }))}
                placeholder="Employee code"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Identification Number (CNIC)</Form.Label>
              <Form.Control
                value={createForm.identification_number ?? ""}
                onChange={(e) => setCreateForm((f) => ({ ...f, identification_number: e.target.value }))}
                placeholder="CNIC / ID"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Job Title</Form.Label>
              <Form.Control
                value={createForm.job_title ?? ""}
                onChange={(e) => setCreateForm((f) => ({ ...f, job_title: e.target.value }))}
                placeholder="Job title"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Location</Form.Label>
              <Form.Select
                value={createForm.location_id ?? ""}
                onChange={(e) =>
                  setCreateForm((f) => ({
                    ...f,
                    location_id: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
                disabled={loadingLocations}
              >
                <option value="">Select location</option>
                {locationsList.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name ?? `Location ${loc.id}`}
                    {loc.city || loc.country ? ` — ${[loc.city, loc.country].filter(Boolean).join(", ")}` : ""}
                  </option>
                ))}
              </Form.Select>
              {loadingLocations && <Form.Text className="text-muted">Loading locations…</Form.Text>}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Employment Type</Form.Label>
              <Form.Select
                value={createForm.employment_type ?? ""}
                onChange={(e) => setCreateForm((f) => ({ ...f, employment_type: e.target.value }))}
              >
                <option value="">Select employment type</option>
                {EMPLOYMENT_TYPES.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Contract Type</Form.Label>
              <Form.Select
                value={createForm.contract_type ?? ""}
                onChange={(e) => setCreateForm((f) => ({ ...f, contract_type: e.target.value }))}
              >
                <option value="">Select contract type</option>
                {CONTRACT_TYPES.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                value={createForm.phone ?? ""}
                onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="Phone"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={createForm.status ?? "active"}
                onChange={(e) => setCreateForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
            </Form.Group>

            {/* Addresses */}
            <div className="card em-card mb-3">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                  <div className="em-section-title mb-0">Addresses</div>
                  <Button
                    type="button"
                    variant="outline-primary"
                    size="sm"
                    onClick={() =>
                      setCreateFormAddresses((prev) => [
                        ...prev,
                        { name: "", zip_code: "", city: "", country: "", address: "" },
                      ])
                    }
                  >
                    <Plus className="me-1" size={14} />
                    Add Address
                  </Button>
                </div>
                <div className="d-flex flex-column gap-3">
                  {createFormAddresses.length === 0 ? (
                    <div className="text-muted small">No addresses added. Click &quot;Add Address&quot; to add one.</div>
                  ) : (
                    createFormAddresses.map((addr, idx) => (
                      <div key={idx} className="p-3 bg-light rounded">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div className="fw-semibold">Address #{idx + 1}</div>
                          <Button
                            type="button"
                            variant="outline-danger"
                            size="sm"
                            disabled={createFormAddresses.length <= 1}
                            onClick={() =>
                              setCreateFormAddresses((prev) => prev.filter((_, i) => i !== idx))
                            }
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <Form.Group>
                              <Form.Label>Name</Form.Label>
                              <Form.Control
                                value={addr.name ?? ""}
                                onChange={(e) =>
                                  setCreateFormAddresses((prev) =>
                                    prev.map((a, i) => (i === idx ? { ...a, name: e.target.value } : a))
                                  )
                                }
                                placeholder="e.g. Head Office"
                              />
                            </Form.Group>
                          </div>
                          <div className="col-md-6">
                            <Form.Group>
                              <Form.Label>Zip / Postal Code</Form.Label>
                              <Form.Control
                                value={addr.zip_code ?? ""}
                                onChange={(e) =>
                                  setCreateFormAddresses((prev) =>
                                    prev.map((a, i) => (i === idx ? { ...a, zip_code: e.target.value } : a))
                                  )
                                }
                                placeholder="Zip / Postal Code"
                              />
                            </Form.Group>
                          </div>
                          <div className="col-md-6">
                            <Form.Group>
                              <Form.Label>City</Form.Label>
                              <Form.Control
                                value={addr.city ?? ""}
                                onChange={(e) =>
                                  setCreateFormAddresses((prev) =>
                                    prev.map((a, i) => (i === idx ? { ...a, city: e.target.value } : a))
                                  )
                                }
                                placeholder="City"
                              />
                            </Form.Group>
                          </div>
                          <div className="col-md-6">
                            <Form.Group>
                              <Form.Label>Country</Form.Label>
                              <Form.Control
                                value={addr.country ?? ""}
                                onChange={(e) =>
                                  setCreateFormAddresses((prev) =>
                                    prev.map((a, i) => (i === idx ? { ...a, country: e.target.value } : a))
                                  )
                                }
                                placeholder="Country"
                              />
                            </Form.Group>
                          </div>
                          <div className="col-12">
                            <Form.Group>
                              <Form.Label>Address</Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={2}
                                value={addr.address ?? ""}
                                onChange={(e) =>
                                  setCreateFormAddresses((prev) =>
                                    prev.map((a, i) => (i === idx ? { ...a, address: e.target.value } : a))
                                  )
                                }
                                placeholder="Street address"
                              />
                            </Form.Group>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="text-muted small mt-2">
                  Addresses are stored as multiple Location records linked to this employee profile.
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={createSubmitting}>
              {createSubmitting ? "Creating…" : "Create"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Employee Modal - same structure as Add */}
      <Modal size="lg" show={showEditModal} onHide={() => { setShowEditModal(false); setEditingProfile(null); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Employee</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Company *</Form.Label>
              <Form.Select
                value={editModalCompanyUuid}
                onChange={(e) => {
                  const uuid = e.target.value;
                  setEditModalCompanyUuid(uuid);
                  setEditForm((f) => ({ ...f, department_id: null, user_id: "" }));
                  loadEditDepartments(uuid);
                 // loadEditUsers(uuid);
                }}
                required
              >
                <option value="">Select company</option>
                {editModalCompanies.map((c) => (
                  <option key={String(c.identifier ?? c.uuid ?? c.id)} value={String(c.identifier ?? c.uuid ?? c.id ?? "")}>
                    {String(c.name ?? c.uuid ?? c.id ?? "—")}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Department</Form.Label>
              <Form.Select
                value={editForm.department_id ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  const deptId = val === "" ? null : Number(val);
                  setEditForm((f) => ({ ...f, department_id: deptId, user_id: "" }));
                }}
                disabled={!editModalCompanyUuid || loadingEditDepartments}
              >
                <option value="">Select department</option>
                {editModalDepartments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name ?? `Department ${d.id}`}
                  </option>
                ))}
              </Form.Select>
              {loadingEditDepartments && <Form.Text className="text-muted">Loading…</Form.Text>}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>User *</Form.Label>
              <Select<{ value: string; label: string }>
                placeholder="Select user"
                isClearable
                isDisabled={hierarchyLoading}
                options={createModalUserOptions}
                value={createModalUserOptions.find((o) => o.value === (editForm.user_id ?? "")) ?? null}
                onChange={(opt) =>
                  setEditForm((f) => ({ ...f, user_id: opt?.value ?? "" }))
                }
              />
              {hierarchyLoading && <Form.Text className="text-muted">Loading…</Form.Text>}
              {editModalCompanyUuid && createModalExtensionsList.length === 0 && !hierarchyLoading && (
                <Form.Text className="text-muted">No extensions available.</Form.Text>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Employee Code</Form.Label>
              <Form.Control
                value={editForm.employee_code ?? ""}
                onChange={(e) => setEditForm((f) => ({ ...f, employee_code: e.target.value }))}
                placeholder="Employee code"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Identification Number (CNIC)</Form.Label>
              <Form.Control
                value={editForm.identification_number ?? ""}
                onChange={(e) => setEditForm((f) => ({ ...f, identification_number: e.target.value }))}
                placeholder="CNIC / ID"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Job Title</Form.Label>
              <Form.Control
                value={editForm.job_title ?? ""}
                onChange={(e) => setEditForm((f) => ({ ...f, job_title: e.target.value }))}
                placeholder="Job title"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Location</Form.Label>
              <Form.Select
                value={editForm.location_id ?? ""}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    location_id: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
                disabled={loadingLocations}
              >
                <option value="">Select location</option>
                {locationsList.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name ?? `Location ${loc.id}`}
                    {loc.city || loc.country ? ` — ${[loc.city, loc.country].filter(Boolean).join(", ")}` : ""}
                  </option>
                ))}
              </Form.Select>
              {loadingLocations && <Form.Text className="text-muted">Loading locations…</Form.Text>}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Employment Type</Form.Label>
              <Form.Select
                value={editForm.employment_type ?? ""}
                onChange={(e) => setEditForm((f) => ({ ...f, employment_type: e.target.value }))}
              >
                <option value="">Select employment type</option>
                {EMPLOYMENT_TYPES.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Contract Type</Form.Label>
              <Form.Select
                value={editForm.contract_type ?? ""}
                onChange={(e) => setEditForm((f) => ({ ...f, contract_type: e.target.value }))}
              >
                <option value="">Select contract type</option>
                {CONTRACT_TYPES.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                value={editForm.phone ?? ""}
                onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="Phone"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={editForm.status ?? "active"}
                onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
            </Form.Group>

            {/* Addresses - same as Add */}
            <div className="card em-card mb-3">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                  <div className="em-section-title mb-0">Addresses</div>
                  <Button
                    type="button"
                    variant="outline-primary"
                    size="sm"
                    onClick={() =>
                      setEditFormAddresses((prev) => [
                        ...prev,
                        { name: "", zip_code: "", city: "", country: "", address: "" },
                      ])
                    }
                  >
                    <Plus className="me-1" size={14} />
                    Add Address
                  </Button>
                </div>
                <div className="d-flex flex-column gap-3">
                  {editFormAddresses.length === 0 ? (
                    <div className="text-muted small">No addresses added. Click &quot;Add Address&quot; to add one.</div>
                  ) : (
                    editFormAddresses.map((addr, idx) => (
                      <div key={idx} className="p-3 bg-light rounded">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div className="fw-semibold">Address #{idx + 1}</div>
                          <Button
                            type="button"
                            variant="outline-danger"
                            size="sm"
                            disabled={editFormAddresses.length <= 1}
                            onClick={() =>
                              setEditFormAddresses((prev) => prev.filter((_, i) => i !== idx))
                            }
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <Form.Group>
                              <Form.Label>Name</Form.Label>
                              <Form.Control
                                value={addr.name ?? ""}
                                onChange={(e) =>
                                  setEditFormAddresses((prev) =>
                                    prev.map((a, i) => (i === idx ? { ...a, name: e.target.value } : a))
                                  )
                                }
                                placeholder="e.g. Head Office"
                              />
                            </Form.Group>
                          </div>
                          <div className="col-md-6">
                            <Form.Group>
                              <Form.Label>Zip / Postal Code</Form.Label>
                              <Form.Control
                                value={addr.zip_code ?? ""}
                                onChange={(e) =>
                                  setEditFormAddresses((prev) =>
                                    prev.map((a, i) => (i === idx ? { ...a, zip_code: e.target.value } : a))
                                  )
                                }
                                placeholder="Zip / Postal Code"
                              />
                            </Form.Group>
                          </div>
                          <div className="col-md-6">
                            <Form.Group>
                              <Form.Label>City</Form.Label>
                              <Form.Control
                                value={addr.city ?? ""}
                                onChange={(e) =>
                                  setEditFormAddresses((prev) =>
                                    prev.map((a, i) => (i === idx ? { ...a, city: e.target.value } : a))
                                  )
                                }
                                placeholder="City"
                              />
                            </Form.Group>
                          </div>
                          <div className="col-md-6">
                            <Form.Group>
                              <Form.Label>Country</Form.Label>
                              <Form.Control
                                value={addr.country ?? ""}
                                onChange={(e) =>
                                  setEditFormAddresses((prev) =>
                                    prev.map((a, i) => (i === idx ? { ...a, country: e.target.value } : a))
                                  )
                                }
                                placeholder="Country"
                              />
                            </Form.Group>
                          </div>
                          <div className="col-12">
                            <Form.Group>
                              <Form.Label>Address</Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={2}
                                value={addr.address ?? ""}
                                onChange={(e) =>
                                  setEditFormAddresses((prev) =>
                                    prev.map((a, i) => (i === idx ? { ...a, address: e.target.value } : a))
                                  )
                                }
                                placeholder="Street address"
                              />
                            </Form.Group>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="text-muted small mt-2">
                  Addresses are stored as multiple Location records linked to this employee profile.
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowEditModal(false); setEditingProfile(null); }} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={editSubmitting}>
              {editSubmitting ? "Saving…" : "Save"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

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
