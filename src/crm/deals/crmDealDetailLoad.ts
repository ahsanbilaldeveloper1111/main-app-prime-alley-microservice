import { getDeal, getLead } from "@utils/crm";

export type CrmDealWithOptionalLead = {
  deal: any;
  relatedLead: any | null;
};

/** Loads a deal and, when `ticket_id` is present, the related lead with parsed `contact_persons`. */
export async function loadCrmDealWithOptionalLead(
  dealId: number,
): Promise<CrmDealWithOptionalLead> {
  const dealData: any = await getDeal(dealId);
  let relatedLead: any | null = null;

  if (dealData.ticket_id) {
    try {
      const leadData: any = await getLead(Number(dealData.ticket_id));
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
      relatedLead = leadData;
    } catch (error) {
      console.error("Failed to fetch lead:", error);
    }
  }

  return { deal: dealData, relatedLead };
}
