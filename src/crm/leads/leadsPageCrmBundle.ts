/**
 * Single re-export surface for CRM lead page API usage.
 * Avoids duplicate import blocks between the page model and view fragments (Sonar duplication).
 */
export {
  getLeads,
  getLead,
  deleteLead,
  convertLead,
  markLeadLost,
  getStages,
  createLeadFollowUp,
  updateLeadFollowUp,
  deleteLeadFollowUp,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  restoreLead,
  updateLead,
  CRM_CAMPAIGNS_LIST_ACTIVE_ONLY,
  getCampaigns,
  getCampaignById,
  getBusinessTypes,
  getLeadFollowUps,
  getMeetings,
} from "@utils/crm";

export type {
  StageData,
  CampaignData,
  CrmDataItem,
  BusinessTypeData,
} from "@utils/crm";
