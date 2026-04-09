import type {
  KanbanCardData,
  KanbanColumnDef,
} from "@components/KanbanBoard";

export type DealsKanbanAvatarHelpers = {
  getInitials: (name: string) => string;
  getRandomColor: (name: string) => string;
};

/** Maps API deals + stages into Kanban columns (shared by Deals and Approvals list pages). */
export function buildDealsKanbanColumns(
  deals: any[],
  stagesData: any[],
  avatar: DealsKanbanAvatarHelpers,
): KanbanColumnDef[] {
  const buckets: Record<string | number, KanbanCardData[]> = {};

  stagesData.forEach((stage) => {
    buckets[stage.id] = [];
  });

  deals.forEach((deal: any) => {
    const stageId = deal.stage_id || deal.stage?.id;
    if (stageId && buckets[stageId]) {
      const dealName = deal.name || "";
      buckets[stageId].push({
        id: deal.id,
        name: dealName,
        email: deal.company_name || "",
        avatarInitials: avatar.getInitials(dealName),
        avatarColor: avatar.getRandomColor(dealName),
        metaLines: [
          deal.net_value || deal.grand_total
            ? `${deal.currency || "AED"} ${deal.net_value || deal.grand_total}`
            : "",
        ].filter(Boolean),
        raw: deal,
      });
    }
  });

  return stagesData.map((stage) => ({
    id: String(stage.id),
    title: stage.name || "No Stage",
    cards: buckets[stage.id] || [],
  }));
}
