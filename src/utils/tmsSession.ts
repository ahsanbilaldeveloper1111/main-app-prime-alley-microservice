export interface TmsSessionData {
  accessToken: string;
  expiresAt: number; // epoch seconds
  user?: {
    id?: string;
    name?: string;
    email?: string;
    [key: string]: any;
  };
}

const TMS_SESSION_STORAGE_KEY = 'tmsSession';

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export const tmsSession = {
  save(session: TmsSessionData): void {
    try {
      if (typeof window === 'undefined') return;
      window.sessionStorage.setItem(TMS_SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch (err) {
      // Fallback to localStorage if sessionStorage is not available
      try {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(TMS_SESSION_STORAGE_KEY, JSON.stringify(session));
      } catch (_) {
        // Ignore
      }
    }
  },

  load(): TmsSessionData | null {
    try {
      if (typeof window === 'undefined') return null;
      const raw = window.sessionStorage.getItem(TMS_SESSION_STORAGE_KEY) || window.localStorage.getItem(TMS_SESSION_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as TmsSessionData;
    } catch {
      return null;
    }
  },

  clear(): void {
    try {
      if (typeof window === 'undefined') return;
      window.sessionStorage.removeItem(TMS_SESSION_STORAGE_KEY);
      window.localStorage.removeItem(TMS_SESSION_STORAGE_KEY);
    } catch {
      // Ignore
    }
  },

  isValid(): boolean {
    const s = this.load();
    if (!s) return false;
    return !!s.accessToken && s.expiresAt > nowSeconds();
  },

  getRemainingSeconds(): number {
    const s = this.load();
    if (!s) return 0;
    return Math.max(0, s.expiresAt - nowSeconds());
  }
};
