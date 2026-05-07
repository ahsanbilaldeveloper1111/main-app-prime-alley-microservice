let ctiStompInstanceCounter = 0;
/** Used only when Web Crypto is missing; monotonic + optional performance.now for same-ms IDs. */
let ctiStompNoCryptoSuffixSeq = 0;

/**
 * Random suffix for instance IDs using Web Crypto when available.
 * IDs are for logging / hook correlation only (not auth secrets). Prefer CSPRNG when present.
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
  // No Web Crypto: avoid Math.random() (non-cryptographic / predictable). Full id is still unique
  // via generateCtiStompInstanceId's counter and Date.now().
  ctiStompNoCryptoSuffixSeq += 1;
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return `${ctiStompNoCryptoSuffixSeq}-${performance.now()}`;
  }
  return String(ctiStompNoCryptoSuffixSeq);
}
export function generateCtiStompInstanceId(): string {
  ctiStompInstanceCounter++;
  return `cti-stomp-${ctiStompInstanceCounter}-${Date.now()}-${randomInstanceSuffix()}`;
}
