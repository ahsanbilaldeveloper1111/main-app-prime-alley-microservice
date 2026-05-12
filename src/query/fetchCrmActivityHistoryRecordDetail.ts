import {
  getHistoryChain,
  getStages,
  getCrmDataById,
  type CrmDataItem,
  type HistoryChainRecord,
  type StageData,
} from "@utils/crm";

export type ActivityHistoryRecordDetail = {
  historyChain: HistoryChainRecord[];
  recordStages: StageData[];
  currentStageIndex: number;
  crmData: CrmDataItem | null;
};

type Input = {
  recordType: string;
  recordId: string | number;
};

type ApiType = "prospect" | "lead" | "deal" | "order";
type StageType = "lead" | "deal" | "order";

const API_TYPE_BY_RECORD_TYPE: Record<string, ApiType> = {
  prospect: "prospect",
  lead: "lead",
  deal: "deal",
  order: "order",
};

const TYPE_TO_STEP_INDEX: Record<string, number> = {
  prospect: 0,
  lead: 1,
  deal: 2,
  order: 3,
};

function resolveApiType(recordType: string): ApiType {
  return API_TYPE_BY_RECORD_TYPE[recordType] ?? "lead";
}

function resolveStageType(recordType: string, apiType: ApiType): StageType {
  if (recordType === "prospect" || apiType === "prospect") return "lead";
  return apiType;
}

function extractCrmDataIdFromRecord(record: HistoryChainRecord): number | null {
  const idString = String(record.id || record.entity_id || "");
  const idMatch = /crm_data_(\d+)/.exec(idString);
  if (!idMatch?.[1]) return null;
  const parsed = Number.parseInt(idMatch[1], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

async function loadCrmDataForChain(
  chain: HistoryChainRecord[],
): Promise<CrmDataItem | null> {
  const crmDataRecord = chain.find(
    (record) => String(record.entity_type) === "CRM Data",
  );
  if (!crmDataRecord) return null;

  const crmDataId = extractCrmDataIdFromRecord(crmDataRecord);
  if (crmDataId === null) return null;

  try {
    return await getCrmDataById(crmDataId);
  } catch {
    return null;
  }
}

export async function fetchCrmActivityHistoryRecordDetail({
  recordType,
  recordId,
}: Input): Promise<ActivityHistoryRecordDetail> {
  const normalizedType = recordType.toLowerCase();
  const apiType = resolveApiType(normalizedType);

  const chainData = await getHistoryChain(apiType, recordId);
  const historyChain = chainData ?? [];

  const crmData = await loadCrmDataForChain(historyChain);

  const stageType = resolveStageType(normalizedType, apiType);
  const stagesData = await getStages(stageType);
  const recordStages = [...stagesData].sort((a, b) => a.sequence - b.sequence);

  const currentStageIndex = TYPE_TO_STEP_INDEX[normalizedType] ?? 0;

  return {
    historyChain,
    recordStages,
    currentStageIndex,
    crmData,
  };
}
