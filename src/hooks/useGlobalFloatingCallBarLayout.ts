import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useMemo,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  clampFloatingBarPositionToViewport,
  buildFloatingBarPositionStyles,
} from "@components/globalFloatingCallBarPosition";
import { FLOATING_CALL_BAR_POSITION_STORAGE_KEY } from "@components/globalFloatingCallBarConstants";

export type UseGlobalFloatingCallBarLayoutArgs = {
  floatingBarVisible: boolean;
  activeCallCallId: string | undefined;
  incomingSessionCallId: string | undefined;
};

export function useGlobalFloatingCallBarLayout({
  floatingBarVisible,
  activeCallCallId,
  incomingSessionCallId,
}: UseGlobalFloatingCallBarLayoutArgs) {
  const [barPosition, setBarPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastDragPositionRef = useRef<{ x: number; y: number } | null>(null);
  const prevFloatingBarActiveCallIdRef = useRef<string | undefined>(undefined);

  const resetFloatingBarAnchorToDefault = useCallback(() => {
    setBarPosition(null);
    setDragPosition(null);
    setIsDragging(false);
    isDraggingRef.current = false;
    lastDragPositionRef.current = null;
    try {
      localStorage.removeItem(FLOATING_CALL_BAR_POSITION_STORAGE_KEY);
    } catch {
      // ignore storage failures (private mode, quota)
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(FLOATING_CALL_BAR_POSITION_STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as { x?: number; y?: number } | string;
      if (parsed && typeof parsed === "object" && typeof parsed.x === "number" && typeof parsed.y === "number") {
        setBarPosition({ x: parsed.x, y: parsed.y });
      }
    } catch {
      // ignore invalid JSON or legacy "top"/"bottom" etc.
    }
  }, []);

  useEffect(() => {
    try {
      if (barPosition) {
        localStorage.setItem(FLOATING_CALL_BAR_POSITION_STORAGE_KEY, JSON.stringify(barPosition));
      } else {
        localStorage.removeItem(FLOATING_CALL_BAR_POSITION_STORAGE_KEY);
      }
    } catch {
      // ignore storage failures
    }
  }, [barPosition]);

  isDraggingRef.current = isDragging;

  const handleDragStart = useCallback((e: ReactMouseEvent) => {
    if (!barRef.current) return;

    const rect = barRef.current.getBoundingClientRect();
    const initial = barPosition
      ? { x: barPosition.x, y: barPosition.y }
      : { x: Math.round(rect.left), y: Math.round(rect.top) };
    isDraggingRef.current = true;
    lastDragPositionRef.current = initial;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - initial.x,
      y: e.clientY - initial.y,
    });
    setDragPosition(initial);
    e.preventDefault();
    e.stopPropagation();
  }, [barPosition]);

  const handleDragEnd = useCallback(() => {
    if (!isDraggingRef.current || !barRef.current) return;
    isDraggingRef.current = false;

    const barRect = barRef.current.getBoundingClientRect();
    setDragPosition(null);
    setIsDragging(false);
    const raw = lastDragPositionRef.current ?? { x: barRect.left, y: barRect.top };
    lastDragPositionRef.current = null;
    const saved = clampFloatingBarPositionToViewport(raw, barRect.width, barRect.height);
    setBarPosition(saved);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newLeft = e.clientX - dragStart.x;
      const newTop = e.clientY - dragStart.y;
      let pos = { x: newLeft, y: newTop };
      if (barRef.current) {
        const { width, height } = barRef.current.getBoundingClientRect();
        pos = clampFloatingBarPositionToViewport(pos, width, height);
      }
      lastDragPositionRef.current = pos;
      setDragPosition(pos);
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    globalThis.addEventListener("mousemove", handleMouseMove);
    globalThis.addEventListener("mouseup", handleMouseUp);
    globalThis.addEventListener("mouseleave", handleMouseUp);

    return () => {
      globalThis.removeEventListener("mousemove", handleMouseMove);
      globalThis.removeEventListener("mouseup", handleMouseUp);
      globalThis.removeEventListener("mouseleave", handleMouseUp);
    };
  }, [isDragging, dragStart, handleDragEnd]);

  const sectionStyle = useMemo((): CSSProperties => {
    const base = buildFloatingBarPositionStyles(barPosition, isDragging, dragPosition);
    if (isDragging && dragPosition) {
      return {
        ...base,
        "--bar-drag-left": `${dragPosition.x}px`,
        "--bar-drag-top": `${dragPosition.y}px`,
        "--bar-drag-right": "auto",
      } as CSSProperties;
    }
    return base;
  }, [barPosition, isDragging, dragPosition]);

  const barVisibleBeforeIncomingRef = useRef(false);
  useEffect(() => {
    if (!incomingSessionCallId) {
      barVisibleBeforeIncomingRef.current = floatingBarVisible;
    }
  }, [floatingBarVisible, incomingSessionCallId]);

  useEffect(() => {
    if (!incomingSessionCallId) {
      return;
    }
    if (barVisibleBeforeIncomingRef.current) {
      return;
    }
    resetFloatingBarAnchorToDefault();
  }, [incomingSessionCallId, resetFloatingBarAnchorToDefault]);

  useEffect(() => {
    const id = activeCallCallId;
    const prev = prevFloatingBarActiveCallIdRef.current;
    prevFloatingBarActiveCallIdRef.current = id;
    if (!prev || id) {
      return;
    }
    resetFloatingBarAnchorToDefault();
  }, [activeCallCallId, resetFloatingBarAnchorToDefault]);

  const useDefaultFloatingBarAnchor = !barPosition && !isDragging && !dragPosition;

  useLayoutEffect(() => {
    if (!floatingBarVisible || !barPosition || !barRef.current) {
      return;
    }
    const { width, height } = barRef.current.getBoundingClientRect();
    const next = clampFloatingBarPositionToViewport(barPosition, width, height);
    if (next.x !== barPosition.x || next.y !== barPosition.y) {
      setBarPosition(next);
    }
  }, [floatingBarVisible, barPosition, activeCallCallId]);

  useEffect(() => {
    const onResize = () => {
      setBarPosition((prev) => {
        if (!prev) {
          return prev;
        }
        const el = barRef.current;
        if (!el) {
          return prev;
        }
        const { width, height } = el.getBoundingClientRect();
        const next = clampFloatingBarPositionToViewport(prev, width, height);
        if (next.x === prev.x && next.y === prev.y) {
          return prev;
        }
        return next;
      });
    };
    globalThis.window.addEventListener("resize", onResize);
    return () => globalThis.window.removeEventListener("resize", onResize);
  }, []);

  return {
    barRef,
    sectionStyle,
    useDefaultFloatingBarAnchor,
    handleDragStart,
    isDragging,
    dragPosition,
  };
}
