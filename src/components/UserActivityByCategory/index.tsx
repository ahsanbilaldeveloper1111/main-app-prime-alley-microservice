"use client";

import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Calendar, ExternalLink, ChevronDown } from "lucide-react";

const FONT = "'Lexend Deca', Helvetica, Arial, sans-serif";

// ─── Data ─────────────────────────────────────────────────────────────────────

const categories = [
  { name: "Property Value",            value: 57.5, color: "#F4A57A" },
  { name: "CRM Object",                value: 20.8, color: "#4ECDC4" },
  { name: "CRM Object Association",    value: 6.2,  color: "#B5A7E0" },
  { name: "Security Activity",         value: 3.8,  color: "#F4D47A" },
  { name: "Property Definition",       value: 2.6,  color: "#F48FB1" },
  { name: "Workflows",                 value: 1.4,  color: "#90CAF9" },
  { name: "Content",                   value: 1.2,  color: "#A5D6A7" },
  { name: "Meeting",                   value: 1.0,  color: "#EF6C00" },
  { name: "Communication preferences", value: 0.9,  color: "#006D77" },
  { name: "Record Creation Form",      value: 0,    color: "#CE93D8" },
  { name: "Segments",                  value: 0,    color: "#B0BEC5" },
];

// Legend items (top 10 shown in legend)
const legendItems = [
  { label: "Property Value",            color: "#F4A57A" },
  { label: "CRM Object",                color: "#4ECDC4" },
  { label: "CRM Object Association",    color: "#B5A7E0" },
  { label: "Security Activity",         color: "#F4D47A" },
  { label: "Property Definition",       color: "#F48FB1" },
  { label: "Workflows",                 color: "#90CAF9" },
  { label: "Content",                   color: "#A5D6A7" },
  { label: "Meeting",                   color: "#EF6C00" },
  { label: "Communication preferences", color: "#006D77" },
  { label: "Record Creation Form",      color: "#CE93D8" },
];

// ─── Custom Tooltip ────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid #e0e0e0",
          borderRadius: "6px",
          padding: "8px 12px",
          fontFamily: FONT,
          fontSize: "13px",
          color: "#141414",
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: "4px" }}>{label}</div>
        <div style={{ color: "#444" }}>
          Activity Volume:{" "}
          <strong>{payload[0].value.toFixed(1)}%</strong>
        </div>
      </div>
    );
  }
  return null;
};

// ─── X-Axis tick formatter ─────────────────────────────────────────────────────

const formatXTick = (value: number) => `${value}%`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function UserActivityByCategory() {
  const [fromDate, setFromDate] = useState("27/01/2026");
  const [toDate, setToDate] = useState("27/02/2026");

  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    const formatted = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    setFromDate(formatted);
  };

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    const formatted = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    setToDate(formatted);
  };

  const formatDateForInput = (displayDate: string) => {
    const [day, month, year] = displayDate.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        fontFamily: FONT,
        color: "#141414",
      }}
    >
      {/* ── Top bar: title + filters ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "15px",
            fontWeight: 600,
            color: "#141414",
            fontFamily: FONT,
          }}
        >
          Chart view
        </h2>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          {/* User and team */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "14px",
              color: "#141414",
            }}
          >
            <span style={{ color: "#555", fontWeight: 400 }}>User and team</span>
            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 700,
                color: "#141414",
                fontFamily: FONT,
                padding: "0",
              }}
            >
              Anyone <ChevronDown size={14} />
            </button>
          </div>

          {/* Date label */}
          <span style={{ fontSize: "14px", color: "#555", fontWeight: 400 }}>
            Date
          </span>

          {/* From date */}
          <label
            style={{
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
              position: "relative",
            }}
          >
            <Calendar size={14} color="#555" style={{ pointerEvents: "none" }} />
            <span style={{ pointerEvents: "none" }}>{fromDate}</span>
            <input
              type="date"
              value={formatDateForInput(fromDate)}
              onChange={handleFromDateChange}
              style={{
                position: "absolute",
                opacity: 0,
                width: "100%",
                height: "100%",
                left: 0,
                top: 0,
                cursor: "pointer",
                zIndex: 1,
              }}
            />
          </label>

          <span style={{ fontSize: "14px", color: "#555" }}>to</span>

          {/* To date */}
          <label
            style={{
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
              position: "relative",
            }}
          >
            <Calendar size={14} color="#555" style={{ pointerEvents: "none" }} />
            <span style={{ pointerEvents: "none" }}>{toDate}</span>
            <input
              type="date"
              value={formatDateForInput(toDate)}
              onChange={handleToDateChange}
              style={{
                position: "absolute",
                opacity: 0,
                width: "100%",
                height: "100%",
                left: 0,
                top: 0,
                cursor: "pointer",
                zIndex: 1,
              }}
            />
          </label>
        </div>
      </div>

      {/* ── Legend ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px 16px",
          marginBottom: "6px",
        }}
      >
        {legendItems.map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "12px",
              color: "#141414",
              fontFamily: FONT,
              fontWeight: 400,
            }}
          >
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: item.color,
                flexShrink: 0,
                display: "inline-block",
              }}
            />
            {item.label}
          </div>
        ))}
      </div>

      {/* Pagination hint */}
      <div
        style={{
          fontSize: "12px",
          color: "#141414",
          marginBottom: "8px",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          fontFamily: FONT,
        }}
      >
        <span style={{ fontSize: "14px" }}>▲</span>
        <span>1/2</span>
        <span style={{ fontSize: "14px" }}>▼</span>
      </div>

      {/* ── Chart ── */}
      <ResponsiveContainer width="100%" height={360}>
        <BarChart
          data={categories}
          layout="vertical"
          margin={{ top: 0, right: 24, left: 0, bottom: 32 }}
          barCategoryGap="20%"
        >
          <CartesianGrid
            horizontal={false}
            vertical={true}
            stroke="#cccccc"
            strokeDasharray="4 4"
          />
          <XAxis
            type="number"
            domain={[0, 65]}
            tickCount={14}
            tickFormatter={formatXTick}
            tick={{
              fontFamily: FONT,
              fontSize: 12,
              fill: "#141414",
              fontWeight: 400,
            }}
            axisLine={{ stroke: "#ccc" }}
            tickLine={false}
            label={{
              value: "Activity Volume",
              position: "insideBottom",
              offset: -20,
              fontFamily: FONT,
              fontSize: 13,
              fontWeight: 700,
              fill: "#141414",
            }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={155}
            tick={{
              fontFamily: FONT,
              fontSize: 12,
              fill: "#141414",
              fontWeight: 100,
              textAnchor: "end",
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
          />
          <Bar dataKey="value" radius={[0, 2, 2, 0]} maxBarSize={22}>
            {categories.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* ── View filtered records ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "8px",
        }}
      >
        <a
          href="#"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "14px",
            fontWeight: 700,
            color: "#0070d2",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
            fontFamily: FONT,
            cursor: "pointer",
          }}
        >
          View filtered records
          <ExternalLink size={13} />
        </a>
      </div>
    </div>
  );
}
