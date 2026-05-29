import React from "react";
import { Form } from "react-bootstrap";

import { toDateTimeLocalInputValue } from "@utils/communications/communicationsDateExtensionFilters";

import type { ChatDateTimeFilterBound } from "./chatDateTimeFilters";

export type ChatModuleDateTimeFilterFieldProps = Readonly<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  bound: ChatDateTimeFilterBound;
  disabled?: boolean;
  /** Bootstrap form layout (admin dashboard / audit log). */
  layout?: "bootstrap" | "ai-chatbot";
}>;

export function ChatModuleDateTimeFilterField({
  label,
  value,
  onChange,
  bound,
  disabled = false,
  layout = "bootstrap",
}: ChatModuleDateTimeFilterFieldProps) {
  const inputValue = toDateTimeLocalInputValue(
    value,
    bound === "from" ? "start" : "end",
  );

  const control = (
    <Form.Control
      type="datetime-local"
      step={60}
      size="sm"
      className={layout === "ai-chatbot" ? "ai-chatbot-settings__input" : undefined}
      value={inputValue}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  );

  if (layout === "ai-chatbot") {
    return (
      <label className="ai-chatbot-settings__field">
        <span className="ai-chatbot-settings__field-label">{label}</span>
        {control}
      </label>
    );
  }

  return (
    <>
      <Form.Label className="small text-muted text-uppercase fw-semibold">
        {label}
      </Form.Label>
      {control}
    </>
  );
}
