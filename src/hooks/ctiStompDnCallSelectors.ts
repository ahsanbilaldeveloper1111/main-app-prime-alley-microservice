import type { CtiCallEvent } from "./ctiStompHookTypes";
import { pickMostRecentCall } from "./ctiStompHelpers";

type Party = Record<string, unknown>;

/** Calls involving DN — lifted from useCtiStomp for cognitive complexity. */
export function getCallStatesForDnFromMap(
  callStateMap: Record<string, CtiCallEvent>,
  dn: string,
): CtiCallEvent[] {
  return Object.values(callStateMap).filter((call) => {
    if (call.isTerminating) return false;

    if (call.currentState === "RINGING") {
      return Boolean(
        call.parties?.some(
          (p: Party) =>
            (p.callingAddress === dn || p.calledAddress === dn) &&
            (p.callStatus === "RINGING" ||
              (p.callStatus !== "DROPPED" && p.callStatus !== "DISCONNECTED")),
        ),
      );
    }

    return Boolean(
      call.parties?.some(
        (p: Party) =>
          (p.callingAddress === dn || p.calledAddress === dn) &&
          p.callStatus !== "DROPPED" &&
          p.callStatus !== "DISCONNECTED",
      ),
    );
  });
}

export function hasActiveCallsInMap(
  callStateMap: Record<string, CtiCallEvent>,
  dn: string,
): boolean {
  return Object.values(callStateMap).some((call) => {
    if (call.isTerminating) return false;

    return Boolean(
      call.parties?.some(
        (p: Party) =>
          (p.callingAddress === dn || p.calledAddress === dn) &&
          p.callStatus !== "DROPPED" &&
          p.callStatus !== "DISCONNECTED",
      ),
    );
  });
}

/** Most recent call state for DN — lifted from useCtiStomp. */
export function getDnCallStateFromMap(
  callStateMap: Record<string, CtiCallEvent>,
  dn: string,
): (CtiCallEvent & { role: string; isActive: boolean }) | null {
  const calls = getCallStatesForDnFromMap(callStateMap, dn);
  if (!calls.length) return null;

  const activeCalls = calls.filter((call) => {
    if (call.isTerminating) return false;

    const dnParties =
      call.parties?.filter(
        (p: Party) =>
          (p.callingAddress === dn || p.calledAddress === dn) &&
          p.callStatus !== "DROPPED" &&
          p.callStatus !== "DISCONNECTED",
      ) || [];

    return dnParties.length > 0;
  });

  if (!activeCalls.length) return null;

  const mostRecent = pickMostRecentCall(activeCalls);

  const matchedParty = mostRecent.parties.find(
    (p: Party) =>
      (p.callingAddress === dn || p.calledAddress === dn) &&
      p.callStatus !== "DROPPED" &&
      p.callStatus !== "DISCONNECTED",
  );

  if (!matchedParty) return null;

  const activeParties = mostRecent.parties.filter(
    (p: Party) =>
      p.callStatus !== "DROPPED" && p.callStatus !== "DISCONNECTED",
  );

  if (activeParties.length === 0) return null;

  return {
    ...mostRecent,
    parties: activeParties,
    role: matchedParty.callingAddress === dn ? "calling" : "called",
    isActive: true,
  };
}

/** Call state for a DN + device — lifted from useCtiStomp. */
export function getCallStateForDeviceFromMap(
  callStateMap: Record<string, CtiCallEvent>,
  dn: string,
  deviceName: string,
): (CtiCallEvent & { role: string; isActive: boolean }) | null {
  const calls = Object.values(callStateMap);
  const filtered = calls.filter((call) =>
    call.parties?.some(
      (p: Party) =>
        ((p.callingAddress === dn && p.callingDeviceName === deviceName) ||
          (p.calledAddress === dn && p.calledDeviceName === deviceName)) &&
        p.callStatus !== "DROPPED",
    ),
  );

  if (!filtered.length) return null;

  const mostRecent = pickMostRecentCall(filtered);

  const matchedParty = mostRecent.parties.find(
    (p: Party) =>
      ((p.callingAddress === dn && p.callingDeviceName === deviceName) ||
        (p.calledAddress === dn && p.calledDeviceName === deviceName)) &&
      p.callStatus !== "DROPPED",
  );

  if (!matchedParty) return null;

  const activeParties = mostRecent.parties.filter(
    (p: Party) =>
      p.callStatus !== "DROPPED" && p.callStatus !== "DISCONNECTED",
  );

  if (activeParties.length === 0) return null;

  return {
    ...mostRecent,
    parties: activeParties,
    role: matchedParty.callingAddress === dn ? "calling" : "called",
    isActive: true,
  };
}
