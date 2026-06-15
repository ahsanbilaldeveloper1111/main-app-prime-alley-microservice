import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useReducer,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Row, Col } from "react-bootstrap";
import { useSession } from "next-auth/react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  LogOut,
  MoreVertical,
  Phone,
  RefreshCw,
  X,
  XCircle,
} from "lucide-react";
import CallWidget from "../campaign-partials/CallWidget";
import WrapUpModal from "../campaign-partials/WrapUp";
import TopBar, { type TeamOption } from "../campaign-partials/TopBarAgent";
import FinesseAuthGate from "../campaign-partials/FinesseAuthGate";
import ConfirmModal from "@components/page-partials/ConfirmModal";
import { toast } from "react-toastify";
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
} from "@utils/finesse";
import {
  mergeTeamUsersFromRoster,
  mergeRosterPayloads,
} from "@utils/finesseRosterMerge";
import {
  useFinesseStomp,
  type FinessePreviewEvent,
} from "@hooks/live-calls/useFinesseStomp";
import { useFinesseCampaignPreview } from "@hooks/live-calls/useFinesseCampaignPreview";
import {
  useFinesseMonitoring,
  type FinesseAgentMonitoringState,
} from "@hooks/live-calls/useFinesseMonitoring";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { usePermissions } from "@utils/permissionUtils";

import {
  formatFinesseStateDuration,
  formatFinesseStateLabel,
  formatFinesseReasonLabel,
  getCampaignAgentStateColor,
  mapEffectiveFinesseStateToTopBarReadyToggle,
  isFinesseConsoleReadyLikeState,
  isFinesseConsoleNotReadyState,
  isFinesseConsoleStatusActionDisabled,
  isFinesseCampaignTopBarStatusLockedState,
} from "@utils/communications/campaign-shared/finesseAgentDisplay";
import type {
  CampaignConsoleActionMenuPortalState,
  CampaignConsoleDisplayAgent,
  CampaignConsoleTeamApiResponse,
  CampaignConsoleTeamUser,
} from "@utils/communications/campaign-shared/campaignConsoleTypes";

type TeamUser = CampaignConsoleTeamUser;
type TeamApiResponse = CampaignConsoleTeamApiResponse;
type DisplayAgent = CampaignConsoleDisplayAgent;
type ActionMenuPortalState = CampaignConsoleActionMenuPortalState;

type ForceSignOutConfirmTarget = {
  loginId: string;
  name: string;
};

const { PERMISSIONS } = HEADER_CONSTANTS;

const SUPERVISOR_READY_MONITORING_DISABLED_REASON =
  "Set your status to Not Ready before monitoring calls";

type MonitoringActionMenuStatus = {
  monitoringState: FinesseAgentMonitoringState | null;
  isOwnFinesseRow: boolean;
  canStartMonitor: boolean;
  canBarge: boolean;
  monitorDisabledReason?: string;
};

function getMonitorDisabledReason(
  isFinesseSupervisor: boolean,
  supervisorIsReady: boolean,
  isOwnFinesseRow: boolean,
  monitoringState: FinesseAgentMonitoringState | null,
): string | undefined {
  if (!isFinesseSupervisor) {
    return "Finesse Supervisor role is required for call monitoring";
  }
  if (supervisorIsReady) {
    return SUPERVISOR_READY_MONITORING_DISABLED_REASON;
  }
  if (isOwnFinesseRow) {
    return "You cannot monitor your own Finesse session";
  }
  if (monitoringState?.agentOnCall !== true) {
    return "Agent is not on a call";
  }
  return undefined;
}

function getMonitoringActionMenuStatus(
  actionMenuPortal: ActionMenuPortalState | null,
  getAgentMonitoringState: (
    agent: DisplayAgent,
  ) => FinesseAgentMonitoringState,
  isOwnFinesseRow: (agentLoginId: string) => boolean,
  isFinesseSupervisor: boolean,
  supervisorIsReady: boolean,
): MonitoringActionMenuStatus {
  const monitoringState = actionMenuPortal
    ? getAgentMonitoringState(actionMenuPortal.agent)
    : null;
  const ownRow = actionMenuPortal
    ? isOwnFinesseRow(actionMenuPortal.agent.loginId)
    : false;
  const monitorDisabledReason = getMonitorDisabledReason(
    isFinesseSupervisor,
    supervisorIsReady,
    ownRow,
    monitoringState,
  );
  const canStartMonitor =
    monitoringState != null &&
    isFinesseSupervisor &&
    !supervisorIsReady &&
    !ownRow &&
    monitoringState.agentOnCall &&
    !monitoringState.monitoringActive;
  const canBarge =
    monitoringState != null &&
    monitoringState.silentMonitorActive &&
    !monitoringState.bargedIn &&
    !supervisorIsReady;
  return {
    monitoringState,
    isOwnFinesseRow: ownRow,
    canStartMonitor,
    canBarge,
    monitorDisabledReason,
  };
}

function getSupervisorStatusActionDisabledReason(
  canChangeUserStatus: boolean,
  agent: DisplayAgent | undefined,
  agentOnCall: boolean,
  targetState: "READY" | "NOT_READY",
): string | undefined {
  if (!canChangeUserStatus) {
    return "You do not have permission to change agent status";
  }
  if (!agent || isFinesseAgentOfflineLikeState(agent.state)) {
    return "Cannot change status of offline agents";
  }
  if (agentOnCall) {
    return "Cannot change status while agent is on a call";
  }
  if (
    targetState === "READY" &&
    isFinesseConsoleReadyLikeState(agent.state)
  ) {
    return "Agent is already Ready";
  }
  if (
    targetState === "NOT_READY" &&
    isFinesseConsoleNotReadyState(agent.state)
  ) {
    return "Agent is already Not Ready";
  }
  return undefined;
}

function isSupervisorStatusActionDisabled(
  canChangeUserStatus: boolean,
  agent: DisplayAgent | undefined,
  agentOnCall: boolean,
  targetState: "READY" | "NOT_READY",
): boolean {
  return (
    getSupervisorStatusActionDisabledReason(
      canChangeUserStatus,
      agent,
      agentOnCall,
      targetState,
    ) != null
  );
}

function getBulkStatusActionDisabledReason(
  canChangeUserStatus: boolean,
  selectedAgentsAllOnCall: boolean,
  canPerformAction: boolean,
  alreadyInTargetStateMessage: string,
): string | undefined {
  if (!canChangeUserStatus) {
    return "You do not have permission to change agent status";
  }
  if (selectedAgentsAllOnCall) {
    return "Cannot change status while selected agent(s) are on a call";
  }
  if (!canPerformAction) {
    return alreadyInTargetStateMessage;
  }
  return undefined;
}

type CampaignConsoleMonitoringMenuItemsProps = Readonly<{
  agent: DisplayAgent;
  status: MonitoringActionMenuStatus;
  onStartSilentMonitor: (agent: DisplayAgent) => Promise<void>;
  onBargeAgentCall: (agent: DisplayAgent) => Promise<void>;
  onStopMonitoring: (agent: DisplayAgent) => Promise<void>;
}>;

function CampaignConsoleMonitoringMenuItems({
  agent,
  status,
  onStartSilentMonitor,
  onBargeAgentCall,
  onStopMonitoring,
}: CampaignConsoleMonitoringMenuItemsProps) {
  const { monitoringState } = status;
  if (!monitoringState) return null;

  return (
    <React.Fragment>
      {!monitoringState.monitoringActive && (
        <button
          type="button"
          className="action-menu-item"
          disabled={!status.canStartMonitor || monitoringState.actionLoading != null}
          title={
            status.canStartMonitor ? undefined : status.monitorDisabledReason
          }
          onClick={(e) => {
            e.stopPropagation();
            if (!status.canStartMonitor) return;
            onStartSilentMonitor(agent).catch(() => undefined);
          }}
        >
          <Phone size={16} color="#0066CC" />
          <span>
            {monitoringState.actionLoading === "monitor"
              ? "Starting monitor..."
              : "Monitor Call"}
          </span>
        </button>
      )}
      {monitoringState.silentMonitorActive && !monitoringState.bargedIn && (
        <button
          type="button"
          className="action-menu-item"
          disabled={
            !status.canBarge || monitoringState.actionLoading != null
          }
          title={status.canBarge ? undefined : status.monitorDisabledReason}
          onClick={(e) => {
            e.stopPropagation();
            if (!status.canBarge) return;
            onBargeAgentCall(agent).catch(() => undefined);
          }}
        >
          <Phone size={16} color="#8b5cf6" />
          <span>
            {monitoringState.actionLoading === "barge" ? "Barging..." : "Barge"}
          </span>
        </button>
      )}
      {monitoringState.monitoringActive && (
        <button
          type="button"
          className="action-menu-item danger"
          disabled={monitoringState.actionLoading != null}
          onClick={(e) => {
            e.stopPropagation();
            onStopMonitoring(agent).catch(() => undefined);
          }}
        >
          <X size={16} />
          <span>
            {monitoringState.actionLoading === "end"
              ? "Stopping..."
              : "Stop Monitoring"}
          </span>
        </button>
      )}
    </React.Fragment>
  );
}

const LiveCallsAgentsManagement = () => {
  const { data: session } = useSession();
  const { hasPermission } = usePermissions();
  const canChangeUserStatus = hasPermission(
    PERMISSIONS.CAN_CHANGE_USER_STATUS_TMS,
  );
  const canForceSignOut = hasPermission(PERMISSIONS.CAN_FORCE_SIGN_OUT_TMS);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [includeLoggedOut, setIncludeLoggedOut] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [teamDataLoading, setTeamDataLoading] = useState(false);
  const [teamData, setTeamData] = useState<
    TeamApiResponse["responseData"] | null
  >(null);
  const [teamDataError, setTeamDataError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  /** Bumps when cluster id is persisted from API so EventSource reconnects with roster params. */
  const [streamConfigBump, setStreamConfigBump] = useState(0);
  const [, rerenderLiveTime] = useReducer((tick: number) => tick + 1, 0);
  const [agentStatus, setAgentStatus] = useState("READY");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [actionMenuPortal, setActionMenuPortal] =
    useState<ActionMenuPortalState | null>(null);
  const [forceSignOutConfirmTarget, setForceSignOutConfirmTarget] =
    useState<ForceSignOutConfirmTarget | null>(null);
  const [forceSignOutLoading, setForceSignOutLoading] = useState(false);
  const [finesseSseToken, setFinesseSseToken] = useState<string | null>(null);

  const {
    handlePreviewEvent,
    handleAgentStateEvent,
    derivedTopBarStatus,
    getFinesseContext,
    callWidgetProps,
    wrapUpModalProps,
  } = useFinesseCampaignPreview(session, {
    selectedTeam,
    includeTeamRow: false,
  });

  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const openAgentActionMenu = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, agent: DisplayAgent) => {
      e.stopPropagation();
      const btn = e.currentTarget;
      const r = btn.getBoundingClientRect();
      const menuWidth = 200;
      let left = r.right - menuWidth;
      left = Math.max(
        12,
        Math.min(left, globalThis.window.innerWidth - menuWidth - 12),
      );
      const top = r.bottom + 6;
      const maxHeight = Math.max(140, globalThis.window.innerHeight - top - 12);
      setActionMenuPortal((prev) =>
        prev?.agent.id === agent.id ? null : { agent, top, left, maxHeight },
      );
    },
    [],
  );

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (target instanceof HTMLElement) {
        if (target.closest("[data-campaign-console-action-menu]")) return;
        if (target.closest("[data-campaign-console-action-trigger]")) return;
      }
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(target)
      ) {
        setShowStatusDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
      setActionMenuPortal(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!actionMenuPortal) return;
    const close = () => setActionMenuPortal(null);
    globalThis.window.addEventListener("scroll", close, true);
    globalThis.window.addEventListener("resize", close);
    return () => {
      globalThis.window.removeEventListener("scroll", close, true);
      globalThis.window.removeEventListener("resize", close);
    };
  }, [actionMenuPortal]);

  // Tick every second so "time in state" increases for each agent
  useEffect(() => {
    const interval = setInterval(() => {
      rerenderLiveTime();
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
      setSelectedTeam(match?.name ?? data.teamName ?? data.teams[0].name ?? "");
    } else {
      setTeams([]);
      setSelectedTeam("");
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
    if (globalThis.window === undefined) return;
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
  const supervisorExtension = useMemo(() => {
    const d = getFinesseUserData();
    const user = session?.user as { phone?: string } | undefined;
    return d?.extension ?? user?.phone ?? null;
  }, [refreshTrigger, selectedTeam, session?.user, streamConfigBump]);
  const isFinesseSupervisor = useMemo(() => {
    const roles = getFinesseUserData()?.roles ?? [];
    return roles.some((role) => role.toUpperCase().includes("SUPERVISOR"));
  }, [refreshTrigger, selectedTeam, streamConfigBump]);

  /** Offline / logged-out rows only when â€œInclude logged outâ€ is checked (stream may still carry them in teamData). */
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
  const monitoringAgents = useMemo(
    () =>
      teamUsersForDisplay.map((user) => ({
        loginId: user.loginId,
        extension: user.extension,
        state: user.state,
      })),
    [teamUsersForDisplay],
  );

  const rosterSyncDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const teamFetchInFlightRef = useRef(false);
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
    if (teamFetchInFlightRef.current) return;
    teamFetchInFlightRef.current = true;
    /** Always include logged-out agents so logout matches roster and is not overwritten. */
    getFinesseUserTeam(username, teamId, true)
      .then((res: TeamApiResponse) => {
        const payload =
          res?.responseData ??
          (res as unknown as { responseData?: TeamApiResponse["responseData"] })
            ?.responseData;
        if (payload) {
          const last = lastRosterPayloadRef.current;
          const merged =
            last == null ? payload : mergeTeamUsersFromRoster(payload, last);
          setTeamData(merged ?? payload);
          if (mergeClusterIntoStoredUserFromTeamPayload(payload)) {
            setStreamConfigBump((b) => b + 1);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        teamFetchInFlightRef.current = false;
      });
  }, []);

  const scheduleTeamSyncFromRoster = useCallback(() => {
    if (rosterSyncDebounceRef.current)
      clearTimeout(rosterSyncDebounceRef.current);
    rosterSyncDebounceRef.current = setTimeout(() => {
      rosterSyncDebounceRef.current = null;
      refetchTeamFromStream();
    }, 400);
  }, [refetchTeamFromStream]);

  useEffect(
    () => () => {
      if (rosterSyncDebounceRef.current)
        clearTimeout(rosterSyncDebounceRef.current);
    },
    [],
  );

  const handleTeamRosterEvent = useCallback(
    (raw: unknown) => {
      if (
        raw != null &&
        typeof raw === "object" &&
        Reflect.get(raw, "__finesseRosterUnparsed") === true
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

  const {
    monitoredAgentIds,
    handleMonitoringDialogEvent,
    handleSupervisorPreviewEvent,
    getAgentMonitoringState,
    getAgentCallDisplayState,
    startSilentMonitor,
    barge,
    endMonitoring,
  } = useFinesseMonitoring({
    teamId: streamTeamId,
    supervisorFinesseUserId: sseFinesseUserId,
    supervisorExtension,
    agents: monitoringAgents,
  });

  const handleFinessePreviewEvent = useCallback(
    (payload: FinessePreviewEvent) => {
      handlePreviewEvent(payload);
      handleSupervisorPreviewEvent(payload);
    },
    [handlePreviewEvent, handleSupervisorPreviewEvent],
  );

  const handleFinesseStateEvent = useCallback((p: { state?: string }) => {
    const raw = typeof p?.state === "string" ? p.state.trim() : "";
    if (!raw) return;
    handleAgentStateEvent(p);
    setAgentStatus(raw);
  }, [handleAgentStateEvent]);

  const handleFinesseErrorEvent = useCallback((p: unknown) => {
    toast.error((p as { message?: string })?.message ?? "Finesse error");
  }, []);

  const handleFinesseAuthError = useCallback((msg: string) => {
    toast.error(msg);
  }, []);

  const handleStompConnected = useCallback(() => {
    scheduleTeamSyncFromRoster();
  }, [scheduleTeamSyncFromRoster]);

  useFinesseStomp({
    token: finesseSseToken,
    finesseUserId: sseFinesseUserId,
    clusterId: rosterClusterId,
    teamId: streamTeamId,
    monitoredAgentIds,
    onStateEvent: handleFinesseStateEvent,
    onPreviewEvent: handleFinessePreviewEvent,
    onMonitoringDialogEvent: handleMonitoringDialogEvent,
    onErrorEvent: handleFinesseErrorEvent,
    onAuthError: handleFinesseAuthError,
    onRosterEvent: handleTeamRosterEvent,
    onStompConnected: handleStompConnected,
  });
  // When gate authenticates on same page (no reload), re-hydrate teams and refetch
  useEffect(() => {
    if (globalThis.window === undefined) return;
    const onAuthenticated = () => {
      hydrateTeamsFromStorage();
      setRefreshTrigger((t) => t + 1);
    };
    globalThis.window.addEventListener(
      "finesse-authenticated",
      onAuthenticated,
    );
    return () =>
      globalThis.window.removeEventListener(
        "finesse-authenticated",
        onAuthenticated,
      );
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
        const payload =
          res?.responseData ??
          (res as unknown as { responseData?: TeamApiResponse["responseData"] })
            ?.responseData;
        setTeamData(payload ?? null);
        if (payload && mergeClusterIntoStoredUserFromTeamPayload(payload)) {
          setStreamConfigBump((b) => b + 1);
        }
      })
      .catch((err) => {
        setTeamDataError(err?.message ?? "Failed to load team");
        setTeamData(null);
      })
      .finally(() => {
        setTeamDataLoading(false);
      });
  }, [refreshTrigger, includeLoggedOut]);

  /** Keep TopBar in sync with REST team row / stored user when SSE is delayed or missing. */
  useEffect(() => {
    const username =
      getFinesseUserData()?.loginId ?? getFinesseUserData()?.loginName;
    const users = teamData?.users ?? [];
    const row =
      username && users.length
        ? users.find((u) => u.loginId === username)
        : undefined;
    const effFromRow =
      row == null
        ? undefined
        : getFinesseEffectiveAgentStateFromStatePayload(row);
    const effFromStore =
      getFinesseEffectiveAgentStateFromStatePayload(getFinesseUserData());
    const eff = effFromRow ?? effFromStore;
    if (eff == null || eff === "") return;
    setAgentStatus(eff);
  }, [teamData]);

  const displayAgentStatus = derivedTopBarStatus ?? agentStatus;

  const handleTeamChange = async (newTeamName: string, newTeamId: number) => {
    if (Number(getStoredTeamId()) === newTeamId) return;
    const previousTeamName = selectedTeam;
    const stored = getFinesseUserData();
    const usernameForCheck =
      stored?.loginId ??
      stored?.loginName ??
      (session?.user as { username?: string } | undefined)?.username ??
      "";
    const switchCheck = await assertFinesseTeamSwitchable(
      newTeamId,
      usernameForCheck || undefined,
      [teams, stored?.teams],
    );
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
        toast.error(getFinesseApiErrorMessage(err, "Unlink failed"));
        setSelectedTeam(previousTeamName);
        return;
      }
    }
    setStoredTeamId(newTeamId);
    clearFinesseUserData();
    if (globalThis.window !== undefined) {
      globalThis.window.dispatchEvent(
        new CustomEvent("finesse-require-reauth", {
          detail: { manualConnect: false },
        }),
      );
    }
  };

  const handleLogout = async () => {
    const { username, teamId } = getFinesseContext();
    if (username && teamId != null) {
      try {
        await finesseUnlink(username, teamId);
      } catch (err: unknown) {
        const msg =
          (
            err as {
              response?: { data?: { message?: string } };
              message?: string;
            }
          )?.response?.data?.message ??
          (err as Error)?.message ??
          "Unlink failed";
        toast.error(msg ?? "Failed to unlink from Finesse");
      }
    }
    clearFinesseUserData();
    setFinesseManualReconnectRequired();
    if (globalThis.window !== undefined) {
      globalThis.window.dispatchEvent(
        new CustomEvent("finesse-require-reauth", {
          detail: { manualConnect: true },
        }),
      );
    }
  };

  const handleAgentStatusChange = async (newState: string) => {
    const { username, teamId } = getFinesseContext();
    if (!username || teamId == null) {
      toast.error("User not found.");
      return;
    }
    const state =
      newState === "READY" || newState === "NOT_READY" ? newState : "READY";
    if (isFinesseConsoleStatusActionDisabled(agentStatus, state)) {
      return;
    }
    try {
      await finesseSetState(teamId, username, state);
      setAgentStatus(state);
    } catch (err: unknown) {
      toast.error(
        getFinesseApiErrorMessage(err, "Failed to update agent state."),
      );
    }
  };

  const statusOptions = [
    { value: "READY", label: "Ready", color: "#10b981", icon: CheckCircle },
    { value: "NOT_READY", label: "Not Ready", color: "#ef4444", icon: XCircle },
  ];

  // Derive agents from API team response (no dummy data)
  const agents: DisplayAgent[] = teamUsersForDisplay.map((u) => {
    const rosterState = u.state ?? "UNKNOWN";
    const monitoringAgent = {
      loginId: u.loginId,
      extension: u.extension,
      state: rosterState,
    };
    const callState = getAgentCallDisplayState(monitoringAgent);
    const effectiveState = callState ?? rosterState;
    const reasonLabel = formatFinesseReasonLabel(u.reasonCode);
    return {
      id: u.loginId,
      loginId: u.loginId,
      name:
        [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || u.loginId,
      state: effectiveState,
      stateLabel: formatFinesseStateLabel(effectiveState),
      stateColor: getCampaignAgentStateColor(effectiveState, {
        treatLoginAsReady: true,
      }),
      timeInState: formatFinesseStateDuration(u.stateChangeTime),
      extension: u.extension ?? "â€”",
      label: reasonLabel ?? undefined,
    };
  });

  const filteredAgents = agents.filter((agent) => {
    const q = searchQuery.toLowerCase();
    return (
      agent.name.toLowerCase().includes(q) ||
      agent.loginId.toLowerCase().includes(q)
    );
  });

  const selectedAgentRows = useMemo(
    () => agents.filter((agent) => selectedAgents.includes(agent.id)),
    [agents, selectedAgents],
  );

  const canBulkSetReady = useMemo(
    () =>
      selectedAgentRows.some(
        (agent) =>
          !isFinesseAgentOfflineLikeState(agent.state) &&
          !isFinesseConsoleReadyLikeState(agent.state) &&
          !getAgentMonitoringState(agent).agentOnCall,
      ),
    [selectedAgentRows, getAgentMonitoringState],
  );

  const canBulkSetNotReady = useMemo(
    () =>
      selectedAgentRows.some(
        (agent) =>
          !isFinesseAgentOfflineLikeState(agent.state) &&
          !isFinesseConsoleNotReadyState(agent.state) &&
          !getAgentMonitoringState(agent).agentOnCall,
      ),
    [selectedAgentRows, getAgentMonitoringState],
  );

  const teamDataAvailable = !teamDataLoading && teamData != null;

  const handleSelectAgent = (id: string) => {
    setSelectedAgents((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
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

  /** POST finesse/teams/{teamId}/users/{loginId}/state — body `{ newState, actingFinesseUserId? }` */
  const handleBulkStatusChange = async (newStatus: string) => {
    if (!canChangeUserStatus) {
      toast.error("You do not have permission to change agent status.");
      return;
    }
    if (selectedAgents.length === 0) {
      toast.warn("Please select at least one agent to change status.");
      return;
    }
    const newState: "READY" | "NOT_READY" =
      newStatus === "READY" ? "READY" : "NOT_READY";
    const agentsToUpdate = selectedAgents.filter((loginId) => {
      const agent = agents.find((a) => a.loginId === loginId);
      if (!agent || isFinesseAgentOfflineLikeState(agent.state)) return false;
      if (getAgentMonitoringState(agent).agentOnCall) return false;
      return !isFinesseConsoleStatusActionDisabled(agent.state, newState);
    });
    if (agentsToUpdate.length === 0) {
      const hasOnCallSelection = selectedAgents.some((loginId) => {
        const agent = agents.find((a) => a.loginId === loginId);
        return agent != null && getAgentMonitoringState(agent).agentOnCall;
      });
      if (hasOnCallSelection) {
        toast.warn("Cannot change status while selected agent(s) are on a call.");
        return;
      }
      toast.warn(
        newState === "READY"
          ? "Selected agent(s) are already Ready."
          : "Selected agent(s) are already Not Ready.",
      );
      return;
    }
    const data = getFinesseUserData();
    const teamId = getEffectiveTeamId(data);
    const actingFinesseUserId = data?.loginId ?? data?.loginName ?? "";
    if (teamId == null) {
      toast.error("Team not available.");
      return;
    }
    const count = agentsToUpdate.length;
    const label = newState === "READY" ? "Ready" : "Not Ready";
    setBulkActionLoading(true);
    try {
      const results = await Promise.allSettled(
        agentsToUpdate.map((loginId) =>
          finesseSetState(teamId, loginId, newState, actingFinesseUserId),
        ),
      );
      const rejected = results.filter(
        (r): r is PromiseRejectedResult => r.status === "rejected",
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

  const handleSingleAgentStatusChange = async (
    agentLoginId: string,
    newStatus: string,
  ) => {
    if (!canChangeUserStatus) {
      toast.error("You do not have permission to change agent status.");
      setActionMenuPortal(null);
      return;
    }
    const newState: "READY" | "NOT_READY" =
      newStatus === "READY" ? "READY" : "NOT_READY";
    const agent = agents.find((a) => a.loginId === agentLoginId);
    if (!agent || isFinesseAgentOfflineLikeState(agent.state)) {
      toast.warn("Cannot change status of offline agents");
      setActionMenuPortal(null);
      return;
    }
    if (isFinesseConsoleStatusActionDisabled(agent.state, newState)) {
      toast.warn(
        newState === "READY"
          ? "Agent is already Ready."
          : "Agent is already Not Ready.",
      );
      setActionMenuPortal(null);
      return;
    }
    if (getAgentMonitoringState(agent).agentOnCall) {
      toast.warn("Cannot change status while agent is on a call.");
      setActionMenuPortal(null);
      return;
    }
    const data = getFinesseUserData();
    const teamId = getEffectiveTeamId(data);
    const actingFinesseUserId = data?.loginId ?? data?.loginName ?? "";
    if (teamId == null) {
      toast.error("Team not available.");
      setActionMenuPortal(null);
      return;
    }
    try {
      await finesseSetState(
        teamId,
        agentLoginId,
        newState,
        actingFinesseUserId,
      );
      const label = newState === "READY" ? "Ready" : "Not Ready";
      toast.success(`Status updated to ${label}.`);
      setRefreshTrigger((t) => t + 1);
    } catch (err: unknown) {
      toast.error(
        getFinesseApiErrorMessage(err, "Failed to update agent state."),
      );
    } finally {
      setActionMenuPortal(null);
    }
  };

  const executeForceSignOutAgent = useCallback(
    async (agentLoginId: string) => {
      if (!canForceSignOut) {
        toast.error("You do not have permission to force sign-out.");
        return false;
      }
      const stored = getFinesseUserData();
      const supervisorFinesseUserId =
        stored?.loginId ?? stored?.loginName ?? "";
      const teamId = getEffectiveTeamId(stored);
      if (!supervisorFinesseUserId.trim()) {
        toast.error("Supervisor user not found.");
        return false;
      }
      if (teamId == null) {
        toast.error("Team not available.");
        return false;
      }
      if (agentLoginId === supervisorFinesseUserId) {
        toast.warn(
          "You cannot force sign-out your own session from another agent row.",
        );
        return false;
      }
      try {
        await finesseForceSignOut({
          teamId,
          finesseUserId: agentLoginId,
          supervisorFinesseUserId,
        });
        toast.success("Agent signed out of Finesse.");
        setRefreshTrigger((t) => t + 1);
        return true;
      } catch (err: unknown) {
        toast.error(getFinesseApiErrorMessage(err, "Force sign-out failed."));
        return false;
      }
    },
    [canForceSignOut],
  );

  const openForceSignOutConfirm = useCallback((agent: DisplayAgent) => {
    setActionMenuPortal(null);
    setForceSignOutConfirmTarget({
      loginId: agent.loginId,
      name: agent.name,
    });
  }, []);

  const handleCloseForceSignOutConfirm = useCallback(() => {
    if (forceSignOutLoading) return;
    setForceSignOutConfirmTarget(null);
  }, [forceSignOutLoading]);

  const handleConfirmForceSignOut = useCallback(async () => {
    if (!forceSignOutConfirmTarget || forceSignOutLoading) return;
    setForceSignOutLoading(true);
    try {
      const success = await executeForceSignOutAgent(
        forceSignOutConfirmTarget.loginId,
      );
      if (success) {
        setForceSignOutConfirmTarget(null);
      }
    } finally {
      setForceSignOutLoading(false);
    }
  }, [
    executeForceSignOutAgent,
    forceSignOutConfirmTarget,
    forceSignOutLoading,
  ]);

  const isOwnFinesseRow = useCallback(
    (agentLoginId: string) => agentLoginId === sseFinesseUserId,
    [sseFinesseUserId],
  );

  const supervisorIsReady =
    isFinesseConsoleReadyLikeState(
      mapEffectiveFinesseStateToTopBarReadyToggle(displayAgentStatus),
    ) && !isFinesseCampaignTopBarStatusLockedState(displayAgentStatus);

  const handleStartSilentMonitor = useCallback(
    async (agent: DisplayAgent) => {
      const state = getAgentMonitoringState(agent);
      if (!isFinesseSupervisor) {
        toast.error("Finesse Supervisor role is required for call monitoring.");
        return;
      }
      if (supervisorIsReady) {
        toast.warn(SUPERVISOR_READY_MONITORING_DISABLED_REASON);
        return;
      }
      if (isOwnFinesseRow(agent.loginId)) {
        toast.warn("You cannot monitor your own Finesse session.");
        return;
      }
      if (!state.agentOnCall) {
        toast.warn("The agent does not have an active call to monitor.");
        return;
      }
      try {
        await startSilentMonitor(agent);
        toast.success("Silent monitoring started.");
      } catch (err: unknown) {
        toast.error(
          getFinesseApiErrorMessage(err, "Failed to start silent monitoring."),
        );
      } finally {
        setActionMenuPortal(null);
      }
    },
    [
      getAgentMonitoringState,
      isFinesseSupervisor,
      isOwnFinesseRow,
      startSilentMonitor,
      supervisorIsReady,
    ],
  );

  const handleBargeAgentCall = useCallback(
    async (agent: DisplayAgent) => {
      if (supervisorIsReady) {
        toast.warn(SUPERVISOR_READY_MONITORING_DISABLED_REASON);
        return;
      }
      try {
        await barge(agent);
        toast.success("Barge request sent.");
      } catch (err: unknown) {
        toast.error(getFinesseApiErrorMessage(err, "Barge failed."));
      } finally {
        setActionMenuPortal(null);
      }
    },
    [barge, supervisorIsReady],
  );

  const handleStopMonitoring = useCallback(
    async (agent: DisplayAgent) => {
      try {
        await endMonitoring(agent);
        toast.success("Monitoring stopped.");
      } catch (err: unknown) {
        toast.error(getFinesseApiErrorMessage(err, "Stop monitoring failed."));
      } finally {
        setActionMenuPortal(null);
      }
    },
    [endMonitoring],
  );

  const actionMenuMonitoringStatus = getMonitoringActionMenuStatus(
    actionMenuPortal,
    getAgentMonitoringState,
    isOwnFinesseRow,
    isFinesseSupervisor,
    supervisorIsReady,
  );
  const actionMenuAgentOnCall =
    actionMenuMonitoringStatus.monitoringState?.agentOnCall === true;
  const selectedAgentsAllOnCall = useMemo(
    () =>
      selectedAgentRows.length > 0 &&
      selectedAgentRows.every(
        (agent) => getAgentMonitoringState(agent).agentOnCall,
      ),
    [selectedAgentRows, getAgentMonitoringState],
  );

  return (
    <FinesseAuthGate
      subTitle="Live Calls Agents Management"
      pageLabel="Live Calls Agents"
    >
      <React.Fragment>
        <BreadcrumbItem
          mainTitle="Campaign Console"
          mainLink="/communications/campaign-console"
          subTitle="Campaign Console"
        />

        <style>{`
        
     .campaign-info-bar {
          background: linear-gradient(135deg, #0066CC 0%, #0066CC 100%);
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
          border-color: #0066CC;
          box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
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
          border-color: #0066CC;
          box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
        }

        .team-selector select:hover {
          border-color: #0066CC;
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
          border-color: #0066CC;
          box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
        }

        .team-selector select:hover {
          border-color: #0066CC;
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
          border-color: #0066CC;
          box-shadow: 0 2px 8px rgba(0, 102, 204, 0.15);
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
          background: #EEF2FF;
          color: #0066CC;
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
          color: #6c757d;
        }

        .icon-button:hover {
          border-color: #0066CC;
          color: #0066CC;
          box-shadow: 0 2px 8px rgba(0, 102, 204, 0.15);
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
          background: linear-gradient(135deg, #0066CC 0%, #0052A3 100%);
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
          box-shadow: 0 2px 8px rgba(0, 102, 204, 0.3);
        }

        .user-menu-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 102, 204, 0.4);
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
          background: linear-gradient(135deg, #0066CC 0%, #0052A3 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(0, 102, 204, 0.4);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 102, 204, 0.5);
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
          color: #141414;
          margin-bottom: 8px;
        }

        .page-subtitle {
          color: #6c757d;
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
          background: linear-gradient(90deg, #0066CC 0%, #0052A3 100%);
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
          color: #141414;
          margin-bottom: 4px;
          line-height: 1;
        }

        .stat-label {
          color: #6c757d;
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
          color: #6c757d;
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
          color: #141414;
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
          border-color: #0066CC;
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
          background: #0066CC;
          border-color: #0066CC;
        }

        input[type="checkbox"].checkbox {
          appearance: none;
          -webkit-appearance: none;
          margin: 0;
          cursor: pointer;
        }

        .checkbox-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          vertical-align: middle;
        }

        .checkbox-check-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
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
          color: #6c757d;
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
          background: #EEF2FF;
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
          background: linear-gradient(135deg, #0066CC 0%, #0052A3 100%);
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
          color: #141414;
          margin-bottom: 2px;
        }

        .agent-details p {
          font-size: 13px;
          color: #6c757d;
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
          color: #6c757d;
          position: relative;
        }

        .action-btn:hover {
          background: #0066CC;
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

        .action-menu-item:hover:not(:disabled) {
          background: #f8fafc;
        }

        .action-menu-item:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .action-menu-item.danger {
          color: #dc2626;
        }

        .action-menu-item.danger:hover {
          background: #fee2e2;
        }

        .info-card {
          background: linear-gradient(135deg, rgba(0, 102, 204, 0.08) 0%, rgba(0, 82, 163, 0.08) 100%);
          border: 2px dashed rgba(0, 102, 204, 0.25);
          border-radius: 12px;
          padding: 32px;
          margin-top: 24px;
          text-align: center;
        }

        .info-card-title {
          font-size: 18px;
          font-weight: 600;
          color: #141414;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .info-card-text {
          color: #6c757d;
          font-size: 14px;
          line-height: 1.6;
        }

        .bulk-action-bar {
          background: linear-gradient(135deg, #0066CC 0%, #0066CC 100%);
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

        .bulk-action-btn:hover:not(:disabled) {
          background: white;
          color: #0066CC;
        }

        .bulk-action-btn:disabled {
          cursor: not-allowed;
          opacity: 0.5;
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
          background: linear-gradient(135deg, #0066CC 0%, #0066CC 100%);
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
          color: #141414;
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
          color: #6c757d;
          font-weight: 500;
        }

        .call-info-value {
          color: #141414;
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
          color: #6c757d;
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
          background: #0066CC;
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
          color: #6c757d;
          transition: all 0.2s;
        }

        .view-toggle button.active {
          background: white;
          color: #0066CC;
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
              agentStatus={displayAgentStatus}
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
          <p className="page-subtitle">
            Monitor campaign status, availability, and manage team operations in
            real-time
          </p>
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
                  disabled={
                    bulkActionLoading || !canChangeUserStatus || !canBulkSetReady
                  }
                  title={getBulkStatusActionDisabledReason(
                    canChangeUserStatus,
                    selectedAgentsAllOnCall,
                    canBulkSetReady,
                    "Selected agent(s) are already Ready",
                  )}
                  onClick={() => {
                    handleBulkStatusChange("READY").catch(() => undefined);
                  }}
                >
                  <CheckCircle size={16} />
                  Set Ready
                </button>
                <button
                  className="bulk-action-btn"
                  type="button"
                  disabled={
                    bulkActionLoading ||
                    !canChangeUserStatus ||
                    !canBulkSetNotReady
                  }
                  title={getBulkStatusActionDisabledReason(
                    canChangeUserStatus,
                    selectedAgentsAllOnCall,
                    canBulkSetNotReady,
                    "Selected agent(s) are already Not Ready",
                  )}
                  onClick={() => {
                    handleBulkStatusChange("NOT_READY").catch(() => undefined);
                  }}
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
              <h2 className="card-title">
                Active Agents ({filteredAgents.length})
              </h2>
            </div>

            <div className="filters">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="visually-hidden"
                  checked={includeLoggedOut}
                  onChange={(e) => setIncludeLoggedOut(e.target.checked)}
                />
                <span
                  className={`checkbox ${includeLoggedOut ? "checked" : ""}`}
                  aria-hidden
                >
                  {includeLoggedOut && <CheckCircle size={14} color="white" />}
                </span>
                <span>Show Offline Agents</span>
              </label>

              <button
                className="icon-button"
                onClick={handleRefresh}
                title="Refresh Agent List"
                style={{ marginLeft: "8px" }}
              >
                <RefreshCw
                  size={18}
                  className={isRefreshing ? "refreshing" : ""}
                />
              </button>
            </div>
          </div>

          {teamDataLoading && (
            <div className="info-card" style={{ marginTop: 0 }}>
              <div className="info-card-title">
                <RefreshCw
                  size={20}
                  className="refreshing"
                  style={{ animation: "spin 1s linear infinite" }}
                />
                Loading team agentsâ€¦
              </div>
              <p className="info-card-text">
                Fetching agents for the selected team.
              </p>
            </div>
          )}

          {!teamDataLoading && teamDataError && (
            <div
              className="info-card"
              style={{ marginTop: 0, borderColor: "#fecaca" }}
            >
              <div className="info-card-title" style={{ color: "#dc2626" }}>
                <AlertCircle size={20} />
                Unable to load team
              </div>
              <p className="info-card-text">{teamDataError}</p>
            </div>
          )}

          {teamDataAvailable && !teamData?.users?.length && (
            <div className="info-card" style={{ marginTop: 0 }}>
              <div className="info-card-title">
                <AlertCircle size={20} color="#0066CC" />
                No agents in this team
              </div>
              <p className="info-card-text">
                The selected team has no users. Choose another team or try again
                later.
              </p>
            </div>
          )}

          {teamDataAvailable &&
            (teamData?.users?.length ?? 0) > 0 &&
            teamUsersForDisplay.length === 0 &&
            !includeLoggedOut && (
              <div className="info-card" style={{ marginTop: 0 }}>
                <div className="info-card-title">
                  <AlertCircle size={20} color="#0066CC" />
                  All agents are offline
                </div>
                <p className="info-card-text">
                  Enable &quot;Include logged out&quot; above to see offline
                  agents.
                </p>
              </div>
            )}

          {teamDataAvailable && teamUsersForDisplay.length > 0 && (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "50px" }}>
                      <div className="checkbox-wrap">
                        <input
                          type="checkbox"
                          className={`checkbox ${selectedAgents.length === filteredAgents.length && filteredAgents.length > 0 ? "checked" : ""}`}
                          checked={
                            selectedAgents.length === filteredAgents.length &&
                            filteredAgents.length > 0
                          }
                          onChange={handleSelectAll}
                          aria-label="Select all agents"
                        />
                        {selectedAgents.length === filteredAgents.length &&
                          filteredAgents.length > 0 && (
                            <span className="checkbox-check-overlay">
                              <CheckCircle size={14} color="white" />
                            </span>
                          )}
                      </div>
                    </th>
                    <th>Agent</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Extension</th>
                    <th style={{ width: "80px", textAlign: "center" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.map((agent) => (
                    <tr
                      key={agent.id}
                      className={
                        selectedAgents.includes(agent.id) ? "selected" : ""
                      }
                    >
                      <td>
                        <div className="checkbox-wrap">
                          <input
                            type="checkbox"
                            className={`checkbox ${selectedAgents.includes(agent.id) ? "checked" : ""}`}
                            checked={selectedAgents.includes(agent.id)}
                            onChange={() => handleSelectAgent(agent.id)}
                            aria-label={`Select ${agent.name}`}
                          />
                          {selectedAgents.includes(agent.id) && (
                            <span className="checkbox-check-overlay">
                              <CheckCircle size={14} color="white" />
                            </span>
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
                            color: agent.stateColor,
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: agent.stateColor,
                            }}
                          />
                          {agent.stateLabel}
                          {agent.label ? ` (${agent.label})` : ""}
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <Clock size={16} color="#6c757d" />
                          {agent.timeInState}
                        </div>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <Phone size={16} color="#6c757d" />
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

        </div>

        {typeof document !== "undefined" &&
          actionMenuPortal &&
          createPortal(
            <div
              data-campaign-console-action-menu
              className="action-menu action-menu--fixed-portal"
              style={{
                position: "fixed",
                top: actionMenuPortal.top,
                left: actionMenuPortal.left,
                maxHeight: actionMenuPortal.maxHeight,
                overflowY: "auto",
                zIndex: 100050,
                minWidth: 180,
              }}
              role="menu"
            >
              <button
                type="button"
                className="action-menu-item"
                disabled={isSupervisorStatusActionDisabled(
                  canChangeUserStatus,
                  actionMenuPortal.agent,
                  actionMenuAgentOnCall,
                  "READY",
                )}
                title={getSupervisorStatusActionDisabledReason(
                  canChangeUserStatus,
                  actionMenuPortal.agent,
                  actionMenuAgentOnCall,
                  "READY",
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!canChangeUserStatus) return;
                  handleSingleAgentStatusChange(
                    actionMenuPortal.agent.loginId,
                    "READY",
                  ).catch(() => undefined);
                }}
              >
                <CheckCircle size={16} color="#10b981" />
                <span>Ready</span>
              </button>
              <button
                type="button"
                className="action-menu-item"
                disabled={isSupervisorStatusActionDisabled(
                  canChangeUserStatus,
                  actionMenuPortal.agent,
                  actionMenuAgentOnCall,
                  "NOT_READY",
                )}
                title={getSupervisorStatusActionDisabledReason(
                  canChangeUserStatus,
                  actionMenuPortal.agent,
                  actionMenuAgentOnCall,
                  "NOT_READY",
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!canChangeUserStatus) return;
                  handleSingleAgentStatusChange(
                    actionMenuPortal.agent.loginId,
                    "NOT_READY",
                  ).catch(() => undefined);
                }}
              >
                <XCircle size={16} color="#ef4444" />
                <span>Not Ready</span>
              </button>
              <CampaignConsoleMonitoringMenuItems
                agent={actionMenuPortal.agent}
                status={actionMenuMonitoringStatus}
                onStartSilentMonitor={handleStartSilentMonitor}
                onBargeAgentCall={handleBargeAgentCall}
                onStopMonitoring={handleStopMonitoring}
              />
              <button
                type="button"
                className="action-menu-item danger"
                disabled={!canForceSignOut}
                title={
                  canForceSignOut
                    ? undefined
                    : "You do not have permission to force sign-out"
                }
                onClick={(e) => {
                  e.stopPropagation();
                  if (!canForceSignOut) return;
                  openForceSignOutConfirm(actionMenuPortal.agent);
                }}
              >
                <LogOut size={16} />
                <span>Force sign out</span>
              </button>
            </div>,
            document.body,
          )}

        {/* Call Widget â€” Finesse preview (campaign) dialogs */}
        <CallWidget {...callWidgetProps} />

        <WrapUpModal {...wrapUpModalProps} />

        <ConfirmModal
          show={forceSignOutConfirmTarget != null}
          onHide={handleCloseForceSignOutConfirm}
          onCancel={handleCloseForceSignOutConfirm}
          title="Force sign out"
          description="Agent might be in an active session. Still want to continue?"
          targetName={forceSignOutConfirmTarget?.name ?? "this agent"}
          confirmButtonText="Continue"
          cancelButtonText="Cancel"
          confirmButtonVariant="danger"
          requireTextConfirmation={false}
          loading={forceSignOutLoading}
          onConfirm={() => {
            handleConfirmForceSignOut().catch(() => undefined);
          }}
        />
      </React.Fragment>
    </FinesseAuthGate>
  );
};

LiveCallsAgentsManagement.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default LiveCallsAgentsManagement;
