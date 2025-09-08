import { PaginationParams } from "@utils/pagination";
import {
    Company,
    DeviceType,
    DNCRCallingAccess,
    FacInfoCallingAccess,
    MobileUser,
} from "@models/tms/Company";
import { User } from "@models/tms/User";

export interface AdLdapDetail {
    UserID: string;
    TelephoneNumber: string;
    Company: string;
    Department: string;
    AllowLocalDNCLCalls: string;
    AllowApiDNCLCalls: string;
    AllowRepetitiveCalls: string;
    IndividualRepetitiveCallsAllowDaily: number;
    IndividualRepetitiveCallsAllowWeekly: number;
    CallRepFollowCompSettings: string;
    CompanyRepetitiveCallsAllowDaily: number;
    CompanyRepetitiveCallsAllowWeekly: number;
}

export interface UnifiedOpUpdateParams {
    UserID: string;

    AllowLocalDNCLCalls: string;
    AllowApiDNCLCalls: string;
    AllowRepetitiveCalls: string;
    IndividualRepetitiveCallsAllowDaily: number;
    IndividualRepetitiveCallsAllowWeekly: number;
    CallRepFollowCompSettings: string;
    CompanyRepetitiveCallsAllowDaily: number;
    CompanyRepetitiveCallsAllowWeekly: number;
}
export interface SearchParams extends Partial<PaginationParams> {
    search?: string;
}

export interface AddFacInfoParams {
    name: string;
    code: string;
}
export interface RemoveLdapUserParams {
    userIds: string[];
    client_transactionid: string;
}
export interface AddLineParams {
    ClusterName: string;
    extensionNumber: string;
    displayName: string;
    client_transactionid: string;
    company_id?: number | null;
    shareLineAppearanceCssName: string;
    userId: string;
    verify: boolean;
    update_user: boolean;
}

export interface TestAddLineParams {
    ClusterName: string;
        pattern: string;
    routePartitionName: string;
    description: string;
    usage: string;
    alertingName: string;
    asciiAlertingName: string;
    shareLineAppearanceCssName: string;
    allowCTIControl: string;
    rejectAnonymousCall: string;
    client_transactionid: string;
    company_id?: number | null;
}
export enum CLUSTER_NAME {
    MOBILE = "SIPZON.MOBI",
    HARD_PHONE_AND_DESKTOP = "SIPZON",
}

export interface TestUpdateAppUserParams {
    ClusterName: string;
    userid: string;
    client_transactionid: string;
    associatedDevices: string[];
    company_id?: number | null;
    }
export interface UpdateAppUserParams {
    ClusterName: string;
    userId: string;
    client_transactionid: string;
    extensionNumber: string;
    company_id?: number | null;
    verify: boolean;
}
export interface TestUpdateUserParams {
    ClusterName: string;
    userid: string;
    enableMobility: string;
    homeCluster: string;    
    associatedDevices: string[];

    maxDeskPickupWaitTime: string;
    serviceProfile: string;
    primaryExtension: {
        pattern: string;
        routePartitionName: string;
    };
    associatedGroups: [
        {
            name: string;
            userRoles: string[];
        },
        {
            name: string;
            userRoles: string[];
        },
    ];
    client_transactionid: string;
    company_id?: number | null;
}
export interface UpdateUserParams {
    ClusterName: string;
    userId: string;
    extensionNumber: string;
 
   
    client_transactionid: string;
    company_id?: number | null;
    user_id?: string;
    verify: boolean;
}
export interface TestUpdateLineParams {
    ClusterName: string;
    pattern: string;
    routePartitionName: string;
    alertingName: string;
    asciiAlertingName: string;
    rejectAnonymousCall: boolean;
    shareLineAppearanceCssName: string;
    allowCTIControl: boolean;

    client_transactionid: string;
    company_id?: number | null;
    user_id?: string;
}
export interface TestAddRemoteDestinationParams {
    ClusterName: string;
    name: string;
    destination: string;
    description: string;
    ownerUserId: string;
    remoteDestinationProfileName: string;
    enableUnifiedMobility: boolean;
    isMobilePhone: boolean;
    timeZone: string;
    client_transactionid: string;
    delayBeforeRingingCell: string;
    lineAssociations: [
        {
            pattern: string;
            routePartitionName: string;
        },
    ];
    company_id?: number | null;
    user_id?: string;
}
export interface AddRemoteDestinationParams {
    ClusterName: string;
    displayName: string;
  
    extensionNumber: string;
    userId: string;
    
    client_transactionid: string;

 
    company_id?: number | null;
    verify: boolean;
    update_user: boolean;
}
export interface TestAddRemoteDestinationProfileParams {
    ClusterName: string;
    name: string;
    description: string;
    product: string;
    model: string;
    class: string;
    protocol: string;
    devicePoolName: string;
    callingSearchSpaceName: string;
    rerouteCallingSearchSpaceName: string;
    client_transactionid: string;
    lines: [
        {
            index: string;
            label: string;
            dirn: {
                pattern: string;
                routePartitionName: string;
            };
            callInfoDisplay: {
                callerName: boolean;
                callerNumber: boolean;
                dialedNumber: boolean;
            };
            associatedEndusers: [
                {
                    userId: string;
                },
            ];
        },
    ];
}

export interface AddRemoteDestinationProfileParams {
    ClusterName: string;
  
  
    userId: string;
    shareLineAppearanceCssName: string;
    extensionNumber: string;
    
    client_transactionid: string;
    
    company_id?: number | null;
    verify: boolean;
    update_user: boolean;
}
export interface UpdateLineParams {
    ClusterName: string;
    extensionNumber: string;
    displayName: string;
    shareLineAppearanceCssName: string;
 

    client_transactionid: string;
    company_id?: number | null;
    user_id?: string;
    update_user: boolean;
    }

export interface TestUpdatePhoneParams {
    ClusterName: string;
    client_transactionid: string;
    name: string;
    lines: {
        lines: [
            {
                index: string;
                label: string;
                display: string;
                dirn: {
                    pattern: string;
                    routePartitionName: string;
                };
                displayAscii: string;
                recordingFlag: string;
                recordingProfileName: string;
                monitoringCssName: string;
                recordingMediaSource: string;
            },
        ];
    };
    company_id?: number | null;
    user_id?: string;
}
export interface UpdatePhoneParams {
    ClusterName: string;
    client_transactionid: string;
    displayName: string;
    extensionNumber: string;
    userId: string;
    shareLineAppearanceCssName: string;
   
    company_id?: number | null;
    user_id?: string;
    update_user: boolean;
}
export enum IMAGICLES {
    IMAGICLE1 = "IMAGICLE-N1",
    IMAGICLE2 = "IMAGICLE-N2",
    IMAGICLE3 = "IMAGICLE-N3",
    IMAGICLE4 = "IMAGICLE-N4",
    IMAGICLE5 = "IMAGICLE-N5",
    IMAGICLE6 = "IMAGICLE-N6",
}
export interface UpdateDNCRParams {
    UserID: string;
    TelephoneNumber: string;
    Company: string;
    Department: string;
    AllowLocalDNCLCalls: string;
    AllowApiDNCLCalls: string;
    AllowRepetitiveCalls: string;
    IndividualRepetitiveCallsAllowDaily: number;
    IndividualRepetitiveCallsAllowWeekly: number;
    CallRepFollowCompSettings: string;
    CompanyRepetitiveCallsAllowDaily: number;
    CompanyRepetitiveCallsAllowWeekly: number;
    client_transactionid: string;
    company_id?: number | null;
    user_id?: string;
    verify: boolean;
    update_user: boolean;
}
export interface TestUpdateDNCRParams {
    UserID: string;
    TelephoneNumber: string;
    Company: string;
    Department: string;
    AllowLocalDNCLCalls: string;
    AllowApiDNCLCalls: string;
    AllowRepetitiveCalls: string;
    IndividualRepetitiveCallsAllowDaily: number;
    IndividualRepetitiveCallsAllowWeekly: number;
    CallRepFollowCompSettings: string;
    CompanyRepetitiveCallsAllowDaily: number;
    CompanyRepetitiveCallsAllowWeekly: number;
  
}
export interface SyncImagicleParams {
    client_transactionid: string;
    serverName: IMAGICLES;
}
export interface AddPhoneParams {
    ClusterName: string;
  
    displayName: string;
    client_transactionid: string;
    company_id?: number | null;
    userId: string;
    extensionNumber: string;
    verify: boolean;
    update_user: boolean;
}
export interface TestAddPhoneParams {
    ClusterName: string;
    name: string;
    description: string;

    product: string;
    builtInBridgeStatus: string;
    class: string;
    protocol: string;
    devicePoolName: string;
    ownerUserName: string;
    digestUser: string;
    lines: [
        {
            index: string;
            label: string;
            display: string;
            displayAscii: string;
            dirn: {
                pattern: string;
                routePartitionName: string;
            };
            associatedEndusers: [
                {
                    userId: string;
                },
            ];
            recordingFlag: string;
            recordingProfileName: string;
            recordingMediaSource: string;
        },
    ];
    action: string;
    client_transactionid: string;
}
export interface AddUserParams {
    ClusterName: string;
    userid: string;
    enableMobility: string;
    homeCluster: string;
    associatedDevices: string[];

    maxDeskPickupWaitTime: string;
    serviceProfile: string;
    primaryExtension: {
        pattern: string;
        routePartitionName: string;
    };
    associatedGroups: [
        {
            name: string;
            userRoles: string[];
        },
        {
            name: string;
            userRoles: string[];
        },
    ];
    client_transactionid: string;
    company_id?: number | null;
    user_id?: string;
    update_user: boolean;
}
export interface SyncPBXParams {
    ClusterName: string;
    client_transactionid: string;
    userId: string;

    displayName: string;
    password: string;
    firstName?: string;
    lastName?: string;

   
    company_id?: number | null;
    user_id?: string;
    verify: boolean;
    update_user: boolean;
    
}
export interface TestSyncPBXParams {
    ClusterName: string;
    client_transactionid: string;
    userid: string;

    displayName: string;
    password: string;
    firstName?: string;
    lastName?: string;

    enableCti?: string;
    enableMobility?: string;
    presenceGroupName?: {
        name: string;
    };
    associatedGroups?: [
        {
            name: string;
            userRoles: string[];
        },
    ];
    company_id?: number | null;
    user_id?: string;
}
export interface RemoveUserParams {
    client_transactionid: string;
    ClusterName: string;
    userid: string;
    company_id?: number | null;
    verify: boolean;
    update_user: boolean;
}
export interface TestRemoveUserParams {
    client_transactionid: string;
    ClusterName: string;
    userid: string;
}
export interface RemovePhoneParams {
    extensionNumber: string;
    client_transactionid: string;
    ClusterName: string;
    userId: string;
    user_id?: string;
    device_type: DeviceType;
    company_id?: number | null;
    verify: boolean;
    update_user: boolean;
}
export interface TestRemovePhoneParams {
    client_transactionid: string;
    ClusterName: string;
    name: string;
  
}
export interface RemoveLineParams {
    extensionNumber: string;
    client_transactionid: string;
    ClusterName: string;
    userId: string;
    user_id?: string;
    company_id?: number | null;
    verify: boolean;
    update_user: boolean;
}
export interface TestRemoveLineParams {
    pattern: string;
    routePartitionName: string;
    client_transactionid: string;
    ClusterName: string;
}
export interface VerifyLdapUserParams {
    userId?: string|null;
    firstName: string;
    lastName: string;
    email: string;
    country: string;
    companyName: string;
    displayName: string;
    extensionNumber?: number|null;
    department: string;
    jobTitle: string;
    client_transactionid: string;
    password: string;
    company_id: number;
    
    update_user: boolean;
    verify: boolean;
}

export interface VerifyUserInfoParams extends VerifyLdapUserParams {
    company: Company | null;
    shareLineAppearanceCssName: string;
    client_transactionid: string;
    mobile_user: MobileUser | null;
    call_repetition_daily: number | null | undefined;
    call_repetition_weekly: number | null | undefined;
    call_repetition: string | null | undefined;
    allow_dncr: DNCRCallingAccess | undefined;
    display: string | null;
    allow_fac_info: FacInfoCallingAccess | undefined;
    device_type: DeviceType | null;
    country: string;
    previous_mobile_user: MobileUser | null;
    previous_device_type: DeviceType | null;    
    department: string;
    jobTitle: string;
    verify: boolean;

    iccid_number: number | null;
}
export enum UserInfoAction {
    ADD_LINE = "addLine",
    ADD_FAC_INFO = "addFacInfo",
    UPDATE_USER = "updateUser",
    LIST_USER = "listUser",
    LIST_INFO = "listInfo",
    ADD_PHONE = "addPhone",
    UPDATE_APP_USER = "updateAppUser",
    REMOVE_LINE = "removeLine",
}
export interface AddUpdateUserInfoParams extends VerifyLdapUserParams {

    user_id?: string;
    shareLineAppearanceCssName: string;
    call_repetition: string | null | undefined;
    call_repetition_weekly: number | null | undefined;
    call_repetition_daily: number | null | undefined;
    allow_dncr: DNCRCallingAccess | undefined;
    allow_fac_info: FacInfoCallingAccess | undefined;
    verify: boolean;
    mobile_user: MobileUser | null;
    device_type: DeviceType | null;
    display: string | null;
    allow_error?: boolean;
    client_transactionid: string;
    iccid_number: number | null;
    update_user: boolean;
}

export interface CreateUpdateLdapUserParams {
    firstName: string;
    lastName: string;
    email: string;
    userId: string;
    user_id?: string;
    extensionNumber: number | null;
    companyName: string;
    department: string;
    company_id?: number | null;
    jobTitle: string;
    country: string;
    client_transactionid: string;
    description: string;
    password: string;
    verify: boolean;
    update_user: boolean;
}
export interface GetUserProfilingDraftParams {
    id: number;
}

export interface GetUserProfilingDraftListParams
    extends Partial<PaginationParams> {}
export interface UserProfilingDraft {
    id: number;
    company_id: number;
    user_id: string;
    data: UserProfilingDraftData;
}
export interface UserProfilingDraftData {
    firstName: string;
    lastName: string;
    email: string;
    userId: string;
    extensionNumber: number | null;
    companyName: string;
    description: string;
    password: string;
    client_transactionid: string;
    country: string;
    department: string;
    jobTitle: string;
    company_id?: number | null;
    shareLineAppearanceCssName: string;
    call_repetition: string | null | undefined;
    call_repetition_weekly: number | null | undefined;
    call_repetition_daily: number | null | undefined;
    allow_dncr: DNCRCallingAccess | undefined;
    allow_fac_info: FacInfoCallingAccess | undefined;
    device_type: DeviceType | null;
    mobile_user: MobileUser | null;
    display: string | null;
    allow_error: boolean;
    iccid_number: number | null;
    created_at: string;
}
export interface AddOnlyLdapUserParams {
    firstName: string;
    lastName: string;
    email: string;
    userId: string;
    extensionNumber: number | null;
    companyName: string;
    description: string;
    password: string;
    client_transactionid: string;
    country: string;
    department: string;
    jobTitle: string;
    company_id?: number | null;
    update_user: boolean;
    verify: boolean;
}

export interface TestAddOnlyLdapUserParams {
    firstName: string;
    lastName: string;
    email: string;
    userId: string;
    extensionNumber: number | null;
    companyName: string;
    description: string;
    password: string;
    client_transactionid: string;
    country: string;
    department: string;
    jobTitle: string;
    organizationalUnit?: string;
    displayName: string;
}
export enum PhoneProduct {
    TCT = "Cisco Dual Mode for iPhone",
    BOT = "Cisco Dual Mode for Android",
    CSF = "Cisco Unified Client Services Framework",
}
export interface UpdateOnlyLdapUserParams {
    firstName: string;
    lastName: string;
    email: string;
    department: string;
    jobTitle: string;
    country: string;
    client_transactionid: string;
    company_id?: number | null;
    user_id?: string;   
    update_user: boolean;   
}
export interface TestUpdateOnlyLdapUserParams {
    firstName: string;
    lastName: string;
    email: string;
    userId: string;
    department: string;
    jobTitle: string;
    country: string;
    client_transactionid: string;
    company_id?: number | null;
}
export interface GetUserProfilingErrorLogRequest extends PaginationParams {
    company_id?: number;
    load_user?: boolean;
    statuses?: UserProfilingErrorLogStatus[];
    load_company?: boolean;
}
export interface UserProfilingErrorLog {
    id: number;
    user_id: number;
    applicant_id: string;
    status: UserProfilingErrorLogStatus;
    user: User;
    applicant_details: ApplicantDetails;
    error_details: iErrorDetails;
    company: Company;
    company_id: number;
    created_at: string;
}
export interface UpdateUserProfilingErrorLogRequest {
    id: number;
    status: UserProfilingErrorLogStatus;
}
export enum UserProfilingErrorLogStatus {
    PENDING = "pending",
    PROCESSED = "processed",
    FAILED = "failed",
    IN_PROGRESS = "in_progress",
}
export interface ApplicantDetails {
    id: number;
    userId: number;
    company_id: number;
    mobile_user: MobileUser;
    displayName?: string;
    extensionNumber?: number;
    previous_mobile_user: MobileUser | null;
    previous_device_type: DeviceType | null;    
    status?: UserProfilingErrorLogStatus;
    device_type?: DeviceType;
    shareLineAppearanceCssName?: string;
    client_transactionid?: string;
    allow_dncr?: DNCRCallingAccess;
    call_repetition?: string;
    call_repetition_daily?: number;
    allow_fac_info?: FacInfoCallingAccess;
    call_repetition_weekly?: number;
    password?: string;
    email?: string;
    iccid_number?: number;
    firstName?: string;
    lastName?: string;
    description?: string;
    country?: string;
    department?: string;
    jobTitle?: string;
    companyName?: string;
    update_user?: boolean;
}

export interface CausedDueTo {
    user_id: number;
    error: string;
    cluster: string | null;
    execution_time_ms: number;
}
export interface UpdateProfilingErrorLogsRequest {
    applicant_id: string;
    status: UserProfilingErrorLogStatus;
    company_id: number;
    applicant_details: ApplicantDetails; 
    error_details: iErrorDetails;
}
export interface iErrorDetails {
    caused_due_to: CausedDueTo[];
    sync_user_steps: any;
}
export interface SyncUserSteps {
    verify_ldap_user?: boolean;
    verify_list_user?   : boolean;
    verify_list_line?: boolean;
    verify_list_phone?: boolean;
    verify_list_remote_destination?: boolean;
    verify_list_remote_destination_profile?: boolean;
    verify_pbx_user?: boolean;
    add_ldap_user?: boolean;
    add_line?: boolean;
    add_phone?: boolean;
    add_fac_info?: boolean;
    update_user?: boolean;
    update_line?: boolean;
    update_phone?: boolean;
    update_app_user?: boolean;
    remove_user?: boolean;
    remove_line?: boolean;
    remove_phone?: boolean;
    remove_fac_info?: boolean;
    remove_remote_destination?: boolean;
    remove_remote_destination_profile?: boolean;
    sync_imagicle?: boolean;
    do_ldap_sync?: boolean;
    add_local_user?: boolean;
}
