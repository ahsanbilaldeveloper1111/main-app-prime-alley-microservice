let fallbackCounter = 0;

export function createNonPrngId(scope: string) {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return `${uuid}-${scope}`;

  const buf = globalThis.crypto?.getRandomValues?.(new Uint8Array(16));
  if (buf) {
    const hex = Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex}-${scope}`;
  }

  fallbackCounter += 1;
  return `${Date.now()}-${fallbackCounter}-${scope}`;
}

