import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { TableColumn } from "@components/GenericTable";
import GenericSidebar, { SidebarSection } from "@components/GenericSidebarNew";
import {
  getBots,
  getBot,
  getBotVersions,
  switchBotVersion,
  getSipTrunks,
  postBots,
  putBot,
  deleteBot,
  publishBot,
  unpublishBot,
  getCompanies,
  type CreateBotPayload,
  type BotConfiguration,
  type BotVersionItem,
  type UpdateBotPayload,
} from "@utils/voicebot/inbound";
import {
  companyIdFromBotApi,
  safeDisplayString,
  toFormString,
} from "@utils/voicebot/formDisplay";
import {
  Row,
  Col,
  Button,
  Modal,
  Offcanvas,
  Form,
  Spinner,
  Accordion,
} from "react-bootstrap";
import { toast } from "react-toastify";
import {
  Plus,
  Pencil,
  Trash2,
  Send,
  Undo2,
  Eye,
  History,
  Info,
  Settings,
  Mic,
  Cpu,
  SlidersHorizontal,
  Phone,
} from "lucide-react";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import "@assets/scss/common.scss";
import { useSession } from "next-auth/react";
import { HEADER_CONSTANTS } from "@constants/headerConstants";

interface CompanyOption {
  id: string;
  company_id?: string;
  identifier?: string;
  name: string;
}

interface BotRow {
  id?: string;
  name: string;
  description?: string;
  status?: string;
  company?: string;
  company_id?: string;
  company_name?: string;
  version?: number | string;
  current_version?: number | string;
  configuration?: BotConfiguration;
  [key: string]: unknown;
}

function rawBotConfig(row: BotRow): Record<string, unknown> {
  const c = row.configuration;
  if (c && typeof c === "object" && !Array.isArray(c)) {
    return c as Record<string, unknown>;
  }
  return {};
}

function nestedLeaf(
  root: Record<string, unknown>,
  nestedKey: string,
  leafKey: string,
): string {
  const nested = root[nestedKey];
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const v = (nested as Record<string, unknown>)[leafKey];
    if (typeof v === "string") return v;
    if (typeof v === "number" || typeof v === "boolean") return String(v);
  }
  return "";
}

function getNestedValue<T extends string | number | boolean>(
  root: Record<string, unknown>,
  nestedKey: string,
  leafKey: string,
  defaultValue: T,
): T {
  const nested = root[nestedKey];
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const value = (nested as Record<string, unknown>)[leafKey];
    if (value != null) {
      // Only return the value if it is of type string | number | boolean
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        return value as T;
      }
    }
  }
  return defaultValue;
}

function llmModelFromBotRow(row: BotRow): string {
  return getNestedValue(
    row.configuration ?? {},
    "llm_settings",
    "llm_model",
    "gpt-4o-mini",
  );
}

function voiceNameFromBotRow(row: BotRow): string {
  return getNestedValue(
    row.configuration ?? {},
    "voice_settings",
    "voice_name",
    "alloy",
  );
}

function sipTrunkFromBotRow(row: BotRow): string {
  return getNestedValue(
    row.configuration ?? {},
    "sip_settings",
    "sip_trunk_id",
    "",
  );
}

function phoneFromBotRow(row: BotRow): string {
  return getNestedValue(
    row.configuration ?? {},
    "sip_settings",
    "phone_number",
    "",
  );
}

function versionFromBotRow(row: BotRow): string {
  const v = row.version ?? row.current_version;
  if (typeof v === "number") return "v" + String(v);
  if (typeof v === "string") return "v" + v;
  return "";
}

function companyLabelFromBotRow(row: BotRow): string {
  const name = row.company_name;
  if (typeof name === "string" && name.trim() !== "") return name;
  const co = row.company;
  if (typeof co === "string" && co.trim() !== "") return co;
  return "";
}
const BOT_STATUS_TABS = [
  { id: "draft", label: "Drafts" },
  { id: "published", label: "Published" },
  { id: "archived", label: "Archived" },
] as const;

const VOICE_OPTIONS = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];

const LLM_MODEL_OPTIONS = [
  "gpt-4o-mini",
  "gpt-4o",
  "gpt-4-turbo",
  "gpt-3.5-turbo",
];

/** Matches `src/pages/voicebot/inbound/bots/create/index.tsx` defaults. */
const defaultConfig: BotConfiguration = {
  instructions:
    "You are a helpful AI assistant. Answer questions clearly and concisely.",
  knowledge_base: "",
  voice_name: "alloy",
  voice_model: "gpt-4o-mini-tts",
  voice_speed: 1,
  voice_instructions: "",
  greeting_message: "Hello! I'm here to help you. How can I assist you today?",
  llm_model: "gpt-4o-mini",
  temperature: 0.7,
  max_tokens: 1000,
  transfer_enabled: true,
  transfer_number: "",
  transfer_trunk_id: "",
  max_duration: 1800,
  idle_timeout: 300,
  allow_interruptions: true,
  noise_cancellation: true,
  min_endpointing_delay: 0.05,
  sip_trunk_id: "",
  phone_number: "",
};

function buildConfigValue<T>(
  value: T | undefined,
  defaultValue: T,
  parse: (input: string) => T = (s: string) => s as any,
): T {
  return typeof value === typeof "undefined" || value === null
    ? defaultValue
    : parse(String(value)) || defaultValue;
}

function buildConfigurationPayload(
  c: BotConfiguration = defaultConfig,
): BotConfiguration {
  return {
    instructions: c.instructions?.trim() ?? "",
    knowledge_base: c.knowledge_base?.trim() ?? "",
    voice_name: c.voice_name ?? "alloy",
    voice_model: c.voice_model ?? "gpt-4o-mini-tts",
    voice_speed: buildConfigValue(c.voice_speed, 1, Number.parseFloat),
    voice_instructions: c.voice_instructions?.trim() ?? "",
    llm_model: c.llm_model ?? "gpt-4o-mini",
    temperature: buildConfigValue(c.temperature, 0.7, Number.parseFloat),
    max_tokens: buildConfigValue(c.max_tokens, 1000, (s) =>
      Number.parseInt(s, 10),
    ),
    greeting_message: c.greeting_message?.trim() ?? "",
    transfer_enabled: Boolean(c.transfer_enabled),
    transfer_number: c.transfer_number?.trim() ?? "",
    transfer_trunk_id: c.transfer_trunk_id?.trim() ?? "",
    max_duration: buildConfigValue(c.max_duration, 1800, (s) =>
      Number.parseInt(s, 10),
    ),
    idle_timeout: buildConfigValue(c.idle_timeout, 300, (s) =>
      Number.parseInt(s, 10),
    ),
    sip_trunk_id: c.sip_trunk_id?.trim() ?? "",
    phone_number: c.phone_number?.trim() ?? "",
    allow_interruptions: Boolean(c.allow_interruptions),
    min_endpointing_delay: buildConfigValue(
      c.min_endpointing_delay,
      0.05,
      Number.parseFloat,
    ),
    noise_cancellation: Boolean(c.noise_cancellation),
  };
}

function getFirstValidationError(form: CreateBotPayload): string | null {
  if (!form.company_id) return "Please select a company";
  if (!form.name?.trim()) return "Bot Name is required";
  if (!form.description?.trim()) return "Description is required";
  const c = form.configuration;
  if (!c?.instructions?.trim()) return "Instructions are required";
  if (!c?.knowledge_base?.trim()) return "Knowledge Base is required";
  if (!c?.voice_instructions?.trim()) return "Voice Instructions are required";
  if (c?.transfer_enabled && !c?.transfer_number?.trim()) {
    return "Transfer Number is required when transfer is enabled";
  }
  if (!c?.sip_trunk_id?.trim()) return "SIP Trunk ID is required";
  if (!c?.phone_number?.trim()) return "Phone Number is required";
  return null;
}

function validateFormAndToast(form: CreateBotPayload): boolean {
  const err = getFirstValidationError(form);
  if (err) {
    toast.error(err);
    return false;
  }
  return true;
}

function buildUpdatePayload(form: CreateBotPayload): UpdateBotPayload {
  const c = form.configuration ?? defaultConfig;
  const companyId = String(form.company_id ?? "").trim();
  return {
    company_id: companyId,
    name: form.name?.trim() ?? "",
    description: form.description?.trim() ?? "",
    status: form.status ?? "draft",
    configuration: buildConfigurationPayload(c),
  };
}

function buildCreateBotPayload(form: CreateBotPayload): CreateBotPayload {
  const updatePayload = buildUpdatePayload(form);
  return {
    company_id: updatePayload.company_id ?? "",
    name: updatePayload.name ?? "",
    description: updatePayload.description ?? "",
    status: updatePayload.status ?? "draft",
    configuration: updatePayload.configuration ?? defaultConfig,
  };
}

type SipTrunkOption = {
  sip_trunk_id: string;
  name: string;
  caller_ids: string[];
};

function listFromSipTrunksResponse(res: unknown): unknown[] {
  if (Array.isArray(res)) return res;
  const o = res as Record<string, unknown> | null | undefined;
  const inner = o?.data ?? o?.results;
  return Array.isArray(inner) ? inner : [];
}

function normalizeCallerIds(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((x) =>
        typeof x === "string" || typeof x === "number" ? String(x) : "",
      )
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  if (typeof raw === "string" && raw.trim()) {
    return raw
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  return [];
}

function callerIdsFromSipTrunkItem(item: Record<string, unknown>): string[] {
  return normalizeCallerIds(item.caller_ids ?? item.callerIds);
}

function sipTrunkRowIdFromItem(item: Record<string, unknown>): string {
  const candidates = [item.sip_trunk_id, item.id, item.trunk_id];
  for (const value of candidates) {
    if (value == null || typeof value === "object") continue;
    if (typeof value === "string") {
      const t = value.trim();
      if (t) return t;
    }
    if (
      typeof value === "number" ||
      typeof value === "boolean" ||
      typeof value === "bigint"
    ) {
      const s = String(value).trim();
      if (s) return s;
    }
  }
  return "";
}

function normalizeSipTrunkRows(list: unknown[]): SipTrunkOption[] {
  const out: SipTrunkOption[] = [];
  for (const raw of list) {
    const item = raw as Record<string, unknown>;
    const id = sipTrunkRowIdFromItem(item);
    if (!id) continue;
    const name = typeof item.name === "string" ? item.name : id;
    out.push({
      sip_trunk_id: id,
      name,
      caller_ids: callerIdsFromSipTrunkItem(item),
    });
  }
  return out;
}

function companyIdentifierParamForSipTrunks(
  companies: CompanyOption[],
  selectedCompanyValue: string,
): string {
  const t = selectedCompanyValue.trim();
  if (!t) return "";
  const c = companies.find(
    (x) => x.id === t || x.identifier === t || x.company_id === t,
  );
  if (c?.identifier?.trim()) return c.identifier.trim();
  return t;
}

function clearStaleSipTrunkFormSelection(
  prev: CreateBotPayload,
  rows: SipTrunkOption[],
): CreateBotPayload {
  const current = prev.configuration?.sip_trunk_id?.trim() ?? "";
  if (!current) return prev;
  const stillValid = rows.some((row) => row.sip_trunk_id === current);
  if (stillValid) return prev;
  return {
    ...prev,
    configuration: {
      ...prev.configuration,
      sip_trunk_id: "",
      phone_number: "",
    },
  };
}

function getListFromResponse(res: unknown): unknown[] {
  if (Array.isArray(res)) return res;
  const obj = res as Record<string, unknown> | null | undefined;
  const list = obj?.results ?? obj?.data;
  return Array.isArray(list) ? list : [];
}

function getCompanyOptions(list: unknown[]): CompanyOption[] {
  return list.map((c) => {
    const item = c as Record<string, unknown>;
    const identifierVal = item.company_identifier ?? item.identifier;
    const idVal = item.id ?? item.company_id;
    let primary = "";
    if (typeof identifierVal === "string") primary = identifierVal.trim();
    else if (typeof identifierVal === "number")
      primary = String(identifierVal).trim();
    let fallback = "";
    if (typeof idVal === "string") fallback = idVal;
    else if (typeof idVal === "number") fallback = String(idVal);
    const idStr = primary || fallback;
    const option: CompanyOption = {
      id: idStr,
      name: typeof item.name === "string" ? item.name : "",
    };
    if (idStr !== "") option.company_id = idStr;
    if (typeof item.identifier === "string" && item.identifier.trim()) {
      option.identifier = item.identifier.trim();
    } else if (
      typeof item.company_identifier === "string" &&
      item.company_identifier.trim()
    ) {
      option.identifier = item.company_identifier.trim();
    }
    return option;
  });
}

function removeIdFromList(prev: string[], idToRemove: string): string[] {
  return prev.filter((id) => id !== idToRemove);
}

function toggleTabDraftSelection(
  prev: string[],
  tabId: string,
  isChecked: boolean,
): string[] {
  if (isChecked) {
    return prev.includes(tabId) ? prev : [...prev, tabId];
  }
  return prev.filter((id) => id !== tabId);
}

function tabSelectionDraftFromVisible(visibleTabIds: string[]): string[] {
  return visibleTabIds.filter((tabId) => tabId !== "all");
}

function mapVisibleStatusTabsForToolbar(
  visibleTabIds: string[],
  botTabCounts: Record<string, number>,
): Array<{ id: string; label: string; count: number; removable: boolean }> {
  return BOT_STATUS_TABS.filter((tab) => visibleTabIds.includes(tab.id)).map(
    (tab) => ({
      id: tab.id,
      label: tab.label,
      count: botTabCounts[tab.id] || 0,
      removable: true,
    }),
  );
}

function extractSettings(config: Record<string, unknown>) {
  const {
    voice_settings = {},
    llm_settings = {},
    behavior_settings = {},
    sip_settings = {},
  } = config;

  // Return as records, you can add additional typing if needed
  return {
    voice: voice_settings as Record<string, unknown>,
    llm: llm_settings as Record<string, unknown>,
    behavior: behavior_settings as Record<string, unknown>,
    sip: sip_settings as Record<string, unknown>,
  };
}

/** Renders version configuration_snapshot (API shape: instructions, knowledge_base, voice_settings, llm_settings, behavior_settings, sip_settings) */
const VersionConfigSnapshot = ({
  config,
}: {
  config: Record<string, unknown>;
}) => {
  const v = (o: Record<string, unknown> | undefined, k: string) =>
    safeDisplayString(o?.[k]);
  const { voice, llm, behavior, sip } = extractSettings(config);
  return (
    <div className="" style={{ maxHeight: "320px", overflow: "auto" }}>
      <table className="table table-bordered mb-2">
        <tbody>
          <tr>
            <th style={{ width: "140px" }}>Instructions</th>
            <td>
              <div
                className="mb-0 text-break"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {v(config, "instructions")}
              </div>
            </td>
          </tr>
          <tr>
            <th>Knowledge Base</th>
            <td>
              <div
                className="mb-0 text-break"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {v(config, "knowledge_base")}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <h6 className="mb-2 mt-2">Voice settings</h6>
      <table className="table  table-bordered mb-2">
        <tbody>
          <tr>
            <th style={{ width: "140px" }}>Voice</th>
            <td>{v(voice, "voice")}</td>
          </tr>
          <tr>
            <th>Model</th>
            <td>{v(voice, "model")}</td>
          </tr>
          <tr>
            <th>Speed</th>
            <td>{v(voice, "speed")}</td>
          </tr>
          <tr>
            <th>Instructions</th>
            <td>
              <div
                className="mb-0 text-break"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {v(voice, "instructions")}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <h6 className="mb-1 mt-2">LLM settings</h6>
      <table className="table table-bordered mb-2">
        <tbody>
          <tr>
            <th style={{ width: "140px" }}>Model</th>
            <td>{v(llm, "model")}</td>
          </tr>
          <tr>
            <th>Temperature</th>
            <td>{v(llm, "temperature")}</td>
          </tr>
          <tr>
            <th>Max tokens</th>
            <td>{v(llm, "max_tokens")}</td>
          </tr>
        </tbody>
      </table>
      <h6 className="mb-2 mt-2">Behavior settings</h6>
      <table className="table table-sm table-bordered mb-2">
        <tbody>
          <tr>
            <th style={{ width: "140px" }}>Greeting</th>
            <td>
              <div
                className="mb-0 text-break"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {v(behavior, "greeting")}
              </div>
            </td>
          </tr>

          <tr>
            <th>Transfer enabled</th>
            <td>{v(behavior, "transfer_enabled")}</td>
          </tr>
          <tr>
            <th>Transfer number</th>
            <td>{v(behavior, "transfer_number")}</td>
          </tr>
          <tr>
            <th>Max duration (s)</th>
            <td>{v(behavior, "max_duration")}</td>
          </tr>
          <tr>
            <th>Idle timeout (s)</th>
            <td>{v(behavior, "idle_timeout")}</td>
          </tr>
          <tr>
            <th>Allow interruptions</th>
            <td>{v(behavior, "allow_interruptions")}</td>
          </tr>
          <tr>
            <th>Min endpointing delay</th>
            <td>{v(behavior, "min_endpointing_delay")}</td>
          </tr>
          <tr>
            <th>Noise cancellation</th>
            <td>{v(behavior, "noise_cancellation")}</td>
          </tr>
        </tbody>
      </table>
      <h6 className="mb-2 mt-2">SIP settings</h6>
      <table className="table table-sm table-bordered mb-0">
        <tbody>
          <tr>
            <th style={{ width: "140px" }}>Trunk ID</th>
            <td>{v(sip, "trunk_id")}</td>
          </tr>
          <tr>
            <th>Phone number</th>
            <td>{v(sip, "phone_number")}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const getBotId = (row: BotRow) => row.id ?? "";

interface BotTableActionsProps {
  row: BotRow;
  canEdit: boolean;
  canDelete: boolean;
  canVersion: boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onPublish: (id: string) => void;
  onUnpublish: (id: string) => void;
  onHistory: (row: BotRow) => void;
  onDelete: (row: BotRow) => void;
}

function isConfigObject(config: unknown): config is Record<string, unknown> {
  return config != null && typeof config === "object";
}

function getConfigValue(
  source: Record<string, unknown> | null,
  key: string,
  nestedKey?: string,
): string {
  const isPresentPrimitive = (
    value: unknown,
  ): value is string | number | boolean =>
    (typeof value === "string" && value.trim() !== "") ||
    typeof value === "number" ||
    typeof value === "boolean";

  if (!source) return "—";
  const config = source.configuration;
  if (!isConfigObject(config)) return "—";
  const direct = config[key];
  if (isPresentPrimitive(direct)) {
    return safeDisplayString(direct);
  }
  if (nestedKey) {
    const nested = config[nestedKey];
    if (isConfigObject(nested)) {
      const nestedValue = nested[key];
      if (isPresentPrimitive(nestedValue)) {
        return safeDisplayString(nestedValue);
      }
    }
  }
  return "—";
}

interface BotHistoryModalBodyProps {
  historyLoading: boolean;
  historyVersions: BotVersionItem[];
  historyBotId: string | null;
  rollbackVersion: number | null;
  onRollback: (botId: string, version: number) => void;
}

const BotHistoryModalBody = ({
  historyLoading,
  historyVersions,
  historyBotId,
  rollbackVersion,
  onRollback,
}: BotHistoryModalBodyProps) => {
  if (historyLoading) {
    return (
      <div className="d-flex justify-content-center py-4">
        <Spinner animation="border" />
      </div>
    );
  }
  if (historyVersions.length === 0) {
    return <p className="text-muted mb-0">No version history.</p>;
  }
  return (
    <Accordion defaultActiveKey="">
      {historyVersions.map((v) => (
        <Accordion.Item key={v.id} eventKey={v.id}>
          <Accordion.Header>
            <span className="me-2">v{v.version}</span>
            <span className="text-muted me-2">
              {v.created_at ? new Date(v.created_at).toLocaleString() : "—"}
            </span>
            {v.change_description && (
              <span className="me-2">— {v.change_description}</span>
            )}
          </Accordion.Header>
          <Accordion.Body>
            {v.configuration_snapshot &&
            typeof v.configuration_snapshot === "object" ? (
              <VersionConfigSnapshot config={v.configuration_snapshot} />
            ) : (
              <p className="text-muted mb-0 small">
                No configuration snapshot.
              </p>
            )}
            {historyBotId && (
              <div className="mt-3 d-flex justify-content-end">
                <Button
                  size="sm"
                  variant="outline-warning"
                  onClick={() => onRollback(historyBotId, v.version)}
                  disabled={rollbackVersion !== null}
                >
                  {rollbackVersion === v.version ? (
                    <Spinner animation="border" size="sm" className="me-1" />
                  ) : null}
                  Rollback to v{v.version}
                </Button>
              </div>
            )}
          </Accordion.Body>
        </Accordion.Item>
      ))}
    </Accordion>
  );
};

const BotTableActions = ({
  row,
  canEdit,
  canDelete,
  canVersion,
  onView,
  onEdit,
  onPublish,
  onUnpublish,
  onHistory,
  onDelete,
}: BotTableActionsProps) => {
  const id = getBotId(row);
  const isPublished = row.status === "published";
  return (
    <div className="d-flex gap-1">
      <Button
        title="View"
        size="sm"
        variant="outline-secondary"
        onClick={() => {
          onView(id);
        }}
      >
        <Eye size={14} />
      </Button>
      {canEdit && (
        <Button
          title="Edit"
          size="sm"
          variant="outline-primary"
          onClick={() => onEdit(id)}
        >
          <Pencil size={14} />
        </Button>
      )}
      {canEdit && !isPublished && (
        <Button
          title="Publish"
          size="sm"
          variant="outline-success"
          onClick={() => onPublish(id)}
        >
          <Send size={14} />
        </Button>
      )}
      {canEdit && isPublished && (
        <Button
          title="Unpublish"
          size="sm"
          variant="outline-warning"
          onClick={() => onUnpublish(id)}
        >
          <Undo2 size={14} />
        </Button>
      )}
      {canVersion && (
        <Button
          title="Show history"
          size="sm"
          variant="outline-info"
          onClick={() => onHistory(row)}
        >
          <History size={14} />
        </Button>
      )}
      {canDelete && (
        <Button
          title="Delete"
          size="sm"
          variant="outline-danger"
          onClick={() => onDelete(row)}
        >
          <Trash2 size={14} />
        </Button>
      )}
    </div>
  );
};

const BotsPage = () => {
  const { data: session } = useSession();
  const { PERMISSIONS } = HEADER_CONSTANTS;
  const isAdmin = String(session?.user?.is_admin ?? "") === "1";
  const sessionUser = session?.user as
    | { company_id?: string | null; company_identifier?: string | null }
    | undefined;
  const userCompanyId = String(sessionUser?.company_id ?? "").trim();
  const userCompanyIdentifier = String(
    sessionUser?.company_identifier ?? "",
  ).trim();
  const permissions = session?.user?.permissions ?? [];
  const canCreateBots = permissions.includes(
    PERMISSIONS.CREATE_INBOUND_BOTS_INBOUND,
  );
  const canEditBots = permissions.includes(
    PERMISSIONS.EDIT_INBOUND_BOTS_INBOUND,
  );
  const canDeleteBots = permissions.includes(
    PERMISSIONS.DELETE_INBOUND_BOTS_INBOUND,
  );
  const canVersionInboundBots = permissions.includes(
    PERMISSIONS.INBOUND_BOT_VERSIONING_INBOUND,
  );
  const [data, setData] = useState<BotRow[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [companyFilter, setCompanyFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showTabSelectorModal, setShowTabSelectorModal] = useState(false);
  const [showBotFormModal, setShowBotFormModal] = useState(false);
  const [isEditFormMode, setIsEditFormMode] = useState(false);
  const [editingBotId, setEditingBotId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState<CreateBotPayload>({
    company_id: "",
    name: "",
    description: "",
    status: "draft",
    configuration: { ...defaultConfig },
  });
  const [sipTrunks, setSipTrunks] = useState<SipTrunkOption[]>([]);
  const [loadingSipTrunks, setLoadingSipTrunks] = useState(false);
  const [visibleTabIds, setVisibleTabIds] = useState<string[]>([
    "all",
    "published",
  ]);
  const [tabSelectionDraft, setTabSelectionDraft] = useState<string[]>([
    "published",
  ]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBotSidebar, setShowBotSidebar] = useState(false);
  const [sidebarBotId, setSidebarBotId] = useState<string | null>(null);
  const [sidebarBot, setSidebarBot] = useState<Record<string, unknown> | null>(
    null,
  );
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyBotId, setHistoryBotId] = useState<string | null>(null);
  const [historyBotName, setHistoryBotName] = useState<string>("");
  const [historyVersions, setHistoryVersions] = useState<BotVersionItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [rollbackVersion, setRollbackVersion] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<BotRow | null>(null);
  const hasInitializedVisibleTabs = useRef(false);
  const sidebarRequestSequence = useRef(0);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await getCompanies({ show_inactive: false });
      const list = getListFromResponse(res);
      const opts = getCompanyOptions(list);
      setCompanies(opts);
      const admin = String(session?.user?.is_admin ?? "") === "1";
      if (admin && opts.length > 0) {
        setForm((prev) =>
          prev.company_id ? prev : { ...prev, company_id: opts[0].id },
        );
      }
    } catch {
      setCompanies([]);
    }
  }, [session?.user?.is_admin]);

  const fetchBots = useCallback(async () => {
    setLoading(true);
    try {
      const params: { company_id?: string; limit: number; status?: string } = {
        limit: 100,
      };
      if (companyFilter) params.company_id = companyFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await getBots(params);
      let list = getListFromResponse(res) as BotRow[];
      if (statusFilter) {
        list = list.filter((row) => String(row.status ?? "") === statusFilter);
      }
      setData(list);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string }; message?: string } })
          ?.response?.data?.detail ||
        (err as { message?: string })?.message ||
        "Failed to load bots";
      toast.error(message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [companyFilter, statusFilter]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    fetchBots();
  }, [fetchBots]);

  useEffect(() => {
    if (isAdmin) return;
    if (isEditFormMode) return;
    const cid = userCompanyId || userCompanyIdentifier;
    if (cid) setForm((f) => ({ ...f, company_id: cid }));
  }, [isAdmin, isEditFormMode, userCompanyId, userCompanyIdentifier]);

  const companyIdForSipTrunks = useMemo(
    () => companyIdentifierParamForSipTrunks(companies, form.company_id),
    [companies, form.company_id],
  );

  useEffect(() => {
    if (!showBotFormModal) return;
    const paramTrim = companyIdForSipTrunks.trim();
    if (!paramTrim) {
      setSipTrunks([]);
      return;
    }
    let cancelled = false;
    setLoadingSipTrunks(true);
    getSipTrunks({ company_id: paramTrim })
      .then((res) => {
        if (cancelled) return;
        const rows = normalizeSipTrunkRows(listFromSipTrunksResponse(res));
        setSipTrunks(rows);
        setForm((prev) => clearStaleSipTrunkFormSelection(prev, rows));
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Failed to load SIP trunks");
          setSipTrunks([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSipTrunks(false);
      });
    return () => {
      cancelled = true;
    };
  }, [companyIdForSipTrunks, showBotFormModal]);

  useEffect(() => {
    if (hasInitializedVisibleTabs.current) return;
    setVisibleTabIds(["all", "published"]);
    setTabSelectionDraft(["published"]);
    hasInitializedVisibleTabs.current = true;
  }, []);

  const closeBotSidebar = useCallback(() => {
    setShowBotSidebar(false);
    setSidebarBotId(null);
    setSidebarBot(null);
    setSidebarLoading(false);
  }, []);

  const openBotSidebar = useCallback((row: BotRow) => {
    const botId = getBotId(row);
    if (!botId) return;
    const requestId = sidebarRequestSequence.current + 1;
    sidebarRequestSequence.current = requestId;
    setSidebarBotId(botId);
    setShowBotSidebar(true);
    setSidebarLoading(true);
    getBot(botId)
      .then((details: Record<string, unknown>) => {
        if (sidebarRequestSequence.current !== requestId) return;
        setSidebarBot(details);
      })
      .catch(() => {
        if (sidebarRequestSequence.current !== requestId) return;
        toast.error("Failed to load bot details");
      })
      .finally(() => {
        if (sidebarRequestSequence.current !== requestId) return;
        setSidebarLoading(false);
      });
  }, []);

  const botSidebarSections = useMemo<SidebarSection[]>(() => {
    if (!sidebarBot) return [];
    const rawStatus = sidebarBot.status;
    const status = typeof rawStatus === "string" ? rawStatus.toLowerCase() : "";
    return [
      {
        id: "about-bot",
        title: "About this bot",
        icon: Info,
        collapsible: true,
        defaultExpanded: true,
        fields: [
          {
            label: "Name",
            value: safeDisplayString(sidebarBot.name),
            copyable: true,
          },
          {
            label: "Description",
            value: safeDisplayString(sidebarBot.description),
          },
          {
            label: "Status",
            value: status === "published" ? "Published" : "Draft",
            type: "badge",
            badgeVariant: status === "published" ? "success" : "secondary",
          },
          {
            label: "Company",
            value: safeDisplayString(
              sidebarBot.company_name ??
                sidebarBot.company_id ??
                sidebarBot.company,
            ),
          },
          {
            label: "Version",
            value: safeDisplayString(
              sidebarBot.current_version ?? sidebarBot.version,
            ),
          },
        ],
      },
      {
        id: "configuration",
        title: "Configuration",
        icon: Settings,
        collapsible: true,
        defaultExpanded: true,
        fields: [
          {
            label: "Instructions",
            value: getConfigValue(sidebarBot, "instructions"),
          },
          {
            label: "Knowledge Base",
            value: getConfigValue(sidebarBot, "knowledge_base"),
          },
        ],
      },
      {
        id: "voice-settings",
        title: "Voice settings",
        icon: Mic,
        collapsible: true,
        defaultExpanded: false,
        fields: [
          {
            label: "Voice",
            value: getConfigValue(sidebarBot, "voice_name", "voice_settings"),
          },
          {
            label: "Model",
            value: getConfigValue(sidebarBot, "voice_model", "voice_settings"),
          },
          {
            label: "Speed",
            value: getConfigValue(sidebarBot, "voice_speed", "voice_settings"),
          },
          {
            label: "Instructions",
            value: getConfigValue(
              sidebarBot,
              "voice_instructions",
              "voice_settings",
            ),
          },
          {
            label: "Greeting",
            value: getConfigValue(
              sidebarBot,
              "greeting_message",
              "behavior_settings",
            ),
          },
        ],
      },
      {
        id: "llm-settings",
        title: "LLM settings",
        icon: Cpu,
        collapsible: true,
        defaultExpanded: false,
        fields: [
          {
            label: "Model",
            value: getConfigValue(sidebarBot, "llm_model", "llm_settings"),
          },
          {
            label: "Temperature",
            value: getConfigValue(sidebarBot, "temperature", "llm_settings"),
          },
          {
            label: "Max tokens",
            value: getConfigValue(sidebarBot, "max_tokens", "llm_settings"),
          },
        ],
      },
      {
        id: "behavior-settings",
        title: "Behavior settings",
        icon: SlidersHorizontal,
        collapsible: true,
        defaultExpanded: false,
        fields: [
          {
            label: "Transfer enabled",
            value: getConfigValue(
              sidebarBot,
              "transfer_enabled",
              "behavior_settings",
            ),
          },
          {
            label: "Transfer number",
            value: getConfigValue(
              sidebarBot,
              "transfer_number",
              "behavior_settings",
            ),
          },
          {
            label: "Transfer trunk ID",
            value: getConfigValue(
              sidebarBot,
              "transfer_trunk_id",
              "behavior_settings",
            ),
          },
          {
            label: "Max duration (s)",
            value: getConfigValue(
              sidebarBot,
              "max_duration",
              "behavior_settings",
            ),
          },
          {
            label: "Idle timeout (s)",
            value: getConfigValue(
              sidebarBot,
              "idle_timeout",
              "behavior_settings",
            ),
          },
          {
            label: "Allow interruptions",
            value: getConfigValue(
              sidebarBot,
              "allow_interruptions",
              "behavior_settings",
            ),
          },
          {
            label: "Noise cancellation",
            value: getConfigValue(
              sidebarBot,
              "noise_cancellation",
              "behavior_settings",
            ),
          },
          {
            label: "Min endpointing delay",
            value: getConfigValue(
              sidebarBot,
              "min_endpointing_delay",
              "behavior_settings",
            ),
          },
        ],
      },
      {
        id: "sip-settings",
        title: "SIP settings",
        icon: Phone,
        collapsible: true,
        defaultExpanded: false,
        fields: [
          {
            label: "SIP trunk ID",
            value: getConfigValue(sidebarBot, "sip_trunk_id", "sip_settings"),
          },
          {
            label: "Phone number",
            value: getConfigValue(sidebarBot, "phone_number", "sip_settings"),
            copyable: true,
          },
        ],
      },
    ];
  }, [sidebarBot]);

  useEffect(() => {
    if (showHistoryModal && historyBotId) {
      setHistoryLoading(true);
      getBotVersions(historyBotId)
        .then(setHistoryVersions)
        .catch(() => {
          toast.error("Failed to load version history");
          setHistoryVersions([]);
        })
        .finally(() => setHistoryLoading(false));
    } else {
      setHistoryVersions([]);
    }
  }, [showHistoryModal, historyBotId]);

  const handlePublish = useCallback(
    async (id: string) => {
      try {
        await publishBot(id);
        toast.success("Bot published");
        fetchBots();
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { detail?: string } } })?.response?.data
            ?.detail ?? "Publish failed";
        toast.error(msg);
      }
    },
    [fetchBots],
  );

  const handleUnpublish = useCallback(
    async (id: string) => {
      try {
        await unpublishBot(id);
        toast.success("Bot unpublished");
        fetchBots();
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { detail?: string } } })?.response?.data
            ?.detail ?? "Unpublish failed";
        toast.error(msg);
      }
    },
    [fetchBots],
  );

  const handleRollback = useCallback(
    (botId: string, version: number) => {
      setRollbackVersion(version);
      switchBotVersion(botId, version)
        .then(() => {
          toast.success(`Rolled back to v${version}`);
          setShowHistoryModal(false);
          setHistoryBotId(null);
          setHistoryBotName("");
          setHistoryVersions([]);
          fetchBots();
        })
        .catch((err: unknown) => {
          const msg =
            (err as { response?: { data?: { detail?: string } } })?.response
              ?.data?.detail ?? "Rollback failed";
          toast.error(msg);
        })
        .finally(() => setRollbackVersion(null));
    },
    [fetchBots],
  );

  const resetFormState = useCallback(() => {
    setEditingBotId(null);
    setIsEditFormMode(false);
    const companyScope = isAdmin
      ? (companies[0]?.id ?? "")
      : userCompanyId || userCompanyIdentifier;
    setForm({
      company_id: companyScope,
      name: "",
      description: "",
      status: "draft",
      configuration: { ...defaultConfig },
    });
  }, [companies, isAdmin, userCompanyId, userCompanyIdentifier]);

  const openCreateForm = useCallback(() => {
    resetFormState();
    setShowBotFormModal(true);
  }, [resetFormState]);

  const openEditForm = useCallback(async (id: string) => {
    setFormLoading(true);
    setShowBotFormModal(true);
    setIsEditFormMode(true);
    setEditingBotId(id);
    try {
      const details = (await getBot(id)) as Record<string, unknown>;
      const configuration = {
        ...defaultConfig,
        ...(details.configuration as Record<string, unknown>),
      } as BotConfiguration;
      setForm({
        company_id: companyIdFromBotApi(details),
        name: toFormString(details.name),
        description: toFormString(details.description),
        status: toFormString(details.status) || "draft",
        configuration,
      });
    } catch {
      toast.error("Failed to load bot for editing");
      setShowBotFormModal(false);
    } finally {
      setFormLoading(false);
    }
  }, []);

  const handleFormSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateFormAndToast(form)) return;
      setFormLoading(true);
      try {
        if (isEditFormMode && editingBotId) {
          await putBot(editingBotId, buildUpdatePayload(form));
          toast.success("Bot updated");
        } else {
          await postBots(buildCreateBotPayload(form));
          toast.success("Bot created");
        }
        setShowBotFormModal(false);
        resetFormState();
        fetchBots();
      } catch (err: unknown) {
        const msg =
          (
            err as {
              response?: { data?: { detail?: string } };
              message?: string;
            }
          )?.response?.data?.detail ??
          (err as { message?: string })?.message ??
          (isEditFormMode ? "Update failed" : "Create failed");
        toast.error(msg);
      } finally {
        setFormLoading(false);
      }
    },
    [form, isEditFormMode, editingBotId, fetchBots, resetFormState],
  );

  const botTabCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: data.length,
      draft: 0,
      published: 0,
      archived: 0,
    };

    data.forEach((row) => {
      const status = String(row.status ?? "").toLowerCase();
      if (status in counts) {
        counts[status] += 1;
      }
    });

    return counts;
  }, [data]);

  const handleTabRemove = useCallback(
    (tabId: string) => {
      if (tabId === "all") return;
      setVisibleTabIds((prev) => removeIdFromList(prev, tabId));
      if (statusFilter === tabId) {
        setLoading(true);
        setStatusFilter("");
      }
    },
    [statusFilter],
  );

  const applyTabDraftChange = useCallback(
    (tabId: string, isChecked: boolean) => {
      setTabSelectionDraft((prev) =>
        toggleTabDraftSelection(prev, tabId, isChecked),
      );
    },
    [],
  );

  const handleApplyTabSelector = useCallback(() => {
    const nextVisible = ["all", ...tabSelectionDraft];
    setVisibleTabIds(nextVisible);
    if (statusFilter && !nextVisible.includes(statusFilter)) {
      setLoading(true);
      setStatusFilter("");
    }
    setShowTabSelectorModal(false);
  }, [tabSelectionDraft, statusFilter]);

  const addBotButtonStyle: React.CSSProperties = {
    cursor: "pointer",
    transition: "150ms ease-out",
    display: "inline-flex",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    background: "#141414",
    borderColor: "rgba(20, 20, 20, 0)",
    color: "rgb(255, 255, 255)",
    textDecoration: "none",
    borderRadius: "4px",
    borderWidth: "1px",
    borderStyle: "solid",
    verticalAlign: "middle",
    paddingBlock: "8px",
    paddingInline: "16px",
    maxWidth: "100%",
    fontFamily: '"Lexend Deca", Helvetica, Arial, sans-serif',
    fontSize: "12px",
    fontWeight: 300,
    letterSpacing: "0px",
    lineHeight: "14px",
    WebkitFontSmoothing: "antialiased",
    textUnderlineOffset: "24%",
    alignItems: "center",
    gap: "0.5rem",
  };

  const toolbarRightActions = useMemo(
    () => (
      <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
        {isAdmin && (
          <Form.Select
            style={{ width: "200px", padding: "7px", borderRadius: "3px" }}
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
          >
            <option value="">All companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Form.Select>
        )}
        <Form.Select
          style={{ width: "140px", padding: "7px", borderRadius: "3px" }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All Bots</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </Form.Select>
        {canCreateBots && (
          <Button
            onClick={openCreateForm}
            style={addBotButtonStyle}
            className="bots-add-button"
          >
            <Plus size={16} />
            <span>Add Bot</span>
          </Button>
        )}
      </div>
    ),
    [
      canCreateBots,
      isAdmin,
      companyFilter,
      companies,
      openCreateForm,
      statusFilter,
    ],
  );

  const tableToolbar = useMemo(
    () => ({
      showTabs: true,
      tabs: [
        {
          id: "all",
          label: "All Bots",
          count: botTabCounts.all,
          removable: false,
        },
        ...mapVisibleStatusTabsForToolbar(visibleTabIds, botTabCounts),
      ],
      activeTab: statusFilter || "all",
      onTabChange: (tabId: string) => {
        setLoading(true);
        setStatusFilter(tabId === "all" ? "" : tabId);
      },
      onTabAdd: () => {
        setTabSelectionDraft(tabSelectionDraftFromVisible(visibleTabIds));
        setShowTabSelectorModal(true);
      },
      onTabRemove: handleTabRemove,
      rightActions: toolbarRightActions,
    }),
    [
      botTabCounts,
      visibleTabIds,
      statusFilter,
      toolbarRightActions,
      handleTabRemove,
    ],
  );

  const columns: TableColumn<BotRow>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      width: "280px",
      render: (row) => {
        const name = String(row.name ?? "—");
        return (
          <span
            title={name}
            style={{
              display: "block",
              width: "100%",
              maxWidth: "280px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {name}
          </span>
        );
      },
    },
    {
      key: "company_name",
      label: "Company",
      sortable: true,
      render: (r: BotRow) =>
        safeDisplayString(companyLabelFromBotRow(r) || undefined),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (r) =>
        r.status === "published" ? (
          <span className="status-badge success">Published</span>
        ) : (
          <span className="status-badge secondary">Draft</span>
        ),
    },
    {
      key: "version",
      label: "Version",
      sortable: false,
      render: (r: BotRow) =>
        safeDisplayString(versionFromBotRow(r) || undefined),
    },
    {
      key: "llm_model",
      label: "LLM Model",
      sortable: false,
      render: (r: BotRow) =>
        safeDisplayString(llmModelFromBotRow(r) || undefined),
    },
    {
      key: "voice_name",
      label: "Voice",
      sortable: false,
      render: (r: BotRow) =>
        safeDisplayString(voiceNameFromBotRow(r) || undefined),
    },
    {
      key: "sip_trunk_id",
      label: "SIP Trunk",
      sortable: false,
      render: (r: BotRow) =>
        safeDisplayString(sipTrunkFromBotRow(r) || undefined),
    },
    {
      key: "phone_number",
      label: "Phone",
      sortable: false,
      render: (r: BotRow) => safeDisplayString(phoneFromBotRow(r) || undefined),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <BotTableActions
          row={row}
          canEdit={canEditBots}
          canDelete={canDeleteBots}
          canVersion={canVersionInboundBots}
          onView={(id) => {
            const targetRow = data.find((item) => getBotId(item) === id);
            if (targetRow) {
              openBotSidebar(targetRow);
            }
          }}
          onEdit={openEditForm}
          onPublish={handlePublish}
          onUnpublish={handleUnpublish}
          onHistory={(r) => {
            if (!canVersionInboundBots) return;
            setHistoryBotId(getBotId(r));
            setHistoryBotName(r.name ?? "");
            setShowHistoryModal(true);
          }}
          onDelete={(r) => {
            setSelectedRow(r);
            setShowDeleteModal(true);
          }}
        />
      ),
    },
  ];

  const cfg = form.configuration ?? defaultConfig;

  const selectedSipTrunk = useMemo(
    () =>
      sipTrunks.find(
        (t) => t.sip_trunk_id === String(cfg.sip_trunk_id ?? "").trim(),
      ),
    [sipTrunks, cfg.sip_trunk_id],
  );

  const phoneNumberOptions = useMemo(() => {
    const ids = selectedSipTrunk?.caller_ids ?? [];
    if (!ids.length) return [];
    const p = String(cfg.phone_number ?? "").trim();
    if (p && !ids.includes(p)) {
      return [p, ...ids];
    }
    return ids;
  }, [selectedSipTrunk, cfg.phone_number]);

  const handleSipTrunkChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const trunkId = e.target.value;
      const trunk = sipTrunks.find((t) => t.sip_trunk_id === trunkId);
      setForm((f) => {
        let nextPhone = "";
        if (trunkId && trunk) {
          nextPhone =
            trunk.caller_ids.length > 0 ? (trunk.caller_ids[0] ?? "") : "";
        }
        return {
          ...f,
          configuration: {
            ...f.configuration,
            sip_trunk_id: trunkId,
            phone_number: nextPhone,
          },
        };
      });
    },
    [sipTrunks],
  );

  useEffect(() => {
    const tid = String(cfg.sip_trunk_id ?? "").trim();
    if (!tid) return;
    const trunk = sipTrunks.find((t) => t.sip_trunk_id === tid);
    if (!trunk?.caller_ids?.length) return;
    setForm((f) => {
      if (String(f.configuration?.phone_number ?? "").trim()) return f;
      return {
        ...f,
        configuration: {
          ...f.configuration,
          phone_number: trunk.caller_ids[0] ?? "",
        },
      };
    });
  }, [sipTrunks, cfg.sip_trunk_id, setForm]);

  const hasCompanyForSip = Boolean(form.company_id?.trim());
  let sipTrunkDefaultOptionLabel = "Select SIP trunk";
  if (!hasCompanyForSip) {
    sipTrunkDefaultOptionLabel = "Select a company in Basic Information first";
  } else if (loadingSipTrunks) {
    sipTrunkDefaultOptionLabel = "Loading…";
  }

  const hasSipTrunkSelected = Boolean(cfg.sip_trunk_id?.trim());
  let phoneNumberFreeTextPlaceholder = "Select a SIP trunk first";
  if (hasSipTrunkSelected) {
    phoneNumberFreeTextPlaceholder =
      "No caller_ids on this trunk; enter a number";
  }
  const sipTrunkSelectDisabled = hasCompanyForSip ? loadingSipTrunks : true;
  const phoneNumberFreeTextDisabled = !hasSipTrunkSelected;

  const formSubmitBlocked = Boolean(getFirstValidationError(form));

  const configForm = (
    <>
      <h6 className="mb-3 mt-2">Configuration</h6>
      <Form.Group className="mb-3">
        <Form.Label>Instructions *</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={cfg.instructions ?? ""}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              configuration: {
                ...prev.configuration,
                instructions: e.target.value,
              },
            }))
          }
          disabled={formLoading}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Knowledge Base *</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={cfg.knowledge_base ?? ""}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              configuration: {
                ...prev.configuration,
                knowledge_base: e.target.value,
              },
            }))
          }
          disabled={formLoading}
        />
      </Form.Group>

      <h6 className="mb-3 mt-2">Voice Settings</h6>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
        }}
      >
        <Form.Group className="mb-3">
          <Form.Label>Voice</Form.Label>
          <Form.Select
            value={cfg.voice_name ?? "alloy"}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                configuration: {
                  ...prev.configuration,
                  voice_name: e.target.value,
                },
              }))
            }
            disabled={formLoading}
          >
            {VOICE_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Voice model</Form.Label>
          <Form.Control value={cfg.voice_model ?? ""} disabled readOnly />
        </Form.Group>
      </div>
      <Form.Group className="mb-3">
        <Form.Label>
          Voice speed ({(cfg.voice_speed ?? 1).toFixed(2)})
        </Form.Label>
        <Form.Range
          min={0.5}
          max={2}
          step={0.01}
          value={cfg.voice_speed ?? 1}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              configuration: {
                ...prev.configuration,
                voice_speed: Number.parseFloat(e.target.value),
              },
            }))
          }
          disabled={formLoading}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Voice Instructions *</Form.Label>
        <Form.Control
          value={cfg.voice_instructions ?? ""}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              configuration: {
                ...prev.configuration,
                voice_instructions: e.target.value,
              },
            }))
          }
          disabled={formLoading}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Greeting message</Form.Label>
        <Form.Control
          value={cfg.greeting_message ?? ""}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              configuration: {
                ...prev.configuration,
                greeting_message: e.target.value,
              },
            }))
          }
          disabled={formLoading}
        />
      </Form.Group>

      <h6 className="mb-3 mt-2">LLM Settings</h6>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
        }}
      >
        <Form.Group className="mb-3">
          <Form.Label>LLM model</Form.Label>
          <Form.Select value={cfg.llm_model ?? "gpt-4o-mini"} disabled>
            {LLM_MODEL_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>
            Temperature ({(cfg.temperature ?? 0.7).toFixed(2)})
          </Form.Label>
          <Form.Range
            min={0}
            max={1}
            step={0.01}
            value={cfg.temperature ?? 0.7}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                configuration: {
                  ...prev.configuration,
                  temperature: Number.parseFloat(e.target.value),
                },
              }))
            }
            disabled={formLoading}
          />
        </Form.Group>
      </div>
      <Form.Group className="mb-3">
        <Form.Label>Max tokens</Form.Label>
        <Form.Control
          type="number"
          min={100}
          max={4000}
          step={100}
          value={cfg.max_tokens ?? 1000}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              configuration: {
                ...prev.configuration,
                max_tokens: Number.parseInt(e.target.value, 10) || 1000,
              },
            }))
          }
          disabled={formLoading}
        />
      </Form.Group>

      <h6 className="mb-3 mt-2">Behavior Settings</h6>
      <Form.Group className="mb-3">
        <Form.Check
          type="switch"
          id="transfer-enabled-inbound"
          label="Enable transfer"
          checked={Boolean(cfg.transfer_enabled)}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              configuration: {
                ...prev.configuration,
                transfer_enabled: e.target.checked,
              },
            }))
          }
          disabled={formLoading}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>
          Transfer number
          {cfg.transfer_enabled ? " *" : ""}
        </Form.Label>
        <Form.Control
          value={cfg.transfer_number ?? ""}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              configuration: {
                ...prev.configuration,
                transfer_number: e.target.value,
              },
            }))
          }
          disabled={formLoading}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Transfer trunk ID</Form.Label>
        <Form.Control
          value={cfg.transfer_trunk_id ?? ""}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              configuration: {
                ...prev.configuration,
                transfer_trunk_id: e.target.value,
              },
            }))
          }
          disabled={formLoading}
        />
      </Form.Group>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
        }}
      >
        <Form.Group className="mb-3">
          <Form.Label>Max duration (seconds)</Form.Label>
          <Form.Control
            type="number"
            min={60}
            step={60}
            value={cfg.max_duration ?? 1800}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                configuration: {
                  ...prev.configuration,
                  max_duration: Number.parseInt(e.target.value, 10) || 1800,
                },
              }))
            }
            disabled={formLoading}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Idle timeout (seconds)</Form.Label>
          <Form.Control
            type="number"
            min={30}
            step={30}
            value={cfg.idle_timeout ?? 300}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                configuration: {
                  ...prev.configuration,
                  idle_timeout: Number.parseInt(e.target.value, 10) || 300,
                },
              }))
            }
            disabled={formLoading}
          />
        </Form.Group>
      </div>
      <div
        className="mb-3"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          alignItems: "center",
        }}
      >
        <Form.Group className="mb-0">
          <Form.Check
            type="switch"
            id="allow-interruptions-inbound"
            label="Allow interruptions"
            checked={Boolean(cfg.allow_interruptions)}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                configuration: {
                  ...prev.configuration,
                  allow_interruptions: e.target.checked,
                },
              }))
            }
            disabled={formLoading}
          />
        </Form.Group>
        <Form.Group className="mb-0">
          <Form.Check
            type="switch"
            id="noise-cancellation-inbound"
            label="Noise cancellation"
            checked={Boolean(cfg.noise_cancellation)}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                configuration: {
                  ...prev.configuration,
                  noise_cancellation: e.target.checked,
                },
              }))
            }
            disabled={formLoading}
          />
        </Form.Group>
      </div>
      <Form.Group className="mb-3">
        <Form.Label>Min endpointing delay</Form.Label>
        <Form.Control
          type="number"
          min={0}
          max={1}
          step={0.01}
          value={cfg.min_endpointing_delay ?? 0.05}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              configuration: {
                ...prev.configuration,
                min_endpointing_delay:
                  Number.parseFloat(e.target.value) || 0.05,
              },
            }))
          }
          disabled={formLoading}
        />
      </Form.Group>

      <h6 className="mb-3 mt-2">SIP Settings</h6>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
        }}
      >
        <Form.Group className="mb-3">
          <Form.Label>SIP trunk *</Form.Label>
          <Form.Select
            value={cfg.sip_trunk_id ?? ""}
            onChange={handleSipTrunkChange}
            disabled={sipTrunkSelectDisabled || formLoading}
          >
            <option value="">{sipTrunkDefaultOptionLabel}</option>
            {sipTrunks.map((t) => (
              <option key={t.sip_trunk_id} value={t.sip_trunk_id}>
                {t.name} ({t.sip_trunk_id})
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Phone number (caller ID) *</Form.Label>
          {phoneNumberOptions.length > 0 ? (
            <Form.Select
              value={cfg.phone_number ?? ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  configuration: {
                    ...prev.configuration,
                    phone_number: e.target.value,
                  },
                }))
              }
              disabled={formLoading}
            >
              <option value="">Select caller ID</option>
              {phoneNumberOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Form.Select>
          ) : (
            <Form.Control
              value={cfg.phone_number ?? ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  configuration: {
                    ...prev.configuration,
                    phone_number: e.target.value,
                  },
                }))
              }
              placeholder={phoneNumberFreeTextPlaceholder}
              disabled={phoneNumberFreeTextDisabled || formLoading}
            />
          )}
        </Form.Group>
      </div>
    </>
  );

  const handleDeleteConfirm = async () => {
    if (!selectedRow) return;
    setDeleteLoading(true);
    try {
      await deleteBot(getBotId(selectedRow));
      toast.success("Bot deleted");
      setShowDeleteModal(false);
      setSelectedRow(null);
      fetchBots();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } }; message?: string })
          ?.response?.data?.detail ??
        (err as { message?: string })?.message ??
        "Delete failed";
      toast.error(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <BreadcrumbItem
        mainTitle=""
        mainLink=""
        subTitle="Voicebot Inbound - Bots"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2 d-flex align-items-center flex-wrap gap-2">
            <h2 className="mb-0">Bots</h2>
          </div>
        </Col>
      </Row>

      <div
        style={{
          display: "flex",
          gap: "0",
          height: "calc(100vh)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <GenericTable<BotRow>
            data={data}
            columns={columns}
            loading={loading}
            emptyMessage="No bots found."
            loadingMessage="Loading bots..."
            showToolbar
            toolbar={tableToolbar}
            showToolbarActions={false}
            pagination={{
              currentPage: 1,
              rowsPerPage: 10,
              totalRows: data.length,
              pageSizeOptions: [10, 25, 50],
            }}
            uniqueKey="id"
            onPreviewClick={(row) => openBotSidebar(row)}
            hover
            striped={false}
          />
        </div>
        {showBotSidebar && (
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              height: "100vh",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              zIndex: 1040,
              boxShadow: "-4px 0 24px rgba(0, 0, 0, 0.12)",
            }}
          >
            <GenericSidebar
              isOpen={showBotSidebar}
              dockInParent
              hideTopHeadingBar
              onClose={closeBotSidebar}
              title={safeDisplayString(sidebarBot?.name ?? "Bot Details")}
              avatar={{
                initials: safeDisplayString(sidebarBot?.name ?? "B")
                  .slice(0, 2)
                  .toUpperCase(),
                name: safeDisplayString(sidebarBot?.name ?? "Bot"),
                gradient: "#0091ae",
              }}
              sections={
                sidebarLoading
                  ? [
                      {
                        id: "sidebar-loading",
                        title: "Loading bot details",
                        icon: Info,
                        isLoading: true,
                        defaultExpanded: true,
                        collapsible: false,
                      },
                    ]
                  : botSidebarSections
              }
              width="470px"
              actionsDropdown={{
                label: "Actions",
                items: [
                  {
                    label: "Edit Bot",
                    onClick: () => {
                      if (!sidebarBotId) return;
                      openEditForm(sidebarBotId);
                    },
                  },
                ],
              }}
            />
          </div>
        )}
      </div>

      <Modal
        show={showTabSelectorModal}
        onHide={() => setShowTabSelectorModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Visible tabs</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small mb-3">
            Choose which status tabs appear in the table toolbar.
          </p>
          {BOT_STATUS_TABS.map((tab) => (
            <Form.Check
              key={tab.id}
              type="checkbox"
              id={`bots-tab-visible-${tab.id}`}
              className="mb-2"
              label={tab.label}
              checked={tabSelectionDraft.includes(tab.id)}
              onChange={(e) => applyTabDraftChange(tab.id, e.target.checked)}
            />
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowTabSelectorModal(false)}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleApplyTabSelector}>
            Apply
          </Button>
        </Modal.Footer>
      </Modal>

      <Offcanvas
        show={showBotFormModal}
        onHide={() => {
          if (formLoading) return;
          setShowBotFormModal(false);
          resetFormState();
        }}
        placement="end"
        backdrop
        scroll
        style={{ width: "640px", maxWidth: "95vw" }}
      >
        <Offcanvas.Header closeButton={!formLoading}>
          <Offcanvas.Title>
            {isEditFormMode ? "Edit Bot" : "Add Bot"}
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Form onSubmit={handleFormSubmit}>
          <Offcanvas.Body
            style={{
              overflowY: "auto",
              maxHeight: "calc(100vh - 110px)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isAdmin ? "1fr 1fr" : "1fr",
                gap: "16px",
              }}
            >
              {isAdmin && (
                <Form.Group className="mb-2">
                  <Form.Label>Company *</Form.Label>
                  <Form.Select
                    value={form.company_id}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        company_id: e.target.value,
                        configuration: {
                          ...prev.configuration,
                          sip_trunk_id: "",
                          phone_number: "",
                        },
                      }))
                    }
                    required
                    disabled={formLoading}
                  >
                    <option value="">Select company</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}
              <Form.Group className="mb-2">
                <Form.Label>Bot name *</Form.Label>
                <Form.Control
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  disabled={formLoading}
                  placeholder="Bot name"
                />
              </Form.Group>
            </div>
            <Form.Group className="mb-3">
              <Form.Label>Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                required
                disabled={formLoading}
                placeholder="Description"
              />
            </Form.Group>
            {configForm}
            <div className="d-flex justify-content-end gap-2 border-top pt-3 mt-2">
              <Button
                variant="outline-secondary"
                onClick={() => {
                  if (formLoading) return;
                  setShowBotFormModal(false);
                  resetFormState();
                }}
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={formLoading || formSubmitBlocked}
              >
                {formLoading ? (
                  <Spinner animation="border" size="sm" className="me-1" />
                ) : null}
                {isEditFormMode ? "Update Bot" : "Create Bot"}
              </Button>
            </div>
          </Offcanvas.Body>
        </Form>
      </Offcanvas>

      <Modal
        show={showHistoryModal}
        onHide={() => {
          setShowHistoryModal(false);
          setHistoryBotId(null);
          setHistoryBotName("");
          setHistoryVersions([]);
          setRollbackVersion(null);
        }}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title
            title={`Version history — ${historyBotName || "Bot"}`}
            style={{
              display: "block",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            Version history — {historyBotName || "Bot"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <BotHistoryModalBody
            historyLoading={historyLoading}
            historyVersions={historyVersions}
            historyBotId={historyBotId}
            rollbackVersion={rollbackVersion}
            onRollback={handleRollback}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowHistoryModal(false);
              setHistoryBotId(null);
              setHistoryBotName("");
              setHistoryVersions([]);
              setRollbackVersion(null);
            }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setSelectedRow(null);
        }}
        onConfirm={handleDeleteConfirm}
        itemName={selectedRow?.name}
        itemType="bot"
        loading={deleteLoading}
      />
    </>
  );
};

BotsPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
export default BotsPage;
