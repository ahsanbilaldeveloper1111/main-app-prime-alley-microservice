/**
 * Detects likely gaps in the CTI SSE stream and schedules a soft state refresh
 * (`initial-state` + `ongoing-calls`) before forcing a full SSE reconnect.
 *
 * Use when call_events may have been dropped (sequence jump, missed pings, reconnect).
 */

export const CTI_STREAM_MISSED_EVENT_DEFAULTS = {
  /** Server keep-alive is ~4s; treat as stale after ~3 missed pings. */
  PING_STALE_MS: 12_000,
  /** Minimum gap between soft recovery publishes. */
  SOFT_RECOVERY_THROTTLE_MS: 3_000,
  /** Sequence increase larger than this triggers recovery (per callId). */
  MAX_SEQUENCE_JUMP: 1,
  /** How many recent call_events to scan when inferring sequence gaps. */
  RECENT_EVENT_SCAN: 50,
} as const;

export type CtiStreamGapReason =
  | "sequence_gap"
  | "ping_stale"
  | "post_reconnect";

export type CtiStreamGapDetection = {
  reason: CtiStreamGapReason;
  callId?: string;
  detail: string;
};

export type CtiStreamMissedEventRecoveryOptions = {
  publish: (destination: string, body?: string) => void | Promise<boolean>;
  onGapDetected?: (detection: CtiStreamGapDetection) => void;
  throttleMs?: number;
  pingStaleMs?: number;
  logPrefix?: string;
};

type SequenceRecord = {
  lastSequence: number;
  lastEventTimeMs: number;
};

/**
 * Stateful tracker + soft recovery scheduler for one CTI SSE connection (master tab).
 */
export class CtiStreamMissedEventRecovery {
  private readonly publish: CtiStreamMissedEventRecoveryOptions["publish"];
  private readonly onGapDetected?: CtiStreamMissedEventRecoveryOptions["onGapDetected"];
  private readonly throttleMs: number;
  private readonly pingStaleMs: number;
  private readonly logPrefix: string;

  private lastPingAtMs = Date.now();
  private lastSoftRecoveryAtMs = 0;
  private readonly sequenceByCallId = new Map<string, SequenceRecord>();
  private pendingRecoveryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: CtiStreamMissedEventRecoveryOptions) {
    this.publish = options.publish;
    this.onGapDetected = options.onGapDetected;
    this.throttleMs =
      options.throttleMs ?? CTI_STREAM_MISSED_EVENT_DEFAULTS.SOFT_RECOVERY_THROTTLE_MS;
    this.pingStaleMs =
      options.pingStaleMs ?? CTI_STREAM_MISSED_EVENT_DEFAULTS.PING_STALE_MS;
    this.logPrefix = options.logPrefix ?? "[CtiStreamMissedEvent]";
  }

  reset(): void {
    this.lastPingAtMs = Date.now();
    this.lastSoftRecoveryAtMs = 0;
    this.sequenceByCallId.clear();
    if (this.pendingRecoveryTimer) {
      clearTimeout(this.pendingRecoveryTimer);
      this.pendingRecoveryTimer = null;
    }
  }

  markPingReceived(atMs: number = Date.now()): void {
    this.lastPingAtMs = atMs;
  }

  markOngoingCallsReceived(atMs: number = Date.now()): void {
    this.lastPingAtMs = atMs;
  }

  markStompConnected(): void {
    this.scheduleSoftRecovery("post_reconnect", "STOMP connected — resync call state");
  }

  /**
   * Records a call_events payload; returns a gap detection when sequence jumps.
   */
  inspectCallEvent(evt: {
    callId?: string;
    sequence?: number;
    eventTime?: string;
  }): CtiStreamGapDetection | null {
    const callId = evt.callId;
    const sequence = evt.sequence;
    if (!callId || sequence == null || !Number.isFinite(sequence)) {
      return null;
    }

    const eventTimeMs = evt.eventTime
      ? new Date(evt.eventTime).getTime()
      : Date.now();
    const prev = this.sequenceByCallId.get(callId);
    this.sequenceByCallId.set(callId, {
      lastSequence: sequence,
      lastEventTimeMs: Number.isFinite(eventTimeMs) ? eventTimeMs : Date.now(),
    });

    if (!prev) {
      return null;
    }

    const jump = sequence - prev.lastSequence;
    if (jump <= CTI_STREAM_MISSED_EVENT_DEFAULTS.MAX_SEQUENCE_JUMP) {
      return null;
    }

    const detection: CtiStreamGapDetection = {
      reason: "sequence_gap",
      callId,
      detail: `sequence jumped ${prev.lastSequence} → ${sequence} (Δ${jump})`,
    };
    this.handleGap(detection);
    return detection;
  }

  /**
   * Call from SSE health tick when connection is OPEN but pings are stale.
   * Returns true if soft recovery was scheduled.
   */
  runPingStaleCheck(now: number = Date.now()): boolean {
    const elapsed = now - this.lastPingAtMs;
    if (elapsed <= this.pingStaleMs) {
      return false;
    }
    const detection: CtiStreamGapDetection = {
      reason: "ping_stale",
      detail: `no ping or state message for ${Math.round(elapsed / 1000)}s`,
    };
    this.handleGap(detection);
    return true;
  }

  private handleGap(detection: CtiStreamGapDetection): void {
    console.warn(`${this.logPrefix} gap detected`, detection);
    this.onGapDetected?.(detection);
    this.scheduleSoftRecovery(detection.reason, detection.detail);
  }

  private scheduleSoftRecovery(reason: CtiStreamGapReason, detail: string): void {
    const now = Date.now();
    if (now - this.lastSoftRecoveryAtMs < this.throttleMs) {
      return;
    }
    if (this.pendingRecoveryTimer) {
      return;
    }

    this.pendingRecoveryTimer = setTimeout(() => {
      this.pendingRecoveryTimer = null;
      this.lastSoftRecoveryAtMs = Date.now();
      this.lastPingAtMs = Date.now();
      console.log(`${this.logPrefix} soft recovery`, { reason, detail });
      void this.publish("/app/request/initial-state", "");
      void this.publish("/app/request/ongoing-calls", "");
    }, 200);
  }
}

/** Factory for useCtiStomp — one recovery instance per hook / global connection. */
export function createCtiStreamMissedEventRecovery(
  options: CtiStreamMissedEventRecoveryOptions,
): CtiStreamMissedEventRecovery {
  return new CtiStreamMissedEventRecovery(options);
}
