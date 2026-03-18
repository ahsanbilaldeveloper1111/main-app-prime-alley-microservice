import type { CSSProperties, FocusEvent, MouseEvent } from "react";

export const BORDER_COLOR_DEFAULT = "rgb(138,138,138)";
export const BORDER_COLOR_FOCUS = "#2d6ae0";

type BorderFocusEvent = FocusEvent<
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
>;

export const onBorderFocus = (e: BorderFocusEvent) => {
  e.currentTarget.style.borderColor = BORDER_COLOR_FOCUS;
};

export const onBorderBlur = (e: BorderFocusEvent) => {
  e.currentTarget.style.borderColor = BORDER_COLOR_DEFAULT;
};

export const setHoverBackgroundColor =
  (color: string) => (e: MouseEvent<HTMLElement>) => {
    e.currentTarget.style.backgroundColor = color;
  };

export const setHoverBorderColor =
  (color: string) => (e: MouseEvent<HTMLElement>) => {
    e.currentTarget.style.borderColor = color;
  };

export const onDarkBorderEnter = setHoverBorderColor("rgba(255,255,255,0.7)");
export const onDarkBorderLeave = setHoverBorderColor("rgba(255,255,255,0.35)");

export const onLightBgEnter = setHoverBackgroundColor("#f0f0f0");
export const onLightBgLeave = setHoverBackgroundColor("#fff");

export const onSubBarBtnEnter = setHoverBackgroundColor("#f5f5f5");
export const onSubBarBtnLeave = setHoverBackgroundColor("#fff");

const selectCaretBaseStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  pointerEvents: "none",
  fontSize: "10px",
  color: "#555",
};

export function SelectCaret({ right = 12 }: Readonly<{ right?: number }>) {
  return <span style={{ ...selectCaretBaseStyle, right }}>▾</span>;
}

