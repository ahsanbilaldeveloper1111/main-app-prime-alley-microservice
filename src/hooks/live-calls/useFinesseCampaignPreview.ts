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
  const wrapUpAutoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
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

  const activePreviewDialog = useMemo(() => {
    const dialogs = Object.values(previewDialogs);
    if (dialogs.length === 0) return null;
    const active = dialogs
      .filter((d) => {
        if ((d as { eventType?: string }).eventType === "ENDED") return false;
        const p = d.participants?.[0];
        if (p?.state === "DROPPED") return false;
        return true;
      })
      .sort((a, b) => {
        const timeA =
          a.participants?.[0]?.stateChangeTime ??
          a.participants?.[0]?.startTime ??
          "";
        const timeB =
          b.participants?.[0]?.stateChangeTime ??
          b.participants?.[0]?.startTime ??
          "";
        return new Date(timeB).getTime() - new Date(timeA).getTime();
      });
    return active[0] ?? null;
  }, [previewDialogs]);

  const activePreviewAgentParticipant = useMemo(() => {
    if (!activePreviewDialog?.dialogId) return null;
    const d = getFinesseUserData();
    const u = session?.user as { phone?: string } | undefined;
    const extension = d?.extension ?? u?.phone;
    const participants = activePreviewDialog.participants ?? [];
    const match = participants.find(
      (p) => (p as { mediaAddress?: string }).mediaAddress === extension,
    );
    return match ?? participants[0] ?? null;
  }, [activePreviewDialog, session?.user]);

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
      setPreviewDialogs((prev) => ({ ...prev, [dialogId]: payload }));
      setLastSubmittedWrapUpIds([]);
    } else if (eventType === "UPDATED") {
      setPreviewDialogs((prev) => {
        const existing = prev[dialogId];
        if (existing) {
          return {
            ...prev,
            [dialogId]: {
              ...existing,
              ...payload,
              callVariables: payload.callVariables ?? existing.callVariables,
              participants: payload.participants ?? existing.participants,
            },
          };
        }
        return { ...prev, [dialogId]: payload };
      });
    } else if (eventType === "ENDED") {
      if (wrapUpEventDialogIdRef.current === dialogId)
        wrapUpEventDialogIdRef.current = null;
      setLastSubmittedWrapUpIds([]);
      setPreviewDialogs((prev) => {
        const next = { ...prev };
        delete next[dialogId];
        return next;
      });
    }
  }, []);

  useEffect(() => {
    if (!activePreviewDialog?.dialogId) {
      setShowCallWidget(false);
      return;
    }
    const participant = activePreviewAgentParticipant;
    const dialogState = activePreviewDialog.dialogState ?? participant?.state;
    const isAlerting =
      dialogState === "ALERTING" || participant?.state === "ALERTING";
    const isActive =
      dialogState === "ACTIVE" || participant?.state === "ACTIVE";
    const isHeld = participant?.state === "HELD";
    const hasUpdateCallData =
      Array.isArray(participant?.actions) &&
      (participant as { actions?: string[] }).actions?.includes(
        "UPDATE_CALL_DATA",
      );
    const isWrapUpState = participant?.state === "WRAP_UP" && hasUpdateCallData;
    setShowCallWidget(true);
    if (isAlerting) {
      setCallStatus("Ringing");
    } else if (isWrapUpState) {
      setCallStatus("Wrap up");
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
      } catch (err: unknown) {
        toast.error(
          (
            err as {
              response?: { data?: { message?: string } };
              message?: string;
            }
          )?.response?.data?.message ??
            (err as Error)?.message ??
            "Failed to accept call",
        );
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
        toast.error(
          (
            err as {
              response?: { data?: { message?: string } };
              message?: string;
            }
          )?.response?.data?.message ??
            (err as Error)?.message ??
            "Failed to reject call",
        );
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
          (
            err as {
              response?: { data?: { message?: string } };
              message?: string;
            }
          )?.response?.data?.message ??
            (err as Error)?.message ??
            `Failed to ${action.toLowerCase()} call`,
        );
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
    }
  }, [getFinesseContext, activePreviewDialog?.dialogId]);

  const resetCallWidgetState = useCallback(() => {
    setShowCallWidget(false);
    setPreviewElapsedSeconds(0);
    setCallStatus("Ringing");
    setIsMuted(false);
    setIsHold(false);
  }, []);

  const handleEndCall = async () => {
    const { username, extension, teamId } = getFinesseContext();
    const dialogId = activePreviewDialog?.dialogId;
    if (username && extension && dialogId && teamId != null) {
      try {
        await sendFinesseDialogAction(teamId, username, String(dialogId), {
          extension: String(extension),
          action: "DROP",
        });
      } catch (err: unknown) {
        toast.error(
          (
            err as {
              response?: { data?: { message?: string } };
              message?: string;
            }
          )?.response?.data?.message ??
            (err as Error)?.message ??
            "Failed to end call",
        );
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
          (
            err as {
              response?: { data?: { message?: string } };
              message?: string;
            }
          )?.response?.data?.message ??
            (err as Error)?.message ??
            (hold ? "Failed to hold" : "Failed to resume"),
        );
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
    const dialogId = activePreviewDialog?.dialogId;
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
        toast.error(
          (
            err as {
              response?: { data?: { message?: string } };
              message?: string;
            }
          )?.response?.data?.message ??
            (err as Error)?.message ??
            "Failed to submit wrap up",
        );
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
      toast.error(
        (
          err as {
            response?: { data?: { message?: string } };
            message?: string;
          }
        )?.response?.data?.message ??
          (err as Error)?.message ??
          "Failed to load wrap-up reasons.",
      );
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

  const wrapUpOnClose = useCallback(() => {
    if (wrapUpAutoCloseTimerRef.current) {
      clearTimeout(wrapUpAutoCloseTimerRef.current);
      wrapUpAutoCloseTimerRef.current = null;
    }
    setIsWrapUpOpen(false);
    resetCallWidgetState();
  }, [resetCallWidgetState]);

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
      previewActions:
        activePreviewAgentParticipant?.actions ??
        activePreviewDialog?.participants?.[0]?.actions,
      onRejectWithAction: handleRejectOrClose,
      onReclassify: handlePreviewReclassify,
      onWrapUpClick: handleWrapUpClick,
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
