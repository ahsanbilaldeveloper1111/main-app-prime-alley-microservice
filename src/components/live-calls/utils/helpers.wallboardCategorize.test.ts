import { describe, it, expect } from "vitest";
import { categorizeDns } from "./helpers";
import type { CtiDevice } from "./types";

const devices: CtiDevice[] = [
  {
    dn: "9001",
    deviceName: "SUP",
    status: "online",
    terminalState: "REGISTERED",
    deviceType: "IP_PHONE",
  },
];

describe("categorizeDns — SILENT / WHISPER Live Coaching", () => {
  it("places supervisor in supervision when whisper session is active but legs are not in callStateMap yet", () => {
    const section = categorizeDns({
      dn: "9001",
      devices,
      call: null,
      active: false,
      activeMonitoring: {
        dn: "1001",
        type: "WHISPER",
        monitor: "9001",
        deviceName: "AGT",
      },
      getCallStateForDevice: () => null,
      getCallStatesForDn: () => [],
      supervisionSessionActive: true,
    });
    expect(section).toBe("supervision");
  });

  it("places supervisor in supervision with whisper observation leg only (no customer on row)", () => {
    const section = categorizeDns({
      dn: "9001",
      devices,
      call: null,
      active: false,
      activeMonitoring: {
        dn: "1001",
        type: "WHISPER",
        monitor: "9001",
        deviceName: "AGT",
      },
      getCallStateForDevice: () => null,
      getCallStatesForDn: (dn) => {
        if (dn === "1001") {
          return [
            {
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
              ],
            },
          ];
        }
        return [];
      },
      supervisionSessionActive: false,
    });
    expect(section).toBe("supervision");
  });

  it("places supervisor in supervision for whisper when supervisionSessionActive but legs lag", () => {
    const section = categorizeDns({
      dn: "9001",
      devices,
      call: null,
      active: true,
      activeMonitoring: {
        dn: "1001",
        type: "WHISPER",
        monitor: "9001",
        deviceName: "AGT",
      },
      getCallStateForDevice: () => ({
        parties: [],
        isTerminating: false,
      }),
      getCallStatesForDn: () => [],
      supervisionSessionActive: true,
    });
    expect(section).toBe("supervision");
  });

  it("places supervisor in supervision for barge when supervisionSessionActive but legs lag", () => {
    const section = categorizeDns({
      dn: "9001",
      devices,
      call: null,
      active: true,
      activeMonitoring: {
        dn: "1001",
        type: "BARGE_IN",
        monitor: "9001",
        deviceName: "AGT",
      },
      getCallStateForDevice: () => ({ parties: [], isTerminating: false }),
      getCallStatesForDn: () => [],
      supervisionSessionActive: true,
    });
    expect(section).toBe("supervision");
  });

  it("does not place supervisor in supervision when whisper session has ended", () => {
    const section = categorizeDns({
      dn: "9001",
      devices,
      call: null,
      active: false,
      activeMonitoring: {
        dn: "1001",
        type: "WHISPER",
        monitor: "9001",
        deviceName: "AGT",
      },
      getCallStateForDevice: () => null,
      getCallStatesForDn: () => [],
      supervisionSessionActive: false,
    });
    expect(section).not.toBe("supervision");
  });

  it("places supervisor in supervision for silent when supervisionSessionActive but legs lag", () => {
    const section = categorizeDns({
      dn: "9001",
      devices,
      call: null,
      active: true,
      activeMonitoring: {
        dn: "1001",
        type: "SILENT",
        monitor: "9001",
        deviceName: "AGT",
      },
      getCallStateForDevice: () => ({ parties: [], isTerminating: false }),
      getCallStatesForDn: () => [],
      supervisionSessionActive: true,
    });
    expect(section).toBe("supervision");
  });

  it("does not place supervisor in supervision when silent session has ended", () => {
    const section = categorizeDns({
      dn: "9001",
      devices,
      call: null,
      active: false,
      activeMonitoring: {
        dn: "1001",
        type: "SILENT",
        monitor: "9001",
        deviceName: "AGT",
      },
      getCallStateForDevice: () => null,
      getCallStatesForDn: () => [],
      supervisionSessionActive: false,
    });
    expect(section).not.toBe("supervision");
  });
});
