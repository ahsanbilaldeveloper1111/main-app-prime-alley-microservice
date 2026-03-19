import type { CSSProperties } from "react";

const toggleStyle = (checked: boolean, disabled: boolean): CSSProperties => ({
  padding: 0,
  border: "none",
  width: "44px",
  height: "24px",
  borderRadius: "12px",
  backgroundColor: checked ? "#2d6ae0" : "#ccc",
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.7 : 1,
  transition: "background-color 150ms ease-out, opacity 150ms ease-out",
  position: "relative",
  flexShrink: 0,
});

const knobStyle = (checked: boolean): CSSProperties => ({
  position: "absolute",
  top: "3px",
  left: checked ? "23px" : "3px",
  width: "18px",
  height: "18px",
  borderRadius: "50%",
  backgroundColor: "#fff",
  transition: "left 150ms ease-out",
  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
});

type ToggleSwitchProps = Readonly<{
  checked: boolean;
  onChange: (nextChecked: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
}>;

export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  ariaLabel = "Toggle",
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={toggleStyle(checked, disabled)}
    >
      <div style={knobStyle(checked)} />
    </button>
  );
}

