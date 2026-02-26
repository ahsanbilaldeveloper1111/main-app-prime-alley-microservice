export interface AnalyticCounterResponse {
    total_user_count: number;
    total_non_admin_user_count: number;
    total_company_count: number;
    total_active_user_count: number;
    total_mobile_user_count: number;
    total_action_count: number;
    total_create_action_count: number;
    total_update_action_count: number;
    total_delete_action_count: number;
}
export interface AnalyticsData {
    success: boolean;
    data: any;
    message?: string;
    code?: number;
}

export interface DashboardOverview {
    create: number;
    update: number;
    delete: number;

    total_companies: number;
    total_users: number;
    mobile_users: number;
}

export interface CompanyMonthlyInteractions {
    [companyName: string]: {
        create: number;
        update: number;
        delete: number;
    };
}

export interface MonthlyInteractionsTrend {
    month: string;
    create: number;
    update: number;
    delete: number;
}

export interface CompanyMobileUserStats {
    company_name: string;
    mobile_users: number;
    non_mobile_users: number;
    total_users: number;
}

export interface CompanyUserActivity {
    company_name: string;
    active_users: number;
    inactive_users: number;
    total_users: number;
}

export interface TopCompany {
    name: string;
    user_count: number;
}

export interface AuditLogSummary {
    [companyName: string]: {
        action: string;
        count: number;
    }[];
}
