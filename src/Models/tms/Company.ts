import { PaginationParams } from "@utils/pagination";

export interface Company {
    id: number;
    name: string;
    parent_id: number;
    calling_access?: CallingAccess[];
    profile?: Profile;
    users_count?: number;
    organization_unit?: string;
    iccids?: CompanyIccid[];
}
export interface CompanyIccid {
    id: number;
    name: string;
    iccid_numbers: string[]|null;
    company_id: number;
}
export interface CompanyCreateUpdate {
    id: number;
    
    fac_code?: number|null;
    cluster_name?: string;
}
export interface CallingAccess {
    id?: number;
    company_id: number;
    allow_dncr?: DNCRCallingAccess;
    allow_fac_info?: FacInfoCallingAccess;
    front_end_calling_access: string;
    back_end_calling_access: string;
    company_iccid_id?: number|null;
}
export enum DNCRCallingAccess {
    ALLOW_DNCR = 1,
    DISALLOW_DNCR = 0,
}
export enum FacInfoCallingAccess {
    ALLOW_FAC_INFO = 1,
    DISALLOW_FAC_INFO = 0,
}
export interface IndexCompanyParams extends PaginationParams {
    search?: string;
    load_calling_access?: boolean;
    load_profile?: boolean;
    parent_id?: number | null;
    load_company_iccid?: boolean;
    load_available_extensions?: boolean;
    ids?: number[];
    
    user_count?: boolean;
}

export interface IndexCompanyProfileParams extends PaginationParams {
    search: string;
    company_id: number | null;
}
export interface Profile {
    id: number;
    additional_info: string;
    partition: string;
    company_id: number;
    extention_ranges: ExtensionRange[];
    recording_profile: string;
    recording_profile_mobile: string;
    app_user: string;
    user_id_prefix: string;
    device_pool: string;
    allow_gsm: CompanyGSM;
    device_pool_mobile: string;
    fac_info: string;
    mobile_user: MobileUser;
    
    sim_ports: string[];
    created_at: string;
    directory_name: string;
    fac_code?: number;
    updated_at: string;
    max_users: number|null;
    organizational_unit: string;
}
export enum CompanyGSM {
    ALLOW_GSM = 1,
    DISALLOW_GSM = 0,
}
export interface ExtensionRange {
    start: number;
    end: number;
}

export enum MobileUser {
    Yes = "Yes",
    No = "No",
}
export enum DeviceType {
    TCT = "TCT",
    BOT = "BOT",
    CSF = "CSF",
}
export interface OrganizationUnit {
    id: number;

    name: string;
    parent_id: number;
}
export interface IndexRequestOrganizationUnit  {
    parent_id?: number | null;
    search: string;
}

export interface GenerateFacCodeRequest {
    company_id: number;
}


