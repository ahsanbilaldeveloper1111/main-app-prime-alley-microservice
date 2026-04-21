import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import { createPortal } from "react-dom";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import { Row, Col } from "react-bootstrap";
import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Users,
  Settings,
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  MoreVertical,
  Phone,
  Mail,
  Edit,
  Trash2,
  Clock,
  PhoneCall,
  PhoneOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  Menu,
  X,
  ChevronDown,
  UserPlus,
  BarChart3,
  Bell,
  Grid,
  List,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  User,
  Mic,
  MicOff,
  Pause,
  LogOut,
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, AreaChart, Area } from 'recharts';

import CallWidget from '../campaign-partials/CallWidget';
import WrapUpModal from '../campaign-partials/WrapUp';
import TopBar from '../campaign-partials/TopBarAgent';
import FinesseAuthGate from '../campaign-partials/FinesseAuthGate';
import { toast } from 'react-toastify';
import {
  getFinesseUserTeam,
  getFinesseUserData,
  getFinesseToken,
  getFinesseClusterId,
  getStoredTeamId,
  setStoredTeamId,
  getEffectiveTeamId,
  clearFinesseUserData,
  setFinesseManualReconnectRequired,
  finesseUnlink,
  finesseSetState,
  finesseForceSignOut,
  assertFinesseTeamSwitchable,
  getFinesseApiErrorMessage,
  mergeClusterIntoStoredUserFromTeamPayload,
  isFinesseAgentOfflineLikeState,
  getFinesseEffectiveAgentStateFromStatePayload,
} from '@utils/finesse';
import { mergeTeamUsersFromRoster, mergeRosterPayloads } from '@utils/finesseRosterMerge';
import { useFinesseStomp } from '@hooks/live-calls/useFinesseStomp';
import { useFinesseCampaignPreview } from '@hooks/live-calls/useFinesseCampaignPreview';
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { usePermissions } from "@utils/permissionUtils";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";

type TeamOption = { id: number; name: string };

type TeamUser = {
  loginId: string;
  firstName?: string;
  lastName?: string;
  extension?: string;
  state?: string;
  stateChangeTime?: string;
  reasonCode?: { label?: string };
  uri?: string;
  dialogsUri?: string;
  mediaType?: number;
  pendingState?: string;
  wrapUpTimer?: number;
};

type TeamApiResponse = {
  status?: string;
  statusCode?: string;
  responseData?: {
    id?: number;
    name?: string;
    uri?: string;
    users?: TeamUser[];
  };
};

type DisplayAgent = {
  id: string;
  loginId: string;
  name: string;
  state: string;
  stateColor: string;
  timeInState: string;
  extension: string;
  label?: string;
};

/** TopBar only toggles READY / NOT_READY; map any other Finesse state to NOT_READY. */
function mapEffectiveFinesseStateToTopBarReadyToggle(
  raw: string | undefined,
): 'READY' | 'NOT_READY' {
  const u = (raw ?? '').trim().toUpperCase();
  if (u === 'READY') return 'READY';
  return 'NOT_READY';
}

/** Fixed menu in a portal; avoids table/overflow clipping and row paint order. */
type ActionMenuPortalState = {
  agent: DisplayAgent;
  top: number;
  left: number;
  maxHeight: number;
};

const getStateColor = (state: string): string => {
  if (state === 'READY' || state === 'LOGIN') return '#10b981';
  if (state === 'NOT_READY') return '#ef4444';
  return '#6b7280';
};

const formatDuration = (stateChangeTime?: string): string => {
  if (!stateChangeTime) return '00:00:00';
  try {
    const then = new Date(stateChangeTime).getTime();
    const diffMs = Date.now() - then;
    const totalSec = Math.max(0, Math.floor(diffMs / 1000));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  } catch {
    return '00:00:00';
  }
};

const { PERMISSIONS } = HEADER_CONSTANTS;

const LiveCallsAgentsManagement = () => {
      const { data: session } = useSession();
      const { hasPermission } = usePermissions();
      const canChangeUserStatus = hasPermission(
        PERMISSIONS.CAN_CHANGE_USER_STATUS_TMS,
      );
      const canForceSignOut = hasPermission(PERMISSIONS.CAN_FORCE_SIGN_OUT_TMS);
      const [teams, setTeams] = useState<TeamOption[]>([]);
      const [selectedTeam, setSelectedTeam] = useState('');
      const [searchQuery, setSearchQuery] = useState('');
      const [includeLoggedOut, setIncludeLoggedOut] = useState(false);
      const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
      const [teamDataLoading, setTeamDataLoading] = useState(false);
      const [teamData, setTeamData] = useState<TeamApiResponse['responseData'] | null>(null);
      const [teamDataError, setTeamDataError] = useState<string | null>(null);
      const [refreshTrigger, setRefreshTrigger] = useState(0);
      /** Bumps when cluster id is persisted from API so EventSource reconnects with roster params. */
      const [streamConfigBump, setStreamConfigBump] = useState(0);
      const [, setLiveTimeTick] = useState(0);
      const [sidebarOpen, setSidebarOpen] = useState(true);
      const [viewMode, setViewMode] = useState('table');
      const [filterStatus, setFilterStatus] = useState('all');
      const [agentStatus, setAgentStatus] = useState('READY');
      const [isRefreshing, setIsRefreshing] = useState(false);
      const [bulkActionLoading, setBulkActionLoading] = useState(false);
      const [showStatusDropdown, setShowStatusDropdown] = useState(false);
      const [showUserMenu, setShowUserMenu] = useState(false);
      const [actionMenuPortal, setActionMenuPortal] = useState<ActionMenuPortalState | null>(null);
      const [finesseSseToken, setFinesseSseToken] = useState<string | null>(null);

      const {
        handlePreviewEvent,
        getFinesseContext,
        callWidgetProps,
        wrapUpModalProps,
      } = useFinesseCampaignPreview(session, {
        selectedTeam,
        includeTeamRow: false,
      });

      const statusDropdownRef = useRef<HTMLDivElement>(null);
      const userMenuRef = useRef<HTMLDivElement>(null);
    
      const openAgentActionMenu = useCallback((e: React.MouseEvent<HTMLButtonElement>, agent: DisplayAgent) => {
        e.stopPropagation();
        const btn = e.currentTarget;
        const r = btn.getBoundingClientRect();
        const menuWidth = 200;
        let left = r.right - menuWidth;
        left = Math.max(12, Math.min(left, window.innerWidth - menuWidth - 12));
        const top = r.bottom + 6;
        const maxHeight = Math.max(140, window.innerHeight - top - 12);
        setActionMenuPortal((prev) =>
          prev?.agent.id === agent.id ? null : { agent, top, left, maxHeight },
        );
      }, []);

      // Close dropdowns when clicking outside
      useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          const t = event.target as HTMLElement | null;
          if (!t) return;
          if (t.closest('[data-campaign-console-action-menu]')) return;
          if (t.closest('[data-campaign-console-action-trigger]')) return;
          if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
            setShowStatusDropdown(false);
          }
          if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
            setShowUserMenu(false);
          }
          setActionMenuPortal(null);
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }, []);

      useEffect(() => {
        if (!actionMenuPortal) return;
        const close = () => setActionMenuPortal(null);
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
        return () => {
          window.removeEventListener('scroll', close, true);
          window.removeEventListener('resize', close);
        };
      }, [actionMenuPortal]);
    
      // Tick every second so "time in state" increases for each agent
      useEffect(() => {
        const interval = setInterval(() => {
          setLiveTimeTick((t) => t + 1);
        }, 1000);
        return () => clearInterval(interval);
      }, []);

      // Populate teams from storage; selected team from FINESSE_SELECTED_TEAM_ID_KEY (getStoredTeamId)
      const hydrateTeamsFromStorage = useCallback(() => {
        const data = getFinesseUserData();
        if (data?.teams?.length) {
          setTeams(data.teams);
          const storedTeamId = getStoredTeamId();
          const match = data.teams.find((t) => t.id === storedTeamId);
          setSelectedTeam(match?.name ?? data.teamName ?? data.teams[0].name ?? '');
        } else {
          setTeams([]);
          setSelectedTeam('');
        }
      }, []);
      useEffect(() => {
        hydrateTeamsFromStorage();
      }, [hydrateTeamsFromStorage]);

      useEffect(() => {
        if (!session?.user) {
          setFinesseSseToken(null);
          return;
        }
        if (typeof window === 'undefined') return;
        setFinesseSseToken(getFinesseToken());
      }, [session?.user]);

      const rosterClusterId = useMemo(
        () => getFinesseClusterId(),
        [refreshTrigger, selectedTeam, streamConfigBump],
      );
      const streamTeamId = useMemo(
        () => getEffectiveTeamId(getFinesseUserData()),
        [refreshTrigger, selectedTeam, streamConfigBump],
      );
      const sseFinesseUserId = useMemo(() => {
        const d = getFinesseUserData();
        return d?.loginId ?? d?.loginName ?? null;
      }, [refreshTrigger, selectedTeam, streamConfigBump]);

      /** Offline / logged-out rows only when “Include logged out” is checked (stream may still carry them in teamData). */
      const teamUsersForDisplay = useMemo(() => {
        const users = teamData?.users ?? [];
        if (includeLoggedOut) return users;
        return users.filter((u) => {
          const st = u.state;
          const pend = u.pendingState;
          return (
            !isFinesseAgentOfflineLikeState(st) &&
            !isFinesseAgentOfflineLikeState(pend)
          );
        });
      }, [teamData?.users, includeLoggedOut]);

      const rosterSyncDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
      /** Latest roster STOMP payload; reapplied after REST refetch so API lag cannot revert LOGOUT/offline. */
      const lastRosterPayloadRef = useRef<unknown>(null);

      useEffect(() => {
        lastRosterPayloadRef.current = null;
      }, [streamTeamId, rosterClusterId]);

      const refetchTeamFromStream = useCallback(() => {
        const d = getFinesseUserData();
        const username = d?.loginId ?? d?.loginName;
        const teamId = getEffectiveTeamId(d);
        if (!username || teamId == null) return;
        /** Always include logged-out agents so logout matches roster and is not overwritten. */
        getFinesseUserTeam(username, teamId, true)
          .then((res: TeamApiResponse) => {
            const payload = res?.responseData ?? (res as unknown as { responseData?: TeamApiResponse['responseData'] })?.responseData;
            if (payload) {
              const last = lastRosterPayloadRef.current;
              const merged =
                last != null ? mergeTeamUsersFromRoster(payload, last) : payload;
              setTeamData(merged ?? payload);
              if (mergeClusterIntoStoredUserFromTeamPayload(payload)) {
                setStreamConfigBump((b) => b + 1);
              }
            }
          })
          .catch(() => {});
      }, []);

      const scheduleTeamSyncFromRoster = useCallback(() => {
        if (rosterSyncDebounceRef.current) clearTimeout(rosterSyncDebounceRef.current);
        rosterSyncDebounceRef.current = setTimeout(() => {
          rosterSyncDebounceRef.current = null;
          refetchTeamFromStream();
        }, 400);
      }, [refetchTeamFromStream]);

      useEffect(() => () => {
        if (rosterSyncDebounceRef.current) clearTimeout(rosterSyncDebounceRef.current);
      }, []);

      const handleTeamRosterEvent = useCallback(
        (raw: unknown) => {
          if (
            raw &&
            typeof raw === 'object' &&
            '__finesseRosterUnparsed' in (raw as object) &&
            (raw as { __finesseRosterUnparsed?: boolean }).__finesseRosterUnparsed === true
          ) {
            scheduleTeamSyncFromRoster();
            return;
          }
          lastRosterPayloadRef.current = mergeRosterPayloads(
            lastRosterPayloadRef.current,
            raw,
          );
          setTeamData((prev) =>
            mergeTeamUsersFromRoster(prev, lastRosterPayloadRef.current),
          );
          /** Debounced REST sync picks up newly logged-in agents; refetch applies `lastRosterPayloadRef` overlay so LOGOUT is not reverted by stale READY. */
          scheduleTeamSyncFromRoster();
        },
        [scheduleTeamSyncFromRoster],
      );

      useFinesseStomp({
        token: finesseSseToken,
        finesseUserId: sseFinesseUserId,
        clusterId: rosterClusterId,
        teamId: streamTeamId,
        onStateEvent: (p) => {
          const raw = typeof p?.state === 'string' ? p.state.trim() : '';
          if (!raw) return;
          setAgentStatus(mapEffectiveFinesseStateToTopBarReadyToggle(raw));
        },
        onPreviewEvent: handlePreviewEvent,
        onErrorEvent: (p) =>
          toast.error((p as { message?: string })?.message ?? 'Finesse error'),
        onAuthError: (msg) => toast.error(msg),
        onRosterEvent: handleTeamRosterEvent,
        onStompConnected: refetchTeamFromStream,
      });
      // When gate authenticates on same page (no reload), re-hydrate teams and refetch
      useEffect(() => {
        if (typeof window === 'undefined') return;
        const onAuthenticated = () => {
          hydrateTeamsFromStorage();
          setRefreshTrigger((t) => t + 1);
        };
        window.addEventListener('finesse-authenticated', onAuthenticated);
        return () => window.removeEventListener('finesse-authenticated', onAuthenticated);
      }, [hydrateTeamsFromStorage]);

      // Fetch user team details using teamId from storage (FINESSE_SELECTED_TEAM_ID_KEY)
      useEffect(() => {
        const data = getFinesseUserData();
        const username = data?.loginId ?? data?.loginName;
        const teamId = getEffectiveTeamId(data);
        if (!username || teamId == null) {
          setTeamData(null);
          setTeamDataError(null);
          return;
        }
        setTeamDataLoading(true);
        setTeamDataError(null);
        getFinesseUserTeam(username, teamId, includeLoggedOut)
          .then((res: TeamApiResponse) => {
            const payload = res?.responseData ?? (res as unknown as { responseData?: TeamApiResponse['responseData'] })?.responseData;
            setTeamData(payload ?? null);
            if (payload && mergeClusterIntoStoredUserFromTeamPayload(payload)) {
              setStreamConfigBump((b) => b + 1);
            }
          })
          .catch((err) => {
            setTeamDataError(err?.message ?? 'Failed to load team');
            setTeamData(null);
          })
          .finally(() => {
            setTeamDataLoading(false);
          });
      }, [refreshTrigger, includeLoggedOut]);

      /** Keep TopBar in sync with REST team row / stored user when SSE is delayed or missing. */
      useEffect(() => {
        const username = getFinesseUserData()?.loginId ?? getFinesseUserData()?.loginName;
        const users = teamData?.users ?? [];
        const row =
          username && users.length
            ? users.find((u) => u.loginId === username)
            : undefined;
        const effFromRow =
          row != null ? getFinesseEffectiveAgentStateFromStatePayload(row) : undefined;
        const effFromStore = getFinesseEffectiveAgentStateFromStatePayload(
          getFinesseUserData(),
        );
        const eff = effFromRow ?? effFromStore;
        if (eff == null || eff === '') return;
        setAgentStatus(mapEffectiveFinesseStateToTopBarReadyToggle(eff));
      }, [teamData]);

      const handleTeamChange = async (newTeamName: string, newTeamId: number) => {
        if (Number(getStoredTeamId()) === newTeamId) return;
        const previousTeamName = selectedTeam;
        const stored = getFinesseUserData();
        const usernameForCheck =
          stored?.loginId ??
          stored?.loginName ??
          (session?.user as { username?: string } | undefined)?.username ??
          '';
        const switchCheck = await assertFinesseTeamSwitchable(newTeamId, usernameForCheck || undefined, [
          teams,
          stored?.teams,
        ]);
        if (!switchCheck.ok) {
          toast.error(switchCheck.message);
          setSelectedTeam(previousTeamName);
          return;
        }
        const { username, teamId } = getFinesseContext();
        if (username && teamId != null) {
          try {
            await finesseUnlink(username, teamId);
          } catch (err: unknown) {
            toast.error(getFinesseApiErrorMessage(err, 'Unlink failed'));
            setSelectedTeam(previousTeamName);
            return;
          }
        }
        setStoredTeamId(newTeamId);
        clearFinesseUserData();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('finesse-require-reauth', { detail: { manualConnect: false } }),
          );
        }
      };

      const handleLogout = async () => {
        const { username, teamId } = getFinesseContext();
        if (username && teamId != null) {
          try {
            await finesseUnlink(username, teamId);
          } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (err as Error)?.message ?? 'Unlink failed';
            toast.error(msg ?? 'Failed to unlink from Finesse');
          }
        }
        clearFinesseUserData();
        setFinesseManualReconnectRequired();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('finesse-require-reauth', { detail: { manualConnect: true } }),
          );
        }
      };

      const handleAgentStatusChange = async (newState: string) => {
        const { username, teamId } = getFinesseContext();
        if (!username || teamId == null) {
          toast.error('User not found.');
          return;
        }
        const state = newState === 'READY' || newState === 'NOT_READY' ? newState : 'READY';
        try {
          await finesseSetState(teamId, username, state);
          setAgentStatus(state);
        } catch (err: unknown) {
          toast.error(getFinesseApiErrorMessage(err, 'Failed to update agent state.'));
        }
      };
    
      const statusOptions = [
        { value: 'READY', label: 'Ready', color: '#10b981', icon: CheckCircle },
        { value: 'NOT_READY', label: 'Not Ready', color: '#ef4444', icon: XCircle }
      ];

      // Derive agents from API team response (no dummy data)
      const agents: DisplayAgent[] = teamUsersForDisplay.map((u) => ({
        id: u.loginId,
        loginId: u.loginId,
        name: [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.loginId,
        state: u.state ?? 'UNKNOWN',
        stateColor: getStateColor(u.state ?? ''),
        timeInState: formatDuration(u.stateChangeTime),
        extension: u.extension ?? '—'
      }));

      const filteredAgents = agents.filter((agent) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          agent.name.toLowerCase().includes(q) || agent.loginId.toLowerCase().includes(q);
        const matchesStatus =
          filterStatus === 'all' ||
          (filterStatus === 'ready' && agent.state === 'READY') ||
          (filterStatus === 'notready' && agent.state === 'NOT_READY') ||
          (filterStatus === 'offline' && isFinesseAgentOfflineLikeState(agent.state));
        return matchesSearch && matchesStatus;
      });

      const teamDataAvailable = !teamDataLoading && teamData != null;
    
      const handleSelectAgent = (id: string) => {
        setSelectedAgents((prev) =>
          prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
        );
      };

      const handleSelectAll = () => {
        if (selectedAgents.length === filteredAgents.length) {
          setSelectedAgents([]);
        } else {
          setSelectedAgents(filteredAgents.map((a) => a.id));
        }
      };

      const handleRefresh = () => {
        setIsRefreshing(true);
        setRefreshTrigger((t) => t + 1);
        setTimeout(() => setIsRefreshing(false), 800);
      };
    
      const handleStatusChange = async (status: string) => {
        setShowStatusDropdown(false);
        await handleAgentStatusChange(status);
      };
    
      /** POST /api/v1/finesse/teams/{teamId}/users/{loginId}/state — body `{ newState: "READY" | "NOT_READY" }` */
      const handleBulkStatusChange = async (newStatus: string) => {
        if (!canChangeUserStatus) {
          toast.error('You do not have permission to change agent status.');
          return;
        }
        if (selectedAgents.length === 0) {
          toast.warn('Please select at least one agent to change status.');
          return;
        }
        const newState: 'READY' | 'NOT_READY' = newStatus === 'READY' ? 'READY' : 'NOT_READY';
        const data = getFinesseUserData();
        const teamId = getEffectiveTeamId(data);
        if (teamId == null) {
          toast.error('Team not available.');
          return;
        }
        const count = selectedAgents.length;
        const label = newState === 'READY' ? 'Ready' : 'Not Ready';
        setBulkActionLoading(true);
        try {
          const results = await Promise.allSettled(
            selectedAgents.map((loginId) => finesseSetState(teamId, loginId, newState)),
          );
          const rejected = results.filter(
            (r): r is PromiseRejectedResult => r.status === 'rejected',
          );
          setRefreshTrigger((t) => t + 1);
          setSelectedAgents([]);
          if (rejected.length === 0) {
            toast.success(`Updated ${count} agent(s) to ${label}.`);
          } else {
            toast.error(
              getFinesseApiErrorMessage(
                rejected[0].reason,
                `Failed to update agent state (${rejected.length}/${count}).`,
              ),
            );
          }
        } finally {
          setBulkActionLoading(false);
        }
      };

      const handleSingleAgentStatusChange = async (agentLoginId: string, newStatus: string) => {
        if (!canChangeUserStatus) {
          toast.error('You do not have permission to change agent status.');
          setActionMenuPortal(null);
          return;
        }
        const newState: 'READY' | 'NOT_READY' = newStatus === 'READY' ? 'READY' : 'NOT_READY';
        const data = getFinesseUserData();
        const teamId = getEffectiveTeamId(data);
        if (teamId == null) {
          toast.error('Team not available.');
          setActionMenuPortal(null);
          return;
        }
        try {
          await finesseSetState(teamId, agentLoginId, newState);
          const label = newState === 'READY' ? 'Ready' : 'Not Ready';
          toast.success(`Status updated to ${label}.`);
          setRefreshTrigger((t) => t + 1);
        } catch (err: unknown) {
          toast.error(getFinesseApiErrorMessage(err, 'Failed to update agent state.'));
        } finally {
          setActionMenuPortal(null);
        }
      };

      const handleForceSignOutAgent = useCallback(async (agentLoginId: string) => {
        if (!canForceSignOut) {
          toast.error('You do not have permission to force sign-out.');
          setActionMenuPortal(null);
          return;
        }
        const stored = getFinesseUserData();
        const supervisorFinesseUserId =
          stored?.loginId ?? stored?.loginName ?? '';
        const teamId = getEffectiveTeamId(stored);
        if (!supervisorFinesseUserId.trim()) {
          toast.error('Supervisor user not found.');
          setActionMenuPortal(null);
          return;
        }
        if (teamId == null) {
          toast.error('Team not available.');
          setActionMenuPortal(null);
          return;
        }
        if (agentLoginId === supervisorFinesseUserId) {
          toast.warn('You cannot force sign-out your own session from another agent row.');
          setActionMenuPortal(null);
          return;
        }
        try {
          await finesseForceSignOut({
            teamId,
            finesseUserId: agentLoginId,
            supervisorFinesseUserId,
          });
          toast.success('Agent signed out of Finesse.');
          setRefreshTrigger((t) => t + 1);
        } catch (err: unknown) {
          toast.error(getFinesseApiErrorMessage(err, 'Force sign-out failed.'));
        } finally {
          setActionMenuPortal(null);
        }
      }, [canForceSignOut]);
    
  return (
    <FinesseAuthGate subTitle="Live Calls Agents Management" pageLabel="Live Calls Agents">
    <React.Fragment>
      <BreadcrumbItem mainTitle="Campaign Console" mainLink="/communications/campaign-console" subTitle="Campaign Console" />

      
      <style>{`
        
     .campaign-info-bar {
          background: linear-gradient(135deg, #667eea 0%, #667eea 100%);
          color: white;
          padding: 16px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          animation: slideDown 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .campaign-info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }

        .campaign-info-item strong {
          font-weight: 700;
          opacity: 0.9;
        }


        .top-bar {
          background: white;
          padding: 16px 32px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .search-box {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .search-box input {
          width: 100%;
          padding: 9px 16px 10px 42px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14px;
          transition: all 0.2s;
        }

        .search-box input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .team-selector select {
          padding: 11px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          color: #475569;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 200px;
        }

        .team-selector select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .team-selector select:hover {
          border-color: #667eea;
        }

        .team-selector {
          position: relative;
        }

        .team-selector select {
          padding: 10px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          color: #475569;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 200px;
        }

        .team-selector select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .team-selector select:hover {
          border-color: #667eea;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .top-right-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .status-dropdown-container {
          position: relative;
          z-index: 100;
        }

        .status-selector {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
          font-weight: 600;
          min-width: 160px;
        }

        .status-selector:hover {
          border-color: #667eea;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
        }

        .status-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          min-width: 200px;
          z-index: 9999;
          overflow: hidden;
          animation: slideDown 0.2s ease;
          border: 1px solid #e5e7eb;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          background: white;
          width: 100%;
          text-align: left;
          font-size: 14px;
          color: #475569;
          font-family: inherit;
        }

        .dropdown-item:hover {
          background: #f8fafc;
        }

        .dropdown-item.active {
          background: #ede9fe;
          color: #7c3aed;
        }

        .icon-button {
          width: 44px;
          height: 44px;
          border: 2px solid #e5e7eb;
          background: white;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          color: #64748b;
        }

        .icon-button:hover {
          border-color: #667eea;
          color: #667eea;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
        }

        .icon-button.refreshing {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .user-menu-button {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          color: white;
          font-weight: 600;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }

        .user-menu-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
        }

       .btn-wrap-up {
          background: linear-gradient(135deg, #2c7ade 0%, #2c7ade 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(6, 182, 212, 0.4);
        }

        .btn-wrap-up:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(6, 182, 212, 0.5);
        }

        .btn-close {
          background: #fff;
  color: #000;
  opacity: 1;
  padding-right: 37px;
  padding-top: 13px;
  padding-bottom: 13px;
        }

        .btn-close:hover {
          background: #e2e8f0;
        }

        .content-area {
          padding: 32px;
        }

        .page-header {
          display: block
        }

        .page-title {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 8px;
        }

        .page-subtitle {
          color: #64748b;
          font-size: 16px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: white;
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.3s;
          border: 1px solid #f1f5f9;
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
        }

        .stat-card:hover::before {
          opacity: 1;
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-main {
          flex: 1;
        }

        .stat-value {
          font-size: 36px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 4px;
          line-height: 1;
        }

        .stat-label {
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 12px;
        }

        .stat-change {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .stat-change.positive {
          background: #dcfce7;
          color: #16a34a;
        }

        .stat-change.negative {
          background: #fee2e2;
          color: #dc2626;
        }

        .stat-footer {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
          font-size: 13px;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .stat-chart {
          height: 60px;
          margin-top: 16px;
          opacity: 0.8;
        }

        .card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .card-header {
          padding: 24px 32px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .card-title {
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
        }

        .filters {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .dropdown {
          position: relative;
        }

        .dropdown-toggle {
          padding: 10px 16px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #475569;
          transition: all 0.2s;
        }

        .dropdown-toggle:hover {
          border-color: #667eea;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          color: #475569;
          user-select: none;
        }

        .checkbox {
          width: 18px;
          height: 18px;
          border: 2px solid #d1d5db;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .checkbox.checked {
          background: #667eea;
          border-color: #667eea;
        }

        .table-container {
          overflow-x: auto;
          overflow-y: visible;
          padding-bottom: 8px;
          max-height: initial !important;
        }

        table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }

        thead th {
          background: #f8fafc;
          padding: 16px 24px;
          text-align: left;
          font-weight: 600;
          font-size: 13px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #e5e7eb;
        }

        tbody tr {
          transition: all 0.2s;
          border-bottom: 1px solid #f1f5f9;
        }

        tbody tr:hover {
          background: #f8fafc;
        }

        tbody tr.selected {
          background: #ede9fe;
        }

        tbody td {
          padding: 10px 24px;
          color: #475569;
          font-size: 14px;
        }

        .agent-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 14px;
        }

        .agent-details h4 {
          font-size: 15px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 2px;
        }

        .agent-details p {
          font-size: 13px;
          color: #64748b;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
        }

        .action-btn {
          width: 36px;
          height: 36px;
          border: none;
          background: #f8fafc;
          border-radius: 8px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          color: #64748b;
          position: relative;
        }

        .action-btn:hover {
          background: #667eea;
          color: white;
        }

        .action-menu-container {
          position: relative;
          display: inline-block;
          z-index: 1;
        }

        .action-menu {
          position: absolute;
          top: calc(100% + 4px);
          right: 0;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          min-width: 160px;
          z-index: 10050;
          overflow: hidden;
          animation: slideDown 0.2s ease;
          border: 1px solid #e5e7eb;
        }

        .action-menu.action-menu--fixed-portal {
          animation: none;
        }

        .action-menu.show-above {
          top: auto;
          bottom: calc(100% + 4px);
          animation: slideUp 0.2s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .action-menu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          background: white;
          width: 100%;
          text-align: left;
          font-size: 13px;
          color: #475569;
          font-family: inherit;
        }

        .action-menu-item:hover {
          background: #f8fafc;
        }

        .action-menu-item.danger {
          color: #dc2626;
        }

        .action-menu-item.danger:hover {
          background: #fee2e2;
        }

        .info-card {
          background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
          border: 2px dashed #667eea40;
          border-radius: 12px;
          padding: 32px;
          margin-top: 24px;
          text-align: center;
        }

        .info-card-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .info-card-text {
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        }

        .bulk-action-bar {
          background: linear-gradient(135deg, #667eea 0%, #667eea 100%);
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: white;
          animation: slideDown 0.3s ease;
        }

        .bulk-action-text {
          font-size: 14px;
          font-weight: 600;
        }

        .bulk-action-buttons {
          display: flex;
          gap: 8px;
        }

        .bulk-action-btn {
          padding: 8px 16px;
          border: 2px solid white;
          background: transparent;
          color: white;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .bulk-action-btn:hover {
          background: white;
          color: #667eea;
        }

        .call-widget {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 315px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          animation: slideUp 0.3s ease;
          z-index: 1000;
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .call-widget-header {
          background: linear-gradient(135deg, #667eea 0%, #667eea 100%);
          color: white;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .call-widget-body {
          padding: 15px;
        }

        .call-status {
          text-align: center;
          margin-bottom: 12px;
        }

        .call-timer {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .call-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          background: #fef3c7;
          color: #92400e;
        }

        .call-status-badge.connected {
          background: #dcfce7;
          color: #166534;
        }

        .call-info-grid {
          display: grid;
          gap: 12px;
          margin-bottom: 5px;
        }

        .call-info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 3px 12px;
          background: #f8fafc;
          border-radius: 10px;
          font-size: 14px;
        }

        .call-info-label {
          color: #64748b;
          font-weight: 500;
        }

        .call-info-value {
          color: #1e293b;
          font-weight: 600;
        }

        .call-controls {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 5px;
        }

        .call-control-btn {
          width: 100%;
          aspect-ratio: 1;
          border: none;
          border-radius: 12px;
          background: #f8fafc;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 500;
        }

        .call-control-btn:hover {
          background: #e2e8f0;
          transform: translateY(-2px);
        }

        .call-control-btn.active {
          background: #667eea;
          color: white;
        }

        .call-action-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .btn-accept {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          padding: 14px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .btn-accept:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
        }

        .btn-reject {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: none;
          padding: 14px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .btn-reject:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
        }

        .btn-end-call {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: none;
          padding: 14px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
          width: 100%;
        }

        .btn-end-call:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
        }

        .view-toggle {
          display: flex;
          gap: 4px;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 10px;
        }

        .view-toggle button {
          padding: 8px 12px;
          border: none;
          background: transparent;
          border-radius: 8px;
          cursor: pointer;
          color: #64748b;
          transition: all 0.2s;
        }

        .view-toggle button.active {
          background: white;
          color: #667eea;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 1024px) {
          .sidebar {
            position: fixed;
            z-index: 1000;
            height: 100%;
          }
          
          .sidebar.closed {
            transform: translateX(-100%);
          }
          
          .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          }

          .call-widget {
            width: 320px;
            bottom: 16px;
            right: 16px;
          }
        }

        @media (max-width: 768px) {
         
          .stats-grid {
            grid-template-columns: 1fr;
          }
          

          .call-widget {
            width: calc(100% - 32px);
            left: 16px;
            right: 16px;
          }
        }
      `}</style>

      <Row>
        <Col md={12}>
          <TopBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedTeam={selectedTeam}
            setSelectedTeam={setSelectedTeam}
            teams={teams}
            agentStatus={agentStatus}
            setAgentStatus={setAgentStatus}
            showStatusDropdown={showStatusDropdown}
            setShowStatusDropdown={setShowStatusDropdown}
            showUserMenu={showUserMenu}
            setShowUserMenu={setShowUserMenu}
            statusOptions={statusOptions}
            handleLogout={handleLogout}
            onStatusChange={handleStatusChange}
            onTeamChange={teams.length > 0 ? handleTeamChange : undefined}
          />
        </Col>
      </Row>

      {/* Page Header */}
      <div className="page-header">
            <h1 className="page-title">Campaign Console</h1>
            <p className="page-subtitle">Monitor campaign status, availability, and manage team operations in real-time</p>
          </div>

          {/* Main Card */}
          <div className="card">
            {selectedAgents.length > 0 && (
              <div className="bulk-action-bar">
                <div className="bulk-action-text">
                  {selectedAgents.length} agent(s) selected
                </div>
                <div className="bulk-action-buttons">
                  <button 
                    className="bulk-action-btn"
                    type="button"
                    disabled={bulkActionLoading || !canChangeUserStatus}
                    title={!canChangeUserStatus ? 'You do not have permission to change agent status' : undefined}
                    onClick={() => void handleBulkStatusChange('READY')}
                  >
                    <CheckCircle size={16} />
                    Set Ready
                  </button>
                  <button 
                    className="bulk-action-btn"
                    type="button"
                    disabled={bulkActionLoading || !canChangeUserStatus}
                    title={!canChangeUserStatus ? 'You do not have permission to change agent status' : undefined}
                    onClick={() => void handleBulkStatusChange('NOT_READY')}
                  >
                    <XCircle size={16} />
                    Set Not Ready
                  </button>
                  <button 
                    className="bulk-action-btn"
                    onClick={() => setSelectedAgents([])}
                  >
                    <X size={16} />
                    Clear
                  </button>
                </div>
              </div>
            )}
            <div className="card-header">
              <div>
                <h2 className="card-title">Active Agents ({filteredAgents.length})</h2>
              </div>
              
              <div className="filters">
                {/* <div className="view-toggle">
                  <button
                    className={viewMode === 'table' ? 'active' : ''}
                    onClick={() => setViewMode('table')}
                  >
                    <List size={18} />
                  </button>
                  <button
                    className={viewMode === 'grid' ? 'active' : ''}
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid size={18} />
                  </button>
                </div> */}

                {/* <div className="dropdown">
                  <select
                    className="dropdown-toggle"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{ border: '2px solid #e5e7eb', background: 'white' }}
                  >
                    <option value="all">All Status</option>
                    <option value="ready">Ready</option>
                    <option value="oncall">On Call</option>
                    <option value="break">Break</option>
                    <option value="offline">Offline</option>
                  </select>
                </div> */}

                <label className="checkbox-label">
                  <div
                    className={`checkbox ${includeLoggedOut ? 'checked' : ''}`}
                    onClick={() => setIncludeLoggedOut(!includeLoggedOut)}
                  >
                    {includeLoggedOut && <CheckCircle size={14} color="white" />}
                  </div>
                  <span>Show Offline Agents</span>
                </label>
                
                <button 
                  className="icon-button"
                  onClick={handleRefresh}
                  title="Refresh Agent List"
                  style={{ marginLeft: '8px' }}
                >
                  <RefreshCw size={18} className={isRefreshing ? 'refreshing' : ''} />
                </button>
              </div>
            </div>

            {teamDataLoading && (
              <div className="info-card" style={{ marginTop: 0 }}>
                <div className="info-card-title">
                  <RefreshCw size={20} className="refreshing" style={{ animation: 'spin 1s linear infinite' }} />
                  Loading team agents…
                </div>
                <p className="info-card-text">Fetching agents for the selected team.</p>
              </div>
            )}

            {!teamDataLoading && teamDataError && (
              <div className="info-card" style={{ marginTop: 0, borderColor: '#fecaca' }}>
                <div className="info-card-title" style={{ color: '#dc2626' }}>
                  <AlertCircle size={20} />
                  Unable to load team
                </div>
                <p className="info-card-text">{teamDataError}</p>
              </div>
            )}

            {teamDataAvailable && !teamData?.users?.length && (
              <div className="info-card" style={{ marginTop: 0 }}>
                <div className="info-card-title">
                  <AlertCircle size={20} color="#667eea" />
                  No agents in this team
                </div>
                <p className="info-card-text">The selected team has no users. Choose another team or try again later.</p>
              </div>
            )}

            {teamDataAvailable &&
              (teamData?.users?.length ?? 0) > 0 &&
              teamUsersForDisplay.length === 0 &&
              !includeLoggedOut && (
                <div className="info-card" style={{ marginTop: 0 }}>
                  <div className="info-card-title">
                    <AlertCircle size={20} color="#667eea" />
                    All agents are offline
                  </div>
                  <p className="info-card-text">
                    Enable &quot;Include logged out&quot; above to see offline agents.
                  </p>
                </div>
              )}

            {teamDataAvailable && teamUsersForDisplay.length > 0 && (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>
                      <div
                        className={`checkbox ${selectedAgents.length === filteredAgents.length && filteredAgents.length > 0 ? 'checked' : ''}`}
                        onClick={handleSelectAll}
                        style={{ cursor: 'pointer' }}
                        role="presentation"
                      >
                        {selectedAgents.length === filteredAgents.length && filteredAgents.length > 0 && (
                          <CheckCircle size={14} color="white" />
                        )}
                      </div>
                    </th>
                    <th>Agent</th>
                    <th>Status</th>
                    <th >Duration</th>
                    <th>Extension</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.map((agent) => (
                    <tr
                      key={agent.id}
                      className={selectedAgents.includes(agent.id) ? 'selected' : ''}
                    >
                      <td>
                        <div
                          className={`checkbox ${selectedAgents.includes(agent.id) ? 'checked' : ''}`}
                          onClick={() => handleSelectAgent(agent.id)}
                          style={{ cursor: 'pointer' }}
                          role="presentation"
                        >
                          {selectedAgents.includes(agent.id) && (
                            <CheckCircle size={14} color="white" />
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="agent-info">
                          <div className="agent-details">
                            <h4>{agent.name}</h4>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className="status-badge"
                          style={{
                            background: `${agent.stateColor}20`,
                            color: agent.stateColor
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: agent.stateColor
                            }}
                          />
                          {agent.state}{agent.label ? ` (${agent.label})` : ''}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={16} color="#64748b" />
                          {agent.timeInState}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={16} color="#64748b" />
                          {agent.extension}
                        </div>
                      </td>
                      <td>
                        <div className="action-menu-container">
                          <button
                            type="button"
                            data-campaign-console-action-trigger
                            className="action-btn"
                            onClick={(e) => openAgentActionMenu(e, agent)}
                            title="Actions"
                          >
                            <MoreVertical size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
            
            {/* Info Card when showing few agents (only when team data is loaded) */}
            {/* {teamDataAvailable && filteredAgents.length < 3 && (
              <div className="info-card">
                <div className="info-card-title">
                  <AlertCircle size={20} color="#667eea" />
                  Limited Agent List
                </div>
                <p className="info-card-text">
                  {selectedTeam
                    ? `Team ${selectedTeam.replace(/-/g, ' ')} currently has ${filteredAgents.length} agent(s). Other agents may be assigned to different teams.`
                    : `Currently ${filteredAgents.length} agent(s). Log in to Finesse to load teams and see team-specific agents.`}
                </p>
              </div>
            )} */}
          </div>

      {typeof document !== 'undefined' &&
        actionMenuPortal &&
        createPortal(
          <div
            data-campaign-console-action-menu
            className="action-menu action-menu--fixed-portal"
            style={{
              position: 'fixed',
              top: actionMenuPortal.top,
              left: actionMenuPortal.left,
              maxHeight: actionMenuPortal.maxHeight,
              overflowY: 'auto',
              zIndex: 100050,
              minWidth: 180,
            }}
            role="menu"
          >
            <button
              type="button"
              className="action-menu-item"
              disabled={!canChangeUserStatus}
              title={!canChangeUserStatus ? 'You do not have permission to change agent status' : undefined}
              onClick={(e) => {
                e.stopPropagation();
                if (!canChangeUserStatus) return;
                const a = actionMenuPortal.agent;
                if (a.state !== 'OFFLINE') {
                  void handleSingleAgentStatusChange(a.loginId, 'READY');
                } else {
                  toast.warn('Cannot change status of offline agents');
                  setActionMenuPortal(null);
                }
              }}
            >
              <CheckCircle size={16} color="#10b981" />
              <span>Ready</span>
            </button>
            <button
              type="button"
              className="action-menu-item"
              disabled={!canChangeUserStatus}
              title={!canChangeUserStatus ? 'You do not have permission to change agent status' : undefined}
              onClick={(e) => {
                e.stopPropagation();
                if (!canChangeUserStatus) return;
                const a = actionMenuPortal.agent;
                if (a.state !== 'OFFLINE') {
                  void handleSingleAgentStatusChange(a.loginId, 'NOT_READY');
                } else {
                  toast.warn('Cannot change status of offline agents');
                  setActionMenuPortal(null);
                }
              }}
            >
              <XCircle size={16} color="#ef4444" />
              <span>Not Ready</span>
            </button>
            <button
              type="button"
              className="action-menu-item danger"
              disabled={!canForceSignOut}
              title={!canForceSignOut ? 'You do not have permission to force sign-out' : undefined}
              onClick={(e) => {
                e.stopPropagation();
                if (!canForceSignOut) return;
                void handleForceSignOutAgent(actionMenuPortal.agent.loginId);
              }}
            >
              <LogOut size={16} />
              <span>Force sign out</span>
            </button>
          </div>,
          document.body,
        )}

      {/* Call Widget — Finesse preview (campaign) dialogs */}
      <CallWidget {...callWidgetProps} />

      <WrapUpModal {...wrapUpModalProps} />
  

    </React.Fragment>
    </FinesseAuthGate>
  );
};

LiveCallsAgentsManagement.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default LiveCallsAgentsManagement;
