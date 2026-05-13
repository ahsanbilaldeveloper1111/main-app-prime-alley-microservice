import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback, useMemo, useRef } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
    updateTeam,
    deleteTeam,
    addTeam,
    assignUsersToTeam,
    removeUsersFromTeam,
    removeOwnersFromTeam,
    getTeamUsers,
    removeModulesFromTeam,
    getTeamModules,
    updateTeamModules,
    ListTeams,
} from '@utils/teams';
import { Button, Form, Modal, Row, Col, Card } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import '@assets/scss/common.scss';
import FormModal from '@components/page-partials/FormModal';
import SuccessfulModal from '@components/page-partials/SuccessfulModal';
import ConfirmModal from '@components/page-partials/ConfirmModal';
import { Edit, Info, Trash2, Users, UserPlus, UserMinus, Package } from 'lucide-react';
import { MultiValue } from 'react-select';
import { getParentUsers } from '@utils/users';
import { getModules } from '@utils/roles';
import { toast } from 'react-toastify';
import { HEADER_CONSTANTS } from '@constants/headerConstants';
import SelectCheckBox, { SelectCheckBoxOption } from '@components/SelectCheckBox';
import GenericTable, { TableColumn, TableAction } from '@components/GenericTable';
import { useDebouncedValue } from '@hooks/useDebouncedValue';
import { controlhubKeys } from '../../../query/keys';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamRow {
    id: number;
    name: string;
    module_names?: string[];
    owner_count: number;
    assigned_user_count: number;
}

interface TeamUser {
    id: number;
    name: string;
    phone?: string;
    email?: string;
}

interface TeamModule {
    id?: number;
    module_id?: number;
    name?: string;
    description?: string;
}

interface AllUser {
    id: number;
    name: string;
    username?: string;
    email?: string;
    phone?: string;
}

interface TeamsApiResponse {
    data: TeamRow[];
    total: number;
    current_page: number;
    per_page: number;
}

interface TeamUsersResponse {
    team_member?: TeamUser[];
    team_owners?: TeamUser[];
}

// ─── Helper functions ─────────────────────────────────────────────────────────

function buildUserOption(user: AllUser): SelectCheckBoxOption {
    return {
        value: user.id,
        label: `${user.name || 'Unknown'} (${user.phone || user.email || 'N/A'})`,
    };
}

function resolveOptionByIdStr(idStr: string, allUsers: AllUser[]): SelectCheckBoxOption {
    const user = allUsers.find((u) => u.id.toString() === idStr);
    return user ? buildUserOption(user) : { value: Number(idStr), label: idStr };
}

function getModuleId(module: TeamModule): number | undefined {
    return module.id ?? module.module_id;
}

function buildAvailableUserOptions(
    allUsers: AllUser[],
    teamUsers: TeamUser[],
    teamOwners: TeamUser[],
    excludeSelectedIds: Set<number>,
): SelectCheckBoxOption[] {
    const assignedIds = new Set([...teamUsers.map((u) => u.id), ...teamOwners.map((u) => u.id)]);
    return allUsers
        .filter((u) => !assignedIds.has(u.id))
        .filter((u) => !excludeSelectedIds.has(u.id))
        .map(buildUserOption);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ModuleCellProps {
    readonly moduleNames?: readonly string[];
}

function ModuleCell({ moduleNames }: Readonly<ModuleCellProps>) {
    const hasModules = moduleNames && moduleNames.length > 0;
    if (hasModules) {
        return (
            <div className="d-flex flex-wrap gap-1">
                {moduleNames.map((moduleName) => (
                    <span key={moduleName} className="status-badge primary">
                        {moduleName}
                    </span>
                ))}
            </div>
        );
    }
    return <span className="status-badge info">Modules not assigned</span>;
}

interface CountBadgeCellProps {
    readonly count: number;
}

function CountBadgeCell({ count }: Readonly<CountBadgeCellProps>) {
    return <span className="status-badge primary">{count}</span>;
}

interface TeamMembersTableProps {
    readonly members: readonly TeamUser[];
    readonly isLoading: boolean;
    readonly selectedIds: readonly number[];
    readonly emptyLabel: string;
    readonly onSelectAll: () => void;
    readonly onSelectOne: (id: number) => void;
    readonly isAllSelected: boolean;
}

function TeamMembersTable({
    members,
    isLoading,
    selectedIds,
    emptyLabel,
    onSelectAll,
    onSelectOne,
    isAllSelected,
}: Readonly<TeamMembersTableProps>) {
    if (isLoading) {
        return (
            <div className="text-center py-3">
                <small className="text-muted">Loading...</small>
            </div>
        );
    }

    const hasMembers = members.length > 0;
    if (!hasMembers) {
        return (
            <div className="text-center py-3 border rounded">
                <small className="text-muted">{emptyLabel}</small>
            </div>
        );
    }

    return (
        <Card>
            <Card.Body className="p-0">
                <table className="table table-hover table-sm mb-0 w-100">
                    <thead className="table-light">
                        <tr>
                            <th style={{ width: '40px' }}>
                                <input
                                    type="checkbox"
                                    checked={isAllSelected}
                                    onChange={onSelectAll}
                                    title="Select All"
                                />
                            </th>
                            <th>Name</th>
                            <th>Extension</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members.map((member) => (
                            <tr key={member.id}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(member.id)}
                                        onChange={() => onSelectOne(member.id)}
                                    />
                                </td>
                                <td>{member.name || 'N/A'}</td>
                                <td title={member.phone || 'N/A'}>{member.phone || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card.Body>
        </Card>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const Teams = () => {
    const { data: session } = useSession();
    const queryClient = useQueryClient();

    // ── Pagination & search state ──
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [searchValue, setSearchValue] = useState('');
    const debouncedSearchValue = useDebouncedValue(searchValue, 400);

    // ── Stable empty-filters ref (no filters on this page) ──
    const prevFiltersStringRef = useRef<string>('');
    const prevFiltersRef = useRef<Record<string, unknown>>({});
    const currentFilters = useMemo<Record<string, unknown>>(() => {
        const str = JSON.stringify({});
        if (str !== prevFiltersStringRef.current) {
            prevFiltersStringRef.current = str;
            prevFiltersRef.current = {};
        }
        return prevFiltersRef.current;
    }, []);

    const filtersListKey = JSON.stringify(currentFilters);
    const teamsListQuery = useQuery({
        queryKey: controlhubKeys.teams.list({
            page: currentPage,
            perPage: rowsPerPage,
            search: debouncedSearchValue,
            filtersKey: filtersListKey,
        }),
        queryFn: async () => {
            try {
                const response = (await ListTeams({
                    page: currentPage,
                    perPage: rowsPerPage,
                    search: debouncedSearchValue,
                    filters: currentFilters,
                })) as TeamsApiResponse;
                return { data: response?.data ?? [], total: response?.total ?? 0 };
            } catch {
                toast.error('Failed to load teams');
                throw new Error('Failed to load teams');
            }
        },
        placeholderData: keepPreviousData,
    });
    const tableData = teamsListQuery.data?.data ?? [];
    const totalRows = teamsListQuery.data?.total ?? 0;
    const isTableLoading = teamsListQuery.isPending || teamsListQuery.isFetching;

    // ── Success modal ──
    const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
    const [successModalTitle, setSuccessModalTitle] = useState('');
    const [successModalDescription, setSuccessModalDescription] = useState('');

    // ── Selected team: use 0 as "none" to avoid number | null throughout ──
    const [selectedTeamId, setSelectedTeamId] = useState<number>(0);
    const [selectedTeamName, setSelectedTeamName] = useState<string>('');

    // ── Edit team modal ──
    const [showEditTeamModal, setShowEditTeamModal] = useState(false);
    const [isLoadingUpdateTeam, setIsLoadingUpdateTeam] = useState(false);

    // ── Delete team modal ──
    const [showDeleteTeamModal, setShowDeleteTeamModal] = useState(false);
    const [isLoadingDeleteTeam, setIsLoadingDeleteTeam] = useState(false);

    // ── Create team modal ──
    const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [isLoadingCreateTeam, setIsLoadingCreateTeam] = useState(false);

    // ── Assign users modal ──
    const [showAssignUsersModal, setShowAssignUsersModal] = useState(false);
    const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);
    const [teamOwners, setTeamOwners] = useState<TeamUser[]>([]);
    const [selectedUsersToAssign, setSelectedUsersToAssign] = useState<string[]>([]);
    const [selectedOwnersToAssign, setSelectedOwnersToAssign] = useState<string[]>([]);
    const [selectedUsersToRemove, setSelectedUsersToRemove] = useState<number[]>([]);
    const [selectedOwnersToRemove, setSelectedOwnersToRemove] = useState<number[]>([]);
    const [showRemoveUsersConfirmModal, setShowRemoveUsersConfirmModal] = useState(false);
    const [showRemoveOwnersConfirmModal, setShowRemoveOwnersConfirmModal] = useState(false);
    const [allUsers, setAllUsers] = useState<AllUser[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [isLoadingTeamUsers, setIsLoadingTeamUsers] = useState(false);
    const [isLoadingAssignUsers, setIsLoadingAssignUsers] = useState(false);
    const [isLoadingRemoveUsers, setIsLoadingRemoveUsers] = useState(false);
    const [ownerSearchInput, setOwnerSearchInput] = useState('');
    const [userSearchInput, setUserSearchInput] = useState('');

    // ── Assign modules modal ──
    const [showAssignModulesModal, setShowAssignModulesModal] = useState(false);
    const [teamModules, setTeamModules] = useState<TeamModule[]>([]);
    const [selectedModulesToAssign, setSelectedModulesToAssign] = useState<number[]>([]);
    const [allModules, setAllModules] = useState<any[]>([]);
    const [isLoadingModules, setIsLoadingModules] = useState(false);
    const [isLoadingTeamModules, setIsLoadingTeamModules] = useState(false);
    const [isLoadingAssignModules, setIsLoadingAssignModules] = useState(false);
    const [isLoadingRemoveModule, setIsLoadingRemoveModule] = useState(false);

    const triggerRefresh = useCallback(() => {
        void queryClient.invalidateQueries({ queryKey: controlhubKeys.teams.all() });
    }, [queryClient]);

    const showSuccess = useCallback((title: string, description: string) => {
        setSuccessModalTitle(title);
        setSuccessModalDescription(description);
        setTimeout(() => setShowSuccessfulModal(true), 100);
    }, []);

    // ── Edit team ──
    const handleEditTeam = useCallback((row: TeamRow) => {
        setSelectedTeamId(row.id);
        setSelectedTeamName(row.name);
        setShowEditTeamModal(true);
    }, []);

    const handleSubmitEditTeam = async () => {
        setIsLoadingUpdateTeam(true);
        try {
            const response = await updateTeam(selectedTeamId, selectedTeamName);
            if (response) {
                setSelectedTeamId(0);
                setSelectedTeamName('');
                setShowEditTeamModal(false);
                showSuccess('Team Updated', 'Team has been updated successfully');
                triggerRefresh();
            }
        } catch {
            toast.error('Failed to update team');
        } finally {
            setIsLoadingUpdateTeam(false);
        }
    };

    // ── Delete team ──
    const handleDeleteTeam = useCallback((row: TeamRow) => {
        setSelectedTeamId(row.id);
        setSelectedTeamName(row.name);
        setShowDeleteTeamModal(true);
    }, []);

    const handleSubmitDeleteTeam = async () => {
        setIsLoadingDeleteTeam(true);
        try {
            const response = await deleteTeam(selectedTeamId);
            if (response) {
                setSelectedTeamId(0);
                setSelectedTeamName('');
                setShowDeleteTeamModal(false);
                showSuccess('Team Deleted', 'Team has been deleted successfully');
                triggerRefresh();
            }
        } catch {
            toast.error('Failed to delete team');
        } finally {
            setIsLoadingDeleteTeam(false);
        }
    };

    // ── Create team ──
    const handleSubmitCreateTeam = async () => {
        setIsLoadingCreateTeam(true);
        try {
            const response = await addTeam(newTeamName);
            if (response) {
                setNewTeamName('');
                setShowCreateTeamModal(false);
                showSuccess('Team Created', 'New Team has been added successfully');
                triggerRefresh();
            }
        } catch {
            toast.error('Failed to create team');
        } finally {
            setIsLoadingCreateTeam(false);
        }
    };

    // ── Users fetching ──
    const fetchAllUsers = useCallback(async (): Promise<AllUser[]> => {
        const alreadyLoaded = allUsers.length > 0 && !isLoadingUsers;
        if (alreadyLoaded) return allUsers;
        setIsLoadingUsers(true);
        try {
            const response = await getParentUsers();
            if (Array.isArray(response)) {
                const users = response as AllUser[];
                setAllUsers(users);
                return users;
            }
            return [];
        } catch {
            return [];
        } finally {
            setIsLoadingUsers(false);
        }
    }, [allUsers, isLoadingUsers]);

    const fetchTeamUsers = useCallback(async (teamId: number) => {
        setIsLoadingTeamUsers(true);
        try {
            const response = (await getTeamUsers(teamId)) as TeamUsersResponse | TeamUser[];
            if (Array.isArray(response)) {
                setTeamUsers(response);
                setTeamOwners([]);
            } else if (response && typeof response === 'object') {
                setTeamUsers(response.team_member ?? []);
                setTeamOwners(response.team_owners ?? []);
            } else {
                setTeamUsers([]);
                setTeamOwners([]);
            }
        } catch {
            setTeamUsers([]);
            setTeamOwners([]);
        } finally {
            setIsLoadingTeamUsers(false);
        }
    }, []);

    // ── Assign users ──
    const handleAssignUsers = useCallback(
        async (row: TeamRow) => {
            setSelectedTeamId(row.id);
            setSelectedTeamName(row.name);
            setSelectedUsersToAssign([]);
            setSelectedOwnersToAssign([]);
            setOwnerSearchInput('');
            setUserSearchInput('');
            setShowAssignUsersModal(true);
            await fetchAllUsers();
            await fetchTeamUsers(row.id);
        },
        [fetchAllUsers, fetchTeamUsers],
    );

    const handleSubmitAssignUsers = async () => {
        const hasNoSelection = selectedUsersToAssign.length === 0 && selectedOwnersToAssign.length === 0;
        if (hasNoSelection) {
            toast.error('Please select at least one user or owner to assign');
            return;
        }
        setIsLoadingAssignUsers(true);
        try {
            const userIds = selectedUsersToAssign.map(Number);
            const ownerIds = selectedOwnersToAssign.length > 0 ? selectedOwnersToAssign.map(Number) : undefined;
            const response = await assignUsersToTeam(selectedTeamId, userIds, ownerIds);
            if (response) {
                setSelectedUsersToAssign([]);
                setSelectedOwnersToAssign([]);
                await fetchTeamUsers(selectedTeamId);
                triggerRefresh();
            }
        } catch {
            toast.error('Failed to assign users');
        } finally {
            setIsLoadingAssignUsers(false);
        }
    };

    const handleCloseAssignUsersModal = () => {
        setShowAssignUsersModal(false);
        setSelectedUsersToAssign([]);
        setSelectedOwnersToAssign([]);
        setSelectedUsersToRemove([]);
        setSelectedOwnersToRemove([]);
        setTeamUsers([]);
        setTeamOwners([]);
        setSelectedTeamId(0);
        setSelectedTeamName('');
        setOwnerSearchInput('');
        setUserSearchInput('');
    };

    // ── Remove users / owners ──
    const handleToggleOwnerRemove = (userId: number) => {
        setSelectedOwnersToRemove((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
        );
    };

    const handleToggleMemberRemove = (userId: number) => {
        setSelectedUsersToRemove((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
        );
    };

    const handleSelectAllOwnersToRemove = () => {
        const allOwnerIds = teamOwners.map((o) => o.id);
        setSelectedOwnersToRemove((prev) => (prev.length === allOwnerIds.length ? [] : allOwnerIds));
    };

    const handleSelectAllMembersToRemove = () => {
        const allUserIds = teamUsers.map((u) => u.id);
        setSelectedUsersToRemove((prev) => (prev.length === allUserIds.length ? [] : allUserIds));
    };

    const handleConfirmRemoveUsers = async () => {
        const hasNoSelection = selectedUsersToRemove.length === 0 && selectedOwnersToRemove.length === 0;
        if (hasNoSelection) {
            toast.error('Please select at least one user or owner to remove');
            return;
        }
        setIsLoadingRemoveUsers(true);
        try {
            let success = true;
            if (selectedOwnersToRemove.length > 0) {
                const res = await removeOwnersFromTeam(selectedTeamId, selectedOwnersToRemove);
                if (!res) success = false;
            }
            if (selectedUsersToRemove.length > 0) {
                const res = await removeUsersFromTeam(selectedTeamId, selectedUsersToRemove);
                if (!res) success = false;
            }
            if (success) {
                setSelectedUsersToRemove([]);
                setSelectedOwnersToRemove([]);
                setShowRemoveUsersConfirmModal(false);
                setShowRemoveOwnersConfirmModal(false);
                await fetchTeamUsers(selectedTeamId);
                triggerRefresh();
            }
        } catch {
            toast.error('Failed to remove users');
        } finally {
            setIsLoadingRemoveUsers(false);
        }
    };

    // ── Modules ──
    const fetchAllModules = useCallback(async () => {
        const alreadyLoaded = allModules.length > 0;
        if (alreadyLoaded) return;
        setIsLoadingModules(true);
        try {
            const modules = await getModules();
            if (Array.isArray(modules)) setAllModules(modules);
        } catch {
            // silent — background prefetch
        } finally {
            setIsLoadingModules(false);
        }
    }, [allModules]);

    const fetchTeamModules = useCallback(async (teamId: number) => {
        setIsLoadingTeamModules(true);
        try {
            const modules = (await getTeamModules(teamId)) as TeamModule[];
            setTeamModules(modules ?? []);
            if (modules?.length > 0) {
                const ids = modules
                    .map(getModuleId)
                    .filter((id): id is number => id !== undefined);
                setSelectedModulesToAssign(ids);
            }
        } catch {
            setTeamModules([]);
        } finally {
            setIsLoadingTeamModules(false);
        }
    }, []);

    const handleAssignModules = useCallback(
        async (row: TeamRow) => {
            setSelectedTeamId(row.id);
            setSelectedTeamName(row.name);
            setSelectedModulesToAssign([]);
            setShowAssignModulesModal(true);
            await fetchAllModules();
            await fetchTeamModules(row.id);
        },
        [fetchAllModules, fetchTeamModules],
    );

    const handleSubmitAssignModules = async () => {
        if (selectedModulesToAssign.length === 0) {
            toast.error('Please select at least one module to assign');
            return;
        }
        setIsLoadingAssignModules(true);
        try {
            const selectedCount = selectedModulesToAssign.length;
            const response = await updateTeamModules(selectedTeamId, selectedModulesToAssign);
            if (response) {
                setSelectedModulesToAssign([]);
                setIsLoadingTeamModules(true);
                try {
                    const modules = (await getTeamModules(selectedTeamId)) as TeamModule[];
                    setTeamModules(modules ?? []);
                } catch {
                    setTeamModules([]);
                } finally {
                    setIsLoadingTeamModules(false);
                }
                handleCloseAssignModulesModal();
                showSuccess(
                    'Modules Updated',
                    `${selectedCount} module(s) have been assigned to the team successfully`,
                );
                triggerRefresh();
            }
        } catch {
            toast.error('Failed to assign modules');
        } finally {
            setIsLoadingAssignModules(false);
        }
    };

    const handleRemoveModule = async (moduleId: number) => {
        setIsLoadingRemoveModule(true);
        try {
            const response = await removeModulesFromTeam(selectedTeamId, [moduleId]);
            if (response) {
                await fetchTeamModules(selectedTeamId);
                showSuccess('Module Removed', 'Module has been removed from the team successfully');
                triggerRefresh();
            }
        } catch {
            toast.error('Failed to remove module');
        } finally {
            setIsLoadingRemoveModule(false);
        }
    };

    const handleCloseAssignModulesModal = () => {
        setShowAssignModulesModal(false);
        setSelectedModulesToAssign([]);
        setTeamModules([]);
        setSelectedTeamId(0);
        setSelectedTeamName('');
    };

    // ── Memoised options ──
    const moduleOptions = useMemo(
        () =>
            allModules.map((m) => ({
                value: m.id as number,
                label: (m.name as string) || `Module ${m.id}`,
            })),
        [allModules],
    );

    const selectedOwnerIdSet = useMemo(
        () => new Set(selectedOwnersToAssign.map(Number)),
        [selectedOwnersToAssign],
    );

    const selectedUserIdSet = useMemo(
        () => new Set(selectedUsersToAssign.map(Number)),
        [selectedUsersToAssign],
    );

    const ownerOptions = useMemo(
        () => buildAvailableUserOptions(allUsers, teamUsers, teamOwners, selectedUserIdSet),
        [allUsers, teamUsers, teamOwners, selectedUserIdSet],
    );

    const userOptions = useMemo(
        () => buildAvailableUserOptions(allUsers, teamUsers, teamOwners, selectedOwnerIdSet),
        [allUsers, teamUsers, teamOwners, selectedOwnerIdSet],
    );

    // ── Permissions ──
    const perms = session?.user?.permissions ?? [];
    const canEdit = perms.includes('edit-teams');
    const canDelete = perms.includes('delete-teams');
    const canAssignUsers = perms.includes('edit-teams') || perms.includes('remove-teams-groups');
    const canAssignModules = perms.includes('edit-teams');
    const canAdd = perms.includes('add-teams');
    const hasAnyAction = canEdit || canDelete || canAssignUsers || canAssignModules;

    // ── GenericTable columns ──
    const columns = useMemo<TableColumn<TeamRow>[]>(
        () => [
            {
                key: 'name',
                label: 'Name',
                sortable: true,
                type: 'text',
                accessor: (row) => row.name,
            },
            {
                key: 'module_names',
                label: 'Assigned Modules',
                sortable: true,
                accessor: (row) => row.module_names?.join(', ') || '',
                render: (row) => <ModuleCell moduleNames={row.module_names} />,
            },
            {
                key: 'owner_count',
                label: 'Assigned Owners',
                sortable: true,
                accessor: (row) => row.owner_count,
                render: (row) => <CountBadgeCell count={row.owner_count} />,
            },
            {
                key: 'assigned_user_count',
                label: 'Assigned Users',
                sortable: true,
                accessor: (row) => row.assigned_user_count,
                render: (row) => <CountBadgeCell count={row.assigned_user_count} />,
            },
        ],
        [],
    );

    // ── GenericTable actions ──
    const actions = useMemo<TableAction<TeamRow>[]>(() => {
        const list: TableAction<TeamRow>[] = [];

        if (canEdit) {
            list.push({
                label: 'Edit',
                icon: <Edit size={16} />,
                variant: 'light',
                className: 'btn-action-style-2 p-1 text-primary',
                onClick: handleEditTeam,
            });
        }

        if (canAssignUsers) {
            list.push({
                label: 'Assign Users',
                icon: <UserPlus size={16} />,
                variant: 'light',
                className: 'btn-action-style-2 p-1 text-success',
                onClick: handleAssignUsers,
            });
        }

        if (canAssignModules) {
            list.push({
                label: 'Assign Modules',
                icon: <Package size={16} />,
                variant: 'light',
                className: 'btn-action-style-2 p-1 text-warning',
                onClick: handleAssignModules,
            });
        }

        if (canDelete) {
            list.push({
                label: 'Delete',
                icon: <Trash2 size={16} />,
                variant: 'light',
                className: 'btn-action-style-2 p-1 text-danger',
                onClick: handleDeleteTeam,
            });
        }

        return list;
    }, [
        canEdit,
        canDelete,
        canAssignUsers,
        canAssignModules,
        handleEditTeam,
        handleAssignUsers,
        handleAssignModules,
        handleDeleteTeam,
    ]);

    // ── Handlers ──
    const handlePaginationChange = (page: number, perPage: number) => {
        setCurrentPage(page);
        setRowsPerPage(perPage);
    };

    const handleSearchChange = (value: string) => {
        setSearchValue(value);
        setCurrentPage(1);
    };

    let assignedModulesContent: ReactElement;
    if (isLoadingTeamModules) {
        assignedModulesContent = (
            <div className="text-center py-3">
                <small className="text-muted">Loading modules...</small>
            </div>
        );
    } else if (teamModules.length > 0) {
        assignedModulesContent = (
            <Card>
                <Card.Body className="p-0">
                    <div className="table-responsive p-0">
                        <table className="table table-hover table-sm mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Name</th>
                                    <th>Description</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teamModules.map((module) => {
                                    const moduleId = getModuleId(module);
                                    return (
                                        <tr key={moduleId}>
                                            <td>{module.name || 'N/A'}</td>
                                            <td>{module.description || 'N/A'}</td>
                                            <td>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => {
                                                        if (moduleId !== undefined) {
                                                            handleRemoveModule(moduleId);
                                                        }
                                                    }}
                                                    title="Remove Module"
                                                    className="p-1"
                                                    disabled={isLoadingRemoveModule || isLoadingAssignModules}
                                                >
                                                    {isLoadingRemoveModule ? (
                                                        <output
                                                            className="spinner-border spinner-border-sm"
                                                            aria-live="polite"
                                                        >
                                                            <span className="visually-hidden">
                                                                Removing module...
                                                            </span>
                                                        </output>
                                                    ) : (
                                                        <Trash2 size={14} />
                                                    )}
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card.Body>
            </Card>
        );
    } else {
        assignedModulesContent = (
            <div className="text-center py-3 border rounded">
                <small className="text-muted">No modules assigned to this team yet.</small>
            </div>
        );
    }

    return (
        <React.Fragment>
            <BreadcrumbItem
                mainTitle="Controlhub"
                mainLink="/controlhub/teams"
                subTitle={HEADER_CONSTANTS.SUBMENU_LABELS.TEAMS}
            />

            <Row className="mb-3">
                <Col md={12}>
                    <div className="page-header-title style-2">
                        <Row className="d-flex justify-content-between align-items-center">
                            <Col md={4} />
                            <Col md={8} className="d-flex justify-content-end">
                                <div className="action-buttons">
                                    {canAdd && (
                                        <Button variant="primary" onClick={() => setShowCreateTeamModal(true)}>
                                            Add Team
                                        </Button>
                                    )}
                                </div>
                            </Col>
                        </Row>
                    </div>
                </Col>
            </Row>

            {/* Main data table */}
            <GenericTable<TeamRow>
                data={tableData}
                columns={columns}
                loading={isTableLoading}
                actions={actions}
                showActions={hasAnyAction}
                actionsLabel="Actions"
                uniqueKey="id"
                pagination={{
                    currentPage,
                    rowsPerPage,
                    totalRows,
                    pageSizeOptions: [15, 25, 50, 100],
                }}
                onPaginationChange={handlePaginationChange}
                showToolbar
                toolbar={{
                    showSearch: true,
                    searchValue,
                    searchPlaceholder: 'Search teams...',
                    onSearchChange: handleSearchChange,
                }}
                showToolbarActions={false}
                emptyMessage="No teams found"
                hover
                size="md"
            />

            {/* ── Edit Team Modal ── */}
            <FormModal
                show={showEditTeamModal}
                onHide={() => setShowEditTeamModal(false)}
                title="Edit Team"
                titleIcon={<Users size={20} className="text-primary" />}
                desc="Please fill in the details below to edit the team."
                formHtml={
                    <div className="form-group mb-3">
                        <label
                            htmlFor="editTeamName"
                            className="fw-semibold d-flex align-items-center gap-2 form-label"
                        >
                            Team Name <span className="text-danger">*</span>
                            <span className="text-muted ms-2" title="Enter the name of the team you want to edit">
                                <Info size={14} />
                            </span>
                        </label>
                        <input
                            id="editTeamName"
                            className="form-control"
                            type="text"
                            value={selectedTeamName}
                            onChange={(e) => setSelectedTeamName(e.target.value)}
                            disabled={isLoadingUpdateTeam}
                        />
                        <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                            <Info size={12} />
                            <span style={{ fontSize: '0.813rem' }}>
                                Change the name of an existing team to better reflect its purpose in the system.
                            </span>
                        </Form.Text>
                    </div>
                }
                submitButtonText="Update Team"
                isSubmitDisabled={!selectedTeamName || isLoadingUpdateTeam}
                cancelButtonText="Cancel"
                onSubmit={handleSubmitEditTeam}
                onCancel={() => setShowEditTeamModal(false)}
                isSubmitting={isLoadingUpdateTeam}
            />

            {/* ── Delete Team Modal ── */}
            <ConfirmModal
                show={showDeleteTeamModal}
                onHide={() => setShowDeleteTeamModal(false)}
                title="Delete Team"
                description="Are you sure you want to delete the following team?"
                targetName={selectedTeamName}
                onConfirm={handleSubmitDeleteTeam}
                confirmButtonText="Delete"
                confirmButtonVariant="danger"
                requireTextConfirmation
                requiredConfirmationText="delete"
                loading={isLoadingDeleteTeam}
            />

            {/* ── Create Team Modal ── */}
            <FormModal
                show={showCreateTeamModal}
                onHide={() => setShowCreateTeamModal(false)}
                title="New Team"
                titleIcon={<Users size={20} className="text-primary" />}
                desc="Please fill in the details below to create a new team."
                formHtml={
                    <div className="form-group mb-3">
                        <label
                            htmlFor="newTeamName"
                            className="fw-semibold d-flex align-items-center gap-2 form-label"
                        >
                            Team Name <span className="text-danger">*</span>
                            <span className="text-muted ms-2" title="Enter the name of the team you want to create">
                                <Info size={14} />
                            </span>
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            id="newTeamName"
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            placeholder="Team Name"
                            disabled={isLoadingCreateTeam}
                        />
                        <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                            <Info size={12} />
                            <span style={{ fontSize: '0.813rem' }}>
                                Enter the name of the team you want to create. This will be used to identify the team in
                                the system.
                            </span>
                        </Form.Text>
                    </div>
                }
                submitButtonText="Add Team"
                isSubmitDisabled={!newTeamName || isLoadingCreateTeam}
                cancelButtonText="Cancel"
                onSubmit={handleSubmitCreateTeam}
                onCancel={() => setShowCreateTeamModal(false)}
                isSubmitting={isLoadingCreateTeam}
            />

            {/* ── Assign Users Modal ── */}
            <Modal show={showAssignUsersModal} onHide={handleCloseAssignUsersModal} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title className="d-flex align-items-center gap-2">
                        <Users size={20} className="text-primary" />
                        Assign Users to Team ({selectedTeamName})
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row>
                        {/* Owners column */}
                        <Col md={6}>
                            <div className="form-group mb-4">
                                <label
                                    htmlFor="assignOwners"
                                    className="fw-semibold d-flex align-items-center gap-2 form-label"
                                >
                                    Select Owners to Assign{' '}
                                    <span
                                        className="text-muted ms-2"
                                        title="Search and select owners to assign to this team"
                                    >
                                        <Info size={14} />
                                    </span>
                                </label>
                                <SelectCheckBox
                                    options={ownerOptions}
                                    onChange={(opts: MultiValue<SelectCheckBoxOption>) => {
                                        setSelectedOwnersToAssign((opts ?? []).map((o) => o.value.toString()));
                                    }}
                                    value={selectedOwnersToAssign.map((id) => resolveOptionByIdStr(id, allUsers))}
                                    noOptionsMessage="No owners found"
                                    placeholder="Select owners to assign..."
                                    isLoading={isLoadingUsers}
                                    inputValue={ownerSearchInput}
                                    onInputChange={(val, action) => {
                                        const isBlurOrClose =
                                            action.action === 'input-blur' || action.action === 'menu-close';
                                        if (!isBlurOrClose) setOwnerSearchInput(val);
                                    }}
                                />
                                <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                                    <Info size={12} />
                                    <span style={{ fontSize: '0.813rem' }}>
                                        Click the dropdown to see all available owners. Users already assigned or
                                        selected as regular users will not appear.
                                    </span>
                                </Form.Text>
                            </div>

                            <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="mb-0 d-flex align-items-center gap-2">
                                        <Users size={18} className="text-warning" />
                                        Team Owners ({teamOwners.length})
                                    </h6>
                                    {selectedOwnersToRemove.length > 0 && (
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => setShowRemoveOwnersConfirmModal(true)}
                                        >
                                            <UserMinus size={14} className="me-1" />
                                            Remove Selected ({selectedOwnersToRemove.length})
                                        </Button>
                                    )}
                                </div>
                                <TeamMembersTable
                                    members={teamOwners}
                                    isLoading={isLoadingTeamUsers}
                                    selectedIds={selectedOwnersToRemove}
                                    emptyLabel="No owners assigned to this team yet."
                                    isAllSelected={
                                        teamOwners.length > 0 &&
                                        selectedOwnersToRemove.length === teamOwners.length
                                    }
                                    onSelectAll={handleSelectAllOwnersToRemove}
                                    onSelectOne={handleToggleOwnerRemove}
                                />
                            </div>
                        </Col>

                        {/* Members column */}
                        <Col md={6}>
                            <div className="form-group mb-4">
                                <label
                                    htmlFor="assignUsers"
                                    className="fw-semibold d-flex align-items-center gap-2 form-label"
                                >
                                    Select Users to Assign{' '}
                                    <span
                                        className="text-muted ms-2"
                                        title="Search and select users to assign to this team"
                                    >
                                        <Info size={14} />
                                    </span>
                                </label>
                                <SelectCheckBox
                                    options={userOptions}
                                    onChange={(opts: MultiValue<SelectCheckBoxOption>) => {
                                        setSelectedUsersToAssign((opts ?? []).map((o) => o.value.toString()));
                                    }}
                                    value={selectedUsersToAssign.map((id) => resolveOptionByIdStr(id, allUsers))}
                                    noOptionsMessage="No users found"
                                    placeholder="Select users to assign..."
                                    isLoading={isLoadingUsers}
                                    inputValue={userSearchInput}
                                    onInputChange={(val, action) => {
                                        const isBlurOrClose =
                                            action.action === 'input-blur' || action.action === 'menu-close';
                                        if (!isBlurOrClose) setUserSearchInput(val);
                                    }}
                                />
                                <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                                    <Info size={12} />
                                    <span style={{ fontSize: '0.813rem' }}>
                                        Click the dropdown to see all available users. Users already assigned or
                                        selected as owners will not appear.
                                    </span>
                                </Form.Text>
                            </div>

                            <div className="mb-3">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="mb-0 d-flex align-items-center gap-2">
                                        <Users size={18} />
                                        Team Members ({teamUsers.length})
                                    </h6>
                                    {selectedUsersToRemove.length > 0 && (
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => setShowRemoveUsersConfirmModal(true)}
                                        >
                                            <UserMinus size={14} className="me-1" />
                                            Remove Selected ({selectedUsersToRemove.length})
                                        </Button>
                                    )}
                                </div>
                                <TeamMembersTable
                                    members={teamUsers}
                                    isLoading={isLoadingTeamUsers}
                                    selectedIds={selectedUsersToRemove}
                                    emptyLabel="No members assigned to this team yet."
                                    isAllSelected={
                                        teamUsers.length > 0 && selectedUsersToRemove.length === teamUsers.length
                                    }
                                    onSelectAll={handleSelectAllMembersToRemove}
                                    onSelectOne={handleToggleMemberRemove}
                                />
                            </div>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={handleCloseAssignUsersModal}
                        disabled={isLoadingAssignUsers || isLoadingRemoveUsers}
                    >
                        Close
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmitAssignUsers}
                        disabled={
                            (selectedUsersToAssign.length === 0 && selectedOwnersToAssign.length === 0) ||
                            isLoadingAssignUsers ||
                            isLoadingRemoveUsers
                        }
                    >
                        {isLoadingAssignUsers ? (
                            <>
                                <output className="spinner-border spinner-border-sm me-1" aria-live="polite">
                                    <span className="visually-hidden">Assigning users...</span>
                                </output>
                                Assigning...
                            </>
                        ) : (
                            <>
                                <UserPlus size={16} className="me-1" />
                                Assign ({selectedUsersToAssign.length} users, {selectedOwnersToAssign.length} owners)
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ── Assign Modules Modal ── */}
            <Modal show={showAssignModulesModal} onHide={handleCloseAssignModulesModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title className="d-flex align-items-center gap-2">
                        <Package size={20} className="text-warning" />
                        Assign Modules to Team
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="mb-3">
                        <h6 className="mb-2">
                            Team: <strong>{selectedTeamName}</strong>
                        </h6>
                    </div>

                    <div className="form-group mb-4">
                        <label
                            htmlFor="assignModules"
                            className="fw-semibold d-flex align-items-center gap-2 form-label"
                        >
                            Select Modules to Assign{' '}
                            <span
                                className="text-muted ms-2"
                                title="Search and select modules to assign to this team"
                            >
                                <Info size={14} />
                            </span>
                        </label>
                        <SelectCheckBox
                            options={moduleOptions}
                            value={selectedModulesToAssign.map((id) => {
                                const opt = moduleOptions.find((o) => o.value === id);
                                return opt ?? { value: id, label: `Module ${id}` };
                            })}
                            onChange={(opts: MultiValue<SelectCheckBoxOption>) => {
                                setSelectedModulesToAssign((opts ?? []).map((o) => o.value as number));
                            }}
                            placeholder="Select modules..."
                            isLoading={isLoadingModules}
                        />
                        <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                            <Info size={12} />
                            <span style={{ fontSize: '0.813rem' }}>
                                Select one or more modules to assign to this team.
                            </span>
                        </Form.Text>
                    </div>

                    <div className="mb-3">
                        <h6 className="mb-3 d-flex align-items-center gap-2">
                            <Package size={18} />
                            Currently Assigned Modules ({teamModules.length})
                        </h6>
                        {assignedModulesContent}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={handleCloseAssignModulesModal}
                        disabled={isLoadingAssignModules || isLoadingRemoveModule}
                    >
                        Close
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmitAssignModules}
                        disabled={
                            selectedModulesToAssign.length === 0 || isLoadingAssignModules || isLoadingRemoveModule
                        }
                    >
                        {isLoadingAssignModules ? (
                            <>
                                <output className="spinner-border spinner-border-sm me-1" aria-live="polite">
                                    <span className="visually-hidden">Updating modules...</span>
                                </output>
                                Updating...
                            </>
                        ) : (
                            <>
                                <Package size={16} className="me-1" />
                                Update Modules ({selectedModulesToAssign.length})
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            <SuccessfulModal
                show={showSuccessfulModal}
                onHide={() => setShowSuccessfulModal(false)}
                title={successModalTitle}
                description={successModalDescription}
            />

            {/* ── Remove Owners Confirmation Modal ── */}
            <ConfirmModal
                show={showRemoveOwnersConfirmModal}
                onHide={() => {
                    setShowRemoveOwnersConfirmModal(false);
                    setSelectedOwnersToRemove([]);
                }}
                title="Remove Owners"
                description={`Are you sure you want to remove ${selectedOwnersToRemove.length} owner(s) from this team?`}
                targetName={
                    selectedOwnersToRemove.length === 1
                        ? teamOwners.find((o) => o.id === selectedOwnersToRemove[0])?.name ?? 'this owner'
                        : `${selectedOwnersToRemove.length} owners`
                }
                onConfirm={handleConfirmRemoveUsers}
                confirmButtonText="Remove Owners"
                confirmButtonVariant="danger"
                requireTextConfirmation
                requiredConfirmationText="remove"
                loading={isLoadingRemoveUsers}
            />

            {/* ── Remove Users Confirmation Modal ── */}
            <ConfirmModal
                show={showRemoveUsersConfirmModal}
                onHide={() => {
                    setShowRemoveUsersConfirmModal(false);
                    setSelectedUsersToRemove([]);
                }}
                title="Remove Members"
                description={`Are you sure you want to remove ${selectedUsersToRemove.length} member(s) from this team?`}
                targetName={
                    selectedUsersToRemove.length === 1
                        ? teamUsers.find((u) => u.id === selectedUsersToRemove[0])?.name ?? 'this member'
                        : `${selectedUsersToRemove.length} members`
                }
                onConfirm={handleConfirmRemoveUsers}
                confirmButtonText="Remove Members"
                confirmButtonVariant="danger"
                requireTextConfirmation
                requiredConfirmationText="remove"
                loading={isLoadingRemoveUsers}
            />
        </React.Fragment>
    );
};

Teams.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default Teams;
