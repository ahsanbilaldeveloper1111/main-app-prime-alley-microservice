import React from "react";
import KanbanBoard, { prospectsToKanbanColumns } from "@components/KanbanBoard";
import type { FilterPill, ToolbarConfig } from "@components/GenericTable";
import { getInitials, getRandomColor } from "@utils/crmNameAvatar";
import { updateCrmData } from "@utils/crm";

export function mergeCrmQuotesListProspectsToolbarConfig(
  prospectsToolbarConfig: ToolbarConfig,
  options: {
    showFiltersSidebar: boolean;
    setShowAdvancedFilters: React.Dispatch<React.SetStateAction<boolean>>;
    showAdvancedFilterPills: boolean;
    quotesFilterPills: FilterPill[];
  },
): ToolbarConfig {
  return {
    ...prospectsToolbarConfig,
    showAdvancedFilters: !options.showFiltersSidebar,
    showFilterPills: true,
    onAdvancedFiltersClick: () =>
      options.setShowAdvancedFilters((prev) => !prev),
    filterPills: [
      ...(prospectsToolbarConfig.filterPills ?? []),
      ...(options.showAdvancedFilterPills ? options.quotesFilterPills : []),
    ],
    showMoreFiltersButton: true,
  };
}

export type CrmQuotesListProspectsBoardCustomBodyParams = Readonly<{
  prospectsViewMode: string;
  dataList: any[];
  handleViewData: (row: any) => void;
  prospectsSearch: string;
}>;

export function renderCrmQuotesListProspectsBoardCustomBody(
  params: CrmQuotesListProspectsBoardCustomBodyParams,
): React.ReactNode {
  if (params.prospectsViewMode !== "board") {
    return undefined;
  }

  const { dataList, handleViewData, prospectsSearch } = params;

  return (
    <KanbanBoard
      columns={prospectsToKanbanColumns(
        dataList,
        getInitials,
        getRandomColor,
      )}
      onCardClick={(card) => handleViewData(card.raw)}
      onCardMove={(cardId, _fromCol, toCol) => {
        const prospect = dataList.find((p) => p.id === cardId);
        if (prospect) {
          updateCrmData(Number(cardId), {
            name: prospect.name || "",
            phone: prospect.phone || "",
            campaign_id: prospect.campaign_id,
            data: { ...prospect.data, lifecycle_stage: toCol },
            scheduled_call_at: prospect.scheduled_call_at || undefined,
            company_domain: prospect.data?.company_domain || undefined,
            company_name: prospect.data?.company_name || undefined,
            source:
              prospect.data?.source_file || prospect.data?.source || undefined,
          });
        }
      }}
      searchValue={prospectsSearch}
    />
  );
}
