/**
 * One shared interval for all useCtiStomp instances — avoids N× polling when many consumers mount.
 */

const masterTabStatusPollListeners = new Set<() => void>();
let masterTabStatusPollIntervalId: ReturnType<typeof setInterval> | null = null;

export function subscribeMasterTabStatusPoll(onTick: () => void): () => void {
  masterTabStatusPollListeners.add(onTick);
  masterTabStatusPollIntervalId ??= setInterval(() => {
    masterTabStatusPollListeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.warn("[useCtiStomp] master tab poll listener failed", e);
      }
    });
  }, 2000);
  return () => {
    masterTabStatusPollListeners.delete(onTick);
    if (
      masterTabStatusPollListeners.size === 0 &&
      masterTabStatusPollIntervalId !== null
    ) {
      clearInterval(masterTabStatusPollIntervalId);
      masterTabStatusPollIntervalId = null;
    }
  };
}
