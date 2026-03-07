import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, ReferenceLine,
} from "recharts";
import { RefreshCw, ExternalLink, Search, PlusCircle, ChevronDown, Info, Check } from "lucide-react";

// ── Shared styles ──────────────────────────────────────────────────────────────
const font = "Lexend Deca, Helvetica, Arial, sans-serif";

// ── Helper functions for dynamic styles ──────────────────────────────────────
const getSidebarItemStyle = (active: boolean): React.CSSProperties => ({
  display: "block", width: "100%", textAlign: "left", background: "none", border: "none",
  fontFamily: font, fontSize: 14, fontWeight: active ? 600 : 400,
  color: active ? "#141414" : "#444",
  padding: "10px 20px", cursor: "pointer",
  borderLeft: active ? "3px solid #141414" : "3px solid transparent",
});

const getTagStyle = (color: string, bg: string): React.CSSProperties => ({
  fontSize: 10, fontWeight: 700, fontFamily: font, padding: "2px 8px",
  borderRadius: 10, color, backgroundColor: bg, marginLeft: 6,
});

const getDotStyle = (color: string): React.CSSProperties => ({
  width: 8, height: 8, borderRadius: "50%", backgroundColor: color, display: "inline-block", marginRight: 6,
});

const s: Record<string, React.CSSProperties> = {
  page: { fontFamily: font, color: "#141414", backgroundColor: "#f5f5f5", minHeight: "100vh" },
  layout: { display: "flex" },
  sidebar: {
    width: 180, flexShrink: 0, paddingTop: 8,
    borderRight: "1px solid #e5e5e5", backgroundColor: "#fff", minHeight: "100vh",
  },
  main: { flex: 1,  maxWidth: "calc(1376px - 180px)" },
  card: {
    backgroundColor: "#fff", border: "1px solid #ccc",
    borderRadius: 8, boxShadow: "rgba(20,20,20,0.08) 0px 1px 8px 0px",
    marginBottom: 16, padding: 24,
  },
  h1: { fontSize: 24, fontWeight: 300, fontFamily: font, margin: "0 0 20px 0", lineHeight: "29px" },
  h2: { fontSize: 18, fontWeight: 600, fontFamily: font, margin: "0 0 12px 0" },
  label: { fontSize: 12, fontWeight: 300, color: "#666", fontFamily: font, marginBottom: 4 },
  value: { fontSize: 32, fontWeight: 300, fontFamily: font, lineHeight: 1.1, margin: "4px 0 10px" },
  link: { color: "rgb(0,97,98)", fontWeight: 600, fontSize: 13, cursor: "pointer", textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: 4 },
  btnDark: {
    display: "inline-flex", alignItems: "center", gap: 6,
    backgroundColor: "#141414", color: "#fff", border: "1px solid transparent",
    borderRadius: 4, padding: "8px 14px", fontSize: 12, fontWeight: 400, fontFamily: font, cursor: "pointer",
  },
  btnLight: {
    display: "inline-flex", alignItems: "center", gap: 6,
    backgroundColor: "#fff", color: "#141414", border: "1px solid #ccc",
    borderRadius: 4, padding: "6px 12px", fontSize: 12, fontWeight: 400, fontFamily: font, cursor: "pointer",
  },
  tableHead: { fontSize: 11, fontWeight: 700, color: "#666", fontFamily: font, letterSpacing: 0.5, textTransform: "uppercase" as const, padding: "10px 16px", backgroundColor: "#f5f5f5", borderBottom: "1px solid #e5e5e5" },
  tableCell: { fontSize: 14, fontFamily: font, padding: "12px 16px", borderBottom: "1px solid #f0f0f0", verticalAlign: "middle" as const },
  select: {
    fontFamily: font, fontSize: 13, padding: "8px 32px 8px 12px", border: "1px solid #ccc",
    borderRadius: 4, backgroundColor: "#fff", appearance: "none" as const, cursor: "pointer",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
  },
  searchBox: {
    fontFamily: font, fontSize: 13, padding: "8px 12px 8px 36px", border: "1px solid #ccc",
    borderRadius: 4, backgroundColor: "#fff", width: 200, outline: "none",
  },
};

// ── Bar chart data (usage this month) ─────────────────────────────────────────
const monthBarData = [{ name: "", used: 10, limit: 490 }];

const barTicks = [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500];

// ── Historical line chart data ─────────────────────────────────────────────────
const historicalData = [
  { period: "1 Feb 2026 – 28 Feb 2026", nonBilled: 1500, billed: 1450, monthly: 500 },
  { period: "11 Feb 2026 – 10 Mar 2026", nonBilled: 0, billed: 10, monthly: 500 },
];

// ── Feature table rows ─────────────────────────────────────────────────────────
const features = [
  { name: "Closing Agent", tags: [{ label: "BETA", color: "#fff", bg: "#7c3aed" }], credits: "--", status: "not" },
  { name: "Customer Agent", tags: [{ label: "START FREE ACCESS", color: "#fff", bg: "#00897b" }], credits: "0", status: "consuming" },
  { name: "Data Agent", tags: [{ label: "BETA", color: "#fff", bg: "#7c3aed" }], credits: "0", status: "consuming" },
  { name: "Intent", tags: [], credits: "10", status: "consuming" },
  { name: "Workflows Breeze Actions", tags: [], credits: "0", status: "consuming" },
];

// ── Custom tooltip ─────────────────────────────────────────────────────────────
const CustomBarTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: "#141414", color: "#fff", padding: "6px 12px", borderRadius: 4, fontSize: 12, fontFamily: font }}>
        <div>Used: <strong>{payload[0]?.value}</strong></div>
      </div>
    );
  }
  return null;
};

// ── Main component ─────────────────────────────────────────────────────────────
export default function UsageLimitsPage() {
  const [activeSection, setActiveSection] = useState("Prime Alley Credits");
  const [showUnbilled, setShowUnbilled] = useState(true);
  const [featureFilter, setFeatureFilter] = useState("All features");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFeatures = features.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={s.page}>
      <div style={s.layout}>

        {/* Sidebar */}
        {/* <div style={s.sidebar}>
          {["Prime Alley Credits", "Marketing Contacts"].map(item => (
            <button key={item} style={getSidebarItemStyle(activeSection === item)} onClick={() => setActiveSection(item)}>
              {item}
            </button>
          ))}
        </div> */}

        {/* Main content */}
        <div style={s.main}>

          {/* ── Your Prime Alley Credits ── */}
          <div style={s.card}>
            <h1 style={s.h1}>Your Prime Alley Credits</h1>
            <div style={{ display: "flex", gap: 40, alignItems: "flex-start" }}>
              {/* Left */}
              <div style={{ minWidth: 180 }}>
                <div style={s.label}>Monthly credits <Info size={12} color="#999" style={{ display: "inline", verticalAlign: "middle" }} /></div>
                <div style={s.value}>500</div>
                <button style={s.btnDark}>
                  <PlusCircle size={13} /> Add credits
                </button>
              </div>
              {/* Divider */}
              <div style={{ width: 1, backgroundColor: "#e5e5e5", alignSelf: "stretch" }} />
              {/* Right */}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, color: "#141414", margin: "0 0 8px 0", lineHeight: "20px" }}>
                  Prime Alley Credits are a simple, flexible way to pay for what you use. Credits works across all usage-based features.
                </p>
                <a style={s.link}><span>Learn more</span><ExternalLink size={11} /></a>
                <p style={{ fontSize: 13, color: "#141414", margin: "10px 0 6px 0" }}>
                  Prime Alley Credits are managed by users with billing permissions or super admin access.
                </p>
                <a style={s.link}><span>Manage user permissions</span><ExternalLink size={11} /></a>
              </div>
            </div>
          </div>

          {/* ── Usage this month ── */}
          <div style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <h2 style={{ ...s.h1, marginBottom: 0 }}>Usage this month</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, color: "#666" }}>Updated 22:06 <Info size={11} color="#999" style={{ verticalAlign: "middle" }} /></span>
                <button style={s.btnLight}><RefreshCw size={12} /> Refresh</button>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>Date range: 11 Feb 2026 - 10 Mar 2026</div>

            {/* Legend */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <span style={getDotStyle("#00897b")} />
              <span style={{ fontSize: 12, color: "#444" }}>Billed usage</span>
            </div>

            {/* Horizontal bar chart */}
            <div style={{ position: "relative" }}>
              {/* Monthly credits label pill */}
              <div style={{
                position: "absolute", right: 0, top: -8, zIndex: 10,
                backgroundColor: "#141414", color: "#fff", fontSize: 10, fontWeight: 700,
                padding: "4px 10px", borderRadius: 4, letterSpacing: 0.5,
              }}>
                MONTHLY CREDITS
              </div>

              <ResponsiveContainer width="100%" height={80}>
                <BarChart
                  layout="vertical"
                  data={[{ name: "usage", used: 10, rest: 490 }]}
                  margin={{ top: 16, right: 1, left: 0, bottom: 0 }}
                  barCategoryGap={0}
                >
                  <XAxis
                    type="number" domain={[0, 500]} ticks={barTicks}
                    tick={{ fontSize: 11, fill: "#888", fontFamily: font }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis type="category" dataKey="name" hide />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="used" stackId="a" fill="#00897b" barSize={22} radius={[0, 0, 0, 0]}>
                    <foreignObject x={4} y={2} width={30} height={22}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", fontFamily: font, paddingTop: 2 }}>10</div>
                    </foreignObject>
                  </Bar>
                  <Bar dataKey="rest" stackId="a" fill="#e5e5e5" barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Summary box */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: font, marginBottom: 12 }}>Summary</div>
              <div style={{
                border: "1px solid #e5e5e5", borderRadius: 6, padding: "20px",
                textAlign: "center" as const,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#666", letterSpacing: 1, fontFamily: font, marginBottom: 6 }}>
                  MONTHLY CREDITS USED
                </div>
                <div style={{ fontSize: 28, fontWeight: 300, fontFamily: font, marginBottom: 4 }}>10 of 500</div>
                <div style={{ fontSize: 13, color: "#666", fontFamily: font }}>credits reset on 11 March</div>
              </div>
            </div>

            {/* Manage credit usage */}
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: font, marginBottom: 4 }}>Manage credit usage by feature</div>
              <div style={{ fontSize: 13, color: "#666", fontFamily: font, marginBottom: 16 }}>
                Sometimes features may show more credits used than what you are billed for.
              </div>

              {/* Filter + search row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ position: "relative" as const }}>
                  <select style={s.select} value={featureFilter} onChange={e => setFeatureFilter(e.target.value)}>
                    <option>All features</option>
                    <option>Consuming credits</option>
                    <option>Not consuming credits</option>
                  </select>
                </div>
                <div style={{ position: "relative" as const }}>
                  <Search size={14} color="#999" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    style={s.searchBox} placeholder="Search feature"
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Table */}
              <div style={{ border: "1px solid #e5e5e5", borderRadius: 6, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
                  <thead>
                    <tr>
                      <th style={{ ...s.tableHead, textAlign: "left" as const }}>FEATURE ↕</th>
                      <th style={{ ...s.tableHead, textAlign: "left" as const }}>CREDITS USED ↕</th>
                      <th style={{ ...s.tableHead, textAlign: "left" as const }}>
                        CREDITS STATUS <Info size={11} color="#999" style={{ verticalAlign: "middle" }} /> ↕
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFeatures.map((f) => (
                      <tr key={f.name} style={{ backgroundColor: "#fff" }}>
                        <td style={s.tableCell}>
                          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" as const, gap: 4 }}>
                            <a style={s.link}>{f.name}</a>
                            {f.tags.map(t => (
                              <span key={t.label} style={getTagStyle(t.color, t.bg)}>{t.label}</span>
                            ))}
                          </div>
                        </td>
                        <td style={s.tableCell}>{f.credits}</td>
                        <td style={s.tableCell}>
                          {f.status === "not" ? (
                            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#888" }}>
                              <span style={{ width: 8, height: 8, borderRadius: "50%", border: "2px solid #aaa", display: "inline-block" }} />
                              Not consuming credits
                            </span>
                          ) : (
                            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#141414" }}>
                              <span style={getDotStyle("#00897b")} />
                              Consuming credits
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── Historical usage ── */}
          <div style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ ...s.h1, marginBottom: 0 }}>Historical usage</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13, color: "#444", fontFamily: font }}>Show usage that isn't billed</span>
                {/* Toggle */}
                <div
                  onClick={() => setShowUnbilled(!showUnbilled)}
                  style={{
                    width: 40, height: 22, borderRadius: 11, cursor: "pointer",
                    backgroundColor: showUnbilled ? "#141414" : "#ccc",
                    position: "relative" as const, transition: "background 200ms",
                    display: "flex", alignItems: "center",
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%", backgroundColor: "#fff",
                    position: "absolute", left: showUnbilled ? 21 : 3, transition: "left 200ms",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {showUnbilled && <Check size={10} color="#141414" strokeWidth={3} />}
                  </div>
                </div>
              </div>
            </div>

            {/* Overview */}
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: font, marginBottom: 6 }}>Overview</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 13, fontFamily: font }}>
              <span style={{ color: "#444" }}>Date range:</span>
              <button style={{ ...s.btnLight, fontSize: 13, padding: "4px 10px" }}>
                Three months <ChevronDown size={12} />
              </button>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: 20, marginBottom: 8 }}>
              {[
                { color: "#00bcd4", label: "Non-billed usage" },
                { color: "#00897b", label: "Billed usage" },
                { color: "#e53935", label: "Monthly credits" },
              ].map(l => (
                <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#444" }}>
                  <span style={{ width: 10, height: 3, backgroundColor: l.label === "Monthly credits" ? "transparent" : l.color, borderTop: l.label === "Monthly credits" ? `2px solid ${l.color}` : "none", display: "inline-block", borderRadius: 2 }} />
                  {l.label}
                </span>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={historicalData} margin={{ top: 10, right: 30, left: 20, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11, fill: "#888", fontFamily: font }}
                  axisLine={{ stroke: "#ccc" }} tickLine={false}
                  label={{ value: "Billing period", position: "insideBottom", offset: -14, fontSize: 12, fill: "#888", fontFamily: font }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#888", fontFamily: font }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `${v / 1000}K` : v}
                  label={{ value: "Credits used", angle: -90, position: "insideLeft", offset: -4, fontSize: 12, fill: "#888", fontFamily: font }}
                  domain={[0, 2000]} ticks={[0, 500, 1000, 1500, 2000]}
                />
                <Tooltip
                  contentStyle={{ fontFamily: font, fontSize: 12, borderRadius: 6 }}
                  labelStyle={{ fontWeight: 700 }}
                />
                {showUnbilled && (
                  <Line type="monotone" dataKey="nonBilled" stroke="#00bcd4" strokeWidth={2} dot={{ r: 4, fill: "#00bcd4" }} name="Non-billed usage" />
                )}
                <Line type="monotone" dataKey="billed" stroke="#00897b" strokeWidth={2} dot={{ r: 4, fill: "#00897b" }} name="Billed usage" />
                <Line type="monotone" dataKey="monthly" stroke="#e53935" strokeWidth={2} strokeDasharray="5 3" dot={false} name="Monthly credits" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* ── Usage log ── */}
          <div style={s.card}>
            <h2 style={{ ...s.h1, marginBottom: 4 }}>Usage log</h2>
            <p style={{ fontSize: 13, color: "#666", fontFamily: font, margin: "0 0 20px 0" }}>
              Sometimes features may show more credits used than what you are billed for.
            </p>

            {/* Date range picker */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: font, marginBottom: 8 }}>Date range</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="text" defaultValue="01/01/2026"
                  style={{
                    fontFamily: font, fontSize: 13, padding: "8px 12px",
                    border: "1px solid #ccc", borderRadius: 4, width: 130,
                  }}
                />
                <span style={{ fontSize: 13, color: "#444" }}>to</span>
                <input
                  type="text" defaultValue="07/03/2026"
                  style={{
                    fontFamily: font, fontSize: 13, padding: "8px 12px",
                    border: "1px solid #ccc", borderRadius: 4, width: 130,
                  }}
                />
              </div>
            </div>

            {/* Buyer Intent section */}
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: font, marginBottom: 12 }}>Buyer Intent</div>
            <div style={{ border: "1px solid #e5e5e5", borderRadius: 6, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
                <thead>
                  <tr>
                    {["FEATURE ↕", "ACTION ↕", "COST PER ACTION ↕", "TOTAL ACTIONS ↕", "CREDITS USED ↕"].map(h => (
                      <th key={h} style={{ ...s.tableHead, textAlign: "left" as const }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={s.tableCell}>Intent</td>
                    <td style={s.tableCell}>Company Added and/or Tracked</td>
                    <td style={s.tableCell}>10 credits</td>
                    <td style={s.tableCell}>1</td>
                    <td style={s.tableCell}>10</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
