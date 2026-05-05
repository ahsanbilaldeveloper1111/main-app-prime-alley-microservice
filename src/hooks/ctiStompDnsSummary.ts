import type { CtiDevice } from "./ctiStompHookTypes";

type DnsGrouped = Record<
  string,
  { dn: string; devices: Record<string, CtiDevice> }
>;

/** Aggregate counts for summary strip — lifted from useCtiStomp updateSummaryData. */
export function summarizeCtiDnsDevices(dns: DnsGrouped): {
  extensions: number;
  online: number;
  offline: number;
  connected: number;
  on_hold: number;
  answered: number;
  incoming: number;
  incomingEvents: number;
} {
  let extensions = 0;
  let online = 0;
  let offline = 0;
  let connected = 0;
  let on_hold = 0;
  let answered = 0;
  const incoming = 0;
  const incomingEvents = 0;

  extensions = Object.keys(dns).length;

  Object.values(dns).forEach((dnData) => {
    Object.values(dnData.devices).forEach((device) => {
      if (device.terminalState === "REGISTERED") online++;
      if (device.terminalState === "UNREGISTERED") offline++;
      if (device.status === "CONNECTED") connected++;
      if (device.status === "ON_HOLD") on_hold++;
      if (device.status === "ANSWERED") answered++;
    });
  });

  return {
    extensions,
    online,
    offline,
    connected,
    on_hold,
    answered,
    incoming,
    incomingEvents,
  };
}
