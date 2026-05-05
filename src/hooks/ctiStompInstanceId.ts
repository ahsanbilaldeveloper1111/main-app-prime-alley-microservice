let ctiStompInstanceCounter = 0;

/**
 * Cryptographically strong random suffix for instance IDs.
 * IDs are used for logging and hook instance correlation only, not auth tokens,
 * but we avoid Math.random() so IDs are not predictable from snapshots of prior IDs.
 */
function randomInstanceSuffix(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Extremely old environments only; counter + Date.now() still limit collision risk
  return Math.random().toString(36).slice(2, 11);
}

export function generateCtiStompInstanceId(): string {
  ctiStompInstanceCounter++;
  return `cti-stomp-${ctiStompInstanceCounter}-${Date.now()}-${randomInstanceSuffix()}`;
}
