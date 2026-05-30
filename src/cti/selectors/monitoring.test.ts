import { describe, it, expect } from "vitest";
import {
  getMonitoringSessionsForSupervisor,
  getMonitoringInfoForMonitoredDn,
  supervisorIsBargedIn,
  agentIsBeingSilentlyMonitored,
  isBargeInType,
} from "./monitoring";
import type { CtiCallEvent, CtiCallStateMap } from "../types";

const makeMonitoringCall = (
  callId: string,
  monitorDn: string,
  monitoredDn: string,
  monitoringType = "SILENT",
  isTerminating = false,
): CtiCallEvent => ({
  callId,
  eventType: "CONNECTED",
  sequence: 1,
  eventTime: "2026-01-01T10:00:00.000Z",
  isConference: false,
  isOneToOne: false,
  isTerminating,
  hasActiveParticipants: true,
  isMonitoring: true,
  eventName: "CallConnected",
  currentState: "CONNECTED",
  monitoring: { monitoringType, monitorDn, monitoredDn },
  parties: [
    { callStatus: "CONNECTED", callingAddress: monitorDn, calledAddress: monitoredDn },
  ],
});

describe("isBargeInType", () => {
  it.each(["BARGE_IN", "BARGE-IN", "BARGEIN", "barge_in", "barge-in"])("returns true for %s", (t) => {
    expect(isBargeInType(t)).toBe(true);
  });

  it.each(["SILENT", "WHISPER", undefined, ""])("returns false for %s", (t) => {
    expect(isBargeInType(t)).toBe(false);
  });
});

describe("getMonitoringSessionsForSupervisor", () => {
  const map: CtiCallStateMap = {
    "MON-001": makeMonitoringCall("MON-001", "9001", "1001", "SILENT"),
    "MON-002": makeMonitoringCall("MON-002", "9001", "1002", "WHISPER"),
    "MON-003": makeMonitoringCall("MON-003", "9002", "1003", "SILENT"),
    "MON-004": makeMonitoringCall("MON-004", "9001", "1004", "SILENT", true), // terminating
  };

  it("returns all non-terminating sessions for supervisor 9001", () => {
    const sessions = getMonitoringSessionsForSupervisor("9001", map);
    expect(sessions).toHaveLength(2);
    expect(sessions.map((s) => s.callId).sort()).toEqual(["MON-001", "MON-002"]);
  });

  it("returns empty for supervisor with no sessions", () => {
    expect(getMonitoringSessionsForSupervisor("9999", map)).toHaveLength(0);
  });

  it("does not include terminating sessions", () => {
    const sessions = getMonitoringSessionsForSupervisor("9001", map);
    expect(sessions.find((s) => s.callId === "MON-004")).toBeUndefined();
  });
});

describe("getMonitoringInfoForMonitoredDn", () => {
  const map: CtiCallStateMap = {
    "MON-001": makeMonitoringCall("MON-001", "9001", "1001", "SILENT"),
  };

  it("returns monitoring info when agent is monitored", () => {
    const info = getMonitoringInfoForMonitoredDn("1001", map);
    expect(info).not.toBeNull();
    expect(info?.monitoringType).toBe("SILENT");
    expect(info?.monitorDn).toBe("9001");
  });

  it("returns null when agent is not monitored", () => {
    expect(getMonitoringInfoForMonitoredDn("2002", map)).toBeNull();
  });
});

describe("supervisorIsBargedIn", () => {
  it("returns true when supervisor has a barge-in session", () => {
    const map: CtiCallStateMap = {
      "MON-001": makeMonitoringCall("MON-001", "9001", "1001", "BARGE_IN"),
    };
    expect(supervisorIsBargedIn("9001", map)).toBe(true);
  });

  it("returns false when supervisor has only a silent session", () => {
    const map: CtiCallStateMap = {
      "MON-001": makeMonitoringCall("MON-001", "9001", "1001", "SILENT"),
    };
    expect(supervisorIsBargedIn("9001", map)).toBe(false);
  });
});

describe("agentIsBeingSilentlyMonitored", () => {
  it("returns true when agent has silent monitoring", () => {
    const map: CtiCallStateMap = {
      "MON-001": makeMonitoringCall("MON-001", "9001", "1001", "SILENT"),
    };
    expect(agentIsBeingSilentlyMonitored("1001", map)).toBe(true);
  });

  it("returns false when agent has barge-in (not silent)", () => {
    const map: CtiCallStateMap = {
      "MON-001": makeMonitoringCall("MON-001", "9001", "1001", "BARGE_IN"),
    };
    expect(agentIsBeingSilentlyMonitored("1001", map)).toBe(false);
  });

  it("returns false when agent has no monitoring", () => {
    expect(agentIsBeingSilentlyMonitored("1001", {})).toBe(false);
  });
});
