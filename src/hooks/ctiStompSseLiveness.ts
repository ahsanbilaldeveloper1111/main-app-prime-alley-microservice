/** SSE liveness tracking shared by primary and deferred CTI stream handlers. */

type SsePayload = {
  type?: string;
};

/**
 * Updates last-message time for connection health checks.
 * Server keep-alive uses `ping` every few seconds; those must count as liveness.
 */
export function touchCtiSseLastMessageTime(
  data: SsePayload,
  lastMessageTimeRef: { current: number | null },
): void {
  const type = data.type;
  if (
    type === "ping" ||
    type === "test" ||
    type === "stomp_connected" ||
    type === "connection"
  ) {
    lastMessageTimeRef.current = Date.now();
    return;
  }
  if (type) {
    lastMessageTimeRef.current = Date.now();
  }
}
