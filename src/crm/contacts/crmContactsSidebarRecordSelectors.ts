import type { CrmQuotesSidebarProspectLike } from "@crm/billing-quotes/crmQuotesListPageShared";

export {
  selectCrmQuotesSidebarRecordEmail as selectCrmContactsSidebarRecordEmail,
  selectCrmQuotesSidebarRecordId as selectCrmContactsSidebarRecordId,
  selectCrmQuotesSidebarRecordPhone as selectCrmContactsSidebarRecordPhone,
} from "@crm/billing-quotes/crmQuotesListPageShared";

/** Default sidebar title when the CRM row has no name. */
export function selectCrmContactsSidebarRecordName(
  contact: CrmQuotesSidebarProspectLike | null | undefined,
): string {
  return contact?.name ?? "Contact";
}
