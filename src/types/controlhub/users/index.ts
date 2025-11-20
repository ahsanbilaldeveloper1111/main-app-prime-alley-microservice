// Shared types for user view components
export interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    ou: string;
    username: string;
    department: string;
    company: string;
    last_synced_at: string;
    role_id: string;
    is_company_admin: string;
    role: {
        name: string;
    };
    group_id: string;
    group: {
        name: string;
    };
    status: string;
    extended_permissions: string[];
    blocked_permissions: string[];
    role_excluded_permissions: string[];
}

export interface Permission {
    id: number;
    name: string;
    slug: string;
    module: string;
    module_name?: string;
}

export interface Role {
    id: number;
    name: string;
    company?: string;
}

export interface Group {
    id: number;
    name: string;
}

export interface SelectOption {
    value: number;
    label: string;
}

export interface Module {
    id: number;
    name: string;
    slug: string;
}

