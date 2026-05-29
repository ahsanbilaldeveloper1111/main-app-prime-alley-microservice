import { describe, it, expect } from "vitest";
import { isStaleEvent, toEventTimeMs } from "./staleEvent";

describe("toEventTimeMs", () => {
  it("returns 0 for undefined", () => {
    expect(toEventTimeMs(undefined)).toBe(0);
  });

  it("returns 0 for empty string", () => {
    expect(toEventTimeMs("")).toBe(0);
  });

  it("returns 0 for invalid date string", () => {
    expect(toEventTimeMs("not-a-date")).toBe(0);
  });

  it("returns correct epoch ms for a valid ISO string", () => {
    const iso = "2026-01-01T10:00:00.000Z";
    expect(toEventTimeMs(iso)).toBe(new Date(iso).getTime());
  });
});

describe("isStaleEvent", () => {
  const BASE_TIME = "2026-01-01T10:00:10.000Z";

  it("returns false when no stored event time (first event)", () => {
    expect(
      isStaleEvent(
        { eventTime: "2026-01-01T10:00:00.000Z", sequence: 1 },
        {},
      ),
    ).toBe(false);
  });

  it("returns true when incoming eventTime is older than stored", () => {
    expect(
      isStaleEvent(
        { eventTime: "2026-01-01T10:00:01.000Z", sequence: 2 },
        { eventTime: BASE_TIME, sequence: 5 },
      ),
    ).toBe(true);
  });

  it("returns false when incoming eventTime is newer than stored", () => {
    expect(
      isStaleEvent(
        { eventTime: "2026-01-01T10:00:15.000Z", sequence: 6 },
        { eventTime: BASE_TIME, sequence: 5 },
      ),
    ).toBe(false);
  });

  it("returns true when same eventTime but incoming sequence <= stored", () => {
    expect(
      isStaleEvent(
        { eventTime: BASE_TIME, sequence: 4 },
        { eventTime: BASE_TIME, sequence: 5 },
      ),
    ).toBe(true);
  });

  it("returns true when same eventTime and same sequence (idempotent delivery)", () => {
    expect(
      isStaleEvent(
        { eventTime: BASE_TIME, sequence: 5 },
        { eventTime: BASE_TIME, sequence: 5 },
      ),
    ).toBe(true);
  });

  it("returns false when same eventTime but incoming sequence is higher", () => {
    expect(
      isStaleEvent(
        { eventTime: BASE_TIME, sequence: 6 },
        { eventTime: BASE_TIME, sequence: 5 },
      ),
    ).toBe(false);
  });

  it("treats missing incoming sequence as 0", () => {
    expect(
      isStaleEvent(
        { eventTime: BASE_TIME, sequence: 0 },
        { eventTime: BASE_TIME, sequence: 1 },
      ),
    ).toBe(true);
  });
});
