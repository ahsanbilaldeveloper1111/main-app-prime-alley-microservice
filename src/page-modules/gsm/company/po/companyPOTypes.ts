export interface CompanyPOData extends Record<string, unknown> {
  company_name: string;
  assigned_gsms: string;
  gsm_count: number;
  assigned_ports: string;
  port_count: number;
  company_identifier?: string;
}

export interface CompanyPOFilterState {
  gsm_id?: string;
  company?: string;
}
