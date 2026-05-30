import { describe, it, expect } from "vitest";
import {
  extractHeldByFromPayload,
  getActiveHoldSegment,
  resolveHeldByForCallState,
} from "./resolveHeldBy";

describe("getActiveHoldSegment", () => {
  it("returns segment with null endTime", () => {
    const segments = [
      { startTime: "t1", endTime: "t2", heldByAddress: "100" },
      { startTime: "t3", endTime: null, heldByAddress: "538" },
    ];
    expect(getActiveHoldSegment(segments)?.heldByAddress).toBe("538");
  });

  it("returns undefined when all segments ended", () => {
    const segments = [{ startTime: "t1", endTime: "t2", heldByAddress: "538" }];
    expect(getActiveHoldSegment(segments)).toBeUndefined();
  });
});

describe("extractHeldByFromPayload", () => {
  it("prefers top-level heldByAddress on HELD event", () => {
    const result = extractHeldByFromPayload({
      heldByAddress: "538",
      heldByDeviceName: "CSFDANIYAL",
      parties: [
        {
          callStatus: "ON_HOLD",
          holdSegments: [
            {
              startTime: "2026-01-01T10:00:00Z",
              endTime: null,
              heldByAddress: "999",
              heldByDeviceName: "OTHER",
            },
          ],
        },
      ],
    });
    expect(result.heldByAddress).toBe("538");
    expect(result.heldByDeviceName).toBe("CSFDANIYAL");
  });

  it("reads active holdSegment when top-level heldByAddress is absent", () => {
    const result = extractHeldByFromPayload({
      parties: [
        {
          callStatus: "ON_HOLD",
          holdSegments: [
            {
              startTime: "2026-01-01T10:00:00Z",
              endTime: null,
              heldByAddress: "1003",
              heldByDeviceName: "AGENT_C",
            },
          ],
        },
      ],
    });
    expect(result.heldByAddress).toBe("1003");
    expect(result.heldByDeviceName).toBe("AGENT_C");
  });
});

describe("resolveHeldByForCallState", () => {
  it("uses callState.heldByAddress when set", () => {
    expect(
      resolveHeldByForCallState({
        heldByAddress: "1001",
        parties: [{ callStatus: "ON_HOLD" }],
      }).heldByAddress,
    ).toBe("1001");
  });

  it("falls back to party holdSegments", () => {
    expect(
      resolveHeldByForCallState({
        parties: [
          {
            callStatus: "ON_HOLD",
            holdSegments: [
              { startTime: "t", endTime: null, heldByAddress: "538" },
            ],
          },
        ],
      }).heldByAddress,
    ).toBe("538");
  });
});
