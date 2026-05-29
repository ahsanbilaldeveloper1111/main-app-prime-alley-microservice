import { describe, it, expect } from "vitest";
import {
  getActiveCalls,
  getCallsForAddress,
  getLiveParties,
  getRemoteAddressForCall,
  isIncomingCallForAddress,
  mapCallStateToActiveCallStatus,
} from "./activeCalls";
import type { CtiCallEvent, CtiCallStateMap } from "../types";

const makeCall = (partial: Partial<CtiCallEvent>): CtiCallEvent => ({
  callId: "CALL-001",
  eventType: "CONNECTED",
  sequence: 1,
  eventTime: "2026-01-01T10:00:00.000Z",
  isConference: false,
  isOneToOne: true,
  isTerminating: false,
  hasActiveParticipants: true,
  eventName: "CallConnected",
  currentState: "CONNECTED",
  parties: [],
  ...partial,
});

describe("getActiveCalls", () => {
  it("returns non-terminating calls", () => {
    const map: CtiCallStateMap = {
      "CALL-001": makeCall({ callId: "CALL-001", isTerminating: false }),
      "CALL-002": makeCall({ callId: "CALL-002", isTerminating: true }),
    };
    const result = getActiveCalls(map);
    expect(result).toHaveLength(1);
    expect(result[0].callId).toBe("CALL-001");
  });

  it("returns empty array for empty map", () => {
    expect(getActiveCalls({})).toHaveLength(0);
  });
});

describe("getLiveParties", () => {
  it("excludes DROPPED and DISCONNECTED parties", () => {
    const call = makeCall({
      parties: [
        { callStatus: "CONNECTED", callingAddress: "1001", calledAddress: "5551234" },
        { callStatus: "DROPPED", callingAddress: "1002", calledAddress: "5551234" },
        { callStatus: "DISCONNECTED", callingAddress: "1003", calledAddress: "5551234" },
      ],
    });
    const live = getLiveParties(call);
    expect(live).toHaveLength(1);
    expect(live[0].callingAddress).toBe("1001");
  });

  it("includes RINGING, ON_HOLD, RETRIEVED", () => {
    const call = makeCall({
      parties: [
        { callStatus: "RINGING", callingAddress: "1001" },
        { callStatus: "ON_HOLD", callingAddress: "1002" },
        { callStatus: "RETRIEVED", callingAddress: "1003" },
      ],
    });
    expect(getLiveParties(call)).toHaveLength(3);
  });
});

describe("getCallsForAddress", () => {
  const map: CtiCallStateMap = {
    "CALL-001": makeCall({
      callId: "CALL-001",
      parties: [
        { callStatus: "CONNECTED", callingAddress: "5551234", calledAddress: "1001" },
      ],
    }),
    "CALL-002": makeCall({
      callId: "CALL-002",
      parties: [
        { callStatus: "CONNECTED", callingAddress: "9999", calledAddress: "8888" },
      ],
    }),
  };

  it("returns calls where user is calledAddress", () => {
    const result = getCallsForAddress(map, "1001");
    expect(result).toHaveLength(1);
    expect(result[0].callId).toBe("CALL-001");
  });

  it("returns empty when user has no calls", () => {
    expect(getCallsForAddress(map, "7777")).toHaveLength(0);
  });

  it("returns empty for empty address", () => {
    expect(getCallsForAddress(map, "")).toHaveLength(0);
  });
});

describe("getRemoteAddressForCall", () => {
  it("returns calledAddress when user is caller", () => {
    const call = makeCall({
      parties: [
        { callStatus: "CONNECTED", callingAddress: "1001", calledAddress: "5551234" },
      ],
    });
    expect(getRemoteAddressForCall(call, "1001")).toBe("5551234");
  });

  it("returns callingAddress when user is called", () => {
    const call = makeCall({
      parties: [
        { callStatus: "CONNECTED", callingAddress: "5551234", calledAddress: "1001" },
      ],
    });
    expect(getRemoteAddressForCall(call, "1001")).toBe("5551234");
  });

  it("returns undefined when user is not a party", () => {
    const call = makeCall({
      parties: [
        { callStatus: "CONNECTED", callingAddress: "9999", calledAddress: "8888" },
      ],
    });
    expect(getRemoteAddressForCall(call, "1001")).toBeUndefined();
  });
});

describe("isIncomingCallForAddress", () => {
  it("returns true when there is a RINGING party targeting the user", () => {
    const call = makeCall({
      parties: [
        { callStatus: "RINGING", callingAddress: "5551234", calledAddress: "1001" },
      ],
    });
    expect(isIncomingCallForAddress(call, "1001")).toBe(true);
  });

  it("returns false when user is the caller", () => {
    const call = makeCall({
      parties: [
        { callStatus: "RINGING", callingAddress: "1001", calledAddress: "5551234" },
      ],
    });
    expect(isIncomingCallForAddress(call, "1001")).toBe(false);
  });

  it("returns false when call is CONNECTED (already answered)", () => {
    const call = makeCall({
      parties: [
        { callStatus: "CONNECTED", callingAddress: "5551234", calledAddress: "1001" },
      ],
    });
    expect(isIncomingCallForAddress(call, "1001")).toBe(false);
  });
});

describe("mapCallStateToActiveCallStatus", () => {
  const cases: Array<[string | undefined, string]> = [
    ["RINGING", "ringing"],
    ["ALERTING", "ringing"],
    ["CONNECTED", "connected"],
    ["ANSWERED", "connected"],
    ["RETRIEVED", "connected"],
    ["ON_HOLD", "onHold"],
    ["HELD", "onHold"],
    ["DISCONNECTED", "ended"],
    ["DROPPED", "ended"],
    [undefined, "dialing"],
    ["UNKNOWN_STATE", "dialing"],
  ];

  it.each(cases)("maps %s → %s", (input, expected) => {
    expect(mapCallStateToActiveCallStatus(input)).toBe(expected);
  });
});
