import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import React, { type ReactElement, useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { Row, Col } from "react-bootstrap";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { useSession } from 'next-auth/react';
import {
  Plus,
  Upload,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  ChevronDown,
  Grid,
  Target,
  Loader,
} from 'lucide-react';

import CallWidget from '../CallWidget';
import WrapUpModal from '../WrapUp';
import type { CallVariableConfig } from '../WrapUp';

import TopBar, { type TeamOption } from '../TopBarAgent';
import FinesseAuthGate from '../FinesseAuthGate';
import { toast } from 'react-toastify';
import {
  getFinesseUserData,
  getFinesseToken,
  setFinesseUserData,
  clearFinesseUserData,
  finesseUnlink,
  finesseLink,
  getFinesseUser,
  finesseSetState,
  getFinesseCampaigns,
  setFinesseCampaignEnabled,
  importFinesseCampaignContacts,
  getFinesseCampaignsContactsStatus,
  sendFinesseDialogAction,
  getFinesseWrapUpReasons,
  getEffectiveTeamId,
  getStoredTeamId,
  setStoredTeamId,
  getFinessePasswordForRelink,
  normalizeFinesseUserData,
  scheduleFinesseCampaign,
  type FinesseUserData,
} from '@utils/finesse';
import { useFinesseCapabilities } from '@hooks/live-calls/useFinesseCapabilities';
import { useFinesseStomp, type FinessePreviewEvent } from '@hooks/live-calls/useFinesseStomp';

export interface CampaignRow {
  id: number;
  name: string;
  type: string;
  dialerType: string;
  timeFrom: string;
  timeTo: string;
  startTime: string;
  endTime: string;
  timezone: string;
  contactsRemaining: number;
  pendingContacts: number;
  enabled: boolean;
}

const mapApiCampaignToRow = (item: any, index: number): CampaignRow => {
  const timeFrom = item.startTime ?? item.timeFrom ?? '09:00';
  const timeTo = item.endTime ?? item.timeTo ?? '17:00';
  return {
    id: item.id ?? item.campaignId ?? index + 1,
    name: item.name ?? item.campaignName ?? '',
    type: item.type ?? 'Agent',
    dialerType: item.dialerType ?? 'Direct Preview',
    timeFrom,
    timeTo,
    startTime: timeFrom,
    endTime: timeTo,
    timezone: item.timezone ?? 'Server Time Zone-Gulf Standard Time',
    contactsRemaining: item.contactsRemaining ?? item.contactCount ?? 0,
    pendingContacts: item.pendingContacts ?? item.contactsRemaining ?? item.contactCount ?? 0,
    enabled: item.enabled ?? true,
  };
};

interface ImportStatusShape {
  status?: string;
  result?: string;
  lastImportTime?: string;
  importedCount?: number;
  message?: string;
  importStatus?: { states?: Array<{ result?: string; numContactsImported?: number; message?: string }> };
}

function formatImportStatusDisplay(s: ImportStatusShape | null | undefined): string {
  if (!s) return '—';
  const result = s.importStatus?.states?.[0]?.result ?? s.result ?? s.status;
  const upper = String(result ?? '').toUpperCase();
  if (upper === 'SUCCESS') {
    const count = s.importStatus?.states?.[0]?.numContactsImported ?? s.importedCount ?? 0;
    const date = s.lastImportTime
      ? new Date(s.lastImportTime).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
      : '';
    return `Imported ${count} contacts${date ? ` (${date})` : ''}.`;
  }
  if (upper === 'IN_PROGRESS') return 'Import in progress…';
  if (upper === 'FAILURE' || upper === 'ERROR') {
    const msg = s.importStatus?.states?.[0]?.message ?? s.message ?? 'Unknown error';
    return `Failed: ${msg}`;
  }
  return '—';
}

const LiveCallsCampaignsManagement = () => {
      const { data: session } = useSession();
      const [teams, setTeams] = useState<string[]>([]);
      const [teamsWithIds, setTeamsWithIds] = useState<TeamOption[]>([]);
      const [selectedTeam, setSelectedTeam] = useState('');
      const [agentStatus, setAgentStatus] = useState('READY');
      const [showStatusDropdown, setShowStatusDropdown] = useState(false);
      const [showUserMenu, setShowUserMenu] = useState(false);
      const [selectedCampaigns, setSelectedCampaigns] = useState<number[]>([]);
      const [searchQuery, setSearchQuery] = useState('');
      const [showCallWidget, setShowCallWidget] = useState(false);
      const [callTimer, setCallTimer] = useState(0);
      const [isMuted, setIsMuted] = useState(false);
      const [isHold, setIsHold] = useState(false);
      const [callStatus, setCallStatus] = useState('Ringing');
      const [showUploadModal, setShowUploadModal] = useState(false);
      const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
      const [uploadedFile, setUploadedFile] = useState<File | null>(null);
      const [columnMapping, setColumnMapping] = useState<Array<{id: number, name: string, order: number}>>([]);
      const [isWrapUpOpen, setIsWrapUpOpen] = useState(false);
      const [wrapUpReasons, setWrapUpReasons] = useState<Array<{ value: string; label: string }>>([]);
      const [wrapUpReasonsLoading, setWrapUpReasonsLoading] = useState(false);
      const [holdLoading, setHoldLoading] = useState(false);
      const [callVariablesConfig, setCallVariablesConfig] = useState<CallVariableConfig[]>([]);

      const statusDropdownRef = useRef<HTMLDivElement>(null);
      const userMenuRef = useRef<HTMLDivElement>(null);
      const fileInputRef = useRef<HTMLInputElement>(null);
      const wrapUpEventDialogIdRef = useRef<string | null>(null);
      const wrapUpAutoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
      // Close dropdowns when clicking outside
      useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
            setShowStatusDropdown(false);
          }
          if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
            setShowUserMenu(false);
          }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }, []);

      // Username available after FinesseAuthGate (from storage or session)
      const finesseData = getFinesseUserData();
      const finesseUsername =
        finesseData?.loginId ??
        finesseData?.loginName ??
        (session?.user as { username?: string } | undefined)?.username ??
        '';

      // Hydrate from storage on mount so teams/APIs run when landing after link (storage is set but first render may miss it).
      // useLayoutEffect so dropdown is filled before first paint and dependent APIs run.
      const [finesseHydrated, setFinesseHydrated] = useState(false);
      const hydrateFromStorage = useCallback(() => {
        const stored = getFinesseUserData();
        if (stored) {
          setFinesseHydrated(true);
          const teamList = stored.teams ?? [];
          const withIds: TeamOption[] = teamList.map((t) => ({ id: t.id, name: t.name }));
          const teamNames = withIds.length > 0 ? withIds.map((t) => t.name) : (stored.teamName ? [stored.teamName] : []);
          if (withIds.length > 0) {
            setTeamsWithIds(withIds);
            setTeams(teamNames);
          } else if (teamNames.length > 0) {
            setTeams(teamNames);
          }
          const storedTeamId = getStoredTeamId();
          const match = withIds.find((t) => t.id === storedTeamId);
          setSelectedTeam(match?.name ?? stored.teamName ?? teamNames[0] ?? '');
          if (stored.state) setAgentStatus(stored.state);
        }
      }, []);
      useLayoutEffect(() => {
        if (typeof window === 'undefined') return;
        hydrateFromStorage();
      }, [hydrateFromStorage]);
      // When gate authenticates on same page (no reload/router), re-hydrate from storage so teams and APIs run
      useEffect(() => {
        if (typeof window === 'undefined') return;
        const onAuthenticated = () => hydrateFromStorage();
        window.addEventListener('finesse-authenticated', onAuthenticated);
        return () => window.removeEventListener('finesse-authenticated', onAuthenticated);
      }, [hydrateFromStorage]);

      // Fetch Finesse user and map to TopBar (teams, selectedTeam, agentStatus) – runs when past FinesseAuthGate / after hydrate
      useEffect(() => {
        if (!finesseHydrated) return;
        const data = getFinesseUserData();
        const teamId = getEffectiveTeamId(data);
        const username = data?.loginId ?? data?.loginName ?? (session?.user as { username?: string } | undefined)?.username ?? '';
        if (!username || teamId == null) return;

        const loadUser = async () => {
          try {
            const response = await getFinesseUser(teamId, username);
            const resData = response?.responseData ?? response;
            if (!resData) return;
            const rawTeams = (resData as { teams?: Array<{ id: number; name: string }> }).teams ?? [];
            const withIds: TeamOption[] = rawTeams.map((t) => ({ id: t.id, name: t.name }));
            const teamNames = withIds.length > 0 ? withIds.map((t) => t.name) : [];
            setTeamsWithIds(withIds);
            setTeams(teamNames);
            const normalized = normalizeFinesseUserData(resData as FinesseUserData);
            setFinesseUserData(normalized);
            const effectiveTeamId = normalized.teamId ?? (normalized.teams?.[0]?.id) ?? getStoredTeamId();
            setStoredTeamId(effectiveTeamId);
            const match = withIds.find((t) => t.id === effectiveTeamId);
            setSelectedTeam(match?.name ?? (resData as { teamName?: string }).teamName ?? teamNames[0] ?? '');
            setAgentStatus((resData as { state?: string }).state ?? 'READY');
          } catch {
            const stored = getFinesseUserData();
            if (stored) {
              const withIds = stored.teams?.map((t) => ({ id: t.id, name: t.name })) ?? [];
              if (withIds.length > 0) {
                setTeamsWithIds(withIds);
                setTeams(withIds.map((t) => t.name));
              }
              const storedTeamId = getStoredTeamId();
              const match = withIds.find((t) => t.id === storedTeamId);
              setSelectedTeam(match?.name ?? stored.teamName ?? withIds[0]?.name ?? '');
              if (stored.state) setAgentStatus(stored.state);
            }
          }
        };
        loadUser();
      }, [finesseHydrated, finesseUsername, session?.user]);

      // Fetch campaigns from Finesse – runs when past FinesseAuthGate / after hydrate
      useEffect(() => {
        if (!finesseHydrated) return;
        const data = getFinesseUserData();
        const teamId = getEffectiveTeamId(data);
        const username = data?.loginId ?? data?.loginName ?? (session?.user as { username?: string } | undefined)?.username ?? '';
        if (!username || teamId == null) return;

        const loadCampaigns = async () => {
          setCampaignsLoading(true);
          try {
            const response = await getFinesseCampaigns(teamId, username);
            const list = response?.data ?? response?.responseData ?? response;
            const arr = Array.isArray(list) ? list : list?.campaigns ?? list?.items ?? [];
            setCampaigns((arr as any[]).map((item, index) => mapApiCampaignToRow(item, index)));
          } catch (err) {
            toast.error((err as any)?.response?.data?.message ?? (err as Error)?.message ?? 'Failed to load campaigns.');
            setCampaigns([]);
          } finally {
            setCampaignsLoading(false);
          }
        };
        loadCampaigns();
      }, [finesseHydrated, finesseUsername, session?.user]);

      // Load import statuses in background – runs when past FinesseAuthGate / after hydrate
      useEffect(() => {
        if (!finesseHydrated) return;
        const data = getFinesseUserData();
        const teamId = getEffectiveTeamId(data);
        const username = data?.loginId ?? data?.loginName ?? (session?.user as { username?: string } | undefined)?.username ?? '';
        if (!username || teamId == null) return;

        const loadImportStatuses = async () => {
          try {
            const statusData = await getFinesseCampaignsContactsStatus(teamId, username);
            const list = (statusData as { importStatuses?: Array<{ campaignId: number }> })?.importStatuses ?? (statusData as { campaigns?: Array<{ campaignId: number }> })?.campaigns ?? [];
            const arr = Array.isArray(list) ? list : [];
            const map: Record<number, unknown> = {};
            arr.forEach((s: { campaignId: number }) => {
              map[s.campaignId] = s;
            });
            setImportStatuses(map);
          } catch {
            // Non-blocking
          }
        };
        loadImportStatuses();
      }, [finesseHydrated, finesseUsername, session?.user]);

      const statusOptions = [
        { value: 'READY', label: 'Ready', color: '#10b981', icon: CheckCircle },
        { value: 'NOT_READY', label: 'Not Ready', color: '#ef4444', icon: XCircle }
      ];

      const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
      const [campaignsLoading, setCampaignsLoading] = useState(false);
      const [importStatuses, setImportStatuses] = useState<Record<number, unknown>>({});
      const [previewDialogs, setPreviewDialogs] = useState<Record<string, FinessePreviewEvent>>({});
      const [token, setToken] = useState<string | null>(null);

      const finesseDataForCap = getFinesseUserData();
      const capabilityTeamId = getEffectiveTeamId(finesseDataForCap);
      const capabilityUsername = finesseDataForCap?.loginId ?? finesseDataForCap?.loginName ?? null;
      const { hasCampaignMgmt, loading: capabilityLoading } = useFinesseCapabilities(capabilityTeamId, capabilityUsername);

      const activePreviewDialog = useMemo(() => {
        const dialogs = Object.values(previewDialogs);
        if (dialogs.length === 0) return null;
        const active = dialogs
          .filter((d) => {
            if ((d as { eventType?: string }).eventType === 'ENDED') return false;
            const p = d.participants?.[0];
            if (p?.state === 'DROPPED') return false;
            return true;
          })
          .sort((a, b) => {
            const timeA = a.participants?.[0]?.stateChangeTime ?? a.participants?.[0]?.startTime ?? '';
            const timeB = b.participants?.[0]?.stateChangeTime ?? b.participants?.[0]?.startTime ?? '';
            return new Date(timeB).getTime() - new Date(timeA).getTime();
          });
        return active[0] ?? null;
      }, [previewDialogs]);

      const getFinesseContext = useCallback(() => {
        const d = getFinesseUserData();
        const u = session?.user as { phone?: string } | undefined;
        return {
          username: d?.loginId ?? d?.loginName,
          extension: d?.extension ?? u?.phone,
          teamId: getEffectiveTeamId(d),
        };
      }, [session?.user]);

      const handlePreviewEvent = useCallback((payload: FinessePreviewEvent) => {
        if (payload?.dialogId == null) return;
        const eventType = (payload as { eventType?: string }).eventType;
        const dialogId = String(payload.dialogId);
        if (eventType === 'CREATED') {
          setPreviewDialogs((prev) => ({ ...prev, [dialogId]: payload }));
        } else if (eventType === 'UPDATED') {
          setPreviewDialogs((prev) => {
            const existing = prev[dialogId];
            if (existing) {
              return {
                ...prev,
                [dialogId]: { ...existing, ...payload, participants: payload.participants ?? existing.participants },
              };
            }
            return { ...prev, [dialogId]: payload };
          });
        } else if (eventType === 'ENDED') {
          if (wrapUpEventDialogIdRef.current === dialogId) wrapUpEventDialogIdRef.current = null;
          setPreviewDialogs((prev) => {
            const next = { ...prev };
            delete next[dialogId];
            return next;
          });
        }
      }, []);

      useEffect(() => {
        if (!session?.user) return;
        const t = typeof globalThis.window !== 'undefined' ? getFinesseToken() : null;
        setToken(t);
      }, [session?.user]);

      useFinesseStomp({
        token,
        finesseUserId: capabilityUsername,
        onStateEvent: (p) => p?.state && setAgentStatus(p.state),
        onErrorEvent: (p) => toast.error((p as { message?: string })?.message ?? 'Finesse error'),
        onAuthError: (msg) => toast.error(msg),
        onPreviewEvent: handlePreviewEvent,
      });

      // Drive call widget and status from preview event: ALERTING → Ringing, ACTIVE → Connected; sync hold; WRAP_UP/ALERTING+UPDATE_CALL_DATA → show Wrap up button (user clicks to open modal)
      useEffect(() => {
        if (!activePreviewDialog?.dialogId) {
          setShowCallWidget(false);
          return;
        }
        const { extension } = getFinesseContext();
        const participants = activePreviewDialog.participants ?? [];
        const agentParticipant = participants.find((p) => (p as { mediaAddress?: string }).mediaAddress === extension) ?? participants[0];
        const participant = agentParticipant ?? activePreviewDialog.participants?.[0];
        const dialogState = activePreviewDialog.dialogState ?? participant?.state;
        const isAlerting = dialogState === 'ALERTING' || participant?.state === 'ALERTING';
        const isActive = dialogState === 'ACTIVE' || participant?.state === 'ACTIVE';
        const isHeld = participant?.state === 'HELD';
        const hasUpdateCallData = Array.isArray(participant?.actions) && (participant as { actions?: string[] }).actions?.includes('UPDATE_CALL_DATA');
        const isWrapUpState = participant?.state === 'WRAP_UP' && hasUpdateCallData;
        setShowCallWidget(true);
        if (isAlerting) {
          setCallStatus('Ringing');
        } else if (isWrapUpState) {
          setCallStatus('Wrap up');
        } else if (isActive || isHeld) {
          setCallStatus('Connected');
          setIsHold(isHeld);
        }
      }, [activePreviewDialog?.dialogId, activePreviewDialog?.dialogState, activePreviewDialog?.participants]);

      // Simulate call timer
      useEffect(() => {
        let interval: NodeJS.Timeout | undefined;
        if (showCallWidget && callStatus === 'Connected') {
          interval = setInterval(() => {
            setCallTimer(prev => prev + 1);
          }, 1000);
        }
        return () => {
          if (interval) clearInterval(interval);
        };
      }, [showCallWidget, callStatus]);
    
      const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      };
    
      const filteredCampaigns = campaigns.filter(campaign =>
        campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (campaign.type ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.dialerType.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
      const handleSelectCampaign = (id: number) => {
        setSelectedCampaigns(prev =>
          prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
      };
    
      const handleSelectAll = () => {
        if (selectedCampaigns.length === filteredCampaigns.length) {
          setSelectedCampaigns([]);
        } else {
          setSelectedCampaigns(filteredCampaigns.map(c => c.id));
        }
      };
    
      /** When user selects a different team: unlink from current team, update storage with new teamId, then link to new team. */
      const handleTeamChange = async (newTeamName: string, newTeamId: number) => {
        const current = getFinesseUserData();
        if (!current) {
          toast.error('Session expired. Please sign in again.');
          return;
        }
        const currentTeamId = getEffectiveTeamId(current);
        const username = current.loginId ?? current.loginName ?? (session?.user as { username?: string } | undefined)?.username ?? '';
        const extension = current.extension ?? (session?.user as { phone?: string } | undefined)?.phone ?? '';
        if (!username || !extension) {
          toast.error('User not found.');
          return;
        }
        if (currentTeamId != null && Number(currentTeamId) === newTeamId) return;
        const password = getFinessePasswordForRelink();
        if (!password) {
          toast.error('Please sign out and sign in again to switch team.');
          return;
        }
        try {
          if (currentTeamId != null) {
            await finesseUnlink(username, currentTeamId);
          }
          setFinesseUserData({ ...current, teamId: newTeamId, teamName: newTeamName });
          setStoredTeamId(newTeamId);
          const response = await finesseLink({
            teamId: newTeamId,
            finesseUserId: username,
            finessePassword: password,
            extension,
          });
          if (response?.status === 'success' && response?.responseData) {
            const data = normalizeFinesseUserData(response.responseData as FinesseUserData);
            setFinesseUserData(data);
          }
          setSelectedTeam(newTeamName);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('finesse-authenticated'));
          }
          toast.success(`Switched to team ${newTeamName.replace(/-/g, ' ')}.`);
        } catch (err: unknown) {
          const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (err as Error)?.message ?? 'Failed to switch team';
          toast.error(msg);
        }
      };

      const handleLogout = async () => {
        const { username, teamId } = getFinesseContext();
        if (!username || teamId == null) {
          toast.error('user not found.');
          return;
        }
        try {
          if (username) {
            await finesseUnlink(username, teamId);
          }
        } catch (err: unknown) {
          const message = err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : err instanceof Error ? err.message : 'Unlink failed';
          toast.error(message ?? 'Failed to unlink from Finesse');
        } finally {
          clearFinesseUserData();
          globalThis.window.location.reload();
        }
      };
    
      const handleToggleCampaign = async (id: number) => {
        const campaign = campaigns.find(c => c.id === id);
        if (!campaign) return;
        const { username, teamId } = getFinesseContext();
        if (!username || teamId == null) {
          toast.error('user not found.');
          return;
        }
        const newEnabled = !campaign.enabled;
        try {
          await setFinesseCampaignEnabled(teamId, username, id, newEnabled);
          setCampaigns(prev => prev.map(c => (c.id === id ? { ...c, enabled: newEnabled } : c)));
          // if (newEnabled) {
          //   setShowCallWidget(true);
          //   setCallTimer(0);
          //   setCallStatus('Ringing');
          // }
        } catch (err: any) {
          toast.error(err?.response?.data?.message ?? err?.message ?? 'Failed to update campaign.');
        }
      };
    
      const handleAcceptCall = async () => {
        const { username, extension, teamId } = getFinesseContext();
        const dialogId = activePreviewDialog?.dialogId;
        if (username && extension && dialogId && teamId != null) {
          try {
            await sendFinesseDialogAction(teamId, username, String(dialogId), {
              extension: String(extension),
              action: 'ACCEPT',
            });
            setCallStatus('Connected');
            setCallTimer(0);
          } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (err as Error)?.message ?? 'Failed to accept call');
          }
        } else {
          setCallStatus('Connected');
          setCallTimer(0);
        }
      };

      const handleRejectCall = async () => {
        const { username, extension, teamId } = getFinesseContext();
        const dialogId = activePreviewDialog?.dialogId;
        if (username && extension && dialogId && teamId != null) {
          try {
            await sendFinesseDialogAction(teamId, username, String(dialogId), {
              extension: String(extension),
              action: 'REJECT',
            });
          } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (err as Error)?.message ?? 'Failed to reject call');
          }
        }
        setShowCallWidget(false);
        setCallTimer(0);
        setCallStatus('Ringing');
      };

      const handleRejectOrClose = async (action: 'REJECT' | 'CLOSE') => {
        const { username, extension, teamId } = getFinesseContext();
        const dialogId = activePreviewDialog?.dialogId;
        if (username && extension && dialogId && teamId != null) {
          try {
            await sendFinesseDialogAction(teamId, username, String(dialogId), {
              extension: String(extension),
              action,
            });
          } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (err as Error)?.message ?? `Failed to ${action.toLowerCase()} call`);
          }
        }
        setShowCallWidget(false);
        setCallTimer(0);
        setCallStatus('Ringing');
      };

      /** Reset local call UI state only (no DROP API). Use when closing wrap-up without submitting. */
      const resetCallWidgetState = () => {
        setShowCallWidget(false);
        setCallTimer(0);
        setCallStatus('Ringing');
        setIsMuted(false);
        setIsHold(false);
      };

      const dropCallAndReset = async () => {
        const { username, extension, teamId } = getFinesseContext();
        const dialogId = activePreviewDialog?.dialogId;
        if (username && extension && dialogId && teamId != null) {
          try {
            await sendFinesseDialogAction(teamId, username, String(dialogId), {
              extension: String(extension),
              action: 'DROP',
            });
          } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (err as Error)?.message ?? 'Failed to end call');
          }
        }
        resetCallWidgetState();
      };

      /** End call: send DROP first; server will send WRAP_UP event, then we show wrap-up modal with wrapUpTimer. */
      const handleEndCall = async () => {
        const { username, extension, teamId } = getFinesseContext();
        const dialogId = activePreviewDialog?.dialogId;
        if (username && extension && dialogId && teamId != null) {
          try {
            await sendFinesseDialogAction(teamId, username, String(dialogId), {
              extension: String(extension),
              action: 'DROP',
            });
          } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (err as Error)?.message ?? 'Failed to end call');
          }
        }
      };

      const handleHoldToggle = async (hold: boolean) => {
        const { username, extension, teamId } = getFinesseContext();
        const dialogId = activePreviewDialog?.dialogId;
        if (username && extension && dialogId && teamId != null) {
          setHoldLoading(true);
          try {
            await sendFinesseDialogAction(teamId, username, String(dialogId), {
              extension: String(extension),
              action: hold ? 'HOLD' : 'RETRIEVE',
            });
            setIsHold(hold);
            toast.success(hold ? 'Call on hold' : 'Call resumed');
          } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (err as Error)?.message ?? (hold ? 'Failed to hold' : 'Failed to resume'));
          } finally {
            setHoldLoading(false);
          }
        }
      };
    
      const handleOpenUploadModal = (campaignId: number) => {
        setSelectedCampaignId(campaignId);
        setShowUploadModal(true);
        setUploadedFile(null);
        setColumnMapping([
          { id: 1, name: 'Phone Number', order: 1 },
          { id: 2, name: 'First Name', order: 2 },
          { id: 3, name: 'Last Name', order: 3 },
          { id: 4, name: 'Email', order: 4 },
          { id: 5, name: 'Company', order: 5 }
        ]);
      };
    
      const handleCloseUploadModal = () => {
        setShowUploadModal(false);
        setSelectedCampaignId(null);
        setUploadedFile(null);
        setColumnMapping([]);
      };
    
      const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
          setUploadedFile(file);
        }
      };
    
      const handleAddColumn = () => {
        const newId = Math.max(...columnMapping.map(c => c.id), 0) + 1;
        setColumnMapping([...columnMapping, { id: newId, name: '', order: columnMapping.length + 1 }]);
      };
    
      const handleRemoveColumn = (id: number) => {
        const newMapping = columnMapping.filter(c => c.id !== id);
        // Reorder
        newMapping.forEach((col, index) => {
          col.order = index + 1;
        });
        setColumnMapping(newMapping);
      };
    
      const handleColumnNameChange = (id: number, newName: string) => {
        setColumnMapping(columnMapping.map(col => 
          col.id === id ? { ...col, name: newName } : col
        ));
      };
    
      const handleMoveColumn = (id: number, direction: 'up' | 'down') => {
        const currentIndex = columnMapping.findIndex(c => c.id === id);
        if (currentIndex === -1) return;
        
        if (direction === 'up' && currentIndex === 0) return;
        if (direction === 'down' && currentIndex === columnMapping.length - 1) return;
    
        const newMapping = [...columnMapping];
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        
        [newMapping[currentIndex], newMapping[targetIndex]] = [newMapping[targetIndex], newMapping[currentIndex]];
        
        // Update order
        newMapping.forEach((col, index) => {
          col.order = index + 1;
        });
        
        setColumnMapping(newMapping);
      };
    
      const handleUploadContacts = async () => {
        if (!uploadedFile || selectedCampaignId == null) {
          toast.error('Please select a file to upload.');
          return;
        }
        const { username, teamId } = getFinesseContext();
        if (!username || teamId == null) {
          toast.error('user not found.');
          return;
        }
        try {
          await importFinesseCampaignContacts(teamId, username, selectedCampaignId, uploadedFile);
          toast.success('Contacts imported successfully.');
          handleCloseUploadModal();
          const response = await getFinesseCampaigns(teamId, username);
          const list = response?.data ?? response?.responseData ?? response;
          const arr = Array.isArray(list) ? list : list?.campaigns ?? list?.items ?? [];
          setCampaigns((arr as any[]).map((item, index) => mapApiCampaignToRow(item, index)));
          const statusData = await getFinesseCampaignsContactsStatus(teamId, username).catch(() => null);
          if (statusData) {
            const listStatus = (statusData as { importStatuses?: Array<{ campaignId: number }> })?.importStatuses ?? (statusData as { campaigns?: Array<{ campaignId: number }> })?.campaigns ?? [];
            const arrStatus = Array.isArray(listStatus) ? listStatus : [];
            const map: Record<number, unknown> = {};
            arrStatus.forEach((s: { campaignId: number }) => {
              map[s.campaignId] = s;
            });
            setImportStatuses(map);
          }
        } catch (err: any) {
          toast.error(err?.response?.data?.message ?? err?.message ?? 'Failed to import contacts.');
        }
      };
    
      const handleTimeChange = async (campaignId: number, field: 'timeFrom' | 'timeTo' | 'startTime' | 'endTime', value: string) => {
        const campaign = campaigns.find(c => c.id === campaignId);
        if (!campaign) return;
        const updates: Partial<CampaignRow> = { [field]: value };
        if (field === 'startTime') updates.timeFrom = value;
        if (field === 'endTime') updates.timeTo = value;
        if (field === 'timeFrom') updates.startTime = value;
        if (field === 'timeTo') updates.endTime = value;
        const nextStart = updates.startTime ?? campaign.startTime;
        const nextEnd = updates.endTime ?? campaign.endTime;
        setCampaigns(campaigns.map(c => (c.id !== campaignId ? c : { ...c, ...updates })));
        const { username, teamId } = getFinesseContext();
        if (!username || teamId == null) return;
        try {
          await scheduleFinesseCampaign(teamId, username, campaignId, {
            startTime: nextStart,
            endTime: nextEnd,
          });
          toast.success('Campaign schedule updated.');
        } catch (err: unknown) {
          const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (err as Error)?.message ?? 'Failed to update schedule';
          toast.error(msg);
          setCampaigns(campaigns.map(c => (c.id !== campaignId ? c : { ...campaign })));
        }
      };
    
      const handleWrapUpSubmit = async (data: { wrapUp: string | string[]; variables: Record<string, string> }) => {
        const { username, extension, teamId } = getFinesseContext();
        const dialogId = activePreviewDialog?.dialogId;
        if (username && extension && dialogId && teamId != null) {
          const reasons = Array.isArray(data.wrapUp) ? data.wrapUp : [data.wrapUp];
          const wrapUpItems: string[] = reasons.map((idOrValue) => {
            const option = wrapUpReasons.find((o) => o.value === String(idOrValue));
            return option ? option.label : String(idOrValue ?? '');
          });
          try {
            await sendFinesseDialogAction(teamId, username, String(dialogId), {
              extension: String(extension),
              action: 'UPDATE_CALL_DATA',
              wrapUpItems,
            });
            toast.success('Wrap up submitted.');
          } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (err as Error)?.message ?? 'Failed to submit wrap up');
          }
        }
        if (wrapUpAutoCloseTimerRef.current) {
          clearTimeout(wrapUpAutoCloseTimerRef.current);
          wrapUpAutoCloseTimerRef.current = null;
        }
        setIsWrapUpOpen(false);
      };
    
      const handleWrapUpMinimize = () => setIsWrapUpOpen(false);

      const startWrapUpAutoCloseTimer = useCallback(() => {
        if (wrapUpAutoCloseTimerRef.current) clearTimeout(wrapUpAutoCloseTimerRef.current);
        const seconds = getFinesseUserData()?.wrapUpTimer ?? 10;
        wrapUpAutoCloseTimerRef.current = setTimeout(() => {
          setIsWrapUpOpen(false);
          wrapUpAutoCloseTimerRef.current = null;
        }, seconds * 1000);
      }, []);

      /** Fetch wrap-up reasons from API, then open Wrap up modal. When openedFromWrapUpEvent, modal auto-closes after wrapUpTimer seconds. */
      const handleWrapUpClick = async (_openedFromEndCall?: boolean, openedFromWrapUpEvent?: boolean) => {
        const { username, teamId } = getFinesseContext();
        if (!username || teamId == null) {
          toast.error('User not found.');
          return;
        }
        setWrapUpReasonsLoading(true);
        try {
          const response = await getFinesseWrapUpReasons(teamId, username);
          console.log('[Finesse] wrapUpReasons API response:', response);
          const raw = response?.responseData ?? response?.data ?? response;
          const list = Array.isArray(raw) ? raw : raw?.wrapUpReasons ?? raw?.reasonCodes ?? raw?.reasons ?? [];
          const options: Array<{ value: string; label: string }> = list.map((item: { uri?: string; id?: number; code?: string; label?: string; name?: string }) => {
            // API shape: { uri: "/finesse/api/User/.../WrapUpReason/5", label: "Not Interested", forAll }
            const idFromUri = typeof item.uri === 'string' ? item.uri.split('/').filter(Boolean).pop() : undefined;
            const value = String(idFromUri ?? item.id ?? item.code ?? item.label ?? item.name ?? '');
            const label = String(item.label ?? item.name ?? item.code ?? value ?? '—');
            return { value, label };
          });
          const reasonsToShow = options.length ? options : [{ value: 'other', label: 'Other' }];
          setWrapUpReasons(reasonsToShow);
          // Parse call variables from API (responseData.callVariables, .variables, .callVariableDefinitions, etc.)
          const data = response?.responseData ?? response?.data ?? response;
          const callVarsRaw = (data as { callVariables?: Array<{ key?: string; name?: string; label?: string }> })?.callVariables
            ?? (data as { variables?: Array<{ key?: string; name?: string; label?: string }> })?.variables
            ?? (data as { callVariableDefinitions?: Array<{ key?: string; name?: string; label?: string }> })?.callVariableDefinitions;
          const callVarConfig: CallVariableConfig[] = Array.isArray(callVarsRaw)
            ? callVarsRaw.map((v: { key?: string; name?: string; label?: string }) => ({
                key: String(v.key ?? v.name ?? ''),
                label: String(v.label ?? v.name ?? v.key ?? '—'),
              })).filter((v: CallVariableConfig) => v.key)
            : [];
          setCallVariablesConfig(callVarConfig);
          setTimeout(() => {
            setIsWrapUpOpen(true);
            if (openedFromWrapUpEvent) startWrapUpAutoCloseTimer();
          }, 0);
        } catch (err) {
          console.error('[Finesse] wrapUpReasons failed:', err);
          toast.error((err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (err as Error)?.message ?? 'Failed to load wrap-up reasons.');
          setWrapUpReasons([{ value: 'other', label: 'Other' }]);
          setCallVariablesConfig([]);
          setTimeout(() => {
            setIsWrapUpOpen(true);
            if (openedFromWrapUpEvent) startWrapUpAutoCloseTimer();
          }, 0);
        } finally {
          setWrapUpReasonsLoading(false);
        }
      };

      const handleAgentStatusChange = async (newState: string) => {
        const { username, teamId } = getFinesseContext();
        if (!username || teamId == null) {
          toast.error('user not found.');
          return;
        }
        const state = newState === 'READY' || newState === 'NOT_READY' ? newState : 'READY';
        try {
          await finesseSetState(teamId, username, state);
          setAgentStatus(state);
        } catch (err: any) {
          toast.error(err?.response?.data?.message || err?.message || 'Failed to update agent state.');
        }
      };

      const capabilityLoadingBlock =
        capabilityUsername && capabilityLoading ? (
          <React.Fragment>
            <BreadcrumbItem mainTitle="" mainLink="" subTitle="Live Calls Campaigns Management" />
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
              <Loader size={40} className="text-primary" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          </React.Fragment>
        ) : capabilityUsername && !capabilityLoading && !hasCampaignMgmt ? (
          <React.Fragment>
            <BreadcrumbItem mainTitle="" mainLink="" subTitle="Live Calls Campaigns Management" />
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', padding: '24px' }}>
              <div className="card" style={{ maxWidth: '420px', width: '100%', padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <AlertCircle size={28} color="#f59e0b" />
                  <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1e293b' }}>Insufficient Capabilities</h2>
                </div>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
                  You don&apos;t have sufficient capabilities to access Live Calls Campaigns.
                </p>
              </div>
            </div>
          </React.Fragment>
        ) : null;

  return (
    <FinesseAuthGate subTitle="Live Calls Campaigns Management" pageLabel="Live Calls Campaigns">
      {capabilityLoadingBlock ? capabilityLoadingBlock : (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Live Calls Campaigns Management" />

    
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

        .search-box {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .search-box input {
          width: 100%;
          padding: 10px 16px 10px 42px;
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

        .team-selector {
          position: relative;
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
          z-index: 1000;
          overflow: hidden;
          animation: slideDownMenu 0.2s ease;
        }

        @keyframes slideDownMenu {
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
          background: none;
          width: 100%;
          text-align: left;
          font-size: 14px;
          color: #475569;
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

        .btn-secondary {
          background: white;
          color: #475569;
          border: 2px solid #e5e7eb;
        }

        .btn-secondary:hover {
          border-color: #667eea;
          color: #667eea;
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

        .action-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
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

        .campaign-name {
          font-weight: 600;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .badge-agent {
          background: #dbeafe;
          color: #1e40af;
        }

        .badge-predictive {
          background: #fef3c7;
          color: #92400e;
        }

        .badge-preview {
          background: #e0e7ff;
          color: #3730a3;
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

        .time-display {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }

        .time-badge {
          background: #f1f5f9;
          padding: 4px 8px;
          border-radius: 6px;
          font-weight: 500;
        }

        .time-input {
          background: #f1f5f9;
          padding: 4px 8px;
          border-radius: 6px;
          font-weight: 500;
          border: 2px solid transparent;
          font-size: 13px;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s;
        }

        .time-input:hover {
          background: #e2e8f0;
          border-color: #cbd5e1;
        }

        .time-input:focus {
          outline: none;
          background: white;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .timezone-text {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 4px;
        }

        .contacts-remaining {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
        }

        .toggle-switch {
          position: relative;
          width: 48px;
          height: 26px;
          background: #cbd5e1;
          border-radius: 13px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .toggle-switch.enabled {
          background: #10b981;
        }

        .toggle-slider {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: all 0.3s;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }

        .toggle-switch.enabled .toggle-slider {
          transform: translateX(22px);
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
        }

        .action-btn:hover {
          background: #667eea;
          color: white;
        }

        .action-menu-container {
          position: relative;
          display: inline-block;
        }

        .action-menu {
          position: absolute;
          top: calc(100% + 4px);
          right: 0;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          min-width: 160px;
          z-index: 1000;
          overflow: hidden;
          animation: slideDownMenu 0.2s ease;
          border: 1px solid #e5e7eb;
        }

        .action-menu.show-above {
          top: auto;
          bottom: calc(100% + 4px);
          animation: slideUpMenu 0.2s ease;
        }

        @keyframes slideUpMenu {
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
          font-size: 14px;
          color: #475569;
        }

        .action-menu-item:hover {
          background: #f8fafc;
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
          cursor: pointer;
        }

        .checkbox.checked {
          background: #667eea;
          border-color: #667eea;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.2s ease;
          overflow-y: auto;
          padding: 20px;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal {
          background: white;
          border-radius: 20px;
          width: 90%;
          max-width: 800px;
          max-height: 85vh;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideIn 0.3s ease;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        @keyframes slideIn {
          from {
            transform: translateY(-50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .modal-header {
          padding: 24px 32px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, #667eea 0%, #667eea 100%);
          color: white;
        }

        .modal-title {
          font-size: 24px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .modal-close-btn {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .modal-body {
          padding: 32px;
          overflow-y: auto;
          flex: 1;
        }

        .modal-section {
          margin-bottom: 32px;
        }

        .modal-section:last-child {
          margin-bottom: 0;
        }

        .modal-section-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .upload-area {
          border: 2px dashed #e5e7eb;
          border-radius: 12px;
          padding: 40px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: #f8fafc;
        }

        .upload-area:hover {
          border-color: #667eea;
          background: #f1f5f9;
        }

        .upload-area.active {
          border-color: #667eea;
          background: #ede9fe;
        }

        .upload-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          background: linear-gradient(135deg, #667eea 0%, #667eea 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .upload-text {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 8px;
        }

        .upload-hint {
          font-size: 14px;
          color: #64748b;
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }

        .file-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #667eea 0%, #667eea 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .file-details {
          flex: 1;
        }

        .file-name {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .file-size {
          font-size: 13px;
          color: #64748b;
        }

        .column-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .column-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }

        .column-order {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #667eea 0%, #667eea 100%);
          color: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
        }

        .column-input {
          flex: 1;
          padding: 10px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
        }

        .column-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .column-controls {
          display: flex;
          gap: 4px;
        }

        .column-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          color: #64748b;
          border: 1px solid #e5e7eb;
        }

        .column-btn:hover {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }

        .column-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .column-btn:disabled:hover {
          background: white;
          color: #64748b;
          border-color: #e5e7eb;
        }

        .column-btn.delete:hover {
          background: #ef4444;
          border-color: #ef4444;
        }

        .add-column-btn {
          width: 100%;
          padding: 12px;
          border: 2px dashed #e5e7eb;
          background: white;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 600;
          color: #667eea;
          transition: all 0.2s;
        }

        .add-column-btn:hover {
          border-color: #667eea;
          background: #f8fafc;
        }

        .modal-footer {
          padding: 24px 32px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .btn-cancel {
          background: #f1f5f9;
          color: #64748b;
          border: none;
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-cancel:hover {
          background: #e2e8f0;
        }

        .btn-upload {
          background: linear-gradient(135deg, #667eea 0%, #667eea 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-upload:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        @media (max-width: 1024px) {
         

          .call-widget {
            width: 320px;
            bottom: 16px;
            right: 16px;
          }
        }

        @media (max-width: 768px) {
          

          .call-widget {
            width: calc(100% - 32px);
            left: 16px;
            right: 16px;
          }
        }
      `}</style>
{/* Top Bar */}
<Row>
  <Col md={12}>
  <TopBar 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedTeam={selectedTeam}
          setSelectedTeam={setSelectedTeam}
          teams={teamsWithIds.length > 0 ? teamsWithIds : teams.map((name, i) => ({ id: i, name }))}
          agentStatus={agentStatus}
          setAgentStatus={setAgentStatus}
          showStatusDropdown={showStatusDropdown}
          setShowStatusDropdown={setShowStatusDropdown}
          showUserMenu={showUserMenu}
          setShowUserMenu={setShowUserMenu}
          statusOptions={statusOptions}
          handleLogout={handleLogout}
          onStatusChange={handleAgentStatusChange}
          onTeamChange={teamsWithIds.length > 0 ? handleTeamChange : undefined}
        />
        </Col>
</Row>
      {/* Page Header */}
      <div className="page-header">
            <h1 className="page-title">Campaign </h1>
            <p className="page-subtitle">Monitor agent status, availability, and manage team operations in real-time</p>
          </div>
          

          {/* Main Table Card */}
          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>
                      <div
                        className={`checkbox ${selectedCampaigns.length === filteredCampaigns.length && filteredCampaigns.length > 0 ? 'checked' : ''}`}
                        onClick={handleSelectAll}
                      >
                        {selectedCampaigns.length === filteredCampaigns.length && filteredCampaigns.length > 0 && (
                          <CheckCircle size={14} color="white" />
                        )}
                      </div>
                    </th>
                    <th>Campaign Name</th>
                    <th>Campaign Type</th>
                    <th>Dialer Type</th>
                    <th>Time</th>
                    <th>Contacts Remaining</th>
                    <th>Enabled</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignsLoading ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b' }}>
                        <Loader size={32} style={{ display: 'inline-block', marginBottom: '12px', animation: 'spin 1s linear infinite' }} />
                        <div>Loading campaigns...</div>
                      </td>
                    </tr>
                  ) : filteredCampaigns.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b' }}>
                        No campaigns found.
                      </td>
                    </tr>
                  ) : (
                  filteredCampaigns.map(campaign => (
                    <tr
                      key={campaign.id}
                      className={selectedCampaigns.includes(campaign.id) ? 'selected' : ''}
                    >
                      <td>
                        <div
                          className={`checkbox ${selectedCampaigns.includes(campaign.id) ? 'checked' : ''}`}
                          onClick={() => handleSelectCampaign(campaign.id)}
                        >
                          {selectedCampaigns.includes(campaign.id) && (
                            <CheckCircle size={14} color="white" />
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="campaign-name">
                          <Target size={18} color="#667eea" />
                          {campaign.name}
                        </div>
                      </td>
                      <td>
                        <span 
                          className={`badge badge-${campaign.type.toLowerCase()}`}
                        >
                          {campaign.type}
                        </span>
                      </td>
                      <td>{campaign.dialerType}</td>
                      <td>
                        <div>
                          <div className="time-display">
                            <span>From</span>
                            <input
                              type="time"
                              className="time-input"
                              value={campaign.startTime}
                              onChange={(e) => handleTimeChange(campaign.id, 'startTime', e.target.value)}
                            />
                            <Clock size={14} color="#94a3b8" />
                            <span>To</span>
                            <input
                              type="time"
                              className="time-input"
                              value={campaign.endTime}
                              onChange={(e) => handleTimeChange(campaign.id, 'endTime', e.target.value)}
                            />
                          </div>
                          <div className="timezone-text">{campaign.timezone}</div>
                        </div>
                      </td>
                      <td>
                        <span className="contacts-remaining">
                          {campaign.pendingContacts ?? campaign.contactsRemaining}
                        </span>
                      </td>
                      <td>
                        <div
                          className={`toggle-switch ${campaign.enabled ? 'enabled' : ''}`}
                          onClick={() => handleToggleCampaign(campaign.id)}
                        >
                          <div className="toggle-slider" />
                        </div>
                      </td>
                      <td>
                        <button 
                          className="action-btn" 
                          title="Update Contacts"
                          onClick={() => handleOpenUploadModal(campaign.id)}
                        >
                          <Upload size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

      {/* Outgoing Call Widget – dynamic from preview event */}
      <CallWidget 
        showCallWidget={showCallWidget}
        setShowCallWidget={setShowCallWidget}
        callStatus={callStatus}
        callTimer={callTimer}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        isHold={isHold}
        setIsHold={setIsHold}
        handleAcceptCall={handleAcceptCall}
        handleRejectCall={handleRejectCall}
        handleEndCall={handleEndCall}
        formatTime={formatTime}
        selectedTeam={selectedTeam}
        activeAgentName="Campaign Agent"
        campaignName={activePreviewDialog?.campaignName}
        customerNumber={activePreviewDialog?.customerNumber}
        dialedNumber={activePreviewDialog?.dialedNumber}
        previewActions={activePreviewDialog?.participants?.[0]?.actions}
        onRejectWithAction={handleRejectOrClose}
        onWrapUpClick={handleWrapUpClick}
        wrapUpLoading={wrapUpReasonsLoading}
        onHoldToggle={handleHoldToggle}
        holdLoading={holdLoading}
      />

      <WrapUpModal
        isOpen={isWrapUpOpen}
        onClose={() => {
          if (wrapUpAutoCloseTimerRef.current) {
            clearTimeout(wrapUpAutoCloseTimerRef.current);
            wrapUpAutoCloseTimerRef.current = null;
          }
          setIsWrapUpOpen(false);
          resetCallWidgetState();
        }}
        onSubmit={handleWrapUpSubmit}
        onMinimize={handleWrapUpMinimize}
        wrapUpReasons={wrapUpReasons}
        callVariablesConfig={callVariablesConfig}
      />

      {/* Upload Contacts Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={handleCloseUploadModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Upload size={28} />
                Upload Contacts
              </div>
              <button className="modal-close-btn" onClick={handleCloseUploadModal}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              {/* File Upload Section */}
              <div className="modal-section">
                <div className="modal-section-title">
                  <Upload size={20} />
                  Select File
                </div>
                
                {!uploadedFile ? (
                  <div 
                    className="upload-area"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="upload-icon">
                      <Upload size={32} />
                    </div>
                    <div className="upload-text">Click to upload or drag and drop</div>
                    <div className="upload-hint">CSV, XLSX, or TXT files (Max 10MB)</div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.txt"
                      style={{ display: 'none' }}
                      onChange={handleFileSelect}
                    />
                  </div>
                ) : (
                  <div className="file-info">
                    <div className="file-icon">
                      <CheckCircle size={24} />
                    </div>
                    <div className="file-details">
                      <div className="file-name">{uploadedFile.name}</div>
                      <div className="file-size">
                        {(uploadedFile.size / 1024).toFixed(2)} KB
                      </div>
                    </div>
                    <button
                      className="action-btn"
                      onClick={() => {
                        setUploadedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      title="Remove file"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>

              {/* Import Status (reference: UpdateContactsModal initialImportStatus) */}
              {selectedCampaignId != null && importStatuses[selectedCampaignId] != null && (
                <div className="modal-section">
                  <div
                    style={{
                      padding: '16px',
                      background: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      borderRadius: '12px',
                      fontSize: '14px',
                      color: '#0c4a6e',
                    }}
                  >
                    <strong>Last import:</strong>{' '}
                    {formatImportStatusDisplay(importStatuses[selectedCampaignId] as ImportStatusShape)}
                  </div>
                </div>
              )}

              {/* Column Mapping Section */}
              <div className="modal-section">
                <div className="modal-section-title">
                  <Grid size={20} />
                  Column Mapping
                </div>
                
                <div className="column-list">
                  {columnMapping.map((column, index) => (
                    <div key={column.id} className="column-item">
                      <div className="column-order">{column.order}</div>
                      <input
                        type="text"
                        className="column-input"
                        placeholder="Enter column name..."
                        value={column.name}
                        onChange={(e) => handleColumnNameChange(column.id, e.target.value)}
                      />
                      <div className="column-controls">
                        <button
                          className="column-btn"
                          onClick={() => handleMoveColumn(column.id, 'up')}
                          disabled={index === 0}
                          title="Move up"
                        >
                          <ChevronDown size={16} style={{ transform: 'rotate(180deg)' }} />
                        </button>
                        <button
                          className="column-btn"
                          onClick={() => handleMoveColumn(column.id, 'down')}
                          disabled={index === columnMapping.length - 1}
                          title="Move down"
                        >
                          <ChevronDown size={16} />
                        </button>
                        <button
                          className="column-btn delete"
                          onClick={() => handleRemoveColumn(column.id)}
                          title="Remove column"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="add-column-btn" onClick={handleAddColumn}>
                  <Plus size={20} />
                  Add Column
                </button>
              </div>

              {/* Preview Info */}
              {uploadedFile && columnMapping.length > 0 && (
                <div className="modal-section">
                  <div 
                    style={{ 
                      padding: '16px', 
                      background: '#f0fdf4', 
                      border: '1px solid #bbf7d0',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <CheckCircle size={20} color="#16a34a" />
                    <div>
                      <div style={{ fontWeight: 600, color: '#166534', marginBottom: '4px' }}>
                        Ready to Upload
                      </div>
                      <div style={{ fontSize: '14px', color: '#15803d' }}>
                        File: {uploadedFile.name} | Columns: {columnMapping.length}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCloseUploadModal}>
                Cancel
              </button>
              <button className="btn-upload" onClick={handleUploadContacts}>
                <Upload size={20} />
                Upload Contacts
              </button>
            </div>
          </div>
        </div>
      )}
    

    </React.Fragment>
      )}
    </FinesseAuthGate>
  );
};

LiveCallsCampaignsManagement.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default LiveCallsCampaignsManagement;
