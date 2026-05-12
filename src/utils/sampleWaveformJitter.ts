/**
 * Pseudo-random jitter in [0, maxPx) for mock chart samples.
 * Uses Web Crypto when available (Sonar S2245: avoids Math.random in security-sensitive scans).
 */
export function sampleWaveformJitterPx(maxPx: number): number {
  const c = globalThis.crypto;
  if (c?.getRandomValues) {
    const u = new Uint32Array(1);
    c.getRandomValues(u);
    const v = u[0] ?? 0;
    return (v / 2 ** 32) * maxPx;
  }
  return maxPx / 2;
}
