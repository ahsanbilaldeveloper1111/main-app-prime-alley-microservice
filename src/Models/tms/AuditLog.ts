import { PaginationParams } from '@utils/pagination';
import { Permission } from './Permission';
import { Company } from '@models/tms/Company';
import { User } from '@models/tms/User';

export interface AuditLog {
    id: number;
    user_id: number;
    user_name: string;
    resource_type: AuditLogResourceType;
    old_values: any;
    action: string;
    new_values: any;
    ip_address: string;
    user_agent: string;
    created_at: string;
    updated_at: string;
    user: User;
    company: Company;
}
export enum AuditLogResourceType {
    RANK = "rank",
    PERMISSION = "permission",
    USER = "user",
    COMPANY = "company",
    AUDIT_LOG = "audit_log",
    CISCO_DB = "cisco_db",
    UNIFIED_OP = "unified_op",
    CUSTOMER_PROFILING = "customer_profiling",
    USER_PROFILING = "user_profiling",
    USER_PROFILING_ERROR_LOG = "user_profiling_error_log",
    GLOBAL = "global",
    LDAP_USER = "ldap_user",
    MODULE = "module",
}

export interface IndexAuditLogParams extends PaginationParams {
    user_id?: number;
    company_id?: number;
    resource_type?: AuditLogResourceType;
}

