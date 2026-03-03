import React, { useState, useMemo } from 'react';
import { Spinner, Button, Modal, Form } from 'react-bootstrap';
import Select from 'react-select';
import { UserPlus, Edit, Trash2, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { addMember, updateMemberRole, removeMember } from '@utils/tasks';
import { canManage } from '@utils/work-planner';
import GenericTable, { TableColumn, TableAction } from '@components/GenericTable';

interface MembersTabProps {
  selectedProject: any;
  members: any[];
  loading: boolean;
  onRefresh: () => void;
  styles: any;
  hierarchyDataExtensions: any[];
}

const AVATAR_COLORS = ['#48bb78', '#f56565', '#4299e1', '#ed64a6', '#667eea', '#9f7aea', '#fc8181', '#ed8936'];

const MembersTab: React.FC<MembersTabProps> = ({
  selectedProject,
  members,
  loading,
  onRefresh,
  styles,
  hierarchyDataExtensions,
}) => {
  const { data: session } = useSession();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [formData, setFormData] = useState({ extension_number: '', role: 'member' });
  const [processing, setProcessing] = useState(false);

  const isAllow = useMemo(() => canManage(members, selectedProject, session), [members, selectedProject, session]);

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
      case 'owner':   return { bg: '#FEE2E2', color: '#991B1B' };
      case 'admin':   return { bg: '#FEF3C7', color: '#92400E' };
      case 'manager': return { bg: '#DBEAFE', color: '#1E40AF' };
      default:        return { bg: '#E5E7EB', color: '#4B5563' };
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
        setFormData({ extension_number: row.extension_number, role: row.role || 'member' });
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
    hierarchyDataExtensions
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
    return allExtensionOptions.find((o: any) => String(o.value) === extNum)
      || { value: extNum, label: resolved.name !== extNum ? `${resolved.name} (${extNum})` : extNum };
  }, [selectedMember, allExtensionOptions]);

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
    if (!selectedProject?.id || !formData.extension_number) return;
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
    if (!selectedProject?.id || !selectedMember || !formData.role) return;
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
    if (!selectedProject?.id || !selectedMember) return;
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Header row above the table */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h5 style={styles.cardTitle}>Project Members</h5>
        {isAllow && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <UserPlus size={16} />
            Add Member
          </Button>
        )}
      </div>

      {/* Empty state when no members */}
      {!loading && members.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
          <Users size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '500' }}>No members found</p>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', opacity: 0.7 }}>
            Add members to collaborate on this project
          </p>
        </div>
      ) : (
        <GenericTable
          data={enrichedMembers}
          columns={columns}
          actions={actions}
          showActions={isAllow && actions.length > 0}
          actionsLabel="Actions"
          uniqueKey="id"
          loading={loading}
          loadingMessage="Loading members..."
          emptyMessage="No members found"
          hover={true}
          sortable={true}
          fixedHeight={false}
          showToolbar={false}
          showToolbarActions={false}
        />
      )}

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
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                menuPosition="fixed"
                classNamePrefix="react-select"
                styles={reactSelectStyles}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
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
              <Form.Select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
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

      {/* ── Remove Confirmation Modal ── */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Remove Member</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to remove{' '}
            <strong>{selectedMember?.user?.name || selectedMember?.extension_number}</strong> from this project?
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleRemoveMember} disabled={processing}>
            {processing ? <Spinner size="sm" animation="border" /> : 'Remove Member'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default MembersTab;
