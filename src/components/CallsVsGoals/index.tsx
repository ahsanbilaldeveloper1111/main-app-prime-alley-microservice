"use client";

import React, { useRef } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { Info } from "lucide-react";

const FONT = "'Lexend Deca', Helvetica, Arial, sans-serif";

// ─── Data ─────────────────────────────────────────────────────────────────────

const SPIKE_CAP = 14.5;

const raw: { date: string; calls: number; goal: number }[] = [
  { date: "2026-01-01", calls: 0,      goal: 0 },
  { date: "2026-01-08", calls: 0,      goal: 0 },
  { date: "2026-01-15", calls: 0,      goal: 0 },
  { date: "2026-01-22", calls: 0,      goal: 0 },
  { date: "2026-01-29", calls: 0,      goal: 0 },
  { date: "2026-02-05", calls: 0,      goal: 0 },
  { date: "2026-02-12", calls: 0,      goal: 0 },
  { date: "2026-02-19", calls: 0,      goal: 0 },
  { date: "2026-02-20", calls: 2,      goal: 0 },
  { date: "2026-02-21", calls: 141414, goal: 3 },
  { date: "2026-02-22", calls: 0,      goal: 0 },
  { date: "2026-03-01", calls: 0,      goal: 0 },
  { date: "2026-04-11", calls: 0,      goal: 0 },
  { date: "2026-05-31", calls: 0,      goal: 0 },
  { date: "2026-07-20", calls: 0,      goal: 0 },
  { date: "2026-09-08", calls: 0,      goal: 0 },
  { date: "2026-10-28", calls: 0,      goal: 0 },
  { date: "2026-12-17", calls: 0,      goal: 0 },
];

const toUTC = (dateStr: string) =>
  Date.UTC(
    +dateStr.slice(0, 4),
    +dateStr.slice(5, 7) - 1,
    +dateStr.slice(8, 10)
  );

const callsSeries = raw.map((d) => ({
  x: toUTC(d.date),
  y: d.calls === 141414 ? SPIKE_CAP : d.calls,
  custom: { realValue: d.calls },
}));

const goalSeries = raw.map((d) => ({
  x: toUTC(d.date),
  y: d.goal,
  custom: { realValue: d.goal },
}));

// ─── Component ────────────────────────────────────────────────────────────────

export default function CallsVsGoalChart() {
  const chartRef = useRef<HighchartsReact.RefObject>(null);

  const options: Highcharts.Options = {
    chart: {
      type: "line",
      backgroundColor: "#ffffff",
      style: { fontFamily: FONT },
      animation: false,
      height: 260,
      marginLeft: 52,
      marginRight: 20,
      marginTop: 16,
      marginBottom: 40,
    },

    title:     { text: undefined },
    credits:   { enabled: false },
    exporting: { enabled: false },

    legend: {
      enabled: true,
      align: "left",
      verticalAlign: "top",
      layout: "horizontal",
      itemStyle: {
        fontFamily: FONT,
        fontSize: "11px",
        fontWeight: "100",
        color: "#141414",
      },
      itemHoverStyle: { color: "#141414" },
      symbolWidth: 10,
      symbolHeight: 10,
      symbolRadius: 5,
      y: -8,
    },

    xAxis: {
      type: "datetime",
      labels: {
        style: {
          fontFamily: FONT,
          fontSize: "11px",
          color: "#141414",
          fontWeight: "100",
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter(this: any) {
          return Highcharts.dateFormat("%e/%m/%Y", this.value as number);
        },
      },
      lineColor: "#d0d0d0",
      tickLength: 0,
      gridLineWidth: 0,
      tickPositions: raw.map((d) => toUTC(d.date)),
    },

    yAxis: {
      min: 0,
      max: 15,
      tickPositions: [0, 5, 10, 15],
      title: { text: undefined },
      labels: {
        style: {
          fontFamily: FONT,
          fontSize: "11px",
          color: "#141414",
          fontWeight: "100",
        },
      },
      gridLineColor: "#e0e0e0",
      gridLineDashStyle: "Dash",
      gridLineWidth: 1,
    },

    tooltip: {
      useHTML: true,
      backgroundColor: "transparent",
      borderWidth: 0,
      shadow: false,
      padding: 0,
      // Use `any` to avoid version-specific Highcharts type issues
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter(this: any) {
        const xVal: number = this.x;
        const date = Highcharts.dateFormat("%e/%m/%Y", xVal);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const chart: any = this.series.chart;
        let callsReal = 0;
        let goalReal  = 0;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        chart.series.forEach((s: any) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pt = s.points.find((p: any) => p.x === xVal);
          if (!pt) return;
          const rv = pt.custom?.realValue ?? pt.y ?? 0;
          if (s.name === "(Count) Calls")     callsReal = rv;
          if (s.name === "(Sum) Goal target") goalReal  = rv;
        });

        const total    = callsReal + goalReal;
        const callsPct = total > 0 ? Math.round((callsReal / total) * 100) : 100;
        const goalPct  = total > 0 ? Math.round((goalReal  / total) * 100) : 0;

        return `
          <div style="font-family:${FONT};font-size:11px;min-width:210px;border-radius:6px;overflow:hidden;border:1px solid #d0d0d0;box-shadow:0 4px 12px rgba(0,0,0,0.15);">
            <div style="background:#141414;color:#fff;padding:6px 10px;font-size:12px;font-weight:700;">${date}</div>
            <div style="background:#fff;padding:8px 10px;">
              <div style="color:#888;font-size:10px;margin-bottom:4px;">(Count) Calls</div>
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                <span style="width:8px;height:8px;border-radius:50%;background:#F4A57A;display:inline-block;flex-shrink:0;"></span>
                <span style="font-weight:700;">(Count) Calls</span>
                <span style="margin-left:auto;font-weight:700;">${callsReal} (${callsPct}%)</span>
              </div>
              <div style="color:#666;margin-bottom:10px;">Totals: <strong>${callsReal}</strong></div>
              <div style="color:#888;font-size:10px;margin-bottom:4px;">(Sum) Goal target</div>
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                <span style="width:8px;height:8px;border-radius:50%;background:transparent;border:2px solid #aaa;display:inline-block;flex-shrink:0;"></span>
                <span style="font-weight:700;">(Sum) Goal target</span>
                <span style="margin-left:auto;font-weight:700;">${goalReal} (${goalPct}%)</span>
              </div>
              <div style="color:#666;">Totals: <strong>${goalReal}</strong></div>
            </div>
          </div>
        `;
      },
    },

    plotOptions: {
      line: {
        animation: false,
        lineWidth: 1.5,
        states: { hover: { lineWidth: 1.5 } },
        marker: {
          enabled: true,
          radius: 3,
          symbol: "circle",
          states: { hover: { enabled: true, radius: 4 } },
        },
        dataLabels: {
          enabled: true,
          crop: false,
          overflow: "allow" as const,
          verticalAlign: "bottom" as const,
          y: 14,
          style: {
            fontFamily: FONT,
            fontSize: "9px",
            fontWeight: "100",
            color: "#141414",
            textOutline: "none",
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter(this: any) {
            return `${this.point?.custom?.realValue ?? this.y ?? 0}`;
          },
        },
        connectNulls: false,
      },
    },

    series: [
      {
        type: "line",
        name: "(Count) Calls",
        color: "#F4A57A",
        marker: {
          fillColor: "#F4A57A",
          lineColor: "#F4A57A",
          lineWidth: 0,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: callsSeries.map((pt: any) => {
          const isSpike = pt.custom?.realValue === 141414;
          return {
            ...pt,
            dataLabels: isSpike
              ? {
                  enabled: true,
                  verticalAlign: "top" as const,
                  y: 14,
                  x: -22,
                  style: {
                    fontFamily: FONT,
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "#141414",
                    textOutline: "none",
                  },
                  formatter() { return "141414"; },
                }
              : undefined,
          };
        }),
      },
      {
        type: "line",
        name: "(Sum) Goal target",
        color: "#bbbbbb",
        marker: {
          fillColor: "#ffffff",
          lineColor: "#bbbbbb",
          lineWidth: 1.5,
          radius: 3,
        },
        dataLabels: {
          enabled: true,
          verticalAlign: "bottom" as const,
          y: 14,
          style: {
            fontFamily: FONT,
            fontSize: "9px",
            fontWeight: "100",
            color: "#141414",
            textOutline: "none",
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter(this: any) {
            return `${this.point?.custom?.realValue ?? this.y ?? 0}`;
          },
        },
        data: goalSeries,
      },
    ] as Highcharts.SeriesOptionsType[],
  };

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        border: "1px solid #e5e5e5",
        padding: "20px 20px 16px",
        fontFamily: FONT,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
        <span style={{ fontSize: "15px", fontWeight: 700, color: "#00818a", fontFamily: FONT }}>
          Calls made vs goal
        </span>
        <Info size={14} color="#888" />
      </div>

      {/* Pills */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
        {["This entire year", "Daily"].map((label) => (
          <span
            key={label}
            style={{
              display: "inline-block",
              border: "1px solid #adadad",
              borderRadius: "3px",
              padding: "2px 8px",
              fontSize: "11px",
              fontWeight: 400,
              color: "#141414",
              fontFamily: FONT,
              backgroundColor: "#fff",
              lineHeight: "16px",
            }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Highcharts renders here */}
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
        ref={chartRef}
      />
    </div>
  );
}
