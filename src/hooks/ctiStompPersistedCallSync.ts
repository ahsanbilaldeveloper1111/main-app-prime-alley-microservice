import type { Client } from "@stomp/stompjs";

/** Push persisted call IDs to STOMP — lifted from useCtiStomp syncPersistedCallStates. */
export function syncPersistedCtiCallStatesToStomp(
  client: Client | null,
  storageKey: string,
): void {
  try {
    const storedCallStates = localStorage.getItem(storageKey);
    if (!storedCallStates) return;

    const parsedCallStates = JSON.parse(storedCallStates) as Record<
      string,
      unknown
    >;

    if (!client?.connected) {
      return;
    }
    Object.keys(parsedCallStates).forEach((callId) => {
      client.publish({
        destination: "/app/request/call-state",
        body: JSON.stringify({ callId }),
      });
    });
  } catch (error) {
    console.warn("[useCtiStomp] syncPersistedCallStates failed", error);
  }
}
