import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts";
import { RefreshCw, ExternalLink, Search, PlusCircle, ChevronDown, Info, Check } from "lucide-react";
import Link from "next/link";
import {
  barTicks,
  getDotStyle,
  getTagStyle,
  historicalData,
  usageLimitsFont,
  usageLimitsStyles as s,
  usageLimitsFeatures,
} from "./usageLimitsConstants";

function CustomBarTooltip({ active, payload }: any) {
  if (active && payload?.length) {
    return (
      <div style={{ background: "#141414", color: "#fff", padding: "6px 12px", borderRadius: 4, fontSize: 12, fontFamily: usageLimitsFont }}>
        <div>
          Used:
          {" "}
          <strong>{payload[0]?.value}</strong>
        </div>
      </div>
    );
  }
  return null;
}

type FeatureRow = (typeof usageLimitsFeatures)[number];

export type UsageLimitsPageViewProps = Readonly<{
  showUnbilled: boolean;
  setShowUnbilled: (v: boolean) => void;
  featureFilter: string;
  setFeatureFilter: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filteredFeatures: FeatureRow[];
}>;

export function UsageLimitsPageView({
  showUnbilled,
  setShowUnbilled,
  featureFilter,
  setFeatureFilter,
  searchQuery,
  setSearchQuery,
  filteredFeatures,
}: UsageLimitsPageViewProps) {
  return (
    <div style={s.page}>
      <div style={s.layout}>

        <div style={s.main}>

          <div style={s.card}>
            <h1 style={s.h1}>Your Credits</h1>
            <div style={{ display: "flex", gap: 40, alignItems: "flex-start" }}>
              <div style={{ minWidth: 180 }}>
                <div style={s.label}>
                  Monthly credits
                  <Info size={12} color="#999" style={{ display: "inline", verticalAlign: "middle" }} />
                </div>
                <div style={s.value}>0</div>
                <button type="button" style={s.btnDark}>
                  <PlusCircle size={13} />
                  {" "}
                  Add credits
                </button>
              </div>
              <div style={{ width: 1, backgroundColor: "#e5e5e5", alignSelf: "stretch" }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, color: "#141414", margin: "0 0 8px 0", lineHeight: "20px" }}>
                  Credits are a simple, flexible way to pay for what you use. Credits works across all usage-based features.
                </p>
                <Link href="/settings" style={s.link}><span>Learn more</span><ExternalLink size={11} /></Link>
                <p style={{ fontSize: 13, color: "#141414", margin: "10px 0 6px 0" }}>
                  Credits are managed by users with billing permissions or super admin access.
                </p>
                <Link href="/settings" style={s.link}><span>Manage user permissions</span><ExternalLink size={11} /></Link>
              </div>
            </div>
          </div>

          <div style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <h2 style={{ ...s.h1, marginBottom: 0 }}>Usage this month</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, color: "#666" }}>Updated 22:06 <Info size={11} color="#999" style={{ verticalAlign: "middle" }} /></span>
                <button type="button" style={s.btnLight}><RefreshCw size={12} /> Refresh</button>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>Date range: 11 Feb 2026 - 10 Mar 2026</div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <span style={getDotStyle("#00897b")} />
              <span style={{ fontSize: 12, color: "#444" }}>Billed usage</span>
            </div>

            <div style={{ position: "relative" }}>
              <div style={{
                position: "absolute", right: 0, top: -8, zIndex: 10,
                backgroundColor: "#141414", color: "#fff", fontSize: 10, fontWeight: 700,
                padding: "4px 10px", borderRadius: 4, letterSpacing: 0.5,
              }}
              >
                MONTHLY CREDITS
              </div>

              <ResponsiveContainer width="100%" height={80}>
                <BarChart
                  layout="vertical"
                  data={[{ name: "usage", used: 0, rest: 0 }]}
                  margin={{ top: 16, right: 1, left: 0, bottom: 0 }}
                  barCategoryGap={0}
                >
                  <XAxis
                    type="number" domain={[0, 0]} ticks={barTicks}
                    tick={{ fontSize: 11, fill: "#888", fontFamily: usageLimitsFont }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis type="category" dataKey="name" hide />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="used" stackId="a" fill="#00897b" barSize={22} radius={[0, 0, 0, 0]}>
                    <foreignObject x={4} y={2} width={30} height={22}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: usageLimitsFont, paddingTop: 2 }}>0</div>
                    </foreignObject>
                  </Bar>
                  <Bar dataKey="rest" stackId="a" fill="#e5e5e5" barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: usageLimitsFont, marginBottom: 12 }}>Summary</div>
              <div style={{
                border: "1px solid #e5e5e5", borderRadius: 6, padding: "20px",
                textAlign: "center" as const,
              }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "#666", letterSpacing: 1, fontFamily: usageLimitsFont, marginBottom: 6 }}>
                  MONTHLY CREDITS USED
                </div>
                <div style={{ fontSize: 28, fontWeight: 300, fontFamily: usageLimitsFont, marginBottom: 4 }}>0 of 0</div>
                <div style={{ fontSize: 13, color: "#666", fontFamily: usageLimitsFont }}>credits reset on 11 March</div>
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: usageLimitsFont, marginBottom: 4 }}>Manage credit usage by feature</div>
              <div style={{ fontSize: 13, color: "#666", fontFamily: usageLimitsFont, marginBottom: 16 }}>
                Sometimes features may show more credits used than what you are billed for.
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ position: "relative" as const }}>
                  <select style={s.select} value={featureFilter} onChange={(e) => setFeatureFilter(e.target.value)}>
                    <option>All features</option>
                    <option>Consuming credits</option>
                    <option>Not consuming credits</option>
                  </select>
                </div>
                <div style={{ position: "relative" as const }}>
                  <Search size={14} color="#999" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    style={s.searchBox} placeholder="Search feature"
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ border: "1px solid #e5e5e5", borderRadius: 6, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
                  <thead>
                    <tr>
                      <th style={{ ...s.tableHead, textAlign: "left" as const }}>FEATURE ↕</th>
                      <th style={{ ...s.tableHead, textAlign: "left" as const }}>CREDITS USED ↕</th>
                      <th style={{ ...s.tableHead, textAlign: "left" as const }}>
                        CREDITS STATUS
                        <Info size={11} color="#999" style={{ verticalAlign: "middle" }} />
                        {" "}
                        ↕
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFeatures.map((f) => (
                      <tr key={f.name} style={{ backgroundColor: "#fff" }}>
                        <td style={s.tableCell}>
                          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" as const, gap: 4 }}>
                            <button type="button" style={{ ...s.link, background: "none", border: "none", padding: 0 }} onClick={() => {}}>
                              {f.name}
                            </button>
                            {f.tags.map((t) => (
                              <span key={t.label} style={getTagStyle(t.color, t.bg)}>{t.label}</span>
                            ))}
                          </div>
                        </td>
                        <td style={s.tableCell}>{f.credits}</td>
                        <td style={s.tableCell}>
                          {f.status === "not" ? (
                            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#888" }}>
                              <span style={{ width: 8, height: 8, borderRadius: "50%", border: "2px solid #aaa", display: "inline-block" }} />
                              <span>Not consuming credits</span>
                            </span>
                          ) : (
                            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#141414" }}>
                              <span style={getDotStyle("#00897b")} />
                              <span>Consuming credits</span>
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

          <div style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ ...s.h1, marginBottom: 0 }}>Historical usage</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13, color: "#444", fontFamily: usageLimitsFont }}>Show usage that isn&apos;t billed</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showUnbilled}
                  onClick={() => setShowUnbilled(!showUnbilled)}
                  style={{
                    width: 40, height: 22, borderRadius: 11, cursor: "pointer",
                    backgroundColor: showUnbilled ? "#141414" : "#ccc",
                    position: "relative" as const, transition: "background 200ms",
                    display: "flex", alignItems: "center",
                    border: "none",
                    padding: 0,
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%", backgroundColor: "#fff",
                    position: "absolute", left: showUnbilled ? 21 : 3, transition: "left 200ms",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                  >
                    {showUnbilled && <Check size={10} color="#141414" strokeWidth={3} />}
                  </div>
                </button>
              </div>
            </div>

            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: usageLimitsFont, marginBottom: 6 }}>Overview</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 13, fontFamily: usageLimitsFont }}>
              <span style={{ color: "#444" }}>Date range:</span>
              <button type="button" style={{ ...s.btnLight, fontSize: 13, padding: "4px 10px" }}>
                Three months
                <ChevronDown size={12} />
              </button>
            </div>

            <div style={{ display: "flex", gap: 20, marginBottom: 8 }}>
              {[
                { color: "#00bcd4", label: "Non-billed usage" },
                { color: "#00897b", label: "Billed usage" },
                { color: "#e53935", label: "Monthly credits" },
              ].map((l) => (
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
                  tick={{ fontSize: 11, fill: "#888", fontFamily: usageLimitsFont }}
                  axisLine={{ stroke: "#ccc" }} tickLine={false}
                  label={{ value: "Billing period", position: "insideBottom", offset: -14, fontSize: 12, fill: "#888", fontFamily: usageLimitsFont }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#888", fontFamily: usageLimitsFont }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${v / 1000}K` : v)}
                  label={{ value: "Credits used", angle: -90, position: "insideLeft", offset: -4, fontSize: 12, fill: "#888", fontFamily: usageLimitsFont }}
                  domain={[0, 0]} ticks={[0, 0]}
                />
                <Tooltip
                  contentStyle={{ fontFamily: usageLimitsFont, fontSize: 12, borderRadius: 6 }}
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

          <div style={s.card}>
            <h2 style={{ ...s.h1, marginBottom: 4 }}>Usage log</h2>
            <p style={{ fontSize: 13, color: "#666", fontFamily: usageLimitsFont, margin: "0 0 20px 0" }}>
              Sometimes features may show more credits used than what you are billed for.
            </p>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: usageLimitsFont, marginBottom: 8 }}>Date range</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="text"
                  defaultValue="01/01/2026"
                  style={{
                    fontFamily: usageLimitsFont, fontSize: 13, padding: "8px 12px",
                    border: "1px solid #ccc", borderRadius: 4, width: 130,
                  }}
                />
                <span style={{ fontSize: 13, color: "#444" }}>to</span>
                <input
                  type="text"
                  defaultValue="07/03/2026"
                  style={{
                    fontFamily: usageLimitsFont, fontSize: 13, padding: "8px 12px",
                    border: "1px solid #ccc", borderRadius: 4, width: 130,
                  }}
                />
              </div>
            </div>

            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: usageLimitsFont, marginBottom: 12 }}>Buyer Intent</div>
            <div style={{ border: "1px solid #e5e5e5", borderRadius: 6, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
                <thead>
                  <tr>
                    {["FEATURE ↕", "ACTION ↕", "COST PER ACTION ↕", "TOTAL ACTIONS ↕", "CREDITS USED ↕"].map((h) => (
                      <th key={h} style={{ ...s.tableHead, textAlign: "left" as const }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={s.tableCell}>Intent</td>
                    <td style={s.tableCell}>Company Added and/or Tracked</td>
                    <td style={s.tableCell}>0 credits</td>
                    <td style={s.tableCell}>0</td>
                    <td style={s.tableCell}>0</td>
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
