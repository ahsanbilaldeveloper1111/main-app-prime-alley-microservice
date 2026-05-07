/** Safe localStorage access for CTI (SSR + private mode). */

export const ctiSafeLocalStorage = {
  getItem: (key: string): string | null => {
    if (globalThis.window === undefined) return null;
    try {
      return localStorage.getItem(key);
    } catch (err) {
      console.warn("[useCtiStomp] localStorage.getItem failed", key, err);
      return null;
    }
  },
  removeItem: (key: string): void => {
    if (globalThis.window === undefined) return;
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.warn("[useCtiStomp] localStorage.removeItem failed", key, err);
    }
  },
};
