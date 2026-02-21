import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import { useSession } from "next-auth/react";
import {
  getUserRequestCategories,
  getUserRequestCategoryFields,
  getUserRequests,getUserRequest,
  updateUserRequest,
  deleteUserRequest,
  downloadUserRequestAttachment,
  type UserRequestCategory,
  type UserRequestCategoryField,
  type UserRequest,
} from "@utils/staffManagement";
import { useMainAppLookups } from "@hooks/useMainAppLookups";
import { toast } from "react-toastify";
import { Badge, Button, Modal, Form } from "react-bootstrap";

import {
  Search,
  ChevronDown,
  FileText,
  Calendar,
  UserPlus,
  User,
  File,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Pencil,
  Trash2,
  Download,
} from "lucide-react";
import ApprovalDetailSidebar from "./sidebar";
import DeleteConfirmationModal from "../../partial/DeleteConfirmationModal";
import NewRequestModal from "@pages/staff-management/NewRequestModal";

const TAB_TO_STATUS: Record<string, string> = {
  Pending: "pending",
  Approved: "approved",
  Rejected: "rejected",
};

function formatRequestDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "—";
  }
}

function formatRequestDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return "—";
  }
}

function getAgingLabel(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    const days = Math.floor((Date.now() - d.getTime()) / (24 * 60 * 60 * 1000));
    if (days < 1) return "Less than 1 day";
    if (days <= 3) return "1-3 days";
    if (days <= 7) return "3-7 days";
    return "7d+";
  } catch {
    return "—";
  }
}

function getDateRangeForOption(option: string): { start_date_from: string; start_date_to: string } | null {
  if (!option?.trim()) return null;
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  const toStr = to.toISOString().slice(0, 10);
  const from = new Date(now);
  switch (option.trim()) {
    case "Today":
      from.setHours(0, 0, 0, 0);
      return { start_date_from: toStr, start_date_to: toStr };
    case "Last 7 days":
      from.setDate(from.getDate() - 7);
      break;
    case "Last 30 days":
      from.setDate(from.getDate() - 30);
      break;
    case "Last 3 months":
      from.setMonth(from.getMonth() - 3);
      break;
    case "All time":
    default:
      return null;
  }
  from.setHours(0, 0, 0, 0);
  const fromStr = from.toISOString().slice(0, 10);
  return { start_date_from: fromStr, start_date_to: toStr };
}

const ApprovalRequest = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const { mainAppUsers } = useMainAppLookups();

  const getDisplayName = useCallback(
    (userId: string | number | null | undefined): string => {
      if (userId == null || userId === "") return "—";
      const idStr = String(userId);
      const u = mainAppUsers?.find((x) => String(x.id) === idStr);
      return u?.name ?? idStr;
    },
    [mainAppUsers]
  );

  const [activeTab, setActiveTab] = useState<"All" | "Pending" | "Approved" | "Rejected">("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedRequestedByUserId, setSelectedRequestedByUserId] = useState<string | null>(null);
  const [requestedBySearchTerm, setRequestedBySearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedAging, setSelectedAging] = useState("");
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showRequestedByDropdown, setShowRequestedByDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showAgingDropdown, setShowAgingDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null);

  const [categories, setCategories] = useState<UserRequestCategory[]>([]);
  const [categoryFields, setCategoryFields] = useState<Record<number, UserRequestCategoryField[]>>({});
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestsPagination, setRequestsPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    last_page: number;
  } | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<UserRequest | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState<UserRequest | null>(null);
  const [editForm, setEditForm] = useState<{
    subject: string;
    reason: string;
    dynamic_fields: Record<string, unknown>;
    dynamic_files: Record<string, File | null>;
    attachments: File[];
  }>({ subject: "", reason: "", dynamic_fields: {}, dynamic_files: {}, attachments: [] });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const loadCategories = useCallback(
    async () => {
      setLoadingCategories(true);
      try {
        const { data } = await getUserRequestCategories({ limit: 1000 });
        setCategories(data ?? []);
        setCategoryFields({});
        if (data?.length) {
          const fieldsByCategory = await Promise.all(
            data.map(async (cat) => {
              try {
                const fields = await getUserRequestCategoryFields(cat.id);
                return { id: cat.id, fields };
              } catch {
                return { id: cat.id, fields: [] };
              }
            })
          );
          const map: Record<number, UserRequestCategoryField[]> = {};
          fieldsByCategory.forEach(({ id, fields }) => {
            map[id] = fields ?? [];
          });
          setCategoryFields(map);
        }
      } catch {
        setCategories([]);
        setCategoryFields({});
      } finally {
        setLoadingCategories(false);
      }
    },
    []
  );

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const loadRequests = useCallback(
    async (page = 1) => {
      setLoadingRequests(true);
      try {
        const status = TAB_TO_STATUS[activeTab] ?? "";
        const params: Record<string, unknown> = {
          page,
          limit: 10,
          status,
        };
        if (searchTerm?.trim()) params.search = searchTerm.trim();
        const category = selectedType ? categories.find((c) => (c.name ?? c.code ?? String(c.id)) === selectedType) : undefined;
        if (category?.id != null) params.user_request_category_id = category.id;
        if (selectedRequestedByUserId != null && selectedRequestedByUserId.trim())
          params.user_ids = [selectedRequestedByUserId.trim()];
        const dateRange = getDateRangeForOption(selectedDate ?? "");
        if (dateRange) {
          params.created_at_from = dateRange.start_date_from;
          params.created_at_to = dateRange.start_date_to;
        }
        const { data, pagination: p } = await getUserRequests(params);
        setRequests(data ?? []);
        if (p) setRequestsPagination({ page: p.page, limit: p.limit, total: p.total, last_page: p.last_page });
        else setRequestsPagination(null);
      } catch {
        setRequests([]);
        setRequestsPagination(null);
      } finally {
        setLoadingRequests(false);
      }
    },
    [activeTab, searchTerm, selectedType, selectedRequestedByUserId, selectedDate, categories]
  );

  useEffect(() => {
    loadRequests(currentPage);
  }, [currentPage, loadRequests]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRequestedByUserId, selectedDate]);

  // Open sidebar when navigating from notification with ?openId= (target_id)
  useEffect(() => {
    if (!router.isReady || !router.query.openId) return;
    const openId = router.query.openId;
    const id = typeof openId === "string" ? openId : Array.isArray(openId) ? openId[0] : undefined;
    if (!id || Number.isNaN(Number(id))) return;
    let cancelled = false;
    (async () => {
      try {
        const request = await getUserRequest(Number(id));
        if (!cancelled && request) setSelectedRequest(request);
      } catch {
        // ignore
      } finally {
        if (!cancelled) {
          const { openId: _, ...rest } = router.query;
          router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
        }
      }
    })();
    return () => { cancelled = true; };
  }, [router.isReady, router.query.openId]);

  const refreshRequests = useCallback(() => {
    loadRequests(currentPage);
  }, [loadRequests, currentPage]);

  const handleDeleteRequest = useCallback(
    async (request: UserRequest, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!globalThis.confirm("Delete this request? This action cannot be undone.")) return;
      try {
        await deleteUserRequest(request.id);
        toast.success("Request deleted");
        refreshRequests();
        if (selectedRequest?.id === request.id) setSelectedRequest(null);
      } catch {
        // toast handled in API
      }
    },
    [refreshRequests, selectedRequest?.id]
  );

  const openCreateModal = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const openEditModal = useCallback((request: UserRequest) => {
    setSelectedRequest(null);
    setEditingRequest(request);
    const df =
      request.dynamic_fields && typeof request.dynamic_fields === "object"
        ? request.dynamic_fields
        : {};
    setEditForm({
      subject: String(request.subject ?? ""),
      reason: String(request.reason ?? ""),
      dynamic_fields: { ...df },
      dynamic_files: {},
      attachments: [],
    });
    setShowEditModal(true);
  }, []);

  const handleEditSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingRequest || !editForm.subject.trim()) {
        toast.error("Subject is required");
        return;
      }
      setEditSubmitting(true);
      try {
        const dynamic_files: Record<string, File> = {};
        Object.entries(editForm.dynamic_files).forEach(([key, file]) => {
          if (file) dynamic_files[key] = file;
        });
        await updateUserRequest(editingRequest.id, {
          subject: editForm.subject.trim(),
          reason: editForm.reason.trim() || null,
          dynamic_fields:
            Object.keys(editForm.dynamic_fields).length > 0 ? editForm.dynamic_fields : undefined,
          ...(Object.keys(dynamic_files).length > 0 ? { dynamic_files } : {}),
          ...(editForm.attachments.length > 0 ? { files: editForm.attachments } : {}),
        });
        toast.success("Request updated");
        setShowEditModal(false);
        setEditingRequest(null);
        refreshRequests();
      } catch {
        // toast handled in API
      } finally {
        setEditSubmitting(false);
      }
    },
    [editingRequest, editForm, refreshRequests]
  );

  const typeOptionsFromCategories = useMemo(() => categories.map((c) => c.name ?? c.code ?? String(c.id)), [categories]);

  const types = typeOptionsFromCategories.length > 0 ? typeOptionsFromCategories : ["Leave", "Document", "Onboarding", "Profile"];
  const requestedByUsers = Array.isArray(mainAppUsers) ? mainAppUsers : [];
  const selectedRequestedByName =
    selectedRequestedByUserId != null
      ? (requestedByUsers.find((u) => String(u.id) === selectedRequestedByUserId)?.name ?? selectedRequestedByUserId)
      : "";
  const dateOptions = ["Today","Last 7 days", "Last 30 days", "Last 3 months", "All time"];
  const agingOptions = ["Less than 1 day", "1-3 days", "3-7 days", "More than 7 days"];

  const totalPages = requestsPagination?.last_page ?? 1;
  const totalRequests = requestsPagination?.total ?? 0;

  const getCategoryName = (categoryId: number | string | null): string => {
    if (categoryId == null || categoryId === "") return "—";
    const id = Number(categoryId);
    const cat = categories.find((c) => Number(c.id) === id);
    return cat?.name ?? cat?.code ?? String(categoryId);
  };

  const getTypeIconFromCategory = (categoryId: number | null): string => {
    const name = getCategoryName(categoryId).toLowerCase();
    if (name.includes("leave")) return "leave";
    if (name.includes("document")) return "document";
    if (name.includes("onboarding")) return "onboarding";
    if (name.includes("profile")) return "profile";
    return "file";
  };
  
    const getTypeIcon = (iconType: string) => {
      switch (iconType) {
        case 'leave':
          return <Calendar size={16} color="#6366f1" />;
        case 'document':
          return <FileText size={16} color="#8b5cf6" />;
        case 'onboarding':
          return <UserPlus size={16} color="#10b981" />;
        case 'profile':
          return <User size={16} color="#6366f1" />;
        default:
          return <File size={16} color="#6b7280" />;
      }
    };
  
    const getTypeColor = (type: string) => {
      switch (type) {
        case 'Leave':
          return '#dbeafe';
        case 'Document':
          return '#f3e8ff';
        case 'Onboarding':
          return '#d1fae5';
        case 'Profile':
          return '#dbeafe';
        default:
          return '#f3f4f6';
      }
    };
  

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Customer Dashboard" />
      <div >
      <div >
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}>
          <h1 style={{ fontSize: "28px", fontWeight: "600", color: "#111827", margin: 0 }}>
            Approval Requests
          </h1>
          {session?.user?.permissions?.includes('add-approval-request-staff-management') && (
          <button
            type="button"
            onClick={openCreateModal}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              backgroundColor: categories.length === 0 ? "#e5e7eb" : "#6366f1",
              color: categories.length === 0 ? "#9ca3af" : "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: categories.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            <Plus size={18} />
            New Request
          </button>
          )}
        </div>
        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '24px',
          borderBottom: '2px solid #e5e7eb'
        }}>
          {(['All','Pending', 'Approved', 'Rejected'] as const).map(tab => (
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

        {/* Filters */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "24px",
          alignItems: "center",
        }}>
          {/* Search Bar */}
          <div style={{ position: "relative", flex: "1 1 300px", minWidth: "250px" }}>
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
              placeholder="Search keyword ..."
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

          {/* Type Filter */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowTypeDropdown(!showTypeDropdown)}
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
                minWidth: '140px',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} />
                <span>{selectedType || 'Type'}</span>
              </div>
              <ChevronDown size={16} />
            </button>
            {showTypeDropdown && (
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
                <div
                  onClick={() => {
                    setSelectedType('');
                    setShowTypeDropdown(false);
                  }}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#6366f1'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  All Types
                </div>
                {types.map(type => (
                  <div
                    key={type}
                    onClick={() => {
                      setSelectedType(type);
                      setShowTypeDropdown(false);
                    }}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      backgroundColor: selectedType === type ? '#f3f4f6' : 'white'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedType === type ? '#f3f4f6' : 'white'}
                  >
                    {type}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Requested By Filter */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowRequestedByDropdown(!showRequestedByDropdown)}
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
                minWidth: '160px',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={16} />
                <span>{selectedRequestedByName || 'Requested by'}</span>
              </div>
              <ChevronDown size={16} />
            </button>
            {showRequestedByDropdown && (
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
                    value={requestedBySearchTerm}
                    onChange={(e) => setRequestedBySearchTerm(e.target.value)}
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
                      setSelectedRequestedByUserId(null);
                      setShowRequestedByDropdown(false);
                      setRequestedBySearchTerm('');
                    }}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#6366f1',
                      backgroundColor: selectedRequestedByUserId === null ? '#f3f4f6' : 'white'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedRequestedByUserId === null ? '#f3f4f6' : 'white'}
                  >
                    All Users
                  </div>
                  {requestedByUsers
                    .filter((u) => !requestedBySearchTerm.trim() || (u.name?.toLowerCase().includes(requestedBySearchTerm.trim().toLowerCase()) ?? false))
                    .map((u) => {
                      const uid = String(u.id);
                      const isSelected = selectedRequestedByUserId != null && uid === selectedRequestedByUserId;
                      return (
                        <div
                          key={u.id}
                          onClick={() => {
                            setSelectedRequestedByUserId(uid);
                            setShowRequestedByDropdown(false);
                            setRequestedBySearchTerm('');
                          }}
                          style={{
                            padding: '10px 16px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            backgroundColor: isSelected ? '#f3f4f6' : 'white'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isSelected ? '#f3f4f6' : 'white'}
                        >
                          {u.name}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* All Dates Filter */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDateDropdown(!showDateDropdown)}
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
                minWidth: '140px',
                justifyContent: 'space-between'
              }}
            >
              <span>{selectedDate || 'All Dates'}</span>
              <ChevronDown size={16} />
            </button>
            {showDateDropdown && (
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
                minWidth: '180px'
              }}>
                <div
                  onClick={() => {
                    setSelectedDate('');
                    setShowDateDropdown(false);
                  }}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#6366f1'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  All Dates
                </div>
                {dateOptions.map(option => (
                  <div
                    key={option}
                    onClick={() => {
                      setSelectedDate(option);
                      setShowDateDropdown(false);
                    }}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      backgroundColor: selectedDate === option ? '#f3f4f6' : 'white'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedDate === option ? '#f3f4f6' : 'white'}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Aging Filter */}
          {/* <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowAgingDropdown(!showAgingDropdown)}
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
                minWidth: '140px',
                justifyContent: 'space-between'
              }}
            >
              <span>{selectedAging || 'All Aging'}</span>
              <ChevronDown size={16} />
            </button>
            {showAgingDropdown && (
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
                minWidth: '180px'
              }}>
                <div
                  onClick={() => {
                    setSelectedAging('');
                    setShowAgingDropdown(false);
                  }}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#6366f1'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  All Aging
                </div>
                {agingOptions.map(option => (
                  <div
                    key={option}
                    onClick={() => {
                      setSelectedAging(option);
                      setShowAgingDropdown(false);
                    }}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      backgroundColor: selectedAging === option ? '#f3f4f6' : 'white'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedAging === option ? '#f3f4f6' : 'white'}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div> */}

          <button
            onClick={() => {
              setCurrentPage(1);
              loadRequests(1);
            }}
            style={{
              padding: "10px 24px",
              backgroundColor: "#6366f1",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              marginLeft: "auto",
            }}
          >
            Search
          </button>
        </div>

        

        {/* Inbox Header */}
        {/* <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
              Inbox
            </h2>
            <div style={{
              padding: '4px 12px',
              backgroundColor: '#e5e7eb',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                {totalRequests}
              </span>
            </div>
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            {totalRequests} {activeTab}
          </div>
        </div> */}

        {/* Requests Table */}
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
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Request</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Type
                      <ChevronDown size={14} />
                    </div>
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Requested By</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Submitted On</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Aging
                      <ChevronDown size={14} />
                    </div>
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Status</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Approved/Rejected By</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Approved/Rejected On</th>
                 
                </tr>
              </thead>
              <tbody>
                {loadingRequests ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "#6b7280" }}>
                      Loading…
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "#6b7280" }}>
                      No requests
                    </td>
                  </tr>
                ) : (
                  requests.map((request, index) => {
                    const created_at = (request as UserRequest & { created_at?: string }).created_at;
                    const categoryName = getCategoryName(request.user_request_category_id);
                    const typeIcon = getTypeIconFromCategory(request.user_request_category_id);
                    return (
                      <tr
                        key={request.id}
                        onClick={() => {
                          setSelectedRequest(request);
                          getUserRequest(request.id).then((request) => {
                            setSelectedRequest(request);
                          });
                        }}
                        style={{
                          borderBottom: index < requests.length - 1 ? "1px solid #f3f4f6" : "none",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                      >
                        <td style={{ padding: "16px" }}>
                          <div style={{ fontSize: "14px", fontWeight: "500", color: "#1f2937", marginBottom: "4px" }}>
                            {request.subject ?? "—"}
                          </div>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4px 10px",
                              backgroundColor: getTypeColor(categoryName),
                              borderRadius: "6px",
                            }}
                          >
                            {getTypeIcon(typeIcon)}
                            <span style={{ fontSize: "13px", fontWeight: "500", color: "#1f2937" }}>
                              {categoryName}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <div style={{ fontSize: "14px", color: "#1f2937", marginBottom: "4px" }}>
                            {getDisplayName(request.user_id)}
                          </div>
                        </td>
                        <td style={{ padding: "16px", fontSize: "14px", color: "#1f2937" }}>
                          {formatRequestDate(created_at)}
                        </td>
                        <td style={{ padding: "16px" }}>
                          <span
                            style={{
                              padding: "4px 12px",
                              backgroundColor: "#fef3c7",
                              color: "#92400e",
                              borderRadius: "16px",
                              fontSize: "13px",
                              fontWeight: "500",
                            }}
                          >
                            {getAgingLabel(created_at)}
                          </span>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <Badge
                            bg={
                              request.status?.toLowerCase() === "approved"
                                ? "success"
                                : request.status?.toLowerCase() === "rejected"
                                  ? "danger"
                                  : "info"
                            }
                            className="text-capitalize"
                          >
                            {request.status}
                          </Badge>
                        </td>
                        <td style={{ padding: "16px" }}>
                          {getDisplayName(request.approved_by_user_id)}
                        </td>
                        <td style={{ padding: "16px" }}>
                          {formatRequestDate(request.approved_at)}
                        </td>
                       
                      </tr>
                    );
                  })
                )}
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
              Showing {totalRequests === 0 ? 0 : ((currentPage - 1) * (requestsPagination?.limit ?? 10)) + 1}-
              {Math.min(currentPage * (requestsPagination?.limit ?? 10), totalRequests)} of {totalRequests} requests
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
      </div>

      <NewRequestModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onSuccess={refreshRequests}
        title="New Request"
        submitLabel="Create Request"
      />

      {/* Edit Request Modal */}
      <Modal show={showEditModal} onHide={() => { setShowEditModal(false); setEditingRequest(null); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Request</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>
            {editingRequest && (
              <>
                {/* <Form.Group className="mb-3">
                  <Form.Label>Created at</Form.Label>
                  <Form.Control
                    type="text"
                    value={formatRequestDateTime((editingRequest as { created_at?: string }).created_at)}
                    readOnly
                    disabled
                    className="bg-light"
                  />
                </Form.Group> */}
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    value={editingRequest.user_request_category_id ?? ""}
                    disabled
                    className="bg-light"
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name ?? c.code ?? `Category ${c.id}`}
                      </option>
                    ))}
                    {editingRequest.user_request_category_id != null &&
                      !categories.some((c) => c.id === editingRequest.user_request_category_id) && (
                      <option value={editingRequest.user_request_category_id}>
                        {getCategoryName(editingRequest.user_request_category_id)}
                      </option>
                    )}
                  </Form.Select>
                </Form.Group>
              </>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Subject *</Form.Label>
              <Form.Control
                type="text"
                value={editForm.subject}
                onChange={(e) => setEditForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="Request subject"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Reason</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editForm.reason}
                onChange={(e) => setEditForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="Optional reason or description"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Attachments</Form.Label>
              {editingRequest && (editingRequest.attachments ?? []).length > 0 && (
                <div className="mb-2 p-2 border rounded bg-light">
                  <div className="small text-muted mb-2">Current attachments</div>
                  {(editingRequest.attachments ?? []).map((att) => (
                    <div
                      key={att.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "6px 8px",
                        backgroundColor: "white",
                        borderRadius: "6px",
                        marginBottom: "4px",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
                        <FileText size={16} color="#6b7280" />
                        <span className="text-truncate" style={{ fontSize: "13px" }}>
                          {att.original_name || "Attachment"}
                        </span>
                        {(att.mime_type ?? att.size_bytes) && (
                          <span className="text-muted" style={{ fontSize: "12px" }}>
                            {att.mime_type ?? ""}
                            {att.size_bytes != null && ` • ${(att.size_bytes / 1024).toFixed(1)} KB`}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const blob = await downloadUserRequestAttachment(att.id);
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = att.original_name || "attachment";
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            toast.success("Download started");
                          } catch {
                            toast.error("Download failed");
                          }
                        }}
                        style={{
                          padding: "4px 8px",
                          border: "none",
                          borderRadius: "4px",
                          backgroundColor: "#f3f4f6",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                        }}
                        title="Download"
                      >
                        <Download size={14} color="#6b7280" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <Form.Control
                type="file"
                multiple
                onChange={(e) => {
                  const files = (e.target as HTMLInputElement).files;
                  setEditForm((f) => ({
                    ...f,
                    attachments: files ? Array.from(files) : [],
                  }));
                }}
              />
              {editForm.attachments.length > 0 && (
                <Form.Text className="d-block mt-1 text-muted">
                  {editForm.attachments.length} new file(s) selected: {editForm.attachments.map((f) => f.name).join(", ")}
                </Form.Text>
              )}
            </Form.Group>
            {editingRequest &&
              (editingRequest.user_request_category_id != null) &&
              (categoryFields[editingRequest.user_request_category_id] ?? []).length > 0 && (
              <Form.Group className="mb-3">
                <Form.Label>Additional fields</Form.Label>
                <div className="border rounded p-3 bg-light">
                  {(categoryFields[editingRequest.user_request_category_id] ?? []).map((field) => (
                    <div key={field.id} className="mb-2">
                      <Form.Label className="small mb-1">
                        {field.label ?? field.key}
                        {field.required && " *"}
                      </Form.Label>
                      {field.type === "textarea" ? (
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={(editForm.dynamic_fields[field.key ?? ""] as string) ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              dynamic_fields: { ...f.dynamic_fields, [field.key ?? ""]: e.target.value },
                            }))
                          }
                          placeholder={field.config?.placeholder ?? undefined}
                        />
                      ) : (field.type === "file" || (field as { type: string }).type === "attachment") ? (
                        <Form.Control
                          type="file"
                          onChange={(e) => {
                            const file = (e.target as HTMLInputElement).files?.[0] ?? null;
                            setEditForm((f) => ({
                              ...f,
                              dynamic_files: { ...f.dynamic_files, [field.key ?? ""]: file },
                            }));
                          }}
                        />
                      ) : field.type === "select" ? (
                        <Form.Select
                          value={(editForm.dynamic_fields[field.key ?? ""] as string) ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              dynamic_fields: { ...f.dynamic_fields, [field.key ?? ""]: e.target.value },
                            }))
                          }
                        >
                          <option value="">Select...</option>
                          {(field.options ?? []).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </Form.Select>
                      ) : field.type === "multiselect" ? (
                        <Form.Select
                          multiple
                          value={
                            Array.isArray(editForm.dynamic_fields[field.key ?? ""])
                              ? (editForm.dynamic_fields[field.key ?? ""] as string[])
                              : typeof editForm.dynamic_fields[field.key ?? ""] === "string"
                                ? (editForm.dynamic_fields[field.key ?? ""] as string).split(",").filter(Boolean)
                                : []
                          }
                          onChange={(e) => {
                            const selected = Array.from((e.target as HTMLSelectElement).selectedOptions, (o) => o.value);
                            setEditForm((f) => ({
                              ...f,
                              dynamic_fields: { ...f.dynamic_fields, [field.key ?? ""]: selected },
                            }));
                          }}
                        >
                          {(field.options ?? []).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </Form.Select>
                      ) : field.type === "radio" ? (
                        <div className="d-flex flex-wrap gap-2">
                          {(field.options ?? []).map((opt) => (
                            <Form.Check
                              key={opt.value}
                              type="radio"
                              id={`edit-${field.key}-${opt.value}`}
                              name={field.key ?? ""}
                              label={opt.label}
                              value={opt.value}
                              checked={(editForm.dynamic_fields[field.key ?? ""] as string) === opt.value}
                              onChange={() =>
                                setEditForm((f) => ({
                                  ...f,
                                  dynamic_fields: { ...f.dynamic_fields, [field.key ?? ""]: opt.value },
                                }))
                              }
                            />
                          ))}
                        </div>
                      ) : field.type === "checkbox" ? (
                        <div className="d-flex flex-wrap gap-2">
                          {(field.options ?? []).map((opt) => {
                            const arr = (Array.isArray(editForm.dynamic_fields[field.key ?? ""])
                              ? (editForm.dynamic_fields[field.key ?? ""] as string[])
                              : []) as string[];
                            const checked = arr.includes(opt.value);
                            return (
                              <Form.Check
                                key={opt.value}
                                type="checkbox"
                                id={`edit-${field.key}-${opt.value}`}
                                label={opt.label}
                                checked={checked}
                                onChange={() => {
                                  const next = checked ? arr.filter((v) => v !== opt.value) : [...arr, opt.value];
                                  setEditForm((f) => ({
                                    ...f,
                                    dynamic_fields: { ...f.dynamic_fields, [field.key ?? ""]: next },
                                  }));
                                }}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <Form.Control
                          type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                          value={(editForm.dynamic_fields[field.key ?? ""] as string) ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              dynamic_fields: { ...f.dynamic_fields, [field.key ?? ""]: e.target.value },
                            }))
                          }
                          placeholder={field.config?.placeholder ?? undefined}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowEditModal(false); setEditingRequest(null); }} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={editSubmitting}>
              {editSubmitting ? "Saving…" : "Save"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Approval Detail Sidebar */}
      {selectedRequest && (
        <div
          onClick={() => setSelectedRequest(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <ApprovalDetailSidebar
              request={selectedRequest}
              categoryName={getCategoryName(selectedRequest.user_request_category_id)}
              onClose={() => setSelectedRequest(null)}
              onSuccess={refreshRequests}
              onEditClick={openEditModal}
              
              onDeleteClick={(request) => {
                setRequestToDelete(request);
                setSelectedRequest(null);
                setShowDeleteModal(true);
              }}
              downloadAttachment={downloadUserRequestAttachment}
            />
          </div>
        </div>
      )}

      {/* Delete request confirmation modal */}
      <DeleteConfirmationModal
        show={showDeleteModal && !!requestToDelete}
        onHide={() => {
          setShowDeleteModal(false);
          setRequestToDelete(null);
        }}
        onConfirm={async () => {
          if (!requestToDelete) return;
          setDeleting(true);
          try {
            await deleteUserRequest(requestToDelete.id);
            toast.success("Request deleted");
            refreshRequests();
            setShowDeleteModal(false);
            setRequestToDelete(null);
          } catch {
            // toast handled in API
          } finally {
            setDeleting(false);
          }
        }}
        itemName={requestToDelete?.subject ?? (requestToDelete ? `Request #${requestToDelete.id}` : undefined)}
        itemType="request"
        loading={deleting}
      />
    </div>

    </React.Fragment>
  );
};

ApprovalRequest.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ApprovalRequest;
