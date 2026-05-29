import { describe, it, expect } from "vitest";
import {
  canUserResumeHoldOnFloatingBar,
  resolveFloatingBarHoldOrientForUser,
  shouldIncludeCallOnFloatingBar,
  type FloatingBarCallStateEntry,
  type FloatingBarCtiCall,
  type FloatingBarDnsMap,
} from "./globalFloatingCallBarHelpers";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeHeldState(
  callingAddress: string,
  calledAddress: string,
  heldByAddress?: string,
): FloatingBarCallStateEntry {
  return {
    heldByAddress,
    parties: [
      {
        callStatus: "ON_HOLD",
        callingAddress,
        calledAddress,
      },
    ],
  };
}

function makeDnsMap(...dns: string[]): FloatingBarDnsMap {
  return Object.fromEntries(dns.map((dn) => [dn, {}]));
}

// ---------------------------------------------------------------------------
// canUserResumeHoldOnFloatingBar
// ---------------------------------------------------------------------------

describe("canUserResumeHoldOnFloatingBar — external caller, internal agent holds", () => {
  // ExternalCaller (5551234) → Agent (1001). Agent puts on hold.
  const dnsMap = makeDnsMap("1001");
  const callState = makeHeldState("5551234", "1001");

  it("allows 1001 (calledAddress / internal) to resume", () => {
    const orient = resolveFloatingBarHoldOrientForUser(callState, "1001");
    expect(canUserResumeHoldOnFloatingBar("1001", callState, dnsMap, orient)).toBe(true);
  });

  it("denies external (5551234) to resume", () => {
    const orient = resolveFloatingBarHoldOrientForUser(callState, "5551234");
    expect(canUserResumeHoldOnFloatingBar("5551234", callState, dnsMap, orient)).toBe(false);
  });
});

describe("canUserResumeHoldOnFloatingBar — heldByAddress matches user (explicit)", () => {
  const dnsMap = makeDnsMap("1001", "1002");
  const callState = makeHeldState("1001", "1002", "1002");

  it("allows the named holder (1002) to resume", () => {
    const orient = resolveFloatingBarHoldOrientForUser(callState, "1002");
    expect(canUserResumeHoldOnFloatingBar("1002", callState, dnsMap, orient)).toBe(true);
  });

  it("denies the non-holder (1001) when holder is explicitly named", () => {
    const orient = resolveFloatingBarHoldOrientForUser(callState, "1001");
    expect(canUserResumeHoldOnFloatingBar("1001", callState, dnsMap, orient)).toBe(false);
  });
});

describe("canUserResumeHoldOnFloatingBar — transfer then hold with explicit heldByAddress", () => {
  const dnsMap = makeDnsMap("1001", "1002", "1003");
  const callState = makeHeldState("1001", "1003", "1003");

  it("allows transfer recipient who held the call (1003) to resume", () => {
    const orient = resolveFloatingBarHoldOrientForUser(callState, "1003");
    expect(canUserResumeHoldOnFloatingBar("1003", callState, dnsMap, orient)).toBe(true);
  });

  it("denies original caller (1001) when server names 1003 as holder", () => {
    const orient = resolveFloatingBarHoldOrientForUser(callState, "1001");
    expect(canUserResumeHoldOnFloatingBar("1001", callState, dnsMap, orient)).toBe(false);
  });

  it("denies an unrelated user (9999) who is not on the call", () => {
    const orient = resolveFloatingBarHoldOrientForUser(callState, "9999");
    expect(canUserResumeHoldOnFloatingBar("9999", callState, dnsMap, orient)).toBe(false);
  });
});

describe("canUserResumeHoldOnFloatingBar — holdSegments without top-level heldByAddress", () => {
  const dnsMap = makeDnsMap("538");
  const callState: FloatingBarCallStateEntry = {
    parties: [
      {
        callStatus: "ON_HOLD",
        holdSegments: [
          {
            startTime: "2026-01-01T10:00:00Z",
            endTime: null,
            heldByAddress: "538",
            heldByDeviceName: "CSFDANIYAL",
          },
        ],
      },
    ],
  };

  it("allows holder DN from active holdSegment to resume", () => {
    const orient = resolveFloatingBarHoldOrientForUser(callState, "538");
    expect(canUserResumeHoldOnFloatingBar("538", callState, dnsMap, orient)).toBe(true);
  });

  it("denies a different extension", () => {
    const orient = resolveFloatingBarHoldOrientForUser(callState, "1001");
    expect(canUserResumeHoldOnFloatingBar("1001", callState, dnsMap, orient)).toBe(false);
  });
});

describe("canUserResumeHoldOnFloatingBar — no user address", () => {
  const dnsMap = makeDnsMap("1001");
  const callState = makeHeldState("5551234", "1001");

  it("returns false when userAddress is undefined", () => {
    expect(canUserResumeHoldOnFloatingBar(undefined, callState, dnsMap)).toBe(false);
  });

  it("returns false when callState is undefined", () => {
    expect(canUserResumeHoldOnFloatingBar("1001", undefined, dnsMap)).toBe(false);
  });
});

describe("canUserResumeHoldOnFloatingBar — call not on hold", () => {
  const dnsMap = makeDnsMap("1001");
  const callState: FloatingBarCallStateEntry = {
    parties: [
      { callStatus: "CONNECTED", callingAddress: "5551234", calledAddress: "1001" },
    ],
  };

  it("returns false when call is connected (not held)", () => {
    expect(canUserResumeHoldOnFloatingBar("1001", callState, dnsMap)).toBe(false);
  });
});

describe("shouldIncludeCallOnFloatingBar — supervision (silent / whisper / barge)", () => {
  const supervisor = "9001";
  const agent = "1001";

  function supervisionCall(
    monitoringType: string,
    monitorPartyStatus = "CONNECTED",
  ): { call: FloatingBarCtiCall; callStateMap: Record<string, FloatingBarCallStateEntry> } {
    const callId = "mon-call-1";
    const call: FloatingBarCtiCall = {
      callId,
      id: callId,
      number: agent,
      status: "connected",
      startTime: new Date(),
      callingAddress: supervisor,
      calledAddress: agent,
    };
    const callStateMap: Record<string, FloatingBarCallStateEntry> = {
      [callId]: {
        isMonitoring: true,
        monitoring: {
          monitoringType,
          monitorDn: supervisor,
          monitoredDn: agent,
        },
        parties: [
          {
            callStatus: monitorPartyStatus,
            callingAddress: supervisor,
            calledAddress: agent,
          },
        ],
      },
    };
    return { call, callStateMap };
  }

  it.each(["SILENT", "WHISPER", "BARGE_IN"])(
    "includes %s monitoring call for the supervisor",
    (monitoringType) => {
      const { call, callStateMap } = supervisionCall(monitoringType);
      expect(
        shouldIncludeCallOnFloatingBar(call, supervisor, callStateMap),
      ).toBe(true);
    },
  );

  it("excludes WHISPER when supervisor observation leg is terminal", () => {
    const { call, callStateMap } = supervisionCall("WHISPER", "DROPPED");
    expect(
      shouldIncludeCallOnFloatingBar(call, supervisor, callStateMap),
    ).toBe(false);
  });

  it("includes BARGE_IN on GFB when only agent+customer parties are live (conference bridge)", () => {
    const callId = "barge-conf-live";
    const customer = "+15551234567";
    const call: FloatingBarCtiCall = {
      callId,
      id: callId,
      number: customer,
      status: "connected",
      startTime: new Date(),
      callingAddress: agent,
      calledAddress: customer,
    };
    const callStateMap: Record<string, FloatingBarCallStateEntry> = {
      [callId]: {
        isMonitoring: true,
        monitoring: {
          monitoringType: "BARGE_IN",
          monitorDn: supervisor,
          monitoredDn: agent,
        },
        parties: [
          {
            callStatus: "CONNECTED",
            callingAddress: agent,
            calledAddress: customer,
          },
        ],
      },
    };
    expect(
      shouldIncludeCallOnFloatingBar(call, supervisor, callStateMap),
    ).toBe(true);
  });

  it("excludes BARGE_IN from GFB when supervisor leg is DROPPED (Jabber hang-up) even if customer is live", () => {
    const callId = "barge-conf-1";
    const customer = "+15551234567";
    const call: FloatingBarCtiCall = {
      callId,
      id: callId,
      number: customer,
      status: "connected",
      startTime: new Date(),
      callingAddress: agent,
      calledAddress: customer,
    };
    const callStateMap: Record<string, FloatingBarCallStateEntry> = {
      [callId]: {
        isMonitoring: true,
        monitoring: {
          monitoringType: "BARGE_IN",
          monitorDn: supervisor,
          monitoredDn: agent,
        },
        parties: [
          {
            callStatus: "DROPPED",
            callingAddress: supervisor,
            calledAddress: agent,
          },
          {
            callStatus: "CONNECTED",
            callingAddress: agent,
            calledAddress: customer,
          },
        ],
      },
    };
    expect(
      shouldIncludeCallOnFloatingBar(call, supervisor, callStateMap),
    ).toBe(false);
  });

  it("excludes BARGE_IN when callStateMap only has live customer leg but eventLog has supervisor DROPPED", () => {
    const callId = "barge-stripped-parties";
    const customer = "+15551234567";
    const call: FloatingBarCtiCall = {
      callId,
      id: callId,
      number: customer,
      status: "connected",
      startTime: new Date(),
      callingAddress: agent,
      calledAddress: customer,
    };
    const callStateMap: Record<string, FloatingBarCallStateEntry> = {
      [callId]: {
        isMonitoring: true,
        monitoring: {
          monitoringType: "BARGE_IN",
          monitorDn: supervisor,
          monitoredDn: agent,
        },
        parties: [
          {
            callStatus: "CONNECTED",
            callingAddress: agent,
            calledAddress: customer,
          },
        ],
      },
    };
    const eventLog = [
      {
        sequence: 5,
        isMonitoring: true,
        monitoring: {
          monitoringType: "BARGE_IN",
          monitorDn: supervisor,
          monitoredDn: agent,
        },
      },
      {
        sequence: 10,
        eventType: "DROPPED",
        isMonitoring: true,
        monitoring: {
          monitoringType: "BARGE_IN",
          monitorDn: supervisor,
          monitoredDn: agent,
        },
        parties: [
          {
            callStatus: "DROPPED",
            callingAddress: supervisor,
            calledAddress: agent,
          },
          {
            callStatus: "CONNECTED",
            callingAddress: agent,
            calledAddress: customer,
          },
        ],
      },
    ];
    expect(
      shouldIncludeCallOnFloatingBar(call, supervisor, callStateMap, eventLog),
    ).toBe(false);
  });

  it.each(["SILENT", "WHISPER"])(
    "excludes %s from GFB when callStateMap strips supervisor leg but eventLog has DROPPED",
    (monitoringType) => {
      const callId = "silent-stripped";
      const customer = "+15551234567";
      const call: FloatingBarCtiCall = {
        callId,
        id: callId,
        number: customer,
        status: "connected",
        startTime: new Date(),
        callingAddress: agent,
        calledAddress: customer,
      };
      const callStateMap: Record<string, FloatingBarCallStateEntry> = {
        [callId]: {
          isMonitoring: true,
          monitoring: {
            monitoringType,
            monitorDn: supervisor,
            monitoredDn: agent,
          },
          parties: [
            {
              callStatus: "CONNECTED",
              callingAddress: agent,
              calledAddress: customer,
            },
          ],
        },
      };
      const eventLog = [
        {
          sequence: 5,
          isMonitoring: true,
          monitoring: {
            monitoringType,
            monitorDn: supervisor,
            monitoredDn: agent,
          },
        },
        {
          sequence: 10,
          eventType: "DROPPED",
          isMonitoring: true,
          monitoring: {
            monitoringType,
            monitorDn: supervisor,
            monitoredDn: agent,
          },
          parties: [
            {
              callStatus: "DROPPED",
              callingAddress: supervisor,
              calledAddress: agent,
            },
            {
              callStatus: "CONNECTED",
              callingAddress: agent,
              calledAddress: customer,
            },
          ],
        },
      ];
      expect(
        shouldIncludeCallOnFloatingBar(call, supervisor, callStateMap, eventLog),
      ).toBe(false);
    },
  );

  it("excludes supervision from GFB when isMonitoring is false (MONITORING_ENDED)", () => {
    const { call, callStateMap } = supervisionCall("BARGE_IN");
    callStateMap[call.callId!] = {
      ...callStateMap[call.callId!],
      isMonitoring: false,
    };
    expect(
      shouldIncludeCallOnFloatingBar(call, supervisor, callStateMap),
    ).toBe(false);
  });

  it.each(["SILENT", "WHISPER", "BARGE_IN"])(
    "excludes %s from GFB when customer leg is DROPPED but supervisor-agent leg is CONNECTED",
    (monitoringType) => {
      const callId = "cust-ended-sup-live";
      const customer = "+15551234567";
      const call: FloatingBarCtiCall = {
        callId,
        id: callId,
        number: agent,
        status: "connected",
        startTime: new Date(),
        callingAddress: supervisor,
        calledAddress: agent,
      };
      const callStateMap: Record<string, FloatingBarCallStateEntry> = {
        [callId]: {
          isMonitoring: true,
          monitoring: {
            monitoringType,
            monitorDn: supervisor,
            monitoredDn: agent,
          },
          parties: [
            {
              callStatus: "CONNECTED",
              callingAddress: supervisor,
              calledAddress: agent,
            },
            {
              callStatus: "DROPPED",
              callingAddress: agent,
              calledAddress: customer,
            },
          ],
        },
      };
      expect(
        shouldIncludeCallOnFloatingBar(call, supervisor, callStateMap),
      ).toBe(false);
    },
  );

  it("excludes BARGE_IN when supervisor and customer legs are terminal", () => {
    const callId = "barge-ended-1";
    const call: FloatingBarCtiCall = {
      callId,
      id: callId,
      number: agent,
      status: "connected",
      startTime: new Date(),
      callingAddress: supervisor,
      calledAddress: agent,
    };
    const callStateMap: Record<string, FloatingBarCallStateEntry> = {
      [callId]: {
        isMonitoring: true,
        monitoring: {
          monitoringType: "BARGE_IN",
          monitorDn: supervisor,
          monitoredDn: agent,
        },
        parties: [
          {
            callStatus: "DROPPED",
            callingAddress: supervisor,
            calledAddress: agent,
          },
          {
            callStatus: "DISCONNECTED",
            callingAddress: agent,
            calledAddress: "+15551234567",
          },
        ],
      },
    };
    expect(
      shouldIncludeCallOnFloatingBar(call, supervisor, callStateMap),
    ).toBe(false);
  });
});
