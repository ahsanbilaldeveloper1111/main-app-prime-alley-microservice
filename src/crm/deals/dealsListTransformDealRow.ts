import moment from "moment";
import {
  GlobalDateFormat,
  formatDateForTable,
} from "@utils/Helper";

export type DealsListExtensionLike = {
  id?: unknown;
  extension?: unknown;
  display_name?: string;
  name?: string;
};

function extensionDisplayName(
  extensions: DealsListExtensionLike[],
  matchId: unknown,
): string {
  const ext = extensions.find(
    (e) => e?.id == matchId || e?.extension == matchId,
  );
  return (
    ext?.display_name ||
    ext?.name ||
    (matchId !== undefined && matchId !== null ? String(matchId) : "") ||
    ""
  );
}

export type TransformDealForListRowOptions = {
  includeTicketId?: boolean;
};

/** Maps a deal API record to GenericTable row shape (shared by Deals and Approvals). */
export function transformDealForGenericTableRow(
  deal: any,
  extensions: DealsListExtensionLike[],
  options: TransformDealForListRowOptions = {},
) {
  const row: Record<string, unknown> = {
    id: deal.id,
    name: deal.name || "",
    company: deal.company_name || "",
    industry: deal.industry || "",
    stage: deal.stage?.name || "No Stage",
    stageColor: deal.stage?.color || "grey",
    dealType: deal.deal_type || "",
    approvalStatus: deal.approval_status ?? deal.approvalStatus ?? "",
    value: deal.net_value || deal.grand_total || "0",
    currency: deal.currency || "AED",
    probability: deal?.stage?.probability || 0,
    closeDate: deal.expected_close_date
      ? moment(deal.expected_close_date).format(GlobalDateFormat)
      : "-",
    followUpDate: deal.follow_up_date
      ? moment(deal.follow_up_date).format(GlobalDateFormat)
      : "-",
    owner: extensionDisplayName(extensions, deal?.created_by) || deal.created_by || "",
    assignedUser:
      extensionDisplayName(extensions, deal?.assigned_to) || deal.assigned_to || "",
    created: formatDateForTable(deal.created_at),
    riskLevel: deal.risk_level || "",
    negotiationBar: deal.negotiation_bar || 0,
    quotationSent: deal.quotation_sent || false,
    contractSent: deal.contract_sent || false,
    isLost: deal.is_lost || false,
    rawData: deal,
  };

  if (options.includeTicketId) {
    row.ticketId = deal.ticket_id || "";
  }

  return row as any;
}
