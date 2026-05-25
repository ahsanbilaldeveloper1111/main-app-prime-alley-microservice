import { describe, it, expect } from "vitest";
import {
  buildWallboardMonitoringPayloadFromEvent,
  computeWallboardSupervisionSessionActive,
  activeMonitoringFromPayload,
  pickBestApplicableMonitoringPayload,
  pickMonitoringPayloadForInitiatorRefill,
  pickPinnedSupervisionPayloadFromCallStateMap,
  callStateMapHasActiveMonitoringForPair,
  eventLogHasSupervisionSnapshotForPair,
  findLatestMonitoringEventForPairInLog,
  findLatestMonitoringEventFromLog,
  findTerminalMonitoringClearInRecentLog,
  findLatestMonitoringSessionStartLogIndex,
  isSilentMonitoringVisibleToViewer,
  isWallboardRemoteSupervisionSessionActive,
  deriveWallboardMonitoringState,
  resolveEffectiveWallboardMonitoring,
  resolveWallboardMonitoringForUi,
  isWallboardSupervisionInitiator,
  wallboardLocalMonitoringForResolve,
  shouldRetainWallboardMonitoringState,
  shouldRetainLocalWallboardMonitoringDuringSseLag,
  shouldRetainRemoteWallboardMonitoringDuringSseLag,
  shouldBlockMonitoringRefillDueToSuppression,
  shouldSkipMonitoringRefillTypeDowngrade,
  wallboardMonitoringPayloadShouldApplyFromStream,
  wallboardMonitoringSessionKey,
  shouldExcludeCallFromWallboardContext,
  CLEARED_WALLBOARD_MONITORING,
} from "./wallboardEventParsing";

const dnsMap = {
  "9001": { devices: { SUP: { deviceName: "SUP", deviceType: "IP_PHONE" } } },
  "1001": { devices: { AGT: { deviceName: "AGT", deviceType: "IP_PHONE" } } },
};

describe("wallboard supervision live events", () => {
  it("detects SILENT monitoring from event metadata without parties", () => {
    const eventLog = [
      {
        eventType: "CONNECTED",
        sequence: 10,
        isMonitoring: true,
        monitoring: {
          monitoringType: "SILENT",
          monitorDn: "9001",
          monitoredDn: "1001",
        },
        parties: [],
      },
    ];
    expect(findLatestMonitoringEventFromLog(eventLog)).not.toBeNull();
    expect(
      findLatestMonitoringEventForPairInLog(eventLog, "9001", "1001"),
    ).not.toBeNull();
  });

  it("builds payload from monitoring block when parties are empty", () => {
    const payload = buildWallboardMonitoringPayloadFromEvent(
      [],
      { monitorDn: "9001", monitoredDn: "1001", monitoringType: "WHISPER" },
      dnsMap,
    );
    expect(payload?.monitorDn).toBe("9001");
    expect(payload?.monitoredDn).toBe("1001");
    expect(payload?.monitoringType).toBe("WHISPER");
  });

  it("treats silent session as active from event log before callStateMap catches up", () => {
    const payload = buildWallboardMonitoringPayloadFromEvent(
      [],
      { monitorDn: "9001", monitoredDn: "1001", monitoringType: "SILENT" },
      dnsMap,
    );
    expect(payload).not.toBeNull();
    const eventLog = [
      {
        sequence: 5,
        isMonitoring: true,
        monitoring: {
          monitoringType: "SILENT",
          monitorDn: "9001",
          monitoredDn: "1001",
        },
      },
    ];
    expect(
      isWallboardRemoteSupervisionSessionActive(payload!, {}, eventLog),
    ).toBe(true);
    expect(eventLogHasSupervisionSnapshotForPair(eventLog, payload!)).toBe(true);
  });

  it("keeps local monitoring during SSE lag when log still has the session", () => {
    const payload = buildWallboardMonitoringPayloadFromEvent(
      [],
      { monitorDn: "9001", monitoredDn: "1001", monitoringType: "WHISPER" },
      dnsMap,
    );
    const eventLog = [
      {
        sequence: 2,
        monitoring: {
          monitoringType: "WHISPER",
          monitorDn: "9001",
          monitoredDn: "1001",
        },
      },
    ];
    const effective = resolveEffectiveWallboardMonitoring(
      {
        dn: "1001",
        type: "WHISPER",
        monitor: "9001",
        deviceName: "AGT",
      },
      {},
      dnsMap,
      eventLog,
    );
    expect(effective.dn).toBe("1001");
    expect(effective.monitor).toBe("9001");
    expect(effective).not.toEqual(CLEARED_WALLBOARD_MONITORING);
  });

  it("clears BARGE_IN for all viewers on MONITORING_ENDED", () => {
    const eventLog = [
      {
        sequence: 5,
        isMonitoring: true,
        monitoring: {
          monitoringType: "BARGE_IN",
          monitorDn: "9001",
          monitoredDn: "1001",
        },
      },
      {
        sequence: 12,
        eventType: "MONITORING_ENDED",
        isMonitoring: false,
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
    ];
    const callStateMap = {
      "mon-1": {
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
    const effective = resolveEffectiveWallboardMonitoring(
      {
        dn: "1001",
        type: "BARGE_IN",
        monitor: "9001",
        deviceName: "AGT",
      },
      callStateMap,
      dnsMap,
      eventLog,
    );
    expect(effective).toEqual(CLEARED_WALLBOARD_MONITORING);
    expect(
      findTerminalMonitoringClearInRecentLog(eventLog, {
        dn: "1001",
        monitor: "9001",
      }),
    ).toBe("monitoring ended");
  });

  it("clears BARGE_IN for all viewers after supervisor disconnects from Jabber", () => {
    const payload = buildWallboardMonitoringPayloadFromEvent(
      [],
      { monitorDn: "9001", monitoredDn: "1001", monitoringType: "BARGE_IN" },
      dnsMap,
    );
    const eventLog = [
      {
        sequence: 5,
        isMonitoring: true,
        monitoring: {
          monitoringType: "BARGE_IN",
          monitorDn: "9001",
          monitoredDn: "1001",
        },
      },
      {
        sequence: 10,
        eventType: "DROPPED",
        isMonitoring: true,
        monitoring: {
          monitoringType: "BARGE_IN",
          monitorDn: "9001",
          monitoredDn: "1001",
        },
        parties: [
          {
            callStatus: "DROPPED",
            callingAddress: "9001",
            calledAddress: "1001",
          },
          {
            callStatus: "CONNECTED",
            callingAddress: "1001",
            calledAddress: "+15551234567",
          },
        ],
      },
    ];
    const callStateMap = {
      "mon-1": {
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
    const effective = resolveEffectiveWallboardMonitoring(
      {
        dn: "1001",
        type: "BARGE_IN",
        monitor: "9001",
        deviceName: "AGT",
      },
      callStateMap,
      dnsMap,
      eventLog,
    );
    expect(effective).toEqual(CLEARED_WALLBOARD_MONITORING);
    expect(
      findTerminalMonitoringClearInRecentLog(eventLog, {
        dn: "1001",
        monitor: "9001",
      }),
    ).toBe("supervisor disconnected");
  });

  it("does not exclude agent customer call from wallboard during WHISPER", () => {
    const agentCustomerCall = {
      isMonitoring: true,
      isTerminating: false,
      monitoring: {
        monitoringType: "WHISPER",
        monitorDn: "9001",
        monitoredDn: "1001",
      },
      parties: [
        {
          callStatus: "CONNECTED",
          callingAddress: "1001",
          calledAddress: "+15551234567",
        },
        {
          callStatus: "CONNECTED",
          callingAddress: "9001",
          calledAddress: "1001",
        },
      ],
    };
    expect(
      shouldExcludeCallFromWallboardContext(
        agentCustomerCall,
        "1001",
        {
          dn: "1001",
          type: "WHISPER",
          monitor: "9001",
          deviceName: "AGT",
        },
        null,
      ),
    ).toBe(false);
  });

  it("keeps whisper session when callStateMap still has monitoring pair", () => {
    const payload = buildWallboardMonitoringPayloadFromEvent(
      [],
      { monitorDn: "9001", monitoredDn: "1001", monitoringType: "WHISPER" },
      dnsMap,
    );
    const callStateMap = {
      "call-1": {
        isMonitoring: true,
        monitoring: {
          monitoringType: "WHISPER",
          monitorDn: "9001",
          monitoredDn: "1001",
        },
        parties: [
          {
            callStatus: "CONNECTED",
            callingAddress: "9001",
            calledAddress: "1001",
          },
          {
            callStatus: "CONNECTED",
            callingAddress: "1001",
            calledAddress: "+15551234567",
          },
        ],
      },
    };
    const effective = resolveEffectiveWallboardMonitoring(
      {
        dn: "1001",
        type: "WHISPER",
        monitor: "9001",
        deviceName: "AGT",
      },
      callStateMap,
      dnsMap,
      [],
    );
    expect(effective.dn).toBe("1001");
    expect(effective.monitor).toBe("9001");
  });

  it.each(["SILENT", "WHISPER"])(
    "clears %s for all viewers after supervisor disconnects from Jabber",
    (monitoringType) => {
      const eventLog = [
        {
          sequence: 5,
          isMonitoring: true,
          monitoring: {
            monitoringType,
            monitorDn: "9001",
            monitoredDn: "1001",
          },
        },
        {
          sequence: 10,
          eventType: "DROPPED",
          isMonitoring: true,
          monitoring: {
            monitoringType,
            monitorDn: "9001",
            monitoredDn: "1001",
          },
          parties: [
            {
              callStatus: "DROPPED",
              callingAddress: "9001",
              calledAddress: "1001",
            },
            {
              callStatus: "CONNECTED",
              callingAddress: "1001",
              calledAddress: "+15551234567",
            },
          ],
        },
      ];
      const callStateMap = {
        "mon-1": {
          isMonitoring: true,
          monitoring: {
            monitoringType,
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
      const effective = resolveEffectiveWallboardMonitoring(
        {
          dn: "1001",
          type: monitoringType,
          monitor: "9001",
          deviceName: "AGT",
        },
        callStateMap,
        dnsMap,
        eventLog,
      );
      expect(effective).toEqual(CLEARED_WALLBOARD_MONITORING);
    },
  );

  it.each(["SILENT", "WHISPER"])(
    "clears %s on MONITORING_ENDED",
    (monitoringType) => {
      const eventLog = [
        {
          sequence: 5,
          isMonitoring: true,
          monitoring: {
            monitoringType,
            monitorDn: "9001",
            monitoredDn: "1001",
          },
        },
        {
          sequence: 12,
          eventType: "MONITORING_ENDED",
          isMonitoring: false,
          monitoring: {
            monitoringType,
            monitorDn: "9001",
            monitoredDn: "1001",
          },
        },
      ];
      const effective = resolveEffectiveWallboardMonitoring(
        {
          dn: "1001",
          type: monitoringType,
          monitor: "9001",
          deviceName: "AGT",
        },
        {
          "agent-1": {
            isMonitoring: true,
            monitoring: {
              monitoringType,
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
        },
        dnsMap,
        eventLog,
      );
      expect(effective).toEqual(CLEARED_WALLBOARD_MONITORING);
    },
  );

  it("does not retain BARGE wallboard monitoring when customer leg ended but supervisor-agent remains", () => {
    const callStateMap = {
      "mon-1": {
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
          {
            callStatus: "DROPPED",
            callingAddress: "1001",
            calledAddress: "+15551234567",
          },
        ],
      },
    };
    expect(
      shouldRetainWallboardMonitoringState(
        { dn: "1001", type: "BARGE_IN", monitor: "9001", deviceName: "AGT" },
        callStateMap,
        [],
      ),
    ).toBe(false);
  });

  it("treats SILENT session active when unrelated prior call has DROPPED customer only", () => {
    const payload = buildWallboardMonitoringPayloadFromEvent(
      [],
      { monitorDn: "9001", monitoredDn: "1001", monitoringType: "SILENT" },
      dnsMap,
    );
    const callStateMap = {
      "old-agent-call": {
        parties: [
          {
            callStatus: "DROPPED",
            callingAddress: "1001",
            calledAddress: "+15550001111",
          },
        ],
      },
      "mon-1": {
        isMonitoring: true,
        monitoring: {
          monitoringType: "SILENT",
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
    expect(
      isWallboardRemoteSupervisionSessionActive(payload!, callStateMap, []),
    ).toBe(true);
  });

  it("treats remote viewer session active when only SSE has whisper (no local active)", () => {
    const callStateMap = {
      "mon-1": {
        isMonitoring: true,
        sequence: 20,
        monitoring: {
          monitoringType: "WHISPER",
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
    const streamOpts = {
      viewerUserAddress: "9002",
      callStateMap,
      dnsMap,
    };
    expect(
      computeWallboardSupervisionSessionActive(
        { dn: null, type: null, deviceName: null },
        { dn: null, type: null, deviceName: null },
        callStateMap,
        [],
        streamOpts,
      ),
    ).toBe(true);
    expect(
      pickBestApplicableMonitoringPayload(callStateMap, dnsMap, [], streamOpts)
        ?.monitoringType,
    ).toBe("WHISPER");
  });

  it("deriveWallboardMonitoringState ignores refilled active for non-initiator viewers", () => {
    const callStateMap = {
      barge: {
        isMonitoring: true,
        sequence: 30,
        eventTime: "2020-01-01T12:00:00Z",
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
          {
            callStatus: "CONNECTED",
            callingAddress: "1001",
            calledAddress: "+15551234567",
          },
        ],
      },
    };
    const staleRefilledActive = {
      dn: "1001",
      type: "WHISPER",
      monitor: "9001",
      deviceName: "AGT",
    };
    expect(isWallboardSupervisionInitiator("9002", "9001")).toBe(false);
    expect(wallboardLocalMonitoringForResolve(staleRefilledActive, "9002")).toEqual({
      dn: null,
      type: null,
      deviceName: null,
      monitor: undefined,
    });
    const derived = deriveWallboardMonitoringState(
      staleRefilledActive,
      callStateMap,
      dnsMap,
      [],
      { viewerUserAddress: "9002", callStateMap, dnsMap },
    );
    expect(derived.ui.type).toBe("BARGE_IN");
    expect(derived.effective.type).toBe("BARGE_IN");
  });

  it("remote viewer effective monitoring follows BARGE when refilled active still WHISPER", () => {
    const callStateMap = {
      barge: {
        isMonitoring: true,
        sequence: 30,
        eventTime: "2020-01-01T12:00:00Z",
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
          {
            callStatus: "CONNECTED",
            callingAddress: "1001",
            calledAddress: "+15551234567",
          },
        ],
      },
      whisper: {
        isMonitoring: true,
        sequence: 10,
        eventTime: "2020-01-01T10:00:00Z",
        monitoring: {
          monitoringType: "WHISPER",
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
    const viewerActive = {
      dn: "1001",
      type: "WHISPER",
      monitor: "9001",
      deviceName: "AGT",
    };
    const streamOpts = {
      viewerUserAddress: "9002",
      callStateMap,
      dnsMap,
      activeMonitoring: viewerActive,
      activeMonitoringType: "WHISPER",
    };
    const effective = resolveEffectiveWallboardMonitoring(
      viewerActive,
      callStateMap,
      dnsMap,
      [],
      streamOpts,
    );
    expect(effective.type).toBe("BARGE_IN");
    const ui = resolveWallboardMonitoringForUi(
      viewerActive,
      effective,
      callStateMap,
      dnsMap,
      [],
      streamOpts,
    );
    expect(ui.type).toBe("BARGE_IN");
  });

  it("supervisionSessionActive is true for whisper when map has flag despite teardown hint", () => {
    const callStateMap = {
      live: {
        isMonitoring: true,
        sequence: 100,
        monitoring: {
          monitoringType: "WHISPER",
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
    const active = activeMonitoringFromPayload({
      monitorDn: "9001",
      monitoredDn: "1001",
      monitoringType: "WHISPER",
      monitoredDeviceName: "AGT",
    });
    expect(
      computeWallboardSupervisionSessionActive(
        active,
        active,
        callStateMap,
        [],
        {
          viewerUserAddress: "9001",
          monitoringTeardown: { monitorDn: "9001", monitoredDn: "1001" },
          suppressedSessionKey: "9001:1001:WHISPER",
        },
      ),
    ).toBe(true);
  });

  it("ignores whisper session start that predates monitoring ended in log (retry)", () => {
    const eventLog = [
      {
        sequence: 10,
        isMonitoring: true,
        monitoring: {
          monitoringType: "WHISPER",
          monitorDn: "9001",
          monitoredDn: "1001",
        },
      },
      {
        sequence: 20,
        eventType: "MONITORING_ENDED",
        isMonitoring: false,
        monitoring: {
          monitoringType: "WHISPER",
          monitorDn: "9001",
          monitoredDn: "1001",
        },
      },
    ];
    const active = {
      dn: "1001",
      type: "WHISPER",
      monitor: "9001",
      deviceName: "AGT",
    };
    expect(findLatestMonitoringSessionStartLogIndex(eventLog, active)).toBe(0);
    expect(
      shouldRetainLocalWallboardMonitoringDuringSseLag(active, eventLog, {
        viewerUserAddress: "9001",
      }),
    ).toBe(true);
    expect(
      shouldRetainLocalWallboardMonitoringDuringSseLag(active, eventLog, {
        viewerUserAddress: "9001",
        callStateMap: {
          barge: {
            isMonitoring: true,
            sequence: 50,
            monitoring: {
              monitoringType: "BARGE_IN",
              monitorDn: "9001",
              monitoredDn: "1001",
            },
          },
        },
      }),
    ).toBe(true);
    const callStateMap = {
      live: {
        isMonitoring: true,
        sequence: 50,
        monitoring: {
          monitoringType: "WHISPER",
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
    expect(
      resolveEffectiveWallboardMonitoring(active, callStateMap, dnsMap, eventLog, {
        viewerUserAddress: "9001",
      }).type,
    ).toBe("WHISPER");
  });

  it("allows refill when incoming channel differs from suppressed session type", () => {
    expect(
      shouldBlockMonitoringRefillDueToSuppression(
        "9001:1001:WHISPER",
        "9001",
        "1001",
        null,
        "BARGE_IN",
      ),
    ).toBe(false);
  });

  it("remote viewer picks newer whisper over stale barge in callStateMap", () => {
    const callStateMap = {
      barge: {
        isMonitoring: true,
        sequence: 5,
        eventTime: "2020-01-01T10:00:00Z",
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
          {
            callStatus: "CONNECTED",
            callingAddress: "1001",
            calledAddress: "+15551234567",
          },
        ],
      },
      whisper: {
        isMonitoring: true,
        sequence: 25,
        eventTime: "2020-01-01T11:00:00Z",
        monitoring: {
          monitoringType: "WHISPER",
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
    const picked = pickBestApplicableMonitoringPayload(callStateMap, dnsMap, [], {
      viewerUserAddress: "9002",
      callStateMap,
      dnsMap,
    });
    expect(picked?.monitoringType).toBe("WHISPER");
  });

  it("hydrates WHISPER UI for remote viewer when effective is cleared but eventLog has session", () => {
    const eventLog = [
      {
        sequence: 3,
        isMonitoring: true,
        monitoring: {
          monitoringType: "WHISPER",
          monitorDn: "9001",
          monitoredDn: "1001",
        },
      },
    ];
    const ui = resolveWallboardMonitoringForUi(
      { dn: null, type: null, deviceName: null },
      { dn: null, type: null, deviceName: null },
      {},
      dnsMap,
      eventLog,
      { viewerUserAddress: "9002", dnsMap },
    );
    expect(ui.type).toBe("WHISPER");
    expect(ui.monitor).toBe("9001");
  });

  it("retains remote WHISPER for other viewers when eventLog leads callStateMap", () => {
    const payload = buildWallboardMonitoringPayloadFromEvent(
      [],
      { monitorDn: "9001", monitoredDn: "1001", monitoringType: "WHISPER" },
      dnsMap,
    );
    const callStateMap = {
      "agent-customer": {
        parties: [
          {
            callStatus: "CONNECTED",
            callingAddress: "1001",
            calledAddress: "+15551234567",
          },
        ],
      },
    };
    const eventLog = [
      {
        sequence: 3,
        isMonitoring: true,
        monitoring: {
          monitoringType: "WHISPER",
          monitorDn: "9001",
          monitoredDn: "1001",
        },
      },
    ];
    expect(
      shouldRetainRemoteWallboardMonitoringDuringSseLag(
        payload!,
        callStateMap,
        eventLog,
      ),
    ).toBe(true);
    expect(
      wallboardMonitoringPayloadShouldApplyFromStream(
        payload!,
        callStateMap,
        eventLog,
      ),
    ).toBe(true);
    expect(
      resolveEffectiveWallboardMonitoring(
        { dn: null, type: null, deviceName: null },
        callStateMap,
        dnsMap,
        eventLog,
      ).type,
    ).toBe("WHISPER");
  });

  it.each(["SILENT", "WHISPER"] as const)(
    "uses active monitoring for UI when effective is cleared during local SSE lag (%s)",
    (monitoringType) => {
      const ui = resolveWallboardMonitoringForUi(
        { dn: "1001", type: monitoringType, monitor: "9001", deviceName: "AGT" },
        { dn: null, type: null, deviceName: null },
        {},
        dnsMap,
        [],
      );
      expect(ui.type).toBe(monitoringType);
      expect(ui.dn).toBe("1001");
    },
  );

  it.each(["SILENT", "WHISPER"] as const)(
    "does not treat stale terminal events as clear before session appears in eventLog (%s)",
    (monitoringType) => {
      const eventLog = [
        {
          sequence: 1,
          eventType: "MONITORING_ENDED",
          isMonitoring: false,
          monitoring: {
            monitoringType,
            monitorDn: "9001",
            monitoredDn: "1001",
          },
        },
      ];
      expect(
        findTerminalMonitoringClearInRecentLog(eventLog, {
          dn: "1001",
          monitor: "9001",
          deviceName: "AGT",
        }),
      ).toBeNull();
      expect(
        shouldRetainLocalWallboardMonitoringDuringSseLag(
          { dn: "1001", type: monitoringType, monitor: "9001", deviceName: "AGT" },
          eventLog,
        ),
      ).toBe(true);
    },
  );

  it("blocks stale barge refill after whisper started locally while suppression active", () => {
    const suppressed = wallboardMonitoringSessionKey("9001", "1001");
    expect(
      shouldBlockMonitoringRefillDueToSuppression(
        suppressed,
        "9001",
        "1001",
        "WHISPER",
        "BARGE_IN",
      ),
    ).toBe(true);
    expect(
      shouldBlockMonitoringRefillDueToSuppression(
        suppressed,
        "9001",
        "1001",
        "WHISPER",
        "WHISPER",
      ),
    ).toBe(true);
  });

  it("allows new channel in log after stop when sequence is newer than barrier", () => {
    const eventLog = [
      {
        sequence: 5,
        eventType: "MONITORING_ENDED",
        isMonitoring: false,
        monitoring: {
          monitoringType: "BARGE_IN",
          monitorDn: "9001",
          monitoredDn: "1001",
        },
      },
      {
        sequence: 12,
        isMonitoring: true,
        monitoring: {
          monitoringType: "WHISPER",
          monitorDn: "9001",
          monitoredDn: "1001",
        },
      },
    ];
    expect(
      findTerminalMonitoringClearInRecentLog(eventLog, {
        dn: "1001",
        monitor: "9001",
        type: "WHISPER",
      }),
    ).toBeNull();
    expect(
      findLatestMonitoringEventForPairInLog(eventLog, "9001", "1001", "WHISPER")
        ?.monitoring?.monitoringType,
    ).toBe("WHISPER");
  });

  it("retains local SILENT monitoring while SSE has not caught up yet", () => {
    expect(
      shouldRetainLocalWallboardMonitoringDuringSseLag(
        { dn: "1001", type: "SILENT", monitor: "9001", deviceName: "AGT" },
        [],
      ),
    ).toBe(true);
    expect(
      resolveEffectiveWallboardMonitoring(
        { dn: "1001", type: "SILENT", monitor: "9001", deviceName: "AGT" },
        {},
        dnsMap,
        [],
        { viewerUserAddress: "9001" },
      ).type,
    ).toBe("SILENT");
  });

  it("retains initiator SILENT when callStateMap has live row but remote session check lags", () => {
    const eventLog = [
      {
        sequence: 5,
        eventType: "MONITORING_ENDED",
        isMonitoring: false,
        monitoring: {
          monitoringType: "SILENT",
          monitorDn: "9001",
          monitoredDn: "1001",
        },
      },
    ];
    const active = {
      dn: "1001",
      type: "SILENT",
      monitor: "9001",
      deviceName: "AGT",
    };
    const callStateMap = {
      silent: {
        isMonitoring: true,
        sequence: 7098,
        monitoring: {
          monitoringType: "SILENT",
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
    expect(
      shouldRetainLocalWallboardMonitoringDuringSseLag(active, eventLog, {
        viewerUserAddress: "9001",
        callStateMap,
      }),
    ).toBe(true);
    expect(
      pickPinnedSupervisionPayloadFromCallStateMap(
        callStateMap,
        dnsMap,
        active,
      )?.monitoringType,
    ).toBe("SILENT");
    expect(
      resolveWallboardMonitoringForUi(
        active,
        CLEARED_WALLBOARD_MONITORING,
        callStateMap,
        dnsMap,
        eventLog,
        { viewerUserAddress: "9001" },
      ).type,
    ).toBe("SILENT");
  });

  it("hides SILENT Live Coaching from non-monitor viewers", () => {
    const callStateMap = {
      "mon-1": {
        isMonitoring: true,
        monitoring: {
          monitoringType: "SILENT",
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
    const viewerOptions = { viewerUserAddress: "9002" };
    expect(
      isSilentMonitoringVisibleToViewer("SILENT", "9001", "9002"),
    ).toBe(false);
    expect(
      shouldRetainRemoteWallboardMonitoringDuringSseLag(
        {
          monitoredDn: "1001",
          monitorDn: "9001",
          monitoringType: "SILENT",
        },
        callStateMap,
        [
          {
            sequence: 1,
            monitoring: {
              monitoringType: "SILENT",
              monitorDn: "9001",
              monitoredDn: "1001",
            },
          },
        ],
        viewerOptions,
      ),
    ).toBe(false);
    expect(
      resolveEffectiveWallboardMonitoring(
        { dn: null, type: null, deviceName: null },
        callStateMap,
        dnsMap,
        [],
        viewerOptions,
      ),
    ).toEqual(CLEARED_WALLBOARD_MONITORING);
  });

  it("shows SILENT Live Coaching to the monitor who started it", () => {
    const callStateMap = {
      "mon-1": {
        isMonitoring: true,
        monitoring: {
          monitoringType: "SILENT",
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
    expect(
      resolveEffectiveWallboardMonitoring(
        { dn: "1001", type: "SILENT", monitor: "9001", deviceName: "AGT" },
        callStateMap,
        dnsMap,
        [],
        { viewerUserAddress: "9001" },
      ).type,
    ).toBe("SILENT");
  });

  it("retains SILENT wallboard monitoring when only supervisor-agent leg is in callStateMap", () => {
    const callStateMap = {
      "mon-1": {
        isMonitoring: true,
        monitoring: {
          monitoringType: "SILENT",
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
    expect(
      shouldRetainWallboardMonitoringState(
        { dn: "1001", type: "SILENT", monitor: "9001", deviceName: "AGT" },
        callStateMap,
        [],
      ),
    ).toBe(true);
  });

  it("treats SILENT session active with isMonitoring and supervisor-agent leg only", () => {
    const payload = buildWallboardMonitoringPayloadFromEvent(
      [],
      { monitorDn: "9001", monitoredDn: "1001", monitoringType: "SILENT" },
      dnsMap,
    );
    const callStateMap = {
      "mon-1": {
        isMonitoring: true,
        monitoring: {
          monitoringType: "SILENT",
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
    expect(
      isWallboardRemoteSupervisionSessionActive(payload!, callStateMap, []),
    ).toBe(true);
  });

  it("treats SILENT session inactive when customer leg ended (Jabber drop)", () => {
    const payload = buildWallboardMonitoringPayloadFromEvent(
      [],
      { monitorDn: "9001", monitoredDn: "1001", monitoringType: "SILENT" },
      dnsMap,
    );
    const callStateMap = {
      "mon-1": {
        isMonitoring: true,
        monitoring: {
          monitoringType: "SILENT",
          monitorDn: "9001",
          monitoredDn: "1001",
        },
        parties: [
          {
            callStatus: "CONNECTED",
            callingAddress: "9001",
            calledAddress: "1001",
          },
          {
            callStatus: "DROPPED",
            callingAddress: "1001",
            calledAddress: "+15551234567",
          },
        ],
      },
    };
    expect(
      callStateMapHasActiveMonitoringForPair(callStateMap, "9001", "1001"),
    ).toBe(false);
    expect(
      isWallboardRemoteSupervisionSessionActive(payload!, callStateMap, []),
    ).toBe(false);
  });

  it("shouldSkipMonitoringRefillTypeDowngrade blocks older SILENT over newer WHISPER in map", () => {
    const callStateMap = {
      whisper: {
        isMonitoring: true,
        sequence: 50,
        monitoring: {
          monitoringType: "WHISPER",
          monitorDn: "9001",
          monitoredDn: "1001",
        },
      },
      silent: {
        isMonitoring: true,
        sequence: 40,
        monitoring: {
          monitoringType: "SILENT",
          monitorDn: "9001",
          monitoredDn: "1001",
        },
      },
    };
    const active = {
      dn: "1001",
      type: "WHISPER",
      monitor: "9001",
      deviceName: "AGT",
    };
    const incoming = buildWallboardMonitoringPayloadFromEvent(
      [],
      { monitorDn: "9001", monitoredDn: "1001", monitoringType: "SILENT" },
      dnsMap,
    )!;
    expect(
      shouldSkipMonitoringRefillTypeDowngrade(active, incoming, callStateMap),
    ).toBe(true);
    const newerSilent = buildWallboardMonitoringPayloadFromEvent(
      [],
      { monitorDn: "9001", monitoredDn: "1001", monitoringType: "SILENT" },
      dnsMap,
    )!;
    const callStateMapNewSilent = {
      whisper: callStateMap.whisper,
      silent: { ...callStateMap.silent, sequence: 55 },
    };
    expect(
      shouldSkipMonitoringRefillTypeDowngrade(
        active,
        newerSilent,
        callStateMapNewSilent,
      ),
    ).toBe(false);
  });

  it("pickMonitoringPayloadForInitiatorRefill keeps live WHISPER when BARGE has higher sequence", () => {
    const callStateMap = {
      barge: {
        isMonitoring: true,
        sequence: 50,
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
          {
            callStatus: "CONNECTED",
            callingAddress: "1001",
            calledAddress: "+15551234567",
          },
        ],
      },
      whisper: {
        isMonitoring: true,
        sequence: 45,
        monitoring: {
          monitoringType: "WHISPER",
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
    const active = {
      dn: "1001",
      type: "WHISPER",
      monitor: "9001",
      deviceName: "AGT",
    };
    expect(
      pickBestApplicableMonitoringPayload(callStateMap, dnsMap, [], {
        strictRemoteSessionOnly: true,
        activeMonitoringType: null,
      })?.monitoringType,
    ).toBe("BARGE_IN");
    expect(
      pickMonitoringPayloadForInitiatorRefill(
        callStateMap,
        dnsMap,
        [],
        active,
        { viewerUserAddress: "9001" },
      )?.monitoringType,
    ).toBe("WHISPER");
  });

  it("pickMonitoringPayloadForInitiatorRefill returns SILENT after WHISPER when active is SILENT and map has flag", () => {
    const callStateMap = {
      whisper: {
        isMonitoring: true,
        sequence: 50,
        monitoring: {
          monitoringType: "WHISPER",
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
      silent: {
        isMonitoring: true,
        sequence: 55,
        monitoring: {
          monitoringType: "SILENT",
          monitorDn: "9001",
          monitoredDn: "1001",
        },
        parties: [],
      },
    };
    const eventLog = [
      {
        sequence: 50,
        eventType: "MONITORING_ENDED",
        isMonitoring: false,
        monitoring: {
          monitoringType: "WHISPER",
          monitorDn: "9001",
          monitoredDn: "1001",
        },
      },
      {
        sequence: 55,
        isMonitoring: true,
        monitoring: {
          monitoringType: "SILENT",
          monitorDn: "9001",
          monitoredDn: "1001",
        },
      },
    ];
    const active = {
      dn: "1001",
      type: "SILENT",
      monitor: "9001",
      deviceName: "AGT",
    };
    expect(
      pickMonitoringPayloadForInitiatorRefill(
        callStateMap,
        dnsMap,
        eventLog,
        active,
        { viewerUserAddress: "9001" },
      )?.monitoringType,
    ).toBe("SILENT");
    expect(
      deriveWallboardMonitoringState(active, callStateMap, dnsMap, eventLog, {
        viewerUserAddress: "9001",
      }).supervisionSessionActive,
    ).toBe(true);
  });

  it("pickMonitoringPayloadForInitiatorRefill skips stale SILENT pin after terminal clear", () => {
    const callStateMap = {
      stale: {
        isMonitoring: true,
        sequence: 7126,
        monitoring: {
          monitoringType: "SILENT",
          monitorDn: "9001",
          monitoredDn: "1001",
        },
        parties: [],
      },
    };
    const eventLog = [
      {
        sequence: 7126,
        eventType: "MONITORING_ENDED",
        isMonitoring: false,
        monitoring: {
          monitoringType: "SILENT",
          monitorDn: "9001",
          monitoredDn: "1001",
        },
      },
    ];
    const active = {
      dn: "1001",
      type: "SILENT",
      monitor: "9001",
      deviceName: "AGT",
    };
    expect(
      pickMonitoringPayloadForInitiatorRefill(
        callStateMap,
        dnsMap,
        eventLog,
        active,
        { viewerUserAddress: "9001" },
      ),
    ).toBeNull();
  });

  it("prefers WHISPER over older BARGE_IN in callStateMap by sequence", () => {
    const callStateMap = {
      barge: {
        isMonitoring: true,
        sequence: 30,
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
          {
            callStatus: "CONNECTED",
            callingAddress: "1001",
            calledAddress: "+15551234567",
          },
        ],
      },
      whisper: {
        isMonitoring: true,
        sequence: 50,
        monitoring: {
          monitoringType: "WHISPER",
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
    const bargePayload = buildWallboardMonitoringPayloadFromEvent(
      [],
      { monitorDn: "9001", monitoredDn: "1001", monitoringType: "BARGE_IN" },
      dnsMap,
    )!;
    const whisperPayload = buildWallboardMonitoringPayloadFromEvent(
      [],
      { monitorDn: "9001", monitoredDn: "1001", monitoringType: "WHISPER" },
      dnsMap,
    )!;
    expect(
      isWallboardRemoteSupervisionSessionActive(bargePayload, callStateMap, []),
    ).toBe(false);
    expect(
      isWallboardRemoteSupervisionSessionActive(whisperPayload, callStateMap, []),
    ).toBe(true);
    expect(
      pickBestApplicableMonitoringPayload(callStateMap, dnsMap, [], {
        viewerUserAddress: "9002",
        activeMonitoringType: null,
        strictRemoteSessionOnly: true,
      })?.monitoringType,
    ).toBe("WHISPER");
    const derived = deriveWallboardMonitoringState(
      { dn: null, type: null, deviceName: null },
      callStateMap,
      dnsMap,
      [],
      { viewerUserAddress: "9002" },
    );
    expect(derived.ui.type).toBe("WHISPER");
    expect(derived.effective.type).toBe("WHISPER");
  });

  it("pickBestApplicableMonitoringPayload finds live WHISPER when stale SILENT type pin is cleared", () => {
    const callStateMap = {
      live: {
        isMonitoring: true,
        sequence: 50,
        monitoring: {
          monitoringType: "WHISPER",
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
    const eventLog = [
      {
        sequence: 10,
        isMonitoring: true,
        monitoring: {
          monitoringType: "SILENT",
          monitorDn: "9001",
          monitoredDn: "1001",
        },
      },
      {
        sequence: 20,
        eventType: "MONITORING_ENDED",
        isMonitoring: false,
        monitoring: {
          monitoringType: "SILENT",
          monitorDn: "9001",
          monitoredDn: "1001",
        },
      },
    ];
    const baseOpts = {
      viewerUserAddress: "9001",
      callStateMap,
      eventLog,
      activeMonitoring: {
        dn: "1001",
        monitor: "9001",
        deviceName: "AGT",
        type: "SILENT" as const,
      },
      strictRemoteSessionOnly: true,
    };
    expect(
      pickBestApplicableMonitoringPayload(callStateMap, dnsMap, eventLog, {
        ...baseOpts,
        activeMonitoringType: "SILENT",
      })?.monitoringType,
    ).not.toBe("WHISPER");
    expect(
      pickBestApplicableMonitoringPayload(callStateMap, dnsMap, eventLog, {
        ...baseOpts,
        activeMonitoring: { ...baseOpts.activeMonitoring, type: null },
        activeMonitoringType: null,
        effectiveMonitoringType: null,
      })?.monitoringType,
    ).toBe("WHISPER");
  });
});
