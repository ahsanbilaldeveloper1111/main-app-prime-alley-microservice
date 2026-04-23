import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, {
  FilterPill,
  TableAction,
  TableColumn,
  ToolbarConfig,
} from "@components/GenericTable";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import { DeleteVoiceBot, ListVoiceBots } from "@utils/aiml";
import { toast } from "react-toastify";
import ConfirmModal from "@pages/partial/ConfirmModal";
import { Bot, CheckCircle, Clock, Edit, Flag, Phone, Plus, Trash2, XCircle } from "lucide-react";
import { useRouter } from "next/router";

type BotStatus = "Active" | "Inactive" | "Paused";
const ALL_FILTER_VALUE = "all";

interface BotRecord {
  id: number;
  name: string;
  description: string;
  language: string;
  callerId: string;
  trunkId: string;
  status: BotStatus;
}

interface RawBotRecord {
  id?: number | string;
  bot_name?: string;
  name?: string;
  description?: string;
  voice_model?: string;
  region?: string;
  caller_id?: string;
  callerId?: string;
  trunk?: string;
  trunkId?: string;
  status?: string;
}

interface BotsApiResponse {
  results?: { data?: RawBotRecord[] };
  bots?: RawBotRecord[];
  data?: RawBotRecord[];
}

interface FilterPillBuilderInput {
  id: string;
  label: string;
  value: string;
  setValue: (value: string) => void;
  options: string[];
  allOptionLabel: string;
  searchable?: boolean;
}

const LANGUAGE_MAP: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
};

const STATUS_OPTIONS: BotStatus[] = ["Active", "Paused", "Inactive"];

const normalizeStatus = (statusValue: unknown): BotStatus => {
  const normalized = typeof statusValue === "string" ? statusValue.toLowerCase() : "";
  if (normalized === "active") {
    return "Active";
  }
  if (normalized === "paused") {
    return "Paused";
  }
  return "Inactive";
};

const extractLanguage = (voiceModelValue: unknown): string => {
  const voiceModel = typeof voiceModelValue === "string" ? voiceModelValue : "";
  if (voiceModel.length === 0) {
    return "English";
  }

  const languageCode = voiceModel.split("-")[0]?.toLowerCase();
  if (languageCode === undefined || languageCode.length === 0) {
    return "English";
  }

  return LANGUAGE_MAP[languageCode] ?? "English";
};

const normalizeBot = (bot: RawBotRecord): BotRecord => {
  const normalizedId = Number(bot.id);
  return {
    id: Number.isFinite(normalizedId) ? normalizedId : 0,
    name: bot.bot_name ?? bot.name ?? "Unnamed Bot",
    description: bot.description ?? "",
    language: extractLanguage(bot.voice_model ?? bot.region),
    callerId: bot.caller_id ?? bot.callerId ?? "",
    trunkId: bot.trunk ?? bot.trunkId ?? "",
    status: normalizeStatus(bot.status),
  };
};

const getStatusIcon = (status: BotStatus): ReactElement => {
  if (status === "Active") {
    return <CheckCircle size={14} />;
  }
  if (status === "Paused") {
    return <Clock size={14} />;
  }
  return <XCircle size={14} />;
};

const getStatusStyle = (status: BotStatus): React.CSSProperties => {
  if (status === "Active") {
    return {
      backgroundColor: "#d1fae5",
      color: "#059669",
    };
  }

  if (status === "Paused") {
    return {
      backgroundColor: "#fef3c7",
      color: "#d97706",
    };
  }

  return {
    backgroundColor: "#f3f4f6",
    color: "#6b7280",
  };
};

const buildColumns = (): TableColumn<BotRecord>[] => [
  {
    key: "id",
    label: "ID",
    sortable: true,
    type: "custom",
    render: (bot) => <span style={{ fontSize: "14px", fontWeight: 600, color: "#1f2937" }}>{bot.id}</span>,
  },
  {
    key: "name",
    label: "Bot Name",
    sortable: true,
    type: "custom",
    render: (bot) => (
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #667eea 0%, #667eea 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Bot size={20} color="white" />
        </div>
        <span style={{ fontSize: "14px", fontWeight: 600, color: "#1f2937" }}>{bot.name}</span>
      </div>
    ),
  },
  {
    key: "description",
    label: "Description",
    sortable: true,
    type: "custom",
    render: (bot) => <span style={{ fontSize: "14px", color: "#6b7280" }}>{bot.description}</span>,
  },
  {
    key: "language",
    label: "Language",
    sortable: true,
    type: "custom",
    render: (bot) => (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Flag size={16} color="#6b7280" />
        <span style={{ fontSize: "14px", color: "#1f2937" }}>{bot.language}</span>
      </div>
    ),
  },
  {
    key: "callerId",
    label: "Caller ID",
    sortable: true,
    type: "custom",
    render: (bot) => <span style={{ fontSize: "14px", fontFamily: "monospace", color: "#1f2937" }}>{bot.callerId}</span>,
  },
  {
    key: "trunkId",
    label: "Trunk ID",
    sortable: true,
    type: "custom",
    render: (bot) => (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "4px 12px",
          backgroundColor: "#f3f4f6",
          color: "#6b7280",
          borderRadius: "6px",
          fontSize: "13px",
          fontWeight: 500,
        }}
      >
        <Phone size={12} />
        {bot.trunkId}
      </span>
    ),
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    type: "custom",
    render: (bot) => {
      const statusStyle = getStatusStyle(bot.status);
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            borderRadius: "20px",
            fontSize: "13px",
            fontWeight: 500,
            backgroundColor: statusStyle.backgroundColor,
            color: statusStyle.color,
          }}
        >
          {getStatusIcon(bot.status)}
          {bot.status}
        </span>
      );
    },
  },
];

const isBotsApiResponse = (value: unknown): value is BotsApiResponse => {
  if (typeof value === "object") {
    return value !== null;
  }
  return false;
};

const isRawBotArray = (value: unknown): value is RawBotRecord[] => Array.isArray(value);

const buildFilterPill = ({
  id,
  label,
  value,
  setValue,
  options,
  allOptionLabel,
  searchable,
}: FilterPillBuilderInput): FilterPill => {
  const isAllSelected = value === ALL_FILTER_VALUE;
  return {
    id,
    label,
    showDropdown: true,
    searchable,
    active: value !== ALL_FILTER_VALUE,
    activeLabel: isAllSelected ? undefined : value,
    onClear: isAllSelected ? undefined : () => setValue(ALL_FILTER_VALUE),
    dropdownOptions: [
      {
        label: allOptionLabel,
        value: ALL_FILTER_VALUE,
        onClick: () => setValue(ALL_FILTER_VALUE),
      },
      ...options.map((option) => ({
        label: option,
        value: option,
        onClick: () => setValue(option),
      })),
    ],
  };
};

const extractBotsPayload = (response: unknown): RawBotRecord[] => {
  if (isBotsApiResponse(response) === false) {
    return [];
  }

  const resultData = response.results?.data;
  if (isRawBotArray(resultData)) {
    return resultData;
  }
  if (isRawBotArray(response.bots)) {
    return response.bots;
  }
  if (isRawBotArray(response.data)) {
    return response.data;
  }
  return [];
};

const AIMLProfiles = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [languageFilter, setLanguageFilter] = useState<string>(ALL_FILTER_VALUE);
  const [statusFilter, setStatusFilter] = useState<string>(ALL_FILTER_VALUE);
  const [trunkFilter, setTrunkFilter] = useState<string>(ALL_FILTER_VALUE);
  const [bots, setBots] = useState<BotRecord[]>([]);
  const [isLoadingBots, setIsLoadingBots] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedBotForDelete, setSelectedBotForDelete] = useState<BotRecord | null>(null);

  const fetchVoiceBots = useCallback(async () => {
    setIsLoadingBots(true);
    try {
      const response = await ListVoiceBots();
      const payload = extractBotsPayload(response);
      const normalizedBots = payload.map((bot) => normalizeBot(bot));
      setBots(normalizedBots);
    } catch (error) {
      console.error("Error fetching voice bots:", error);
      toast.error("Failed to fetch voice bots");
      setBots([]);
    } finally {
      setIsLoadingBots(false);
    }
  }, []);

  useEffect(() => {
    fetchVoiceBots();
  }, [fetchVoiceBots, refreshKey]);

  const handleEditBot = useCallback(
    (bot: BotRecord) => {
      router.push(`/agents/outbound-agent/voicebot-edit?id=${bot.id}`);
    },
    [router],
  );

  const handleDeleteBot = useCallback((bot: BotRecord) => {
    setSelectedBotForDelete(bot);
    setShowDeleteModal(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setSelectedBotForDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (selectedBotForDelete === null) {
      return;
    }

    try {
      await DeleteVoiceBot(selectedBotForDelete.id);
      closeDeleteModal();
      setRefreshKey((previous) => previous + 1);
    } catch (error) {
      console.error("Error deleting bot:", error);
    }
  }, [closeDeleteModal, selectedBotForDelete]);

  const uniqueLanguages = useMemo(
    () => Array.from(new Set(bots.map((bot) => bot.language))).sort((a, b) => a.localeCompare(b)),
    [bots],
  );

  const uniqueTrunks = useMemo(
    () => Array.from(new Set(bots.map((bot) => bot.trunkId).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [bots],
  );

  const filteredBots = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return bots.filter((bot) => {
      const matchesSearch =
        query.length === 0 ||
        bot.name.toLowerCase().includes(query) ||
        bot.description.toLowerCase().includes(query);

      const matchesLanguage = languageFilter === ALL_FILTER_VALUE || bot.language === languageFilter;
      const matchesStatus = statusFilter === ALL_FILTER_VALUE || bot.status === statusFilter;
      const matchesTrunk = trunkFilter === ALL_FILTER_VALUE || bot.trunkId === trunkFilter;

      return matchesSearch && matchesLanguage && matchesStatus && matchesTrunk;
    });
  }, [bots, languageFilter, searchQuery, statusFilter, trunkFilter]);

  const tableColumns = useMemo(() => buildColumns(), []);

  const tableActions = useMemo<TableAction<BotRecord>[]>(
    () => [
      {
        label: "Edit Bot",
        icon: <Edit size={16} />,
        onClick: handleEditBot,
        variant: "link",
        className: "p-1 text-primary",
      },
      {
        label: "Delete Bot",
        icon: <Trash2 size={16} />,
        onClick: handleDeleteBot,
        variant: "link",
        className: "p-1 text-danger",
      },
    ],
    [handleDeleteBot, handleEditBot],
  );

  const filterPills = useMemo<FilterPill[]>(
    () => [
      buildFilterPill({
        id: "bots-language",
        label: "Language",
        value: languageFilter,
        setValue: setLanguageFilter,
        options: uniqueLanguages,
        allOptionLabel: "All Languages",
        searchable: true,
      }),
      buildFilterPill({
        id: "bots-status",
        label: "Status",
        value: statusFilter,
        setValue: setStatusFilter,
        options: STATUS_OPTIONS,
        allOptionLabel: "All Status",
      }),
      buildFilterPill({
        id: "bots-trunk",
        label: "Trunk",
        value: trunkFilter,
        setValue: setTrunkFilter,
        options: uniqueTrunks,
        allOptionLabel: "All Trunks",
        searchable: true,
      }),
    ],
    [languageFilter, statusFilter, trunkFilter, uniqueLanguages, uniqueTrunks],
  );

  const toolbarConfig = useMemo<ToolbarConfig>(
    () => ({
      showSearch: true,
      searchValue: searchQuery,
      searchPlaceholder: "Search bots...",
      onSearchChange: setSearchQuery,
      onSearch: () => setSearchQuery((previous) => previous.trim()),
      showFiltersButton: true,
      showFilterPills: false,
      filterPills,
      showMoreFiltersButton: false,
    }),
    [filterPills, searchQuery],
  );

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Voice Bot Profiles" />

      <PageHeader
        title=""
        showSearch={false}
        buttons={
          <button
            type="button"
            onClick={() => router.push("/agents/outbound-agent/voicebot-create")}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px 16px",
              backgroundColor: "#667eea",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <Plus size={18} />
            Add Voice Bot
          </button>
        }
      />

      <div>
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <GenericTable<BotRecord>
            data={filteredBots}
            columns={tableColumns}
            actions={tableActions}
            showActions
            actionsLabel="Actions"
            showToolbar
            toolbar={toolbarConfig}
            loading={isLoadingBots}
            loadingMessage="Loading voice bots..."
            emptyMessage="No bots found matching your criteria"
            uniqueKey="id"
            showToolbarActions={false}
            hover
          />
        </div>
      </div>

      <ConfirmModal
        show={showDeleteModal}
        onHide={closeDeleteModal}
        title="Delete Voice Bot"
        description={`Are you sure you want to delete the voice bot "${selectedBotForDelete?.name}"? This action cannot be undone.`}
        targetName={selectedBotForDelete?.name ?? ""}
        onConfirm={handleConfirmDelete}
        onCancel={closeDeleteModal}
        confirmButtonText="Delete"
        confirmButtonVariant="danger"
        requireTextConfirmation
        requiredConfirmationText="delete"
      />
    </React.Fragment>
  );
};

AIMLProfiles.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default AIMLProfiles;
