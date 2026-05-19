"use client";

import React, { useId } from "react";
import { Calendar } from "lucide-react";
import { apiDateToDisplayDate, parseMainDashboardApiDate } from "@utils/mainDashboardDateRanges";

const FONT = "'Lexend Deca', Helvetica, Arial, sans-serif";

export function MainDashboardDateField({
  label,
  value,
  onChange,
  min,
  max,
}: Readonly<{
  label: string;
  value: string;
  onChange: (apiDate: string) => void;
  min?: string;
  max?: string;
}>) {
  const inputId = useId();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    if (!next || !parseMainDashboardApiDate(next)) return;
    onChange(next);
  };

  return (
    <label
      htmlFor={inputId}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        border: "1px solid #adadad",
        borderRadius: "4px",
        padding: "6px 10px",
        fontSize: "14px",
        color: "#141414",
        fontFamily: FONT,
        cursor: "pointer",
        backgroundColor: "#fff",
        margin: 0,
      }}
    >
      <Calendar size={14} color="#555" style={{ pointerEvents: "none", flexShrink: 0 }} />
      <span style={{ pointerEvents: "none", whiteSpace: "nowrap" }}>
        {apiDateToDisplayDate(value)}
      </span>
      <input
        id={inputId}
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={handleChange}
        aria-label={label}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0,
          cursor: "pointer",
          border: "none",
          margin: 0,
          padding: 0,
        }}
      />
    </label>
  );
}
