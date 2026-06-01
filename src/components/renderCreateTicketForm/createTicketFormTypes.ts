export interface TicketFormData {
  ticketName: string;
  pipeline: string;
  submodule: string;
  ticketType: string;
  ticketStatus: string;
  ticketDescription: string;
  source: string;
  ticketOwner: string;
  priority: string;
  createDate: string;
  contactAssociateRecord: string;
  contactAssociationLabel: string;
  addTimelineContact: boolean;
  companyAssociateRecord: string;
  companyAssociationLabel: string;
  addTimelineCompany: boolean;
}
