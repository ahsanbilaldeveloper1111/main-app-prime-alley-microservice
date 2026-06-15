import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "next-auth";
import { toast } from "react-toastify";
import {
  getFinesseUserData,
  getEffectiveTeamId,
  sendFinesseDialogAction,
  getFinesseWrapUpReasons,
  getFinesseApiErrorMessage,
} from "@utils/finesse";
import { buildPreviewContactGridRows } from "@utils/finessePreviewContactGrid";
import type { FinessePreviewEvent } from "@hooks/live-calls/useFinesseStomp";
import type { CallVariableConfig } from "@pages/communications/campaign-partials/WrapUp";

export type UseFinesseCampaignPreviewOptions = {
  selectedTeam: string;
  /** Passed to CallWidget (campaign manager uses false). */
  includeTeamRow?: boolean;
  /** When includeTeamRow, e.g. campaign console agent name */
  activeAgentName?: string;
};

function formatPreviewTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

type PreviewParticipant = NonNullable<FinessePreviewEvent["participants"]>[number];

function resolveAgentExtension(session: Session | null): string | undefined {
  const d = getFinesseUserData();
  const u = session?.user as { phone?: string } | undefined;
  return d?.extension ?? u?.phone;
}

function resolvePreviewAgentParticipant(
  dialog: FinessePreviewEvent,
  extension: string | undefined,
): PreviewParticipant | null {
  const participants = dialog.participants ?? [];
  if (!extension) return participants[0] ?? null;
  return (
    participants.find((p) => p.mediaAddress === extension) ??
    participants[0] ??
    null
  );
}

function previewDialogActions(
  dialog: FinessePreviewEvent,
  agentParticipant: PreviewParticipant | null,
): string[] {
  const dialogActions = (dialog as { actions?: string[] }).actions;
  if (Array.isArray(dialogActions) && dialogActions.length > 0) {
    return dialogActions;
  }
  return Array.isArray(agentParticipant?.actions) ? agentParticipant.actions : [];
}

function isWrapUpPreviewState(
  dialog: FinessePreviewEvent,
  agentParticipant: PreviewParticipant | null,
): boolean {
  return (
    agentParticipant?.state === "WRAP_UP" || dialog.dialogState === "WRAP_UP"
  );
}

/** Dedicated call popup — only while the agent leg is ringing or connected. */
function isPreviewCallWidgetVisibleState(
  dialog: FinessePreviewEvent,
  agentParticipant: PreviewParticipant | null,
): boolean {
  if ((dialog as { eventType?: string }).eventType === "ENDED") return false;

  const participantState = agentParticipant?.state;
  const dialogState = dialog.dialogState;

  if (
    participantState === "DROPPED" ||
    participantState === "WRAP_UP" ||
    dialogState === "WRAP_UP" ||
    dialogState === "ENDED"
  ) {
    return false;
  }

  if (participantState === "ALERTING" || dialogState === "ALERTING") return true;
  if (participantState === "ACTIVE" || dialogState === "ACTIVE") return true;
  if (participantState === "HELD") return true;

  return false;
}

/** Preview/ringing before the agent leg is connected — wrap-up must not be offered yet. */
function isPreviewBeforeConnectedCall(
  dialog: FinessePreviewEvent | null | undefined,
  agentParticipant: PreviewParticipant | null,
): boolean {
  if (!dialog) return true;
  if (isWrapUpPreviewState(dialog, agentParticipant)) return false;
  const participantState = agentParticipant?.state;
  const dialogState = dialog.dialogState;
  if (participantState === "ACTIVE" || participantState === "HELD") return false;
  if (dialogState === "ACTIVE") return false;
  return true;
}

function participantSortTime(dialog: FinessePreviewEvent): string {
  const agent = dialog.participants?.[0];
  return agent?.stateChangeTime ?? agent?.startTime ?? "";
}

/**
 * Finesse outbound preview (campaign) dialog: SSE PREVIEW events → CallWidget + WrapUpModal + dialog actions.
 */
export function useFinesseCampaignPreview(
  session: Session | null,
  options: UseFinesseCampaignPreviewOptions,
) {
  const { selectedTeam, includeTeamRow = false, activeAgentName } = options;

  const [previewDialogs, setPreviewDialogs] = useState<
    Record<string, FinessePreviewEvent>
  >({});
  const [showCallWidget, setShowCallWidget] = useState(false);
  const [callStatus, setCallStatus] = useState("Ringing");
  const [previewElapsedSeconds, setPreviewElapsedSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isHold, setIsHold] = useState(false);
  const [holdLoading, setHoldLoading] = useState(false);
  const [isWrapUpOpen, setIsWrapUpOpen] = useState(false);
  const [wrapUpReasons, setWrapUpReasons] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [wrapUpReasonsLoading, setWrapUpReasonsLoading] = useState(false);
  const [callVariablesConfig, setCallVariablesConfig] = useState<
    CallVariableConfig[]
  >([]);
  const [lastSubmittedWrapUpIds, setLastSubmittedWrapUpIds] = useState<
    string[]
  >([]);

  const wrapUpEventDialogIdRef = useRef<string | null>(null);
  /** Dialog kept in state so wrap-up submit still works after preview ENDED. */
  const wrapUpPendingDialogIdRef = useRef<string | null>(null);
  const wrapUpAutoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const handleWrapUpClickRef = useRef<
    (openedFromEndCall?: boolean, openedFromWrapUpEvent?: boolean) => Promise<void>
  >(async () => undefined);
  /** After a Finesse REST error, keep the call popup hidden until the next CREATED preview. */
  const suppressCallWidgetUntilCreatedRef = useRef(false);

  const resetCallWidgetState = useCallback(() => {
    setShowCallWidget(false);
    setPreviewElapsedSeconds(0);
    setCallStatus("Ringing");
    setIsMuted(false);
    setIsHold(false);
  }, []);

  const dismissCallWidgetAfterFinesseError = useCallback(
    (dialogId?: string | number | null) => {
      suppressCallWidgetUntilCreatedRef.current = true;
      if (dialogId != null) {
        const id = String(dialogId);
        setPreviewDialogs((prev) => {
          if (!(id in prev)) return prev;
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
      resetCallWidgetState();
    },
    [resetCallWidgetState],
  );

  const getFinesseContext = useCallback(() => {
    const d = getFinesseUserData();
    const u = session?.user as { phone?: string } | undefined;
    return {
      username: d?.loginId ?? d?.loginName,
      extension: d?.extension ?? u?.phone,
      teamId: getEffectiveTeamId(d),
    };
  }, [session?.user]);

  const agentExtension = useMemo(
    () => resolveAgentExtension(session),
    [session?.user],
  );

  const clearWrapUpSession = useCallback((dialogId?: string | number | null) => {
    wrapUpEventDialogIdRef.current = null;
    wrapUpPendingDialogIdRef.current = null;
    if (dialogId == null) return;
    const id = String(dialogId);
    setPreviewDialogs((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const activePreviewDialog = useMemo(() => {
    const dialogs = Object.values(previewDialogs);
    if (dialogs.length === 0) return null;
    const active = dialogs
      .filter((d) => {
        const id = d.dialogId == null ? "" : String(d.dialogId);
        const agent = resolvePreviewAgentParticipant(d, agentExtension);
        if (agent?.state === "DROPPED") return false;
        if ((d as { eventType?: string }).eventType === "ENDED") {
          return wrapUpPendingDialogIdRef.current === id;
        }
        if (wrapUpPendingDialogIdRef.current === id) return true;
        return true;
      })
      .sort(
        (a, b) =>
          new Date(participantSortTime(b)).getTime() -
          new Date(participantSortTime(a)).getTime(),
      );
    return active[0] ?? null;
  }, [previewDialogs, agentExtension]);

  const activePreviewAgentParticipant = useMemo(() => {
    if (!activePreviewDialog?.dialogId) return null;
    return resolvePreviewAgentParticipant(activePreviewDialog, agentExtension);
  }, [activePreviewDialog, agentExtension]);

  const previewCallVariables = useMemo(() => {
    const p = activePreviewAgentParticipant as {
      callVariables?: Array<{ name?: string; value?: string }>;
    } | null;
    const dialogVars = activePreviewDialog?.callVariables;
    const raw = p?.callVariables ?? dialogVars ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [activePreviewAgentParticipant, activePreviewDialog]);

  const previewContactRows = useMemo(
    () => buildPreviewContactGridRows(previewCallVariables),
    [previewCallVariables],
  );

  const previewCallStateLabel = useMemo(() => {
    if (!activePreviewDialog) return "";
    return (
      activePreviewDialog.dialogState ??
      activePreviewAgentParticipant?.state ??
      ""
    );
  }, [activePreviewDialog, activePreviewAgentParticipant]);

  const previewTimeAnchorMs = useMemo(() => {
    if (!activePreviewAgentParticipant) return null;
    const iso =
      activePreviewAgentParticipant.startTime ??
      activePreviewAgentParticipant.stateChangeTime;
    if (!iso) return null;
    const t = Date.parse(String(iso));
    return Number.isFinite(t) ? t : null;
  }, [activePreviewAgentParticipant]);

  const handlePreviewEvent = useCallback((payload: FinessePreviewEvent) => {
    if (payload?.dialogId == null) return;
    const eventType = (payload as { eventType?: string }).eventType;
    const dialogId = String(payload.dialogId);
    if (eventType === "CREATED") {
      suppressCallWidgetUntilCreatedRef.current = false;
      setPreviewDialogs((prev) => ({ ...prev, [dialogId]: payload }));
      setLastSubmittedWrapUpIds([]);
    } else if (eventType === "UPDATED") {
      let mergedDialog: FinessePreviewEvent = payload;
      setPreviewDialogs((prev) => {
        const existing = prev[dialogId];
        if (existing) {
          mergedDialog = {
            ...existing,
            ...payload,
            callVariables: payload.callVariables ?? existing.callVariables,
            participants: payload.participants ?? existing.participants,
          };
          return { ...prev, [dialogId]: mergedDialog };
        }
        return { ...prev, [dialogId]: payload };
      });
      const agent = resolvePreviewAgentParticipant(mergedDialog, agentExtension);
      if (!isPreviewCallWidgetVisibleState(mergedDialog, agent)) {
        setShowCallWidget(false);
      }
    } else if (eventType === "ENDED") {
      if (wrapUpPendingDialogIdRef.current === dialogId) {
        setShowCallWidget(false);
        setPreviewDialogs((prev) => {
          const existing = prev[dialogId];
          return {
            ...prev,
            [dialogId]: {
              ...(existing ?? payload),
              ...payload,
              eventType: "ENDED",
            },
          };
        });
        return;
      }
      if (wrapUpEventDialogIdRef.current === dialogId) {
        wrapUpEventDialogIdRef.current = null;
      }
      setLastSubmittedWrapUpIds([]);
      setPreviewDialogs((prev) => {
        const next = { ...prev };
        delete next[dialogId];
        return next;
      });
    }
  }, [agentExtension]);

  useEffect(() => {
    if (suppressCallWidgetUntilCreatedRef.current) {
      setShowCallWidget(false);
      return;
    }
    if (!activePreviewDialog?.dialogId) {
      setShowCallWidget(false);
      return;
    }
    const participant = activePreviewAgentParticipant;
    if (!isPreviewCallWidgetVisibleState(activePreviewDialog, participant)) {
      setShowCallWidget(false);
      return;
    }

    const dialogState = activePreviewDialog.dialogState ?? participant?.state;
    const isAlerting =
      dialogState === "ALERTING" || participant?.state === "ALERTING";
    const isActive =
      dialogState === "ACTIVE" || participant?.state === "ACTIVE";
    const isHeld = participant?.state === "HELD";
    setShowCallWidget(true);
    if (isAlerting) {
      setCallStatus("Ringing");
    } else if (isActive || isHeld) {
      setCallStatus("Connected");
      setIsHold(isHeld);
    }
  }, [
    activePreviewDialog?.dialogId,
    activePreviewDialog?.dialogState,
    activePreviewAgentParticipant,
  ]);

  useEffect(() => {
    if (previewTimeAnchorMs == null || !showCallWidget) {
      setPreviewElapsedSeconds(0);
      return;
    }
    const tick = () => {
      setPreviewElapsedSeconds(
        Math.max(0, Math.floor((Date.now() - previewTimeAnchorMs) / 1000)),
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [previewTimeAnchorMs, showCallWidget]);

  const handleAcceptCall = async () => {
    const { username, extension, teamId } = getFinesseContext();
    const dialogId = activePreviewDialog?.dialogId;
    if (username && extension && dialogId && teamId != null) {
      try {
        await sendFinesseDialogAction(teamId, username, String(dialogId), {
          extension: String(extension),
          action: "ACCEPT",
        });
        setCallStatus("Connected");
      } catch {
        toast.error("Issue establishing the call. Skipping...");
        dismissCallWidgetAfterFinesseError(dialogId);
      }
    } else {
      setCallStatus("Connected");
    }
  };

  const handleRejectCall = async () => {
    const { username, extension, teamId } = getFinesseContext();
    const dialogId = activePreviewDialog?.dialogId;
    if (username && extension && dialogId && teamId != null) {
      try {
        await sendFinesseDialogAction(teamId, username, String(dialogId), {
          extension: String(extension),
          action: "REJECT",
        });
      } catch (err: unknown) {
        toast.error(getFinesseApiErrorMessage(err, "Failed to reject call"));
        dismissCallWidgetAfterFinesseError(dialogId);
      }
    }
    setShowCallWidget(false);
    setPreviewElapsedSeconds(0);
    setCallStatus("Ringing");
  };

  const handleRejectOrClose = async (action: "REJECT" | "CLOSE") => {
    const { username, extension, teamId } = getFinesseContext();
    const dialogId = activePreviewDialog?.dialogId;
    if (username && extension && dialogId && teamId != null) {
      try {
        await sendFinesseDialogAction(teamId, username, String(dialogId), {
          extension: String(extension),
          action,
        });
      } catch (err: unknown) {
        toast.error(
          getFinesseApiErrorMessage(err, `Failed to ${action.toLowerCase()} call`),
        );
        dismissCallWidgetAfterFinesseError(dialogId);
      }
    }
    setShowCallWidget(false);
    setPreviewElapsedSeconds(0);
    setCallStatus("Ringing");
  };

  const handlePreviewReclassify = useCallback(async () => {
    const { username, extension, teamId } = getFinesseContext();
    const dialogId = activePreviewDialog?.dialogId;
    if (!username || !extension || dialogId == null || teamId == null) {
      toast.error("Cannot reclassify: missing user or dialog.");
      return;
    }
    const raw =
      globalThis.window === undefined
        ? null
        : globalThis.window.prompt(
            "Reclassify parameter (if required by your dialer):",
            "",
          );
    if (raw === null) return;
    const actionParam = raw.trim() === "" ? undefined : raw.trim();
    try {
      await sendFinesseDialogAction(teamId, username, String(dialogId), {
        extension: String(extension),
        action: "RECLASSIFY",
        actionParam: actionParam ?? null,
      });
      toast.success("Reclassify sent.");
    } catch (err: unknown) {
      toast.error(getFinesseApiErrorMessage(err, "Failed to reclassify."));
      dismissCallWidgetAfterFinesseError(dialogId);
    }
  }, [
    getFinesseContext,
    activePreviewDialog?.dialogId,
    dismissCallWidgetAfterFinesseError,
  ]);

  const requestWrapUpModal = useCallback(
    async (dialogId: string | number, openedFromWrapUpEvent = true) => {
      const dialogKey = String(dialogId);
      if (wrapUpEventDialogIdRef.current === dialogKey) return;
      wrapUpEventDialogIdRef.current = dialogKey;
      wrapUpPendingDialogIdRef.current = dialogKey;
      setShowCallWidget(false);
      await handleWrapUpClickRef.current(false, openedFromWrapUpEvent);
    },
    [],
  );

  const handleEndCall = async () => {
    const { username, extension, teamId } = getFinesseContext();
    const dialogId = activePreviewDialog?.dialogId;
    if (username && extension && dialogId && teamId != null) {
      try {
        await sendFinesseDialogAction(teamId, username, String(dialogId), {
          extension: String(extension),
          action: "DROP",
        });
        await requestWrapUpModal(dialogId, true);
      } catch (err: unknown) {
        toast.error(getFinesseApiErrorMessage(err, "Failed to end call"));
        dismissCallWidgetAfterFinesseError(dialogId);
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
          action: hold ? "HOLD" : "RETRIEVE",
        });
        setIsHold(hold);
        toast.success(hold ? "Call on hold" : "Call resumed");
      } catch (err: unknown) {
        toast.error(
          getFinesseApiErrorMessage(
            err,
            hold ? "Failed to hold" : "Failed to resume",
          ),
        );
        dismissCallWidgetAfterFinesseError(dialogId);
      } finally {
        setHoldLoading(false);
      }
    }
  };

  const handleWrapUpSubmit = async (data: {
    wrapUp: string | string[];
    variables: Record<string, string>;
  }) => {
    const { username, extension, teamId } = getFinesseContext();
    const dialogId =
      wrapUpPendingDialogIdRef.current ?? activePreviewDialog?.dialogId;
    if (
      isPreviewBeforeConnectedCall(
        activePreviewDialog,
        activePreviewAgentParticipant,
      ) &&
      wrapUpPendingDialogIdRef.current == null
    ) {
      toast.warn("Wrap-up reasons can only be added while on a call.");
      return;
    }
    if (username && extension && dialogId && teamId != null) {
      const reasons = Array.isArray(data.wrapUp) ? data.wrapUp : [data.wrapUp];
      setLastSubmittedWrapUpIds(reasons.map(String));
      const wrapUpItems: string[] = reasons.map((idOrValue) => {
        const option = wrapUpReasons.find((o) => o.value === String(idOrValue));
        return option ? option.label : String(idOrValue ?? "");
      });
      try {
        await sendFinesseDialogAction(teamId, username, String(dialogId), {
          extension: String(extension),
          action: "UPDATE_CALL_DATA",
          wrapUpItems,
        });
        toast.success("Wrap up submitted.");
      } catch (err: unknown) {
        toast.error(getFinesseApiErrorMessage(err, "Failed to submit wrap up"));
        dismissCallWidgetAfterFinesseError(dialogId);
      }
    }
    if (wrapUpAutoCloseTimerRef.current) {
      clearTimeout(wrapUpAutoCloseTimerRef.current);
      wrapUpAutoCloseTimerRef.current = null;
    }
    setIsWrapUpOpen(false);
    clearWrapUpSession(dialogId);
  };

  const handleWrapUpMinimize = () => setIsWrapUpOpen(false);

  const startWrapUpAutoCloseTimer = useCallback(() => {
    if (wrapUpAutoCloseTimerRef.current)
      clearTimeout(wrapUpAutoCloseTimerRef.current);
    const seconds = getFinesseUserData()?.wrapUpTimer ?? 10;
    wrapUpAutoCloseTimerRef.current = setTimeout(() => {
      setIsWrapUpOpen(false);
      wrapUpAutoCloseTimerRef.current = null;
    }, seconds * 1000);
  }, []);

  const handleWrapUpClick = async (
    _openedFromEndCall?: boolean,
    openedFromWrapUpEvent?: boolean,
  ) => {
    if (
      !openedFromWrapUpEvent &&
      isPreviewBeforeConnectedCall(
        activePreviewDialog,
        activePreviewAgentParticipant,
      )
    ) {
      toast.warn("Wrap-up reasons can only be added while on a call.");
      return;
    }
    const dialogId =
      wrapUpPendingDialogIdRef.current ?? activePreviewDialog?.dialogId;
    if (dialogId != null) {
      const dialogKey = String(dialogId);
      wrapUpPendingDialogIdRef.current = dialogKey;
      wrapUpEventDialogIdRef.current = dialogKey;
    }
    const { username, teamId } = getFinesseContext();
    if (!username || teamId == null) {
      toast.error("User not found.");
      return;
    }
    setWrapUpReasonsLoading(true);
    try {
      const response = await getFinesseWrapUpReasons(teamId, username);
      const raw = response?.responseData ?? response?.data ?? response;
      const list = Array.isArray(raw)
        ? raw
        : (raw?.wrapUpReasons ?? raw?.reasonCodes ?? raw?.reasons ?? []);
      const options: Array<{ value: string; label: string }> = list.map(
        (item: {
          uri?: string;
          id?: number;
          code?: string;
          label?: string;
          name?: string;
        }) => {
          const idFromUri =
            typeof item.uri === "string"
              ? item.uri.split("/").findLast(Boolean)
              : undefined;
          const value = String(
            idFromUri ?? item.id ?? item.code ?? item.label ?? item.name ?? "",
          );
          const label = String(
            item.label ?? item.name ?? item.code ?? value ?? "—",
          );
          return { value, label };
        },
      );
      const reasonsToShow = options.length
        ? options
        : [{ value: "other", label: "Other" }];
      setWrapUpReasons(reasonsToShow);
      const data = response?.responseData ?? response?.data ?? response;
      const callVarsRaw =
        (
          data as {
            callVariables?: Array<{
              key?: string;
              name?: string;
              label?: string;
            }>;
          }
        )?.callVariables ??
        (
          data as {
            variables?: Array<{ key?: string; name?: string; label?: string }>;
          }
        )?.variables ??
        (
          data as {
            callVariableDefinitions?: Array<{
              key?: string;
              name?: string;
              label?: string;
            }>;
          }
        )?.callVariableDefinitions;
      const callVarConfig: CallVariableConfig[] = Array.isArray(callVarsRaw)
        ? callVarsRaw
            .map((v: { key?: string; name?: string; label?: string }) => ({
              key: String(v.key ?? v.name ?? ""),
              label: String(v.label ?? v.name ?? v.key ?? "—"),
            }))
            .filter((v: CallVariableConfig) => v.key)
        : [];
      setCallVariablesConfig(callVarConfig);
      setTimeout(() => {
        setIsWrapUpOpen(true);
        if (openedFromWrapUpEvent) startWrapUpAutoCloseTimer();
      }, 0);
    } catch (err) {
      toast.error(getFinesseApiErrorMessage(err, "Failed to load wrap-up reasons."));
      setWrapUpReasons([{ value: "other", label: "Other" }]);
      setCallVariablesConfig([]);
      setTimeout(() => {
        setIsWrapUpOpen(true);
        if (openedFromWrapUpEvent) startWrapUpAutoCloseTimer();
      }, 0);
    } finally {
      setWrapUpReasonsLoading(false);
    }
  };

  handleWrapUpClickRef.current = handleWrapUpClick;

  useEffect(() => {
    if (suppressCallWidgetUntilCreatedRef.current) return;
    if (!activePreviewDialog?.dialogId) return;

    const participant = activePreviewAgentParticipant;
    if (!isWrapUpPreviewState(activePreviewDialog, participant)) return;

    requestWrapUpModal(activePreviewDialog.dialogId, true);
  }, [
    activePreviewDialog?.dialogId,
    activePreviewDialog?.dialogState,
    activePreviewAgentParticipant?.state,
    requestWrapUpModal,
  ]);

  const wrapUpOnClose = useCallback(() => {
    if (wrapUpAutoCloseTimerRef.current) {
      clearTimeout(wrapUpAutoCloseTimerRef.current);
      wrapUpAutoCloseTimerRef.current = null;
    }
    const dialogId =
      wrapUpPendingDialogIdRef.current ?? activePreviewDialog?.dialogId;
    setIsWrapUpOpen(false);
    clearWrapUpSession(dialogId);
    resetCallWidgetState();
  }, [activePreviewDialog?.dialogId, clearWrapUpSession, resetCallWidgetState]);

  return {
    handlePreviewEvent,
    /** Same shape as previous inline helpers: username, extension, teamId */
    getFinesseContext,
    formatPreviewTime,
    activePreviewDialog,
    callWidgetProps: {
      showCallWidget,
      setShowCallWidget,
      callStatus,
      elapsedSeconds: previewElapsedSeconds,
      isMuted,
      setIsMuted,
      isHold,
      setIsHold,
      handleAcceptCall,
      handleRejectCall,
      handleEndCall,
      formatTime: formatPreviewTime,
      selectedTeam,
      includeTeamRow,
      activeAgentName,
      campaignName: activePreviewDialog?.campaignName,
      customerNumber: activePreviewDialog?.customerNumber,
      dialedNumber:
        activePreviewDialog?.dialedNumber ?? activePreviewDialog?.fromAddress,
      previewStateLabel: previewCallStateLabel,
      previewContactRows,
      previewActions: activePreviewDialog
        ? previewDialogActions(
            activePreviewDialog,
            activePreviewAgentParticipant,
          )
        : [],
      onRejectWithAction: handleRejectOrClose,
      onReclassify: handlePreviewReclassify,
      onWrapUpClick:
        callStatus === "Ringing" ? undefined : handleWrapUpClick,
      wrapUpLoading: wrapUpReasonsLoading,
      onHoldToggle: handleHoldToggle,
      holdLoading,
    },
    wrapUpModalProps: {
      isOpen: isWrapUpOpen,
      onClose: wrapUpOnClose,
      onSubmit: handleWrapUpSubmit,
      onMinimize: handleWrapUpMinimize,
      wrapUpReasons,
      callVariablesConfig,
      initialSelectedWrapUpIds: lastSubmittedWrapUpIds,
    },
    wrapUpAutoCloseTimerRef,
    resetCallWidgetState,
  };
}
