import type { MutableRefObject } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { NextRouter } from "next/router";
import { toast } from "react-toastify";
import {
  getDeal,
  getLead,
  getRelevantDealTemplate,
  type DealTemplateData,
} from "@utils/crm";
import {
  buildEditDealFormStateFromDeal,
  buildEstimateOverridesPatch,
  buildHydratedTemplateFieldValues,
  mapEstimationChartItems,
  normalizeDealTemplateDataKey,
  resolveBusinessTypeStateFromDeal,
  sortEstimatesByCreatedAtDesc,
} from "@utils/crm/editDealFetchHelpers";
import type { EstimationLineItem } from "@utils/crm/editDealFetchHelpers";

export type EditDealInitialLoadParams = Readonly<{
  router: NextRouter;
  dealIdParam: string | string[] | undefined;
  isInitialLoad: MutableRefObject<boolean>;
  setFetching: Dispatch<SetStateAction<boolean>>;
  setFormData: Dispatch<SetStateAction<any>>;
  setBusinessTypeId: Dispatch<SetStateAction<number | null>>;
  setBusinessTypeOther: Dispatch<SetStateAction<string>>;
  setShowOtherBusinessType: Dispatch<SetStateAction<boolean>>;
  setSourceLead: Dispatch<SetStateAction<unknown>>;
  setDealTemplate: Dispatch<SetStateAction<DealTemplateData | null>>;
  setInitialTemplateFieldValues: Dispatch<
    SetStateAction<Record<string, unknown>>
  >;
  setTemplateFieldsData: Dispatch<SetStateAction<Record<string, unknown>>>;
  setEstimates: Dispatch<SetStateAction<unknown[]>>;
  setAttachments: Dispatch<SetStateAction<unknown[]>>;
  setHistories: Dispatch<SetStateAction<unknown[]>>;
  setNegotiationBar: Dispatch<SetStateAction<number>>;
  setProbability: Dispatch<SetStateAction<number>>;
  setEstimationItems: Dispatch<SetStateAction<EstimationLineItem[]>>;
}>;

function applyBusinessTypeFromDeal(
  deal: unknown,
  p: EditDealInitialLoadParams,
): void {
  const {
    businessTypeId: bId,
    businessTypeOther: bOther,
    showOther,
  } = resolveBusinessTypeStateFromDeal(deal);
  p.setBusinessTypeId(bId);
  p.setBusinessTypeOther(bOther);
  p.setShowOtherBusinessType(showOther);
}

async function tryLoadSourceLead(
  ticketId: string | number | null | undefined,
  setSourceLead: EditDealInitialLoadParams["setSourceLead"],
): Promise<void> {
  if (!ticketId) return;
  try {
    const leadData = await getLead(Number(ticketId));
    setSourceLead(leadData);
  } catch (error) {
    console.error("Failed to fetch lead:", error);
  }
}

async function applyDealTemplate(
  deal: any,
  dealIdNum: number,
  p: EditDealInitialLoadParams,
): Promise<void> {
  const stored: Record<string, unknown> = {
    ...deal.deal_template_field_values,
    ...deal.template_data,
  };
  const fromDeal = deal.deal_template;
  const resolved =
    fromDeal ?? (await getRelevantDealTemplate({ deal_id: dealIdNum }));

  if (!resolved) {
    p.setDealTemplate(null);
    p.setInitialTemplateFieldValues({});
    p.setTemplateFieldsData({});
    return;
  }
  p.setDealTemplate(resolved);
  const hydrated = buildHydratedTemplateFieldValues(
    resolved,
    stored,
    normalizeDealTemplateDataKey,
  );
  p.setInitialTemplateFieldValues(hydrated);
  p.setTemplateFieldsData(hydrated);
}

function applyEstimationItems(
  deal: any,
  sortedEstimates: any[],
  setFormData: EditDealInitialLoadParams["setFormData"],
  setEstimationItems: EditDealInitialLoadParams["setEstimationItems"],
): void {
  if (sortedEstimates.length > 0) {
    const latest = sortedEstimates[0];
    const overrides = buildEstimateOverridesPatch(latest);
    if (Object.keys(overrides).length > 0) {
      setFormData((prev: any) => ({ ...prev, ...overrides }));
    }
    setEstimationItems(
      mapEstimationChartItems(latest.estimation_chart, deal.currency),
    );
    return;
  }
  const dealChart = deal.estimation_chart;
  if (Array.isArray(dealChart) && dealChart.length > 0) {
    setEstimationItems(mapEstimationChartItems(dealChart, deal.currency));
  }
}

function resolveDealIdNumber(
  dealIdParam: string | string[] | undefined,
): number | null {
  if (dealIdParam === undefined) return null;
  const raw = Array.isArray(dealIdParam) ? dealIdParam[0] : dealIdParam;
  if (raw === undefined || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Initial GET deal + template + estimates hydration (moved out of `EditDeal` for Sonar complexity). */
export async function runEditDealInitialLoad(
  p: EditDealInitialLoadParams,
): Promise<void> {
  const { router, dealIdParam, isInitialLoad } = p;
  if (!router.isReady || !dealIdParam || isInitialLoad.current === false) {
    return;
  }

  const dealIdNum = resolveDealIdNumber(dealIdParam);
  if (dealIdNum === null) return;

  try {
    p.setFetching(true);
    const deal = await getDeal(dealIdNum);

    p.setFormData(buildEditDealFormStateFromDeal(deal) as Record<string, any>);
    applyBusinessTypeFromDeal(deal, p);
    await tryLoadSourceLead(
      deal.ticket_id ? Number(deal.ticket_id) : null,
      p.setSourceLead,
    );
    await applyDealTemplate(deal, dealIdNum, p);

    const sortedEstimates = sortEstimatesByCreatedAtDesc(deal.estimates);
    p.setEstimates(sortedEstimates);
    p.setAttachments((deal as { attachments?: unknown[] }).attachments || []);
    p.setHistories((deal as { histories?: unknown[] }).histories || []);
    p.setNegotiationBar(deal.negotiation_bar || 0);
    p.setProbability(deal.probability || 0);

    applyEstimationItems(
      deal,
      sortedEstimates,
      p.setFormData,
      p.setEstimationItems,
    );

    isInitialLoad.current = false;
  } catch (error) {
    console.error("Failed to fetch deal:", error);
    toast.error("Failed to load deal data");
    router.push("/crm/deals");
  } finally {
    p.setFetching(false);
  }
}
