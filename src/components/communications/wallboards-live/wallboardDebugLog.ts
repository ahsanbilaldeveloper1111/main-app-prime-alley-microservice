/** Normalized supervision channel flags for debug payloads (SILENT / WHISPER / BARGE_IN). */
export function wallboardDebugChannelFlags(
  monitoringType: string | null | undefined,
): {
  monitoringType: string | null;
  channel: string | null;
  isSilent: boolean;
  isWhisper: boolean;
  isBarge: boolean;
} {
  const channel = String(monitoringType ?? "")
    .trim()
    .toUpperCase()
    .replaceAll("-", "_");
  return {
    monitoringType: monitoringType ?? null,
    channel: channel || null,
    isSilent: channel === "SILENT",
    isWhisper: channel === "WHISPER",
    isBarge: channel === "BARGE_IN" || channel === "BARGEIN",
  };
}

export function wallboardDebugInvolvesSilent(
  ...types: Array<string | null | undefined>
): boolean {
  return types.some((t) => wallboardDebugChannelFlags(t).isSilent);
}

/** Merges channel flags for active + incoming types (SILENT switch debugging). */
export function wallboardDebugSupervisionTransition(
  prevType: string | null | undefined,
  nextType: string | null | undefined,
): Record<string, unknown> {
  return {
    prev: wallboardDebugChannelFlags(prevType),
    next: wallboardDebugChannelFlags(nextType),
    crossChannel:
      Boolean(prevType && nextType) &&
      wallboardDebugChannelFlags(prevType).channel !==
        wallboardDebugChannelFlags(nextType).channel,
    involvesSilent: wallboardDebugInvolvesSilent(prevType, nextType),
  };
}

/** Debug-mode NDJSON logging for wallboard supervision (session 8bce45). */
export function wallboardDebugLog(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>,
  runId = "pre-fix",
): void {
  // #region agent log
  fetch("http://127.0.0.1:7304/ingest/018bbd1f-52ad-440c-99ca-dcd51835655f", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "8bce45",
    },
    body: JSON.stringify({
      sessionId: "8bce45",
      runId,
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

export function summarizeMonitoringCallStateMap(
  callStateMap: Record<string, unknown> | undefined,
): Array<{ key: string; type: string | null; sequence: number | null; isMonitoring: boolean }> {
  if (!callStateMap) {
    return [];
  }
  const out: Array<{
    key: string;
    type: string | null;
    sequence: number | null;
    isMonitoring: boolean;
  }> = [];
  for (const [key, raw] of Object.entries(callStateMap)) {
    if (!raw || typeof raw !== "object") {
      continue;
    }
    const c = raw as {
      isMonitoring?: boolean;
      sequence?: number;
      monitoring?: { monitoringType?: string };
    };
    if (c.isMonitoring !== true && !c.monitoring?.monitoringType) {
      continue;
    }
    out.push({
      key,
      type: c.monitoring?.monitoringType ?? null,
      sequence: c.sequence ?? null,
      isMonitoring: c.isMonitoring === true,
    });
  }
  return out;
}
