import { Permission } from './Permission';

export interface Module {
    id: number;
    name: string;
    description: string;
    permissions?: Permission[];
    created_at?: string;
    updated_at?: string;
}

export enum ModuleStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive'
}
export enum ModuleName {
    USER = 'user',
    DASHBOARD = 'dashboard',
    RANK = 'rank',
    PERMISSION = 'permission',
    GLOBAL = 'global',
    UNIFIED_OP = 'unified_op',
    CISCO_DB = 'cisco_db',
    CUSTOMER_PROFILING = 'customer_profiling',
    COMPANY = 'company',
    USER_PROFILING_ERROR_LOG = 'user_profiling_error_log',
    AUDIT_LOG = 'audit_log',
    USER_SETTING = 'user_setting',
}

export interface ModuleCreateData {
    name: string;
    description: string;
}

export interface ModuleUpdateData {
    name?: string;
    description?: string;
} 