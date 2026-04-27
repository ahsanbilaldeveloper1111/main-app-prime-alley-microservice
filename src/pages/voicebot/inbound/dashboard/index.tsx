import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  getCompanies,
  getBots,
  getCalls,
  getCallsStats,
} from "@utils/voicebot/inbound";
import { useSession } from "next-auth/react";
import { Form, Row, Col } from "react-bootstrap";
import {
  CompanyOverviewCards,
  RecentCallsTable,
  CompanyOverviewTable,
  formatDuration,
  type CompanyRow,
  type BotRow,
  type CallRow,
  type CompanyTableRow,
} from "@components/voicebot/inbound/dashboard";
import { parseCallsStatsPayload } from "@utils/voicebot/inboundAnalyticsSummary";
import { getBotNameByInboundId, getCompanyByCrmId } from "@utils/Helper";
import "@assets/scss/common.scss";

function pickInboundStr(v: unknown): string {
  if (typeof v !== "string") return "";
  const s = v.trim();
  return s && s !== "[object Object]" ? s : "";
}

function asLookupId(v: unknown): string | null {
  if (v == null || v === "") return null;
  if (typeof v === "string" || typeof v === "number") {
    const s = String(v).trim();
    return s || null;
  }
  return null;
}

/** Normalize call rows: camelCase fields, nested company/bot objects, id lookups via {@link getCompanyByCrmId} / {@link getBotNameByInboundId}. */
function enrichRecentCalls(
  calls: CallRow[],
  companies: CompanyRow[],
  bots: BotRow[],
): CallRow[] {
  return calls.map((call) => {
    const r = call as Record<string, unknown>;
    let companyName =
      pickInboundStr(r.company_name) || pickInboundStr(r.companyName);
    if (!companyName && r.company && typeof r.company === "object") {
      const co = r.company as Record<string, unknown>;
      companyName =
        pickInboundStr(co.name) ||
        pickInboundStr(co.company_name) ||
        pickInboundStr(co.companyName);
    }
    const companyKey = asLookupId(
      r.company_id ??
        r.companyId ??
        (typeof r.company === "string" ? r.company : null),
    );
    if (!companyName && companyKey) {
      companyName = getCompanyByCrmId(companyKey, companies) ?? "";
    }

    let botName = pickInboundStr(r.bot_name) || pickInboundStr(r.botName);
    if (!botName && r.bot && typeof r.bot === "object") {
      const bo = r.bot as Record<string, unknown>;
      botName =
        pickInboundStr(bo.name) ||
        pickInboundStr(bo.bot_name) ||
        pickInboundStr(bo.botName);
    }
    const botKey = asLookupId(
      r.bot_id ??
        r.botId ??
        r.bot_uuid ??
        r.voicebot_id ??
        (typeof r.bot === "string" ? r.bot : null),
    );
    if (!botName && botKey) {
      botName = getBotNameByInboundId(botKey, bots) ?? "";
    }

    const next = { ...call };
    if (companyName) next.company_name = companyName;
    if (botName) next.bot_name = botName;
    return next;
  });
}

interface StatsState {
  total_calls?: number;
  completed?: number;
  avg_duration_seconds?: number;
  total_cost?: number;
}

function parseList<T>(res: unknown): T[] {
  const list = Array.isArray(res)
    ? res
    : ((res as { results?: T[] })?.results ??
      (res as { data?: T[] })?.data ??
      []);
  return Array.isArray(list) ? list : [];
}

function mergeStatsState(
  statsRes: unknown,
  parsed: ReturnType<typeof parseCallsStatsPayload>,
): StatsState | null {
  const raw =
    (statsRes as { data?: StatsState })?.data ?? (statsRes as StatsState);
  if (parsed && typeof raw === "object" && raw) {
    return { ...raw, ...parsed };
  }
  if (parsed) {
    return parsed as StatsState;
  }
  return typeof raw === "object" && raw ? raw : null;
}

function inboundCompanyDisplayLabel(c: CompanyRow): string {
  return (
    (typeof c.name === "string" && c.name.trim()) ||
    (typeof c.company_name === "string" && c.company_name.trim()) ||
    "—"
  );
}

function inboundSubscriptionTierLabel(c: CompanyRow): string {
  return String(c.subscription_tier ?? c.subscriptionTier ?? "Free");
}

function callsAndCostFromStatsResponse(statsRes: unknown): {
  calls: number;
  cost: number;
} {
  const s = mergeStatsState(statsRes, parseCallsStatsPayload(statsRes));
  return {
    calls: s?.total_calls ?? 0,
    cost: s?.total_cost == null ? 0 : Number(s.total_cost),
  };
}

function buildBotsByCompany(botList: BotRow[]): Record<string, number> {
  const botsByCompany: Record<string, number> = {};
  for (const b of botList) {
    const cid = String(b.company_id ?? b.companyId ?? b.company ?? "");
    if (cid) botsByCompany[cid] = (botsByCompany[cid] ?? 0) + 1;
  }
  return botsByCompany;
}

function tableRowFromCompany(
  c: CompanyRow,
  botsByCompany: Record<string, number>,
  calls: number,
  cost: number,
): CompanyTableRow {
  const cid = String(c.id ?? c.company_id ?? c.identifier ?? "");
  return {
    company: inboundCompanyDisplayLabel(c),
    tier: inboundSubscriptionTierLabel(c),
    bots: botsByCompany[cid] ?? 0,
    calls,
    cost: cost.toFixed(4),
  };
}

function primaryCallCompanyKey(call: CallRow): string | null {
  const r = call as Record<string, unknown>;
  const candidates = [
    r.company_id,
    r.companyId,
    typeof r.company === "string" ? r.company : null,
  ];
  for (const v of candidates) {
    const id = asLookupId(v);
    if (id) return id;
  }
  return null;
}

/**
 * Per-company calls/cost from the recent GET /calls/ sample only (avoids N× GET /calls/stats/).
 * Totals for the overview cards still come from a single stats request.
 */
function aggregateCallsSampleByCompany(
  callList: CallRow[],
): Map<string, { calls: number; cost: number }> {
  const m = new Map<string, { calls: number; cost: number }>();
  for (const call of callList) {
    const key = primaryCallCompanyKey(call) ?? "__unscoped__";
    const costRaw = (call as { total_cost?: unknown }).total_cost;
    const costDelta = costRaw == null || costRaw === "" ? 0 : Number(costRaw);
    const cur = m.get(key) ?? { calls: 0, cost: 0 };
    cur.calls += 1;
    if (Number.isFinite(costDelta)) cur.cost += costDelta;
    m.set(key, cur);
  }
  return m;
}

function companyStatsFromSample(
  c: CompanyRow,
  sample: Map<string, { calls: number; cost: number }>,
): { calls: number; cost: number } {
  const ids = [
    String(c.id ?? "").trim(),
    String(c.company_id ?? "").trim(),
    String(c.identifier ?? "").trim(),
  ].filter(Boolean);
  for (const id of ids) {
    const hit = sample.get(id);
    if (hit) return hit;
    const lower = id.toLowerCase();
    for (const [k, v] of sample) {
      if (k.toLowerCase() === lower) return v;
    }
  }
  return { calls: 0, cost: 0 };
}

function buildCompanyTableRows(
  companyList: CompanyRow[],
  botList: BotRow[],
  callList: CallRow[],
  statsRes: unknown,
): CompanyTableRow[] {
  const botsByCompany = buildBotsByCompany(botList);
  if (companyList.length === 0) return [];

  if (companyList.length === 1) {
    const { calls, cost } = callsAndCostFromStatsResponse(statsRes);
    return [tableRowFromCompany(companyList[0], botsByCompany, calls, cost)];
  }

  const sample = aggregateCallsSampleByCompany(callList);
  return companyList.map((c) => {
    const { calls, cost } = companyStatsFromSample(c, sample);
    return tableRowFromCompany(c, botsByCompany, calls, cost);
  });
}

function companyRowApiId(c: CompanyRow): string {
  return String(c.id ?? c.company_id ?? c.identifier ?? "").trim();
}

/** Value for admin company `<select>` — API tenant scope uses `identifier`. */
function inboundCompanySelectValue(c: CompanyRow): string {
  return String(c.identifier ?? "").trim();
}

/** First selectable company when admin has not chosen one yet. */
function defaultAdminSelectedCompanyId(
  prev: string,
  list: CompanyRow[],
): string {
  if (prev) return prev;
  const first = list.find((c) => Boolean(inboundCompanySelectValue(c)));
  return first ? inboundCompanySelectValue(first) : "";
}

async function loadInboundDashboardData(
  effectiveCompanyId: string | undefined,
): Promise<{
  companyList: CompanyRow[];
  botList: BotRow[];
  callList: CallRow[];
  statsRes: unknown;
  mergedStats: StatsState | null;
  companyTableRows: CompanyTableRow[];
}> {
  const paramsCompanies: { show_inactive?: boolean; company_id?: string } = {
    show_inactive: false,
  };
  if (effectiveCompanyId) paramsCompanies.company_id = effectiveCompanyId;

  const paramsBots = effectiveCompanyId
    ? { company_id: effectiveCompanyId, limit: 100 }
    : { limit: 100 };

  const paramsCalls: { limit: number; company_id?: string } = { limit: 100 };
  if (effectiveCompanyId) paramsCalls.company_id = effectiveCompanyId;

  const [compRes, botRes, callsRes, statsRes] = await Promise.all([
    getCompanies(paramsCompanies),
    getBots(paramsBots),
    getCalls(paramsCalls),
    getCallsStats(
      effectiveCompanyId ? { company_id: effectiveCompanyId } : undefined,
    ),
  ]);

  const companyList = parseList<CompanyRow>(compRes);
  const botList = parseList<BotRow>(botRes);
  const callList = parseList<CallRow>(callsRes);
  const mergedStats = mergeStatsState(
    statsRes,
    parseCallsStatsPayload(statsRes),
  );
  const companyTableRows = buildCompanyTableRows(
    companyList,
    botList,
    callList,
    statsRes,
  );

  return {
    companyList,
    botList,
    callList,
    statsRes,
    mergedStats,
    companyTableRows,
  };
}

const InboundDashboardPage = () => {
  const { data: session, status: sessionStatus } = useSession();
  const isAdmin = String(session?.user?.is_admin ?? "") === "1";
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [bots, setBots] = useState<BotRow[]>([]);
  const [recentCalls, setRecentCalls] = useState<CallRow[]>([]);
  const [stats, setStats] = useState<StatsState | null>(null);
  const [companyRows, setCompanyRows] = useState<CompanyTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminCompanyOptions, setAdminCompanyOptions] = useState<CompanyRow[]>(
    [],
  );
  const [adminSelectedCompanyId, setAdminSelectedCompanyId] = useState("");
  const [adminCompanyListLoading, setAdminCompanyListLoading] =
    useState(isAdmin);

  const companyIdentifier = (session?.user as { company_identifier?: string })
    ?.company_identifier;

  useEffect(() => {
    if (sessionStatus === "loading" || !isAdmin) {
      if (sessionStatus !== "loading" && !isAdmin) {
        setAdminCompanyListLoading(false);
      }
      return;
    }

    let cancelled = false;
    setAdminCompanyListLoading(true);
    void (async () => {
      try {
        const res = await getCompanies({ show_inactive: false });
        if (cancelled) return;
        const list = parseList<CompanyRow>(res);
        setAdminCompanyOptions(list);
        setAdminSelectedCompanyId((prev) =>
          defaultAdminSelectedCompanyId(prev, list),
        );
      } catch {
        if (!cancelled) {
          setAdminCompanyOptions([]);
        }
      } finally {
        if (!cancelled) setAdminCompanyListLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, sessionStatus]);

  useEffect(() => {
    if (sessionStatus === "loading") return;

    let cancelled = false;
    const isCancelled = () => cancelled;

    const resetDashboardToEmpty = () => {
      setCompanies([]);
      setBots([]);
      setRecentCalls([]);
      setStats(null);
      setCompanyRows([]);
      setLoading(false);
    };

    const clearDashboardLists = () => {
      setCompanies([]);
      setBots([]);
      setRecentCalls([]);
      setStats(null);
      setCompanyRows([]);
    };

    const applyLoadedDashboard = (
      data: Awaited<ReturnType<typeof loadInboundDashboardData>>,
    ) => {
      setCompanies(data.companyList);
      setBots(data.botList);
      setRecentCalls(
        enrichRecentCalls(data.callList, data.companyList, data.botList),
      );
      setStats(data.mergedStats);
      setCompanyRows(data.companyTableRows);
    };

    const load = async () => {
      if (isAdmin && adminCompanyListLoading) return;
      const scopeMissing =
        (isAdmin && !adminSelectedCompanyId) ||
        (!isAdmin && !companyIdentifier);
      if (scopeMissing) {
        if (!isCancelled()) resetDashboardToEmpty();
        return;
      }

      setLoading(true);
      try {
        const scope = isAdmin ? adminSelectedCompanyId : companyIdentifier;
        const data = await loadInboundDashboardData(scope);
        if (isCancelled()) return;
        applyLoadedDashboard(data);
      } catch {
        if (!isCancelled()) clearDashboardLists();
      } finally {
        if (!isCancelled()) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [
    isAdmin,
    companyIdentifier,
    sessionStatus,
    adminSelectedCompanyId,
    adminCompanyListLoading,
  ]);

  const totalCompanies = isAdmin
    ? adminCompanyOptions.length
    : companies.length;
  const publishedBots = bots.filter((b) => b.status === "published").length;
  const activeBots = bots.filter(
    (b) => b.is_active === true || b.isActive === true,
  ).length;
  const totalCalls = stats?.total_calls ?? 0;
  const completedCalls = stats?.completed ?? 0;
  const successRate =
    totalCalls > 0 ? ((completedCalls / totalCalls) * 100).toFixed(1) : "0.0";
  const totalCost = stats?.total_cost == null ? 0 : Number(stats.total_cost);
  const avgDuration = formatDuration(stats?.avg_duration_seconds);
  const transferRate = "0.0";

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle=""
        mainLink=""
        subTitle="Voicebot Inbound - Dashboard"
      />
      <h2 className="mb-4">Dashboard</h2>

      {isAdmin && (
        <Row className="mb-4 align-items-end">
          <Col xs={12} md={6} lg={5}>
            <Form.Label className="small text-muted mb-1">Company</Form.Label>
            <Form.Select
              value={adminSelectedCompanyId}
              onChange={(e) => setAdminSelectedCompanyId(e.target.value)}
              disabled={
                adminCompanyListLoading || adminCompanyOptions.length === 0
              }
              aria-label="Select company for dashboard"
            >
              {adminCompanyOptions.length === 0 && !adminCompanyListLoading ? (
                <option value="">No companies</option>
              ) : (
                adminCompanyOptions
                  .map((c) => ({ c, value: inboundCompanySelectValue(c) }))
                  .filter((x) => x.value)
                  .map(({ c, value }) => (
                    <option key={value} value={value}>
                      {inboundCompanyDisplayLabel(c)}
                    </option>
                  ))
              )}
            </Form.Select>
          </Col>
        </Row>
      )}

      <CompanyOverviewCards
        isAdmin={isAdmin}
        loading={loading}
        totalCompanies={totalCompanies}
        publishedBots={publishedBots}
        successRate={successRate}
        avgDuration={avgDuration}
        activeBots={activeBots}
        totalCalls={totalCalls}
        transferRate={transferRate}
        totalCostFormatted={`$${totalCost.toFixed(4)}`}
      />

      <RecentCallsTable loading={loading} calls={recentCalls} />

      {isAdmin && <CompanyOverviewTable loading={loading} rows={companyRows} />}
    </React.Fragment>
  );
};

InboundDashboardPage.getLayout = (page: ReactElement) => (
  <Layout>{page}</Layout>
);
export default InboundDashboardPage;
