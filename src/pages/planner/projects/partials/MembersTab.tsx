import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Spinner, Button, Modal, Form } from 'react-bootstrap';
import Select from 'react-select';
import { UserPlus, Edit, Trash2, Users, Filter } from 'lucide-react';
import { addMember, updateMemberRole, removeMember } from '@utils/tasks';
import GenericTable, { TableColumn, TableAction, ToolbarConfig, FilterPill } from '@components/GenericTable';
import type { StatsCardData } from '@components/GenericStatsCards';
import DeleteConfirmationModal from '@pages/partial/DeleteConfirmationModal';

interface MembersTabProps {
  selectedProject: any;
  members: any[];
  loading: boolean;
  onRefresh: () => void;
  styles: any;
  hierarchyDataExtensions: any[];
  /** From parent: admin / owner per `canAdministerProjectFromMembers` (not granted to member/viewer). */
  canManageProject: boolean;
}

const AVATAR_COLORS = ['#48bb78', '#f56565', '#4299e1', '#ed64a6', '#667eea', '#9f7aea', '#fc8181', '#ed8936'];

/** API uses lowercase roles; edit `<select>` must include every role that can appear on a row (e.g. `viewer`) or the controlled value stays stale. */
const PROJECT_MEMBER_ROLE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'member', label: 'Member' },
  { value: 'admin', label: 'Admin' },
  { value: 'viewer', label: 'Viewer' },
];

/** Coerce API role to string without `String(object)` → `[object Object]`. */
function memberRoleRawToTrimmedString(raw: unknown): string {
  if (typeof raw === 'string') {
    return raw;
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return String(raw);
  }
  return 'member';
}

function normalizeMemberRoleForForm(raw: unknown): string {
  const r = memberRoleRawToTrimmedString(raw).trim().toLowerCase();
  const allowed = new Set(['member', 'admin', 'manager', 'viewer', 'owner']);
  return allowed.has(r) ? r : 'member';
}

const MembersTab: React.FC<MembersTabProps> = ({
  selectedProject,
  members,
  loading,
  onRefresh,
  styles: _styles,
  hierarchyDataExtensions,
  canManageProject,
}) => {
  const isAllow = canManageProject;
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [formData, setFormData] = useState({ extension_number: '', role: 'member' });
  const [processing, setProcessing] = useState(false);

  // Pagination and search states
  const [pagination, setPagination] = useState({
    currentPage: 1,
    rowsPerPage: 15,
    sortBy: '',
    sortOrder: 'asc' as 'asc' | 'desc',
  });
  const [searchValue, setSearchValue] = useState('');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectedColumns] = useState<string[]>(['member', 'extension_number', 'role']);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const getInitials = (name: string) => {
    const clean = String(name || '').trim();
    if (!clean) return 'UN';
    return clean.split(' ').filter(Boolean).map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const extensionByNumber = useMemo(() => {
    const map = new Map<string, any>();
    (hierarchyDataExtensions || []).forEach((ext: any) => {
      const key = String(ext?.extension_number || ext?.id || '').trim();
      if (key) map.set(key, ext);
    });
    return map;
  }, [hierarchyDataExtensions]);

  const resolveMemberUser = (member: any) => {
    const extNum = String(member?.extension_number || '').trim();
    const hierarchyExt = extNum ? extensionByNumber.get(extNum) : null;
    const name =
      member?.user?.name ||
      member?.user?.display_name ||
      hierarchyExt?.user?.name ||
      hierarchyExt?.name ||
      extNum ||
      'Unknown';
    const email = member?.user?.email || hierarchyExt?.user?.email || '';
    return { name: String(name), email: email ? String(email) : '' };
  };

  const getRoleColors = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'owner':
        return { bg: '#FEE2E2', color: '#991B1B' };
      case 'admin':
        return { bg: '#FEF3C7', color: '#92400E' };
      case 'manager':
        return { bg: '#DBEAFE', color: '#1E40AF' };
      case 'viewer':
        return { bg: '#F3E8FF', color: '#6B21A8' };
      default:
        return { bg: '#E5E7EB', color: '#4B5563' };
    }
  };

  // ── Enrich members with resolved display fields ───────────────────────────
  const enrichedMembers = useMemo(() =>
    members.map((member, index) => {
      const resolved = resolveMemberUser(member);
      return {
        ...member,
        _displayName: resolved.name,
        _email: resolved.email,
        _initials: getInitials(resolved.name),
        _avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
        _roleColors: getRoleColors(member.role),
      };
    }),
    [members, extensionByNumber]
  );

  // ── GenericTable columns ──────────────────────────────────────────────────
  const columns: TableColumn[] = [
    {
      key: 'member',
      label: 'Member',
      sortable: true,
      render: (row: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            backgroundColor: row._avatarColor, color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.875rem', fontWeight: '600', flexShrink: 0,
          }}>
            {row._initials}
          </div>
          <div>
            <div style={{ fontWeight: '500', color: '#1F2937' }}>{row._displayName}</div>
            {row._email && (
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{row._email}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'extension_number',
      label: 'Extension',
      sortable: true,
      render: (row: any) => (
        <span style={{ color: '#4B5563', fontFamily: 'monospace' }}>
          {row.extension_number}
        </span>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (row: any) => (
        <span style={{
          padding: '0.25rem 0.75rem',
          backgroundColor: row._roleColors.bg,
          color: row._roleColors.color,
          borderRadius: '6px',
          fontSize: '0.75rem',
          fontWeight: '600',
          display: 'inline-block',
          textTransform: 'capitalize',
        }}>
          {row.role || 'Member'}
        </span>
      ),
    },
  ];

  // ── GenericTable actions ──────────────────────────────────────────────────
  const actions: TableAction[] = isAllow ? [
    {
      label: 'Edit Role',
      icon: <Edit size={16} />,
      variant: 'link',
      className: 'text-secondary p-1',
      onClick: (row: any) => {
        setSelectedMember(row);
        setFormData({
          extension_number: row.extension_number,
          role: normalizeMemberRoleForForm(row.role),
        });
        setShowEditModal(true);
      },
    },
    {
      label: 'Remove Member',
      icon: <Trash2 size={16} />,
      variant: 'link',
      className: 'text-danger p-1',
      onClick: (row: any) => {
        setSelectedMember(row);
        setShowDeleteModal(true);
      },
    },
  ] : [];

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const extensionOptions = useMemo(() =>
    (hierarchyDataExtensions || [])
      .map((ext: any) => ({
        value: String(ext?.extension_number || ext?.id || '').trim(),
        label: String(ext?.user?.name || ext?.name || '').trim() || String(ext?.extension_number || ext?.id || 'Unknown'),
      }))
      .filter((opt: any) => opt.value)
      .filter((opt: any) => !members.some((m: any) => String(m.extension_number || '').trim() === opt.value)),
    [hierarchyDataExtensions, members]
  );

  const allExtensionOptions = useMemo(() =>
    (hierarchyDataExtensions || []).map((ext: any) => ({
      value: String(ext?.extension_number || ext?.id || '').trim(),
      label: String(ext?.user?.name || ext?.name || ext?.extension_number || ext?.id || 'Unknown').trim(),
    })).filter((o: any) => o.value),
    [hierarchyDataExtensions]
  );

  const selectedExtensionOption = useMemo(() =>
    extensionOptions.find((opt: any) => String(opt.value) === String(formData.extension_number)) || null,
    [formData.extension_number, extensionOptions]
  );

  const selectedMemberOptionForEdit = useMemo(() => {
    const extNum = String(selectedMember?.extension_number || '').trim();
    if (!extNum) return null;
    const resolved = resolveMemberUser(selectedMember);
    const found = allExtensionOptions.find((o: any) => String(o.value) === extNum);
    if (found) {
      return found;
    }
    const label = resolved.name === extNum ? extNum : `${resolved.name} (${extNum})`;
    return { value: extNum, label };
  }, [selectedMember, allExtensionOptions]);

  const removeMemberModalItemName = useMemo(() => {
    if (selectedMember) {
      return resolveMemberUser(selectedMember).name;
    }
    if (selectedItems.length > 0) {
      return `${selectedItems.length} selected members`;
    }
    return undefined;
  }, [selectedMember, selectedItems.length]);

  const removeMemberModalAdditionalInfo =
    selectedMember && String(selectedMember.extension_number || '').trim() ? (
      <p className="text-muted small mb-0">
        Extension <span className="font-monospace">{String(selectedMember.extension_number)}</span>
      </p>
    ) : undefined;

  const reactSelectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      minHeight: '38px',
      borderColor: state.isFocused ? '#4680FF' : '#E5E9F2',
      boxShadow: state.isFocused ? '0 0 0 1px #4680FF' : 'none',
      '&:hover': { borderColor: '#4680FF' },
    }),
    placeholder: (base: any) => ({ ...base, color: '#9CA3AF' }),
    singleValue: (base: any) => ({ ...base, color: '#1F2937', fontWeight: '500' }),
    input: (base: any) => ({ ...base, color: '#1F2937' }),
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
  };

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  const handleAddMember = async () => {
    if (!canManageProject || !selectedProject?.id || !formData.extension_number) return;
    try {
      setProcessing(true);
      await addMember(selectedProject.id, { extension_number: formData.extension_number, role: formData.role } as any);
      setShowAddModal(false);
      setFormData({ extension_number: '', role: 'member' });
      onRefresh();
    } catch (error) {
      console.error('Error adding member:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!canManageProject || !selectedProject?.id || !selectedMember || !formData.role) return;
    try {
      setProcessing(true);
      await updateMemberRole(selectedProject.id, selectedMember.extension_number, { role: formData.role });
      setShowEditModal(false);
      setSelectedMember(null);
      setFormData({ extension_number: '', role: 'member' });
      onRefresh();
    } catch (error) {
      console.error('Error updating member role:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!canManageProject || !selectedProject?.id || !selectedMember) return;
    try {
      setProcessing(true);
      await removeMember(selectedProject.id, selectedMember.extension_number);
      setShowDeleteModal(false);
      setSelectedMember(null);
      onRefresh();
    } catch (error) {
      console.error('Error removing member:', error);
    } finally {
      setProcessing(false);
    }
  };

  // ── Filtered and Paginated Data ───────────────────────────────────────────
  const filteredMembers = useMemo(() => {
    let result = enrichedMembers;

    // Search filter
    if (searchValue.trim()) {
      const search = searchValue.toLowerCase();
      result = result.filter((m: any) => 
        m._displayName.toLowerCase().includes(search) ||
        m._email.toLowerCase().includes(search) ||
        String(m.extension_number).toLowerCase().includes(search) ||
        (m.role || '').toLowerCase().includes(search)
      );
    }

    // Role filter
    if (roleFilter) {
      result = result.filter((m: any) => (m.role || 'member').toLowerCase() === roleFilter.toLowerCase());
    }

    return result;
  }, [enrichedMembers, searchValue, roleFilter]);

  const paginatedMembers = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.rowsPerPage;
    const end = start + pagination.rowsPerPage;
    return filteredMembers.slice(start, end);
  }, [filteredMembers, pagination.currentPage, pagination.rowsPerPage]);

  const countMembersByRole = useCallback((role: string) => {
    const r = role.toLowerCase();
    return members.filter((m: any) => (m.role || '').toLowerCase() === r).length;
  }, [members]);

  // ── Stats Cards ───────────────────────────────────────────────────────────
  const statsCardsData: StatsCardData[] = useMemo(() => {
    const totalMembers = members.length;
    const ownerCount = countMembersByRole('owner');
    const adminCount = countMembersByRole('admin');
    const managerCount = countMembersByRole('manager');
    const viewerCount = countMembersByRole('viewer');
    const memberCount = members.filter(
      (m: any) => (m.role || '').toLowerCase() === 'member' || !m.role,
    ).length;

    return [
      {
        title: 'Total Members',
        value: totalMembers,
        icon: Users,
        iconColor: '#6366F1',
        iconBgColor: '#EEF2FF',
        subtitle: `${ownerCount + adminCount + managerCount} with elevated roles`,
      },
      {
        title: 'Owners',
        value: ownerCount,
        icon: Users,
        iconColor: '#991B1B',
        iconBgColor: '#FEE2E2',
        metric: {
          text: 'Full project control',
          dotColor: '#991B1B',
        },
      },
      {
        title: 'Admins',
        value: adminCount,
        icon: Users,
        iconColor: '#92400E',
        iconBgColor: '#FEF3C7',
        metric: {
          text: 'Management access',
          dotColor: '#92400E',
        },
      },
      {
        title: 'Managers',
        value: managerCount,
        icon: Users,
        iconColor: '#1E40AF',
        iconBgColor: '#DBEAFE',
        metric: {
          text: 'Team coordination',
          dotColor: '#1E40AF',
        },
      },
      {
        title: 'Viewers',
        value: viewerCount,
        icon: Users,
        iconColor: '#6B21A8',
        iconBgColor: '#F3E8FF',
        metric: {
          text: 'Read-only access',
          dotColor: '#6B21A8',
        },
      },
      {
        title: 'Members',
        value: memberCount,
        icon: Users,
        iconColor: '#4B5563',
        iconBgColor: '#E5E7EB',
        metric: {
          text: 'Standard access',
          dotColor: '#4B5563',
        },
      },
    ];
  }, [members, countMembersByRole]);

  // ── Filter Pills ──────────────────────────────────────────────────────────
  const filterPills: FilterPill[] = useMemo(() => [
    {
      id: 'role',
      label: 'Role',
      icon: <Filter size={14} />,
      active: !!roleFilter,
      activeLabel: roleFilter ? roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1) : undefined,
      onClear: () => setRoleFilter(null),
      showDropdown: true,
      dropdownOptions: [
        { label: 'All Roles', value: 'all', onClick: () => setRoleFilter(null) },
        { label: 'Owner', value: 'owner', onClick: () => setRoleFilter('owner') },
        { label: 'Admin', value: 'admin', onClick: () => setRoleFilter('admin') },
        { label: 'Manager', value: 'manager', onClick: () => setRoleFilter('manager') },
        { label: 'Member', value: 'member', onClick: () => setRoleFilter('member') },
        { label: 'Viewer', value: 'viewer', onClick: () => setRoleFilter('viewer') },
      ],
    },
  ], [roleFilter]);

  // Render Add Member Button (following prospects.tsx pattern)
  const renderAddMemberButton = () => (
    <div
      style={{
        position: "absolute",
        right: "19px",
        top: "170px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      {isAllow && selectedItems.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setShowDeleteModal(true);
          }}
          style={{
            padding: "9px 13px",
            backgroundColor: "#dc3545",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#c82333";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#dc3545";
          }}
        >
          <Trash2 size={16} />
          Delete ({selectedItems.length})
        </button>
      )}
      {isAllow && (
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: "9px 13px",
            backgroundColor: "#000000",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#1a1a1a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#000000";
          }}
        >
          <UserPlus size={16} />
          Add Member
        </button>
      )}
    </div>
  );

  // ── Toolbar Configuration ─────────────────────────────────────────────────
  const toolbarConfig: ToolbarConfig = useMemo(() => ({
    // Tabs (required for rightActions to render)
    showTabs: true,
    tabs: [
      {
        id: 'all',
        label: 'All Members',
        count: members.length,
        removable: false,
      },
    ],
    activeTab: 'all',
    
    showSearch: true,
    searchValue,
    searchPlaceholder: 'Search members...',
    onSearchChange: setSearchValue,
    onSearch: () => setPagination(prev => ({ ...prev, currentPage: 1 })),
    
    showFilterPills: true,
    filterPills,
    
    showEditColumns: false,
    
    showExportButton: true,
    onExportClick: () => {
      console.log('Export members data');
      // Implement export functionality
    },
    
    rightActions: renderAddMemberButton(),
  }), [searchValue, filterPills, isAllow, selectedItems.length, members.length]);

  // ── Row Interaction Handlers ──────────────────────────────────────────────
  const handleFirstColumnClick = useCallback(
    (row: any) => {
      if (!isAllow) {
        return;
      }
      setSelectedMember(row);
      setFormData({
        extension_number: row.extension_number,
        role: normalizeMemberRoleForForm(row.role),
      });
      setShowEditModal(true);
    },
    [isAllow],
  );

  const handleRowDoubleClick = useCallback(
    (row: any) => {
      if (!isAllow) {
        return;
      }
      setSelectedMember(row);
      setFormData({
        extension_number: row.extension_number,
        role: normalizeMemberRoleForForm(row.role),
      });
      setShowEditModal(true);
    },
    [isAllow],
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [searchValue, roleFilter]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Members Table with GenericTable */}
      <div
        className="members-table-wrapper"
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <GenericTable
          data={paginatedMembers}
          columns={columns.filter((c) => selectedColumns.includes(c.key))}
          actions={actions}
          showActions={isAllow && actions.length > 0}
          actionsLabel="Actions"
          
          // Selection
          selectable={isAllow}
          selectedRows={paginatedMembers.filter((item) =>
            selectedItems.includes(item.id)
          )}
          onSelectionChange={(selected) => {
            setSelectedItems(selected.map((item) => item.id));
          }}
          
          // Pagination
          pagination={{
            currentPage: pagination.currentPage,
            rowsPerPage: pagination.rowsPerPage,
            totalRows: filteredMembers.length,
            pageSizeOptions: [10, 15, 25, 50, 100],
          }}
          onPaginationChange={(page, rowsPerPage) => {
            setPagination({
              ...pagination,
              currentPage: page,
              rowsPerPage,
            });
          }}
          
          // Sorting
          sortable={true}
          defaultSortBy={pagination.sortBy}
          defaultSortOrder={pagination.sortOrder}
          onSort={(column, direction) => {
            setPagination((prev) => ({
              ...prev,
              sortBy: column,
              sortOrder: direction,
              currentPage: 1,
            }));
          }}
          
          // Row interactions
          onFirstColumnClick={(row) => handleFirstColumnClick(row)}
          onRowDoubleClick={(row) => handleRowDoubleClick(row)}
          
          // Loading & styling
          loading={loading}
          emptyMessage="No members found matching your criteria"
          loadingMessage="Loading members..."
          hover={true}
          uniqueKey="id"
          
          // Fixed height mode
          fixedHeight={true}
          maxHeight="calc(100vh - 345px)"
          
          // Toolbar
          showToolbar={true}
          toolbar={toolbarConfig}
          
          // Stats cards for metrics
          statsCards={statsCardsData}
        />
      </div>

      {/* ── Add Member Modal ── */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Member</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Select Member</Form.Label>
              <Select
                value={selectedExtensionOption}
                onChange={(opt: any) => setFormData(prev => ({ ...prev, extension_number: opt?.value || '' }))}
                options={extensionOptions}
                placeholder="Type to search"
                isClearable
                isSearchable
                menuPortalTarget={typeof document === 'undefined' ? null : document.body}
                menuPosition="fixed"
                classNamePrefix="react-select"
                styles={reactSelectStyles}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select
                value={formData.role}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, role: e.target.value }))
                }
              >
                {PROJECT_MEMBER_ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAddMember} disabled={processing || !formData.extension_number}>
            {processing ? <Spinner size="sm" animation="border" /> : 'Add Member'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Edit Role Modal ── */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Member Role</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Member</Form.Label>
              <Select
                value={selectedMemberOptionForEdit}
                options={allExtensionOptions}
                isDisabled
                classNamePrefix="react-select"
                styles={reactSelectStyles}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select
                value={formData.role}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, role: e.target.value }))
                }
              >
                {PROJECT_MEMBER_ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
                {selectedMember?.role?.toLowerCase() === 'owner' && (
                  <option value="owner">Owner</option>
                )}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleUpdateRole} disabled={processing}>
            {processing ? <Spinner size="sm" animation="border" /> : 'Update Role'}
          </Button>
        </Modal.Footer>
      </Modal>

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setSelectedMember(null);
        }}
        onConfirm={handleRemoveMember}
        itemName={removeMemberModalItemName}
        itemType="member"
        additionalInfo={removeMemberModalAdditionalInfo}
        loading={processing}
      />
    </>
  );
};

export default MembersTab;
