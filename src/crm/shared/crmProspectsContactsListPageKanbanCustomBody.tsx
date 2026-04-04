import React from "react";
import KanbanBoard, { prospectsToKanbanColumns } from "@components/KanbanBoard";
import type { TableAction } from "@components/GenericTable";
import { updateCrmData } from "@utils/crm";
import { getInitials, getRandomColor } from "@utils/crmNameAvatar";

export type CrmProspectsKanbanCustomBodyParams = {
  prospectsViewMode: "table" | "board";
  dataList: any[];
  prospectsActions: TableAction<any>[];
  handleViewData: (row: any) => void;
  prospectsSearch: string;
};

function persistKanbanCardMove(
  dataList: any[],
  cardId: string | number,
  toCol: string,
): void {
  const prospect = dataList.find((p) => p.id === cardId);
  if (!prospect) return;
  updateCrmData(Number(cardId), {
    name: prospect.name || "",
    phone: prospect.phone || "",
    campaign_id: prospect.campaign_id,
    data: { ...prospect.data, lifecycle_stage: toCol },
    scheduled_call_at: prospect.scheduled_call_at || undefined,
    company_domain: prospect.data?.company_domain || undefined,
    company_name: prospect.data?.company_name || undefined,
    source: prospect.data?.source || undefined,
  });
}

export function renderCrmProspectsKanbanTableCustomBody({
  prospectsViewMode,
  dataList,
  prospectsActions,
  handleViewData,
  prospectsSearch,
}: CrmProspectsKanbanCustomBodyParams): React.ReactNode {
  if (prospectsViewMode !== "board") return undefined;
  return (
    <KanbanBoard
      columns={prospectsToKanbanColumns(dataList, getInitials, getRandomColor)}
      cardActions={prospectsActions}
      onCardClick={(card) => handleViewData(card.raw)}
      onCardMove={(cardId, _fromCol, toCol) => {
        persistKanbanCardMove(dataList, cardId, toCol);
      }}
      searchValue={prospectsSearch}
    />
  );
}
