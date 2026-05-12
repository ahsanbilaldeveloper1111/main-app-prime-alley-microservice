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

export async function fetchCrmActivityHistoryRecordDetail({
  recordType,
  recordId,
}: Input): Promise<ActivityHistoryRecordDetail> {
  const rt = recordType.toLowerCase();
  const id = recordId;

  const apiType =
    rt === "prospect"
      ? "prospect"
      : rt === "lead"
        ? "lead"
        : rt === "deal"
          ? "deal"
          : rt === "order"
            ? "order"
            : "lead";

  const chainData = await getHistoryChain(
    apiType as "prospect" | "lead" | "deal" | "order",
    id,
  );
  const historyChain = chainData || [];

  const crmDataRecord = chainData?.find((record: HistoryChainRecord) => {
    const entityType = String(record.entity_type);
    return entityType === "CRM Data";
  });

  let crmData: CrmDataItem | null = null;
  if (crmDataRecord) {
    const idString = String(crmDataRecord.id || crmDataRecord.entity_id || "");
    const idMatch = /crm_data_(\d+)/.exec(idString);
    if (idMatch?.[1]) {
      const crmDataId = Number.parseInt(idMatch[1], 10);
      try {
        crmData = await getCrmDataById(crmDataId);
      } catch {
        crmData = null;
      }
    }
  }

  const stageType = rt === "prospect" ? "lead" : apiType;
  const stagesData = await getStages(stageType as "lead" | "deal" | "order");
  const recordStages = [...stagesData].sort((a, b) => a.sequence - b.sequence);

  const typeToStepIndex: Record<string, number> = {
    prospect: 0,
    lead: 1,
    deal: 2,
    order: 3,
  };
  const currentStageIndex = typeToStepIndex[rt] ?? 0;

  return {
    historyChain,
    recordStages,
    currentStageIndex,
    crmData,
  };
}
