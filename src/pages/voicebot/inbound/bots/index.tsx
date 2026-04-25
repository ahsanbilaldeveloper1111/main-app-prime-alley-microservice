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
  postBots,
  deleteBot,
  publishBot,
  unpublishBot,
  getCompanies,
  type CreateBotPayload,
  type BotConfiguration,
  type BotVersionItem,
} from "@utils/voicebot/inbound";
import { safeDisplayString } from "@utils/voicebot/formDisplay";
import {
  Row,
  Col,
  Button,
  Modal,
  Form,
  Spinner,
  Accordion,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import {
  Plus,
  Pencil,
  Trash2,
  Send,
  Undo2,
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

function llmModelFromBotRow(row: BotRow): string {
  const c = rawBotConfig(row);
  const direct = c.llm_model;
  if (typeof direct === "string") return direct;
  return nestedLeaf(c, "llm_settings", "llm_model");
}

function voiceNameFromBotRow(row: BotRow): string {
  const c = rawBotConfig(row);
  const direct = c.voice_name;
  if (typeof direct === "string") return direct;
  return nestedLeaf(c, "voice_settings", "voice_name");
}

function sipTrunkFromBotRow(row: BotRow): string {
  const c = rawBotConfig(row);
  const direct = c.sip_trunk_id;
  if (typeof direct === "string") return direct;
  return nestedLeaf(c, "sip_settings", "sip_trunk_id");
}

function phoneFromBotRow(row: BotRow): string {
  const c = rawBotConfig(row);
  const direct = c.phone_number;
  if (typeof direct === "string") return direct;
  return nestedLeaf(c, "sip_settings", "phone_number");
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

const defaultConfig: BotConfiguration = {
  instructions: "",
  knowledge_base: "",
  voice_name: "onyx",
  voice_model: "gpt-4o-mini-tts",
  voice_speed: 1,
  llm_model: "gpt-4o-mini",
  temperature: 0.7,
  max_tokens: 1000,
  greeting_message: "",
  transfer_enabled: false,
  max_duration: 1800,
  idle_timeout: 300,
};

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

/** Renders version configuration_snapshot (API shape: instructions, knowledge_base, voice_settings, llm_settings, behavior_settings, sip_settings) */
const VersionConfigSnapshot = ({
  config,
}: {
  config: Record<string, unknown>;
}) => {
  const v = (o: Record<string, unknown> | undefined, k: string) =>
    safeDisplayString(o?.[k]);
  const voice = (config.voice_settings ?? {}) as Record<string, unknown>;
  const llm = (config.llm_settings ?? {}) as Record<string, unknown>;
  const behavior = (config.behavior_settings ?? {}) as Record<string, unknown>;
  const sip = (config.sip_settings ?? {}) as Record<string, unknown>;
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
      <Button
        title="Show history"
        size="sm"
        variant="outline-info"
        onClick={() => onHistory(row)}
      >
        <History size={14} />
      </Button>
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
  const router = useRouter();
  const { data: session } = useSession();
  const { PERMISSIONS } = HEADER_CONSTANTS;
  const isAdmin = String(session?.user?.is_admin ?? "") === "1";
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
  const [data, setData] = useState<BotRow[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [companyFilter, setCompanyFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showTabSelectorModal, setShowTabSelectorModal] = useState(false);
  const [visibleTabIds, setVisibleTabIds] = useState<string[]>([
    "all",
    "published",
  ]);
  const [tabSelectionDraft, setTabSelectionDraft] = useState<string[]>([
    "published",
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBotSidebar, setShowBotSidebar] = useState(false);
  const [sidebarBotId, setSidebarBotId] = useState<string | null>(null);
  const [sidebarBot, setSidebarBot] = useState<Record<string, unknown> | null>(null);
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyBotId, setHistoryBotId] = useState<string | null>(null);
  const [historyBotName, setHistoryBotName] = useState<string>("");
  const [historyVersions, setHistoryVersions] = useState<BotVersionItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [rollbackVersion, setRollbackVersion] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<BotRow | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState<CreateBotPayload>({
    company_id: "",
    name: "",
    description: "",
    status: "draft",
    configuration: { ...defaultConfig },
  });
  const hasInitializedVisibleTabs = useRef(false);
  const sidebarRequestSequence = useRef(0);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await getCompanies({ show_inactive: false });
      const list = getListFromResponse(res);
      const opts = getCompanyOptions(list);
      setCompanies(opts);
      if (opts.length > 0)
        setForm((f: CreateBotPayload) =>
          f.company_id ? f : { ...f, company_id: opts[0].id },
        );
    } catch {
      setCompanies([]);
    }
  }, []);

  const fetchBots = useCallback(async () => {
    setLoading(true);
    try {
      const params: { company_id?: string; limit: number; status?: string } = {
        limit: 100,
      };
      if (companyFilter) params.company_id = companyFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await getBots(params);
      console.log(res);
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
          { label: "Name", value: safeDisplayString(sidebarBot.name), copyable: true },
          { label: "Description", value: safeDisplayString(sidebarBot.description) },
          {
            label: "Status",
            value: status === "published" ? "Published" : "Draft",
            type: "badge",
            badgeVariant: status === "published" ? "success" : "secondary",
          },
          {
            label: "Company",
            value: safeDisplayString(
              sidebarBot.company_name ?? sidebarBot.company_id ?? sidebarBot.company,
            ),
          },
          {
            label: "Version",
            value: safeDisplayString(sidebarBot.current_version ?? sidebarBot.version),
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
          { label: "Voice", value: getConfigValue(sidebarBot, "voice_name", "voice_settings") },
          { label: "Model", value: getConfigValue(sidebarBot, "voice_model", "voice_settings") },
          { label: "Speed", value: getConfigValue(sidebarBot, "voice_speed", "voice_settings") },
          {
            label: "Instructions",
            value: getConfigValue(sidebarBot, "voice_instructions", "voice_settings"),
          },
          {
            label: "Greeting",
            value: getConfigValue(sidebarBot, "greeting_message", "behavior_settings"),
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
          { label: "Model", value: getConfigValue(sidebarBot, "llm_model", "llm_settings") },
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
            value: getConfigValue(sidebarBot, "transfer_enabled", "behavior_settings"),
          },
          {
            label: "Transfer number",
            value: getConfigValue(sidebarBot, "transfer_number", "behavior_settings"),
          },
          {
            label: "Transfer trunk ID",
            value: getConfigValue(sidebarBot, "transfer_trunk_id", "behavior_settings"),
          },
          {
            label: "Max duration (s)",
            value: getConfigValue(sidebarBot, "max_duration", "behavior_settings"),
          },
          {
            label: "Idle timeout (s)",
            value: getConfigValue(sidebarBot, "idle_timeout", "behavior_settings"),
          },
          {
            label: "Allow interruptions",
            value: getConfigValue(sidebarBot, "allow_interruptions", "behavior_settings"),
          },
          {
            label: "Noise cancellation",
            value: getConfigValue(sidebarBot, "noise_cancellation", "behavior_settings"),
          },
          {
            label: "Min endpointing delay",
            value: getConfigValue(sidebarBot, "min_endpointing_delay", "behavior_settings"),
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
            onClick={() => {
              router.push("/voicebot/inbound/bots/create");
            }}
            style={addBotButtonStyle}
            className="bots-add-button"
          >
            <Plus size={16} />
            <span>Add Bot</span>
          </Button>
        )}
      </div>
    ),
    [canCreateBots, isAdmin, companyFilter, companies, router, statusFilter],
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
    { key: "name", label: "Name", sortable: true },
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
          onView={(id) => {
            setViewBotId(id);
            setShowViewModal(true);
          }}
          onEdit={(id) =>
            router.push(
              `/voicebot/inbound/bots/edit?id=${encodeURIComponent(id)}`,
            )
          }
          onPublish={handlePublish}
          onUnpublish={handleUnpublish}
          onHistory={(r) => {
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

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_id || !form.name) {
      toast.error("Company and name are required");
      return;
    }
    setFormLoading(true);
    try {
      await postBots(form);
      toast.success("Bot created");
      setShowAddModal(false);
      setForm({
        company_id: form.company_id,
        name: "",
        description: "",
        status: "draft",
        configuration: { ...defaultConfig },
      });
      fetchBots();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } }; message?: string })
          ?.response?.data?.detail ??
        (err as { message?: string })?.message ??
        "Create failed";
      toast.error(msg);
    } finally {
      setFormLoading(false);
    }
  };

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

  const configForm = (
    <>
      <Form.Group className="mb-2">
        <Form.Label>Instructions</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          value={form.configuration?.instructions ?? ""}
          onChange={(e) =>
            setForm({
              ...form,
              configuration: {
                ...form.configuration,
                instructions: e.target.value,
              },
            })
          }
          placeholder="Bot system instructions"
        />
      </Form.Group>
      <Form.Group className="mb-2">
        <Form.Label>Greeting message</Form.Label>
        <Form.Control
          value={form.configuration?.greeting_message ?? ""}
          onChange={(e) =>
            setForm({
              ...form,
              configuration: {
                ...form.configuration,
                greeting_message: e.target.value,
              },
            })
          }
          placeholder="Hello! How can I help?"
        />
      </Form.Group>
      <Form.Group className="mb-2">
        <Form.Label>Voice name</Form.Label>
        <Form.Control
          value={form.configuration?.voice_name ?? ""}
          onChange={(e) =>
            setForm({
              ...form,
              configuration: {
                ...form.configuration,
                voice_name: e.target.value,
              },
            })
          }
          placeholder="onyx"
        />
      </Form.Group>
      <Form.Group className="mb-2">
        <Form.Label>LLM model</Form.Label>
        <Form.Control
          value={form.configuration?.llm_model ?? ""}
          onChange={(e) =>
            setForm({
              ...form,
              configuration: {
                ...form.configuration,
                llm_model: e.target.value,
              },
            })
          }
          placeholder="gpt-4o-mini"
        />
      </Form.Group>
    </>
  );

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
          <GenericSidebar
            isOpen={showBotSidebar}
            onClose={closeBotSidebar}
            title={safeDisplayString(sidebarBot?.name ?? "Bot Details")}
            subtitle={safeDisplayString(sidebarBot?.description)}
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
                    router.push(
                      `/voicebot/inbound/bots/edit?id=${encodeURIComponent(sidebarBotId)}`,
                    );
                  },
                },
              ],
            }}
          />
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

      <Modal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Bot</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddSubmit}>
          <Modal.Body>
            <Form.Group className="mb-2">
              <Form.Label>Company *</Form.Label>
              <Form.Select
                value={form.company_id}
                onChange={(e) =>
                  setForm((f: CreateBotPayload) => ({ ...f, company_id: e.target.value }))
                }
                required
              >
                <option value="">Select company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Name *</Form.Label>
              <Form.Control
                value={form.name}
                onChange={(e) =>
                  setForm((f: CreateBotPayload) => ({ ...f, name: e.target.value }))
                }
                required
                placeholder="Bot name"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm((f: CreateBotPayload) => ({ ...f, description: e.target.value }))
                }
                placeholder="Description"
              />
            </Form.Group>
            {configForm}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={formLoading || !form.company_id || !form.name}
            >
              {formLoading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                "Create"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

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
          <Modal.Title>Version history — {historyBotName || "Bot"}</Modal.Title>
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
