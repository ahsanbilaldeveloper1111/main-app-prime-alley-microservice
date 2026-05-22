import { describe, it, expect, vi } from "vitest";
import { applyCallEvent } from "./applyCallEvent";
import type { CtiCallEvent, CtiCallStateMap, CtiDnsMap } from "../types";

const dnsMap: CtiDnsMap = {
  "9001": {
    dn: "9001",
    devices: { SUP: { dn: "9001", deviceName: "SUP", deviceType: "IP_PHONE", status: "online", terminalState: "idle" } },
  },
  "1001": {
    dn: "1001",
    devices: { AGT: { dn: "1001", deviceName: "AGT", deviceType: "IP_PHONE", status: "online", terminalState: "idle" } },
  },
};

const monitoringEndedEvent = (
  overrides: Partial<CtiCallEvent> = {},
): CtiCallEvent => ({
  callId: "agent-call-001",
  eventType: "MONITORING_ENDED",
  sequence: 42,
  eventTime: "2026-05-22T12:00:00.000Z",
  isConference: false,
  isOneToOne: true,
  isTerminating: false,
  hasActiveParticipants: true,
  eventName: "MonitoringEndedEvImpl",
  isMonitoring: false,
  monitoring: {
    monitorDn: "9001",
    monitoredDn: "1001",
    monitoringType: "BARGE_IN",
  },
  parties: [
    {
      callStatus: "CONNECTED",
      callingAddress: "1001",
      calledAddress: "+15551234567",
    },
  ],
  ...overrides,
});

describe("applyCallEvent MONITORING_ENDED", () => {
  it("clears isMonitoring and prunes stale supervision row for the pair", () => {
    const prev: CtiCallStateMap = {
      "agent-call-001": {
        callId: "agent-call-001",
        eventType: "CONNECTED",
        sequence: 10,
        eventTime: "2026-05-22T11:00:00.000Z",
        isConference: false,
        isOneToOne: true,
        isTerminating: false,
        hasActiveParticipants: true,
        eventName: "CallConnected",
        isMonitoring: true,
        monitoring: {
          monitoringType: "BARGE_IN",
          monitorDn: "9001",
          monitoredDn: "1001",
        },
        parties: [
          {
            callStatus: "CONNECTED",
            callingAddress: "1001",
            calledAddress: "+15551234567",
          },
        ],
      },
      "mon-sup-agent": {
        callId: "mon-sup-agent",
        eventType: "CONNECTED",
        sequence: 11,
        eventTime: "2026-05-22T11:01:00.000Z",
        isConference: false,
        isOneToOne: true,
        isTerminating: false,
        hasActiveParticipants: true,
        eventName: "CallConnected",
        isMonitoring: true,
        monitoring: {
          monitoringType: "BARGE_IN",
          monitorDn: "9001",
          monitoredDn: "1001",
        },
        parties: [
          {
            callStatus: "CONNECTED",
            callingAddress: "9001",
            calledAddress: "1001",
          },
        ],
      },
    };

    const save = vi.fn();
    const removed = vi.fn();
    const next = applyCallEvent(
      prev,
      "agent-call-001",
      monitoringEndedEvent(),
      dnsMap,
      save,
      removed,
    );

    expect(next["agent-call-001"]?.isMonitoring).toBe(false);
    expect(next["mon-sup-agent"]).toBeUndefined();
    expect(removed).toHaveBeenCalled();
  });
});
