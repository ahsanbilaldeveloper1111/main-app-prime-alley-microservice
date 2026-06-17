import { ACCOUNT_DEFAULTS_FONT } from "@components/main-settings/accountDefaultsTabPrimitives";

import React from "react";

import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

import { Form } from "react-bootstrap";



/** P&A forms only — matches CreatePlannerTaskSidebar field classes. */

export const MAIN_SETTINGS_FORM_FIELD_CLASS = "mb-3 planner-sidebar-field";

export const MAIN_SETTINGS_FORM_CONTROL_CLASS = "form-control py-2";

export const MAIN_SETTINGS_FORM_SELECT_CLASS = "form-select py-2";

export const MAIN_SETTINGS_FORM_READONLY_VALUE_CLASS = "planner-sidebar-readonly-value";



const fieldLabelStyle: React.CSSProperties = {

  display: "block",

  fontFamily: ACCOUNT_DEFAULTS_FONT,

  fontSize: "13px",

  fontWeight: 600,

  color: "#141414",

  marginBottom: 4,

  letterSpacing: "0.01em",

};



const hintStyle: React.CSSProperties = {

  fontFamily: ACCOUNT_DEFAULTS_FONT,

  fontSize: "11px",

  color: "#718096",

};



export function formatIsoDateLocal(date: Date): string {

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;

}



export function parseIsoDateLocal(value: string | null | undefined): Date | null {

  const trimmed = (value ?? "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;

  const parsed = new Date(`${trimmed}T00:00:00`);

  return Number.isNaN(parsed.getTime()) ? null : parsed;

}



export function MainSettingsFormField({

  id,

  label,

  hint,

  children,

}: Readonly<{

  id: string;

  label: string;

  hint?: string;

  children: React.ReactNode;

}>) {

  return (

    <Form.Group className={MAIN_SETTINGS_FORM_FIELD_CLASS} controlId={id}>

      <Form.Label style={fieldLabelStyle}>{label}</Form.Label>

      {children}

      {hint ? (

        <Form.Text className="text-muted" style={hintStyle}>

          {hint}

        </Form.Text>

      ) : null}

    </Form.Group>

  );

}



export type MainSettingsDatePickerProps = Readonly<{

  id: string;

  value: string | null | undefined;

  onChange: (value: string) => void;

  minDate?: Date;

  maxDate?: Date;

  disabled?: boolean;

  placeholder?: string;

  isClearable?: boolean;

}>;



export function MainSettingsDatePicker({

  id,

  value,

  onChange,

  minDate,

  maxDate,

  disabled = false,

  placeholder = "Select date",

  isClearable = false,

}: MainSettingsDatePickerProps) {

  const selectedDate = parseIsoDateLocal(value ?? "");



  return (

    <DatePicker

      id={id}

      selected={selectedDate}

      onChange={(date) => onChange(date ? formatIsoDateLocal(date) : "")}

      minDate={minDate}

      maxDate={maxDate}

      disabled={disabled}

      placeholderText={placeholder}

      dateFormat="MMM d, yyyy"

      className={MAIN_SETTINGS_FORM_CONTROL_CLASS}

      popperClassName="main-settings-datepicker-popper"

      calendarClassName="main-settings-datepicker"

      showPopperArrow={false}

      autoComplete="off"

      isClearable={isClearable}

    />

  );

}

