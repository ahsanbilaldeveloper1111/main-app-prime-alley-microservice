import { useCallback, useEffect, useMemo, useState } from "react";
import {
  finesseBarge,
  finesseEndMonitoring,
  finesseStartSilentMonitor,
  getFinesseMonitoringAgentDialogs,
  isFinesseAgentOnCallFromRosterState,
} from "@utils/finesse";
import type { FinessePreviewEvent } from "@hooks/live-calls/useFinesseStomp";

const MONITOR_START_GRACE_MS = 15_000;
const MONITORING_POLL_MS = 20_000;
const ACTIVE_DIALOG_STATES = new Set(["ACTIVE", "ALERTING", "HELD", "TALKING"]);
/** Connected call legs only — excludes ALERTING (ringing/preview) for monitor eligibility. */
const CONNECTED_DIALOG_STATES = new Set(["ACTIVE", "HELD", "TALKING"]);

export type FinesseMonitoringAgent = {
  loginId: string;
  extension?: string;
  /** Team roster state; combined with dialogs to detect on-call for monitoring. */
  state?: string;
};

export type FinesseMonitorAction = "monitor" | "barge" | "end";

export type FinesseMonitorSession = {
  agentExtension?: string;
  supervisorMonitorDialogId: string | number | null;
  monitorStartedAt: number;
  bargedIn: boolean;
  bargedInAt: number | null;
};

export type FinesseAgentMonitoringState = {
  agentOnCall: boolean;
  monitoringActive: boolean;
  silentMonitorActive: boolean;
  bargedIn: boolean;
  activeAgentDialogId: string | number | null;
  supervisorMonitorDialogId: string | number | null;
  actionLoading: FinesseMonitorAction | null;
};

type UseFinesseMonitoringOptions = {
  teamId: number | string | null | undefined;
  supervisorFinesseUserId: string | null | undefined;
  supervisorExtension: string | null | undefined;
  agents: FinesseMonitoringAgent[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function upperString(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function cleanValue(value: unknown): string | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const text = String(value).trim();
  return text && text !== "—" ? text : undefined;
}

function dialogIdFromEvent(dialog: FinessePreviewEvent): string | number | null {
  const raw = dialog.dialogId ?? (dialog as { id?: string | number }).id;
  return typeof raw === "string" || typeof raw === "number" ? raw : null;
}

function callTypeFromDialog(dialog: FinessePreviewEvent): string {
  const mediaProperties = (dialog as { mediaProperties?: unknown }).mediaProperties;
  const mediaCallType = isRecord(mediaProperties)
    ? mediaProperties.callType
    : undefined;
  return upperString(dialog.callType ?? mediaCallType);
}

function normalizeDialog(
  raw: unknown,
  fallbackAgentId?: string,
): FinessePreviewEvent | null {
  if (!isRecord(raw)) return null;
  const mediaProperties = isRecord(raw.mediaProperties)
    ? raw.mediaProperties
    : undefined;
  const dialogId = raw.dialogId ?? raw.id;
  if (typeof dialogId !== "string" && typeof dialogId !== "number") return null;
  return {
    ...raw,
    agentId: raw.agentId ?? fallbackAgentId,
    dialogId,
    dialogState: raw.dialogState ?? raw.state,
    callType: raw.callType ?? mediaProperties?.callType,
    dialedNumber: raw.dialedNumber ?? mediaProperties?.dialedNumber,
  } as FinessePreviewEvent;
}

function extractDialogArray(response: unknown): unknown[] {
  if (!isRecord(response)) return [];
  const responseData = isRecord(response.responseData)
    ? response.responseData
    : response;
  const directDialogs = responseData.dialogs;
  if (Array.isArray(directDialogs)) return directDialogs;
  if (isRecord(directDialogs) && Array.isArray(directDialogs.dialogs)) {
    return directDialogs.dialogs;
  }
  return [];
}

function normalizeDialogsResponse(
  response: unknown,
  fallbackAgentId: string,
): FinessePreviewEvent[] {
  return extractDialogArray(response)
    .map((dialog) => normalizeDialog(dialog, fallbackAgentId))
    .filter((dialog): dialog is FinessePreviewEvent => dialog != null);
}

function isActiveDialog(dialog: FinessePreviewEvent): boolean {
  if (upperString(dialog.eventType) === "ENDED") return false;
  const dialogState = upperString(
    dialog.dialogState ?? (dialog as { state?: unknown }).state,
  );
  if (ACTIVE_DIALOG_STATES.has(dialogState)) return true;
  return (dialog.participants ?? []).some((participant) =>
    ACTIVE_DIALOG_STATES.has(upperString(participant.state)),
  );
}

function isConnectedDialog(dialog: FinessePreviewEvent): boolean {
  if (upperString(dialog.eventType) === "ENDED") return false;
  const dialogState = upperString(
    dialog.dialogState ?? (dialog as { state?: unknown }).state,
  );
  if (CONNECTED_DIALOG_STATES.has(dialogState)) return true;
  return (dialog.participants ?? []).some((participant) =>
    CONNECTED_DIALOG_STATES.has(upperString(participant.state)),
  );
}

function isAgentOnCallFromRosterState(state: string | undefined): boolean {
  return isFinesseAgentOnCallFromRosterState(state);
}

function participantAddresses(dialog: FinessePreviewEvent): string[] {
  return (dialog.participants ?? [])
    .map((participant) => cleanValue(participant.mediaAddress))
    .filter((address): address is string => address != null);
}

function dialogInvolvesAddress(
  dialog: FinessePreviewEvent,
  address: string | undefined,
): boolean {
  if (!address) return false;
  const values = [
    cleanValue(dialog.fromAddress),
    cleanValue(dialog.toAddress),
    cleanValue(dialog.dialedNumber),
    ...participantAddresses(dialog),
  ].filter((value): value is string => value != null);
  return values.includes(address);
}

function isSupervisorMonitorDialogForAgent(
  dialog: FinessePreviewEvent,
  supervisorExtension: string | undefined,
  agentExtension: string | undefined,
): boolean {
  if (!isActiveDialog(dialog)) return false;
  const callType = callTypeFromDialog(dialog);
  const looksLikeMonitorLeg =
    callType.includes("MONITOR") || callType.includes("BARGE");
  const matchesSupervisor = dialogInvolvesAddress(dialog, supervisorExtension);
  const matchesAgent = !agentExtension || dialogInvolvesAddress(dialog, agentExtension);
  return matchesSupervisor && matchesAgent && (looksLikeMonitorLeg || matchesAgent);
}

function dialogsById(dialogs: FinessePreviewEvent[]) {
  return dialogs.reduce<Record<string, FinessePreviewEvent>>((acc, dialog) => {
    const dialogId = dialogIdFromEvent(dialog);
    if (dialogId != null) acc[String(dialogId)] = dialog;
    return acc;
  }, {});
}

function getActiveDialogId(dialogs: Record<string, FinessePreviewEvent>) {
  const active = Object.values(dialogs).find(isActiveDialog);
  return active ? dialogIdFromEvent(active) : null;
}

function getConnectedDialogId(dialogs: Record<string, FinessePreviewEvent>) {
  const connected = Object.values(dialogs).find(isConnectedDialog);
  return connected ? dialogIdFromEvent(connected) : null;
}

function findSupervisorDialogIdForSession(
  dialogs: FinessePreviewEvent[],
  supervisorExtension: string | undefined,
  session: FinesseMonitorSession,
): string | number | null {
  const match = dialogs.find((dialog) =>
    isSupervisorMonitorDialogForAgent(
      dialog,
      supervisorExtension,
      session.agentExtension,
    ),
  );
  return match ? dialogIdFromEvent(match) : null;
}

function mergeSupervisorDialogMatches(
  prev: Record<string, FinesseMonitorSession>,
  dialogs: FinessePreviewEvent[],
  supervisorExtension: string | undefined,
): Record<string, FinesseMonitorSession> {
  let changed = false;
  const next = { ...prev };
  Object.entries(prev).forEach(([agentId, session]) => {
    const dialogId = findSupervisorDialogIdForSession(
      dialogs,
      supervisorExtension,
      session,
    );
    if (dialogId != null && dialogId !== session.supervisorMonitorDialogId) {
      changed = true;
      next[agentId] = { ...session, supervisorMonitorDialogId: dialogId };
    }
  });
  return changed ? next : prev;
}

export function useFinesseMonitoring({
  teamId,
  supervisorFinesseUserId,
  supervisorExtension,
  agents,
}: UseFinesseMonitoringOptions) {
  const [agentDialogs, setAgentDialogs] = useState<
    Record<string, Record<string, FinessePreviewEvent>>
  >({});
  const [sessions, setSessions] = useState<Record<string, FinesseMonitorSession>>(
    {},
  );
  const [actionLoading, setActionLoading] = useState<
    Record<string, FinesseMonitorAction | null>
  >({});
  const [now, setNow] = useState(() => Date.now());

  const normalizedSupervisorExtension = cleanValue(supervisorExtension);
  const canUseMonitoringApi =
    teamId != null &&
    cleanValue(supervisorFinesseUserId) != null &&
    normalizedSupervisorExtension != null;

  const monitoredAgentIds = useMemo(
    () =>
      agents
        .map((agent) => agent.loginId.trim())
        .filter((loginId) => loginId && loginId !== supervisorFinesseUserId),
    [agents, supervisorFinesseUserId],
  );

  const agentById = useMemo(
    () =>
      agents.reduce<Record<string, FinesseMonitoringAgent>>((acc, agent) => {
        acc[agent.loginId] = agent;
        return acc;
      }, {}),
    [agents],
  );

  useEffect(() => {
    setAgentDialogs({});
    setSessions({});
    setActionLoading({});
  }, [teamId, supervisorFinesseUserId]);

  useEffect(() => {
    if (Object.keys(sessions).length === 0) return undefined;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [sessions]);

  const fetchAgentDialogs = useCallback(
    async (agent: FinesseMonitoringAgent) => {
      const supervisorId = cleanValue(supervisorFinesseUserId);
      if (teamId == null || !supervisorId || !agent.loginId) return;
      const response = await getFinesseMonitoringAgentDialogs(
        teamId,
        supervisorId,
        agent.loginId,
      );
      const dialogs = normalizeDialogsResponse(response, agent.loginId);
      setAgentDialogs((prev) => ({
        ...prev,
        [agent.loginId]: dialogsById(dialogs),
      }));
    },
    [teamId, supervisorFinesseUserId],
  );

  const mergeSupervisorDialogs = useCallback(
    (dialogs: FinessePreviewEvent[]) => {
      setSessions((prev) =>
        mergeSupervisorDialogMatches(
          prev,
          dialogs,
          normalizedSupervisorExtension,
        ),
      );
    },
    [normalizedSupervisorExtension],
  );

  const fetchSupervisorDialogs = useCallback(async () => {
    const supervisorId = cleanValue(supervisorFinesseUserId);
    if (teamId == null || !supervisorId) return;
    const response = await getFinesseMonitoringAgentDialogs(
      teamId,
      supervisorId,
      supervisorId,
    );
    mergeSupervisorDialogs(normalizeDialogsResponse(response, supervisorId));
  }, [mergeSupervisorDialogs, supervisorFinesseUserId, teamId]);

  const refreshMonitoringDialogs = useCallback(() => {
    if (teamId == null || !supervisorFinesseUserId) return;
    monitoredAgentIds.forEach((agentId) => {
      const agent = agentById[agentId];
      if (agent) fetchAgentDialogs(agent).catch(() => undefined);
    });
    if (Object.keys(sessions).length > 0) {
      fetchSupervisorDialogs().catch(() => undefined);
    }
  }, [
    agentById,
    fetchAgentDialogs,
    fetchSupervisorDialogs,
    monitoredAgentIds,
    sessions,
    supervisorFinesseUserId,
    teamId,
  ]);

  useEffect(() => {
    refreshMonitoringDialogs();
    const interval = setInterval(refreshMonitoringDialogs, MONITORING_POLL_MS);
    return () => clearInterval(interval);
  }, [refreshMonitoringDialogs]);

  const handleMonitoringDialogEvent = useCallback((payload: FinessePreviewEvent) => {
    const normalized = normalizeDialog(payload, cleanValue(payload.agentId));
    const agentId = cleanValue(normalized?.agentId);
    const dialogId = normalized ? dialogIdFromEvent(normalized) : null;
    if (!normalized || !agentId || dialogId == null) return;
    setAgentDialogs((prev) => {
      const existing = prev[agentId] ?? {};
      if (upperString(normalized.eventType) === "ENDED") {
        const nextDialogs = { ...existing };
        delete nextDialogs[String(dialogId)];
        return { ...prev, [agentId]: nextDialogs };
      }
      return {
        ...prev,
        [agentId]: {
          ...existing,
          [String(dialogId)]: {
            ...existing[String(dialogId)],
            ...normalized,
            participants:
              normalized.participants ?? existing[String(dialogId)]?.participants,
          },
        },
      };
    });
  }, []);

  const handleSupervisorPreviewEvent = useCallback(
    (payload: FinessePreviewEvent) => {
      const normalized = normalizeDialog(payload);
      if (!normalized) return;
      mergeSupervisorDialogs([normalized]);
    },
    [mergeSupervisorDialogs],
  );

  const getAgentMonitoringState = useCallback(
    (agent: FinesseMonitoringAgent): FinesseAgentMonitoringState => {
      const dialogs = agentDialogs[agent.loginId] ?? {};
      const connectedDialogId = getConnectedDialogId(dialogs);
      const rosterOnCall = isAgentOnCallFromRosterState(agent.state);
      const session = sessions[agent.loginId];
      const withinGrace =
        session != null && now - session.monitorStartedAt <= MONITOR_START_GRACE_MS;
      const silentMonitorActive =
        session != null &&
        !session.bargedIn &&
        (session.supervisorMonitorDialogId != null || withinGrace);
      const bargedIn = session?.bargedIn === true;
      return {
        agentOnCall: connectedDialogId != null || rosterOnCall,
        monitoringActive: silentMonitorActive || bargedIn,
        silentMonitorActive,
        bargedIn,
        activeAgentDialogId: connectedDialogId,
        supervisorMonitorDialogId: session?.supervisorMonitorDialogId ?? null,
        actionLoading: actionLoading[agent.loginId] ?? null,
      };
    },
    [actionLoading, agentDialogs, now, sessions],
  );

  const setAgentActionLoading = useCallback(
    (agentId: string, action: FinesseMonitorAction | null) => {
      setActionLoading((prev) => ({ ...prev, [agentId]: action }));
    },
    [],
  );

  const startSilentMonitor = useCallback(
    async (agent: FinesseMonitoringAgent) => {
      const supervisorId = cleanValue(supervisorFinesseUserId);
      const supervisorExt = normalizedSupervisorExtension;
      const agentExtension = cleanValue(agent.extension);
      if (!canUseMonitoringApi || teamId == null || !supervisorId || !supervisorExt) {
        throw new Error("Supervisor Finesse context is not available.");
      }
      if (!agentExtension) {
        throw new Error("Agent extension is not available.");
      }
      if (!getAgentMonitoringState(agent).agentOnCall) {
        throw new Error("The agent does not have an active call to monitor.");
      }
      setAgentActionLoading(agent.loginId, "monitor");
      try {
        await finesseStartSilentMonitor(teamId, supervisorId, {
          targetAgentId: agent.loginId,
          supervisorExtension: supervisorExt,
          agentExtension,
        });
        setSessions((prev) => ({
          ...prev,
          [agent.loginId]: {
            agentExtension,
            supervisorMonitorDialogId: null,
            monitorStartedAt: Date.now(),
            bargedIn: false,
            bargedInAt: null,
          },
        }));
        fetchAgentDialogs(agent).catch(() => undefined);
        fetchSupervisorDialogs().catch(() => undefined);
      } finally {
        setAgentActionLoading(agent.loginId, null);
      }
    },
    [
      canUseMonitoringApi,
      fetchAgentDialogs,
      fetchSupervisorDialogs,
      getAgentMonitoringState,
      normalizedSupervisorExtension,
      setAgentActionLoading,
      supervisorFinesseUserId,
      teamId,
    ],
  );

  const barge = useCallback(
    async (agent: FinesseMonitoringAgent) => {
      const supervisorId = cleanValue(supervisorFinesseUserId);
      const supervisorExt = normalizedSupervisorExtension;
      if (!canUseMonitoringApi || teamId == null || !supervisorId || !supervisorExt) {
        throw new Error("Supervisor Finesse context is not available.");
      }
      const state = getAgentMonitoringState(agent);
      const session = sessions[agent.loginId];
      setAgentActionLoading(agent.loginId, "barge");
      try {
        await finesseBarge(teamId, supervisorId, {
          supervisorExtension: supervisorExt,
          targetAgentId: agent.loginId,
          agentExtension: cleanValue(agent.extension),
          supervisorMonitorDialogId: session?.supervisorMonitorDialogId,
          agentDialogId: state.activeAgentDialogId,
        });
        setSessions((prev) => ({
          ...prev,
          [agent.loginId]: {
            agentExtension: cleanValue(agent.extension),
            supervisorMonitorDialogId: session?.supervisorMonitorDialogId ?? null,
            monitorStartedAt: session?.monitorStartedAt ?? Date.now(),
            bargedIn: true,
            bargedInAt: Date.now(),
          },
        }));
        fetchSupervisorDialogs().catch(() => undefined);
      } finally {
        setAgentActionLoading(agent.loginId, null);
      }
    },
    [
      canUseMonitoringApi,
      fetchSupervisorDialogs,
      getAgentMonitoringState,
      normalizedSupervisorExtension,
      sessions,
      setAgentActionLoading,
      supervisorFinesseUserId,
      teamId,
    ],
  );

  const endMonitoring = useCallback(
    async (agent: FinesseMonitoringAgent) => {
      const supervisorId = cleanValue(supervisorFinesseUserId);
      const supervisorExt = normalizedSupervisorExtension;
      if (!canUseMonitoringApi || teamId == null || !supervisorId || !supervisorExt) {
        throw new Error("Supervisor Finesse context is not available.");
      }
      const session = sessions[agent.loginId];
      setAgentActionLoading(agent.loginId, "end");
      try {
        await finesseEndMonitoring(teamId, supervisorId, {
          supervisorExtension: supervisorExt,
          supervisorMonitorDialogId: session?.supervisorMonitorDialogId,
          targetAgentId: agent.loginId,
          agentExtension: cleanValue(agent.extension),
        });
        setSessions((prev) => {
          const next = { ...prev };
          delete next[agent.loginId];
          return next;
        });
        fetchAgentDialogs(agent).catch(() => undefined);
      } finally {
        setAgentActionLoading(agent.loginId, null);
      }
    },
    [
      canUseMonitoringApi,
      fetchAgentDialogs,
      normalizedSupervisorExtension,
      sessions,
      setAgentActionLoading,
      supervisorFinesseUserId,
      teamId,
    ],
  );

  useEffect(() => {
    if (Object.keys(sessions).length === 0) return;
    setSessions((prev) => {
      let changed = false;
      const next = { ...prev };
      Object.entries(prev).forEach(([agentId, session]) => {
        const dialogs = agentDialogs[agentId] ?? {};
        const hasActiveAgentDialog = getActiveDialogId(dialogs) != null;
        const graceExpired =
          Date.now() - session.monitorStartedAt > MONITOR_START_GRACE_MS;
        if (!hasActiveAgentDialog && graceExpired) {
          delete next[agentId];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [agentDialogs, now, sessions]);

  return {
    monitoredAgentIds,
    handleMonitoringDialogEvent,
    handleSupervisorPreviewEvent,
    getAgentMonitoringState,
    startSilentMonitor,
    barge,
    endMonitoring,
  };
}
