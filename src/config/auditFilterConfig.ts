import { AuditLogsStaffManagement } from "@utils/staffManagement";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { ModuleSlug } from "@utils/Helper";
import { AuditLogsWorkPlanner } from "@utils/work-planner";
import { GetTmsAuditLogs } from "@utils/tms/List";
import { GetAccountAuditLogs } from "@utils/accounting";

export interface AuditFilterService {
  serviceName: string;
  serviceValue: string;
  serviceKey?: string;
  userKey?: string;
  isShow?: string;
  actions?: string[];
  users?: string;
  moduleSlug?: string;
}

export interface AuditFilterNode {
  moduleName: string;
  isShow: string;
  services: AuditFilterService[];
  endpoint: (params: Record<string, unknown>) => Promise<unknown>;
  responsePattern?: unknown[];
  pageKey?: string;
  perPageKey?: string;
  timestamp?: string | [string, string];
}

export const AuditFilterActions = { CREATE: "Create", MODIFY: "Update", REMOVE: "Remove" } as const;

const StaffManagementServices = {
  moduleName: "Staff management",
  isShow: HEADER_CONSTANTS.PERMISSIONS.STAFF_MANAGEMENT_SERVICES,
  endpoint: AuditLogsStaffManagement as (params: Record<string, unknown>) => Promise<unknown>,
  responsePattern: [],
  perPageKey: "limit",
  pageKey: "page",
  timestamp: ["date_from", "date_to"] as [string, string],
  services: [
    {
      serviceName: "User Requests",
      serviceValue: "user_request",
      serviceKey: "resource_type",
      userKey: "user_id",
      isShow: HEADER_CONSTANTS.PERMISSIONS.VIEW_EMPLOYEES_STAFF_MANAGEMENT,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
      users: "dropdown",
      moduleSlug: ModuleSlug.STAFF_MANAGEMENT,
    },
    {
      serviceName: "User Journey",
      serviceValue: "user_journey",
      serviceKey: "resource_type",
      userKey: "user_id",
      isShow: HEADER_CONSTANTS.PERMISSIONS.VIEW_EMPLOYEES_STAFF_MANAGEMENT,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
      users: "dropdown",
      moduleSlug: ModuleSlug.STAFF_MANAGEMENT,
    },
    {
      serviceName: "User Journey Step",
      serviceValue: "user_journey_step",
      serviceKey: "resource_type",
      userKey: "user_id",
      isShow: HEADER_CONSTANTS.PERMISSIONS.VIEW_EMPLOYEES_STAFF_MANAGEMENT,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
      users: "dropdown",
      moduleSlug: ModuleSlug.STAFF_MANAGEMENT,
    },
    {
      serviceName: "User Request Approval",
      serviceValue: "user_request_approval",
      serviceKey: "resource_type",
      userKey: "user_id",
      isShow: HEADER_CONSTANTS.PERMISSIONS.VIEW_EMPLOYEES_STAFF_MANAGEMENT,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
      users: "dropdown",
      moduleSlug: ModuleSlug.STAFF_MANAGEMENT,
    },
    {
      serviceName: "User Request Categories",
      serviceValue: "user_request_category",
      serviceKey: "resource_type",
      isShow: HEADER_CONSTANTS.PERMISSIONS.VIEW_EMPLOYEES_STAFF_MANAGEMENT,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
      users: "dropdown",
      moduleSlug: ModuleSlug.STAFF_MANAGEMENT,
    },
    {
      serviceName: "Attendance",
      serviceValue: "user_attendance",
      serviceKey: "resource_type",
      userKey: "user_id",
      isShow: HEADER_CONSTANTS.PERMISSIONS.VIEW_ATTENDENCE_STAFF_MANAGEMENT,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY],
      users: "hierarchy",
      moduleSlug: ModuleSlug.STAFF_MANAGEMENT,
    },
    {
      serviceName: "User Profile",
      serviceValue: "user_profile",
      serviceKey: "resource_type",
      userKey: "user_id",
      isShow: HEADER_CONSTANTS.PERMISSIONS.VIEW_ATTENDENCE_STAFF_MANAGEMENT,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY],
      users: "hierarchy",
      moduleSlug: ModuleSlug.STAFF_MANAGEMENT,
    },
  ],
};

const WorkPlannerServices = {
  moduleName: "Work Planner",
  isShow: HEADER_CONSTANTS.PERMISSIONS.WORK_PLANNER_SERVICES,
  endpoint: AuditLogsWorkPlanner as (params: Record<string, unknown>) => Promise<unknown>,
  responsePattern: [],
  perPageKey: "limit",
  pageKey: "page",
  timestamp: ["date_from", "date_to"] as [string, string],
  services: [
    {
      serviceName: "Project",
      serviceValue: "project",
      serviceKey: "resource_type",
      userKey: "user_id",
      isShow: HEADER_CONSTANTS.PERMISSIONS.WORK_PLANNER_SERVICES,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
      users: "dropdown",
      moduleSlug: ModuleSlug.WORK_PLANNER,
    },
    {
      serviceName: "Task",
      serviceValue: "task",
      serviceKey: "resource_type",
      userKey: "user_id",
      isShow: HEADER_CONSTANTS.PERMISSIONS.WORK_PLANNER_SERVICES,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
      users: "dropdown",
      moduleSlug: ModuleSlug.WORK_PLANNER,
    },
    {
      serviceName: "Status",
      serviceValue: "status",
      serviceKey: "resource_type",
      userKey: "user_id",
      isShow: HEADER_CONSTANTS.PERMISSIONS.WORK_PLANNER_SERVICES,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
      users: "dropdown",
      moduleSlug: ModuleSlug.WORK_PLANNER,
    },
    {
      serviceName: "Label",
      serviceValue: "label",
      serviceKey: "resource_type",
      userKey: "user_id",
      isShow: HEADER_CONSTANTS.PERMISSIONS.WORK_PLANNER_SERVICES,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
      users: "dropdown",
      moduleSlug: ModuleSlug.WORK_PLANNER,
    },
    {
      serviceName: "Task Comment",
      serviceValue: "task_comment",
      serviceKey: "resource_type",
      userKey: "user_id",
      isShow: HEADER_CONSTANTS.PERMISSIONS.WORK_PLANNER_SERVICES,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
      users: "dropdown",
      moduleSlug: ModuleSlug.WORK_PLANNER,
    },
    {
      serviceName: "Task Checklist",
      serviceValue: "task_checklist",
      serviceKey: "resource_type",
      userKey: "user_id",
      isShow: HEADER_CONSTANTS.PERMISSIONS.WORK_PLANNER_SERVICES,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
      users: "dropdown",
      moduleSlug: ModuleSlug.WORK_PLANNER,
    },
    {
      serviceName: "Task Assignee",
      serviceValue: "task_assignee",
      serviceKey: "resource_type",
      userKey: "user_id",
      isShow: HEADER_CONSTANTS.PERMISSIONS.WORK_PLANNER_SERVICES,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
      users: "dropdown",
      moduleSlug: ModuleSlug.WORK_PLANNER,
    },
    {
      serviceName: "Task Watcher",
      serviceValue: "task_watcher",
      serviceKey: "resource_type",
      userKey: "user_id",
      isShow: HEADER_CONSTANTS.PERMISSIONS.WORK_PLANNER_SERVICES,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
      users: "dropdown",
      moduleSlug: ModuleSlug.WORK_PLANNER,
    },
    {
      serviceName: "Task Document",
      serviceValue: "task_document",
      serviceKey: "resource_type",
      userKey: "user_id",
      isShow: HEADER_CONSTANTS.PERMISSIONS.WORK_PLANNER_SERVICES,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
      users: "dropdown",
      moduleSlug: ModuleSlug.WORK_PLANNER,
    },
    {
      serviceName: "Project Member",
      serviceValue: "project_member",
      serviceKey: "resource_type",
      userKey: "user_id",
      isShow: HEADER_CONSTANTS.PERMISSIONS.WORK_PLANNER_SERVICES,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
      users: "dropdown",
      moduleSlug: ModuleSlug.WORK_PLANNER,
    },
  ],
};

const AccountingAuditLogsServices = {
  moduleName: "Accounts",
  isShow: HEADER_CONSTANTS.PERMISSIONS.ACCOUNTS_SERVICES,
  endpoint: GetAccountAuditLogs as (params: Record<string, unknown>) => Promise<unknown>,
  responsePattern: [],
  perPageKey: "limit",
  pageKey: "page",
  timestamp: ["date_from", "date_to"] as [string, string],
  services: [
    {
      serviceName: "Invoices",
      serviceValue: "invoice",
      serviceKey: "resource_type",
      isShow: HEADER_CONSTANTS.PERMISSIONS.VIEW_INVOICES_BILLING,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
    },
    {
      serviceName: "Payment",
      serviceValue: "payment",
      serviceKey: "resource_type",
      isShow: HEADER_CONSTANTS.PERMISSIONS.VIEW_INVOICES_BILLING,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
    },
    {
      serviceName: "Product",
      serviceValue: "product",
      serviceKey: "resource_type",
      isShow: HEADER_CONSTANTS.PERMISSIONS.VIEW_INVOICES_BILLING,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
    },
    {
      serviceName: "Product Category",
      serviceValue: "product_,category",
      serviceKey: "resource_type",
      isShow: HEADER_CONSTANTS.PERMISSIONS.VIEW_INVOICES_BILLING,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
    },
    {
      serviceName: "Expense",
      serviceValue: "expense",
      serviceKey: "resource_type",
      isShow: HEADER_CONSTANTS.PERMISSIONS.VIEW_INVOICES_BILLING,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
    },
    {
      serviceName: "Expense Category",
      serviceValue: "expense_category",
      serviceKey: "resource_type",
      isShow: HEADER_CONSTANTS.PERMISSIONS.VIEW_INVOICES_BILLING,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
    }
  ],
};

const TmsAuditLogsServices = {
  moduleName: "Automation",
  isShow: HEADER_CONSTANTS.PERMISSIONS.TMS_SERVICES,
  endpoint: GetTmsAuditLogs as (params: Record<string, unknown>) => Promise<unknown>,
  responsePattern: [],
  perPageKey: "limit",
  pageKey: "page",
  timestamp: ["date_from", "date_to"] as [string, string],
  services: [
    {
      serviceName: "User",
      serviceValue: "user",
      serviceKey: "resource_type",
      isShow: HEADER_CONSTANTS.PERMISSIONS.TMS_SERVICES,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
    },
    {
      serviceName: "Customer Profiling",
      serviceValue: "customer_profiling",
      serviceKey: "resource_type",
      isShow: HEADER_CONSTANTS.PERMISSIONS.VIEW_INVOICES_BILLING,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
    },
    {
      serviceName: "User Profiling",
      serviceValue: "user_profiling",
      serviceKey: "resource_type",
      isShow: HEADER_CONSTANTS.PERMISSIONS.VIEW_INVOICES_BILLING,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
    },
    {
      serviceName: "LDap User",
      serviceValue: "ldap_user",
      serviceKey: "resource_type",
      isShow: HEADER_CONSTANTS.PERMISSIONS.VIEW_INVOICES_BILLING,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
    },
    {
      serviceName: "User Profiling Error Log",
      serviceValue: "user_profiling_error_log",
      serviceKey: "resource_type",
      isShow: HEADER_CONSTANTS.PERMISSIONS.VIEW_INVOICES_BILLING,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
    },
    {
      serviceName: "Global",
      serviceValue: "global",
      serviceKey: "resource_type",
      isShow: HEADER_CONSTANTS.PERMISSIONS.VIEW_INVOICES_BILLING,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
    },
    {
      serviceName: "Module",
      serviceValue: "module",
      serviceKey: "resource_type",
      isShow: HEADER_CONSTANTS.PERMISSIONS.VIEW_INVOICES_BILLING,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
    },
    {
      serviceName: "Audit Log",
      serviceValue: "audit_log",
      serviceKey: "resource_type",
      isShow: HEADER_CONSTANTS.PERMISSIONS.VIEW_INVOICES_BILLING,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
    },
    {
      serviceName: "Cisco DB",
      serviceValue: "cisco_db",
      serviceKey: "resource_type",
      isShow: HEADER_CONSTANTS.PERMISSIONS.VIEW_INVOICES_BILLING,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
    },
    {
      serviceName: "Unified OP",
      serviceValue: "unified_op",
      serviceKey: "resource_type",
      isShow: HEADER_CONSTANTS.PERMISSIONS.VIEW_INVOICES_BILLING,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
    },
    {
      serviceName: "Permission",
      serviceValue: "permission",
      serviceKey: "resource_type",
      isShow: HEADER_CONSTANTS.PERMISSIONS.VIEW_INVOICES_BILLING,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
    },
    {
      serviceName: "Rank",
      serviceValue: "rank",
      serviceKey: "resource_type",
      isShow: HEADER_CONSTANTS.PERMISSIONS.VIEW_INVOICES_BILLING,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
    },
    {
      serviceName: "Company",
      serviceValue: "company",
      serviceKey: "resource_type",
      isShow: HEADER_CONSTANTS.PERMISSIONS.VIEW_INVOICES_BILLING,
      actions: [AuditFilterActions.CREATE, AuditFilterActions.MODIFY, AuditFilterActions.REMOVE],
    },
    
  ],
};

export const AuditFilterConfig: AuditFilterNode[] = [
  StaffManagementServices,
  WorkPlannerServices,
  AccountingAuditLogsServices,
  TmsAuditLogsServices,
];
