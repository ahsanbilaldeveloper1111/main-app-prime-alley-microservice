import { getDeal, getLead, type DealData, type LeadData } from "@utils/crm";

/** API may return `contact_persons` as JSON string; we normalize to an array when parsing. */
type LeadDataWithContactPersons = LeadData & {
  contact_persons?: string | unknown[] | null;
};

export type CrmDealWithOptionalLead = {
  deal: DealData;
  relatedLead: LeadData | null;
};

/** Loads a deal and, when `ticket_id` is present, the related lead with parsed `contact_persons`. */
export async function loadCrmDealWithOptionalLead(
  dealId: number,
): Promise<CrmDealWithOptionalLead> {
  const dealData = await getDeal(dealId);
  let relatedLead: LeadData | null = null;

  if (dealData.ticket_id) {
    try {
      const leadData = (await getLead(
        Number(dealData.ticket_id),
      )) as LeadDataWithContactPersons;
      if (
        leadData.contact_persons &&
        typeof leadData.contact_persons === "string"
      ) {
        try {
          leadData.contact_persons = JSON.parse(leadData.contact_persons);
        } catch (e) {
          console.error("Failed to parse contact_persons:", e);
          leadData.contact_persons = [];
        }
      }
      relatedLead = leadData as LeadData;
    } catch (error) {
      console.error("Failed to fetch lead:", error);
    }
  }

  return { deal: dealData, relatedLead };
}
