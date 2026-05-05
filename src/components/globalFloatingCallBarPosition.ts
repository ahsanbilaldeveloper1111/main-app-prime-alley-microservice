import type { CSSProperties } from "react";
import { FLOATING_BAR_VIEWPORT_GUTTER_PX } from "./globalFloatingCallBarConstants";

export function clampFloatingBarPositionToViewport(
  pos: { x: number; y: number },
  barWidth: number,
  barHeight: number,
  margin = 8,
): { x: number; y: number } {
  const win = globalThis.window;
  if (win === undefined || barWidth <= 0 || barHeight <= 0) {
    return pos;
  }
  const vw = win.innerWidth;
  const vh = win.innerHeight;
  const maxX = Math.max(margin, vw - barWidth - margin);
  const maxY = Math.max(margin, vh - barHeight - margin);
  return {
    x: Math.min(Math.max(margin, pos.x), maxX),
    y: Math.min(Math.max(margin, pos.y), maxY),
  };
}

export function buildFloatingBarPositionStyles(
  barPosition: { x: number; y: number } | null,
  isDragging: boolean,
  dragPosition: { x: number; y: number } | null,
): CSSProperties {
  const baseStyles: CSSProperties = {
    position: "fixed",
    zIndex: 9999,
    backgroundColor: "#fff",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    transition: isDragging ? "none" : "all 0.3s ease",
    cursor: isDragging ? "grabbing" : "grab",
    border: "none",
    visibility: "visible",
    opacity: 1,
    borderRadius: "1.5rem",
    padding: "0.5rem 1rem",
    gap: "clamp(0.5rem, 2vw, 1rem)",
    boxSizing: "border-box",
    minWidth: `min(320px, calc(100vw - ${FLOATING_BAR_VIEWPORT_GUTTER_PX * 2}px))`,
    maxWidth: `min(625px, calc(100vw - ${FLOATING_BAR_VIEWPORT_GUTTER_PX * 2}px))`,
    width: "auto",
  };

  const anchored: CSSProperties = {
    ...baseStyles,
    right: "auto",
    bottom: "auto",
    transform: "none",
  };

  if (isDragging && dragPosition) {
    return { ...anchored, left: `${dragPosition.x}px`, top: `${dragPosition.y}px` };
  }
  if (barPosition) {
    return { ...anchored, left: `${barPosition.x}px`, top: `${barPosition.y}px` };
  }
  /* Default anchor: position comes from `.global-floating-call-bar-default-anchor` for responsiveness */
  return {
    ...baseStyles,
    transform: "none",
  };
}
