import { describe, it, expect } from "vitest";
import {
  agentHasLiveCustomerConversationInMap,
  callHasLiveAgentPartyWithNonSupervisor,
  dnHasLiveCustomerConversationOnCall,
  shouldPruneSupervisionOrStaleObservationCall,
  shouldTerminateSupervisionCallWithoutCustomer,
  supervisionCustomerConversationEnded,
} from "./ctiMonitoringCallParties";

describe("supervision hang-up from Jabber", () => {
  const supervisor = "9001";
  const agent = "1001";
  const customer = "+15551234567";

  it("detects live customer leg on agent call", () => {
    const call = {
      parties: [
        {
          callStatus: "CONNECTED",
          callingAddress: agent,
          calledAddress: customer,
        },
      ],
    };
    expect(
      callHasLiveAgentPartyWithNonSupervisor(call, agent, supervisor),
    ).toBe(true);
  });

  it("terminates SILENT monitoring when only supervisor leg remains", () => {
    const map = {
      "mon-1": {
        isMonitoring: true,
        monitoring: {
          monitoringType: "SILENT",
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
    expect(agentHasLiveCustomerConversationInMap(map, agent, supervisor)).toBe(
      false,
    );
    expect(
      shouldPruneSupervisionOrStaleObservationCall(map["mon-1"], map),
    ).toBe(true);
    expect(
      shouldTerminateSupervisionCallWithoutCustomer(map["mon-1"], map),
    ).toBe(true);
  });

  it("prunes on explicit MONITORING_ENDED semantics (isMonitoring false + supervision type)", () => {
    const map = {
      "mon-1": {
        isMonitoring: false,
        monitoring: {
          monitoringType: "WHISPER",
          monitorDn: supervisor,
          monitoredDn: agent,
        },
        parties: [
          {
            callStatus: "CONNECTED",
            callingAddress: supervisor,
            calledAddress: agent,
          },
        ],
      },
    };
    expect(shouldPruneSupervisionOrStaleObservationCall(map["mon-1"], map)).toBe(
      true,
    );
  });

  it("prunes when isMonitoring cleared but supervisor↔agent leg still CONNECTED (Jabber drop)", () => {
    const map = {
      "mon-1": {
        isMonitoring: false,
        monitoring: {
          monitoringType: "BARGE_IN",
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
    expect(shouldPruneSupervisionOrStaleObservationCall(map["mon-1"], map)).toBe(
      true,
    );
    expect(dnHasLiveCustomerConversationOnCall(map["mon-1"], agent)).toBe(false);
  });

  it("supervisionCustomerConversationEnded ignores DROPPED customer on unrelated prior call", () => {
    const map = {
      "old-call": {
        parties: [
          {
            callStatus: "DROPPED",
            callingAddress: agent,
            calledAddress: customer,
          },
        ],
      },
      "mon-1": {
        isMonitoring: true,
        monitoring: {
          monitoringType: "SILENT",
          monitorDn: supervisor,
          monitoredDn: agent,
        },
        parties: [
          {
            callStatus: "CONNECTED",
            callingAddress: supervisor,
            calledAddress: agent,
          },
        ],
      },
    };
    expect(
      supervisionCustomerConversationEnded(map["mon-1"], map, agent, supervisor),
    ).toBe(false);
  });

  it("supervisionCustomerConversationEnded is false when only supervisor-agent leg exists (session start)", () => {
    const map = {
      "mon-1": {
        isMonitoring: true,
        monitoring: {
          monitoringType: "SILENT",
          monitorDn: supervisor,
          monitoredDn: agent,
        },
        parties: [
          {
            callStatus: "CONNECTED",
            callingAddress: supervisor,
            calledAddress: agent,
          },
        ],
      },
    };
    expect(
      supervisionCustomerConversationEnded(map["mon-1"], map, agent, supervisor),
    ).toBe(false);
  });

  it("supervisionCustomerConversationEnded is true when customer is DROPPED on the supervision call", () => {
    const map = {
      "mon-1": {
        isMonitoring: true,
        monitoring: {
          monitoringType: "SILENT",
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
      supervisionCustomerConversationEnded(map["mon-1"], map, agent, supervisor),
    ).toBe(true);
  });

  it("does not terminate WHISPER while customer is still live on another row", () => {
    const map = {
      "agent-customer": {
        parties: [
          {
            callStatus: "CONNECTED",
            callingAddress: agent,
            calledAddress: customer,
          },
        ],
      },
      "mon-1": {
        isMonitoring: true,
        monitoring: {
          monitoringType: "WHISPER",
          monitorDn: supervisor,
          monitoredDn: agent,
        },
        parties: [
          {
            callStatus: "CONNECTED",
            callingAddress: supervisor,
            calledAddress: agent,
          },
        ],
      },
    };
    expect(
      shouldTerminateSupervisionCallWithoutCustomer(map["mon-1"], map),
    ).toBe(false);
  });
});
