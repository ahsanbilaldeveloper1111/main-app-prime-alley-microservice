export enum ClusterName {
    HARD_PHONE_AND_DESKTOP_CLUSTER = "SIPZON",
    MOBILE_CLUSTER = "MOBILE"
}

export interface ListCSS {
    name: string;
    ClusterName: string;
}

export interface ListRoutePartition {
    name: string;
    ClusterName: string;
    description?: string;
    dialPlanWizardGenId?: string;
    timeScheduleIdName?: string;
    useOriginatingDeviceTimeZone?: string;
    timeZone?: string;
    partitionUsage?: string;
}

export interface ListAppUser {
    userid: string;
    ClusterName: string;
    presenceGroupName?: string;
    acceptPresenceSubscription?: string;
    acceptOutOfDialogRefer?: string;
    acceptUnsolicitedNotification?: string;
    allowReplaceHeader?: string;
    isStandard?: string;
}

export interface ListRecordingProfile {
    name: string;
    ClusterName: string;
}

export interface ListFacInfo {
    name: string;
    ClusterName: string;
    code?: string;
    authorizationLevel?: string;
}

export interface ListDevicePool {
    name: string;
    ClusterName: string;
}

export interface ListLdapDirectory {
    name: string;
    ClusterName: string;
}
export interface SearchParams extends Partial<any> {
    search?: string;
}