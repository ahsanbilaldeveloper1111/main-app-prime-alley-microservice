import React from "react";
import { Form } from "react-bootstrap";

/** Preset swatches shared by project labels and statuses modals. */
export const PROJECT_SETTINGS_PRESET_COLORS: readonly string[] = [
  "#4680FF",
  "#2CA87F",
  "#FFB64D",
  "#DC2626",
  "#9E9E9E",
  "#667EEA",
  "#F56565",
  "#48BB78",
  "#ED8936",
  "#4FC3F7",
  "#06b6d4",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
];

export type ProjectSettingsPresetColorPickerProps = Readonly<{
  color: string;
  onColorChange: (color: string) => void;
}>;

/**
 * Preset grid + native color input used by Labels and Statuses project settings tabs.
 */
export function ProjectSettingsPresetColorPicker({
  color,
  onColorChange,
}: ProjectSettingsPresetColorPickerProps) {
  return (
    <>
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        {PROJECT_SETTINGS_PRESET_COLORS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onColorChange(preset)}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "6px",
              backgroundColor: preset,
              border:
                color === preset ? "3px solid #1F2937" : "2px solid #E5E9F2",
              cursor: "pointer",
              padding: 0,
            }}
          />
        ))}
      </div>
      <Form.Control
        type="color"
        value={color}
        onChange={(e) => onColorChange(e.target.value)}
        style={{ width: "100%", height: "40px" }}
      />
    </>
  );
}
