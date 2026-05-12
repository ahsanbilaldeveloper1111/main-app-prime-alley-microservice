import type { CSSProperties } from "react";

export const usageLimitsFont = "Lexend Deca, Helvetica, Arial, sans-serif";

export const getTagStyle = (color: string, bg: string): CSSProperties => ({
  fontSize: 10, fontWeight: 700, fontFamily: usageLimitsFont, padding: "2px 8px",
  borderRadius: 10, color, backgroundColor: bg, marginLeft: 6,
});

export const getDotStyle = (color: string): CSSProperties => ({
  width: 8, height: 8, borderRadius: "50%", backgroundColor: color, display: "inline-block", marginRight: 6,
});

export const usageLimitsStyles: Record<string, CSSProperties> = {
  page: { fontFamily: usageLimitsFont, color: "#141414", backgroundColor: "#f5f5f5", minHeight: "100vh" },
  layout: { display: "flex" },
  sidebar: {
    width: 180, flexShrink: 0, paddingTop: 8,
    borderRight: "1px solid #e5e5e5", backgroundColor: "#fff", minHeight: "100vh",
  },
  main: { flex: 1, maxWidth: "calc(1376px - 180px)" },
  card: {
    backgroundColor: "#fff", border: "1px solid #ccc",
    borderRadius: 8, boxShadow: "rgba(20,20,20,0.08) 0px 1px 8px 0px",
    marginBottom: 16, padding: 24,
  },
  h1: { fontSize: 24, fontWeight: 300, fontFamily: usageLimitsFont, margin: "0 0 20px 0", lineHeight: "29px" },
  h2: { fontSize: 18, fontWeight: 600, fontFamily: usageLimitsFont, margin: "0 0 12px 0" },
  label: { fontSize: 12, fontWeight: 300, color: "#666", fontFamily: usageLimitsFont, marginBottom: 4 },
  value: { fontSize: 32, fontWeight: 300, fontFamily: usageLimitsFont, lineHeight: 1.1, margin: "4px 0 10px" },
  link: { color: "rgb(0,97,98)", fontWeight: 600, fontSize: 13, cursor: "pointer", textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: 4 },
  btnDark: {
    display: "inline-flex", alignItems: "center", gap: 6,
    backgroundColor: "#141414", color: "#fff", border: "1px solid transparent",
    borderRadius: 4, padding: "8px 14px", fontSize: 12, fontWeight: 400, fontFamily: usageLimitsFont, cursor: "pointer",
  },
  btnLight: {
    display: "inline-flex", alignItems: "center", gap: 6,
    backgroundColor: "#fff", color: "#141414", border: "1px solid #ccc",
    borderRadius: 4, padding: "6px 12px", fontSize: 12, fontWeight: 400, fontFamily: usageLimitsFont, cursor: "pointer",
  },
  tableHead: { fontSize: 11, fontWeight: 700, color: "#666", fontFamily: usageLimitsFont, letterSpacing: 0.5, textTransform: "uppercase" as const, padding: "10px 16px", backgroundColor: "#f5f5f5", borderBottom: "1px solid #e5e5e5" },
  tableCell: { fontSize: 14, fontFamily: usageLimitsFont, padding: "12px 16px", borderBottom: "1px solid #f0f0f0", verticalAlign: "middle" as const },
  select: {
    fontFamily: usageLimitsFont, fontSize: 13, padding: "8px 32px 8px 12px", border: "1px solid #ccc",
    borderRadius: 4, backgroundColor: "#fff", appearance: "none" as const, cursor: "pointer",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
  },
  searchBox: {
    fontFamily: usageLimitsFont, fontSize: 13, padding: "8px 12px 8px 36px", border: "1px solid #ccc",
    borderRadius: 4, backgroundColor: "#fff", width: 200, outline: "none",
  },
};

export const monthBarData = [{ name: "", used: 0, limit: 0 }];

export const barTicks = [0, 0];

export const historicalData = [
  { period: "1 Feb 2026 – 28 Feb 2026", nonBilled: 0, billed: 0, monthly: 0 },
  { period: "11 Feb 2026 – 10 Mar 2026", nonBilled: 0, billed: 0, monthly: 0 },
];

export const usageLimitsFeatures = [
  { name: "Call Transcription", tags: [{ label: "BETA", color: "#fff", bg: "#7c3aed" }], credits: "--", status: "not" },
  { name: "AI Analysis", tags: [{ label: "START FREE ACCESS", color: "#fff", bg: "#00897b" }], credits: "0", status: "consuming" },
  { name: "Data Enrichment", tags: [{ label: "BETA", color: "#fff", bg: "#7c3aed" }], credits: "0", status: "consuming" },
  { name: "Intent", tags: [], credits: "10", status: "consuming" },
  { name: "Workflows Actions", tags: [], credits: "0", status: "consuming" },
] as const;
