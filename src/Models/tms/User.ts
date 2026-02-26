import { PaginationParams } from "@utils/pagination";
import { Company, DNCRCallingAccess, FacInfoCallingAccess, DeviceType, MobileUser } from "@models/tms/Company";
import { Permission } from "./Permission";
import { Rank } from "./Rank";

export enum UserType {
    ADMIN = 'admin',
    PARTNER = 'partner',
    CUSTOMER = 'customer'
}
export interface IndexUserParams extends PaginationParams {
    company_id?: number;
    load_blocked_permissions?: boolean;
    load_extended_permissions?: boolean;
    load_ranks?: boolean;
}
export interface User {
    id?: number;
    username: string;
    name: string;
    phone_no?: string|number;
    parent_company?: Company;
    ranks: Rank[];
    company_iccid_id?: number;
    email?: string;
    user_type: UserType;
    first_name?: string;
    last_name?: string;
    country?: string;
    department?: string;
    job_title?: string;
    description?: string;
    notify_email?: string;
    blocked_permissions?: Permission[];
    extended_permissions?: Permission[];
    profile?: Profile;
    created_at?: string;
    user_access_info: UserAccessInfo;
    company_id?: number;
    settings?: UserSetting;
    updated_at?: string;
}
export interface UserSetting {
    id?: number;
    user_id?: number;
    enable_email_notification?: boolean;
    enable_sms_notification?: boolean;
    enable_google_authentication?: boolean;

}
export interface UserSettingUpdate {
    user_id?: number;
    enable_email_notification?: boolean;
    enable_sms_notification?: boolean;
    enable_google_authentication?: boolean;
}

export interface Profile {
    id?: number;
    user_id?: number;
    device_pool?: string;
    device_pool_mobile?: string;

    recording_profile?: string;
    app_user?: string;
    partition?: string;
    recording_profile_mobile?: string;
     shareLineAppearanceCssName: string;
    call_repetition: string|null|undefined;
    call_repetition_weekly: number|null|undefined;
    call_repetition_daily: number|null|undefined;
    allow_dncr: DNCRCallingAccess|undefined;
    allow_fac_info: FacInfoCallingAccess|undefined;
    mobile_user: MobileUser|null
    device_type: DeviceType|null;
    iccid_number?: number;
    syncing_ldap_steps: {
        sync_pbx: boolean;
        sync_pbx_mobile: boolean;
        sync_imagicle: boolean;
        add_line: boolean;
        add_line_mobile: boolean;
        add_phone: boolean;
        add_phone_mobile: boolean;
        add_app_user: boolean;
        add_app_user_mobile: boolean;
        add_user: boolean;
        add_user_mobile: boolean;
        add_remote_destination: boolean;
        add_remote_destination_profile: boolean;
        remove_line: boolean;
        remove_line_mobile: boolean;
        remove_phone: boolean;
        remove_phone_mobile: boolean;
        remove_user: boolean;
        remove_user_mobile: boolean;
        update_dncr: boolean;
    };
};
export type ProfileOperation = 'add_user' | 'add_phone' | 'add_line' | 'add_remote_destination' | 'add_remote_destination_profile' | 'remove_user' | 'remove_phone' | 'remove_line' | 'sync_pbx' | 'sync_imagicle' | 'update_dncr' | 'add_app_user' | 'add_user_mobile' | 'add_phone_mobile' | 'add_line_mobile' | 'add_remote_destination_profile_mobile' | 'add_remote_destination_mobile' | 'remove_user_mobile' | 'remove_phone_mobile' | 'remove_line_mobile'|'add_app_user_mobile'|'sync_pbx_mobile';

export interface UserAccessInfo {
    permissions: UserPermission[];
}

export interface UserPermission {
   module: string;
   action: string;
}

export interface CreateUserData {
    username: string;
    name: string;
    phone: string;
    company: string;
    rank_ids: number[];
    user_type: UserType;
    extended_permission_ids?: number[];
    blocked_permission_ids?: number[];
}

export interface UpdateUserData extends Partial<CreateUserData> {
    id: number;
}

export interface UserCreateData {
    name: string;
    email: string;
    password: string;
    user_type: UserType;
}

export interface UserUpdateData {
    name: string;
    email: string;
    rank_ids?: number[];
    user_type: UserType;
}

