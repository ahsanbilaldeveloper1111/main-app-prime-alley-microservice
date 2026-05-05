import { isSameCtiCallForActiveLookup } from "../../utils/incomingCallMatching";
import type { IncomingCallData } from "../../contexts/IncomingCallContext";
import type {
  CtiActiveCallEntry,
  CtiDnsDevice,
  DnsMapLike,
} from "./layoutTypes";

export function findMatchingActiveCall(
  activeCalls: Map<string, CtiActiveCallEntry>,
  incomingCall: IncomingCallData,
): CtiActiveCallEntry | undefined {
  const calls = Array.from(activeCalls.values());
  return calls.find((call) => isSameCtiCallForActiveLookup(call, incomingCall));
}

export function findAnsweredIncomingCall(
  activeCalls: Map<string, CtiActiveCallEntry>,
  incomingCall: IncomingCallData,
): CtiActiveCallEntry | undefined {
  const calls = Array.from(activeCalls.values()) as CtiActiveCallEntry[];
  return calls.find((call) => {
    const sameCall =
      call.callId === incomingCall.callId ||
      (call.callingAddress === incomingCall.callingAddress &&
        call.calledAddress === incomingCall.calledAddress);
    const notRinging = call.status && call.status !== "ringing";
    return Boolean(sameCall && notRinging);
  });
}

export function getNotificationsOverflowLabel(totalUnreadCount: number): string {
  if (totalUnreadCount <= 0) {
    return "Notifications";
  }

  const countLabel = totalUnreadCount > 99 ? "99+" : String(totalUnreadCount);
  return `Notifications (${countLabel})`;
}

export function getUserDevicesFromDnsMap(
  dnsMap: DnsMapLike,
  userAddress: string | undefined | null,
): CtiDnsDevice[] {
  const userDeviceInfo = dnsMap?.[userAddress || ""];
  if (!userDeviceInfo?.devices) return [];
  return Object.values(userDeviceInfo.devices);
}

export function pickControllerDevice(
  userDevices: CtiDnsDevice[],
  preferredDeviceName?: string | null,
): CtiDnsDevice | null {
  if (!userDevices.length) return null;
  if (preferredDeviceName) {
    const match = userDevices.find(
      (device) => device.deviceName === preferredDeviceName,
    );
    if (match) return match;
  }
  return (
    userDevices.find((device) => device.terminalState === "REGISTERED") ||
    userDevices[0] ||
    null
  );
}
