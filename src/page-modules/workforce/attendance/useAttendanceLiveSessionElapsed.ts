import { useEffect, useMemo, useState } from "react";

/** Elapsed time since check-in, updates every second while `checkInAtIso` is set (HH:MM:SS). */
export function useAttendanceLiveSessionElapsed(checkInAtIso: string | null | undefined): string {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!checkInAtIso) return;
    const id = globalThis.setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => globalThis.clearInterval(id);
  }, [checkInAtIso]);

  return useMemo(() => {
    if (!checkInAtIso) return "";
    const start = Date.parse(checkInAtIso);
    if (Number.isNaN(start)) return "";
    const totalSec = Math.max(0, Math.floor((Date.now() - start) / 1000));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const hPart = h < 100 ? String(h).padStart(2, "0") : String(h);
    return `${hPart}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [checkInAtIso, tick]);
}
