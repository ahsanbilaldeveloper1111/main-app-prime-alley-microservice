import { HEADER_CONSTANTS } from "@constants/headerConstants";

const { PERMISSIONS } = HEADER_CONSTANTS;

export interface RoutePermission {
    path: string;
    permissions: string[];
    children?: RoutePermission[];
}

// Define all route permissions in a hierarchical structure
export const routePermissions: RoutePermission[] = [
    
    //profile services start
    {path: '/profile',permissions: ['']},
    {path: '/coming-soon',permissions: ['']},
    {path: '/plan-upgrade',permissions: ['']},
    {path: '/live-calls-test',permissions: ['']},
    {path: '/resources',permissions: ['']},
   
    {path: '/resources/faq',permissions: ['']},
    {path: '/resources/help-materials',permissions: ['']},
    {path: '/resources/contact-support',permissions: ['']},


    {path: '/reports',permissions: [PERMISSIONS.REPORTS_SERVICES]},
    {path: '/billing',permissions: [PERMISSIONS.REPORTS_SERVICES]},
    {path: '/reseller',permissions: [PERMISSIONS.REPORTS_SERVICES]},
    {path: '/vendor',permissions: [PERMISSIONS.REPORTS_SERVICES]},
    {path: '/crm-new',permissions: [PERMISSIONS.REPORTS_SERVICES]},
    {path: '/tickets/dashboardnew',permissions: [PERMISSIONS.REPORTS_SERVICES]},

    
    //netops services start
    {
        path: '/netops',
        permissions: [PERMISSIONS.CONTROL_HUB_SERVICES],
        children: [
            {
                path: '/dashboard',
                permissions: [PERMISSIONS.CONTROL_HUB_SERVICES]
            },
            {
                path: '/devices',
                permissions: [PERMISSIONS.CONTROL_HUB_SERVICES]
            },
            {
                path: '/services',
                permissions: [PERMISSIONS.CONTROL_HUB_SERVICES]
            },
            {
                path: '/alerts',
                permissions: [PERMISSIONS.CONTROL_HUB_SERVICES]
            },
            {
                path: '/uptime-sla',
                permissions: [PERMISSIONS.CONTROL_HUB_SERVICES]
            },
        ]
    },
     
    
    //controlhub services start
    {
        path: '/controlhub',
        permissions: [PERMISSIONS.CONTROL_HUB_SERVICES],
        children: [
            {
                path: '/ranks',
                permissions: ['view-ranks'],
                children: [
                    {
                        path: '/permissions',
                        permissions: ['view-permissions-ranks']
                    },
                    {
                        path: '/permissions/edit',
                        permissions: ['assign-permissions-ranks']
                    }
                ]
            },
            {
                path: '/users',
                permissions: ['view-users'],
                children: [
                    {
                        path: '/',
                        permissions: ['edit-users']
                    }
                ]
            },
            {
                path: '/groups',
                permissions: ['view-groups']
            },
        ]
    },
    
    //call logs services start
    {
        path: '/call-logs',
        permissions: ['view-call-logs'],
        children: [
            {
                path: '/dashboard',
                permissions: ['dashboard-call-logs']
            }
        ]
    },

    //call recordings services start
    {
        path: '/call-recordings',
        permissions: ['view-call-recordings']
    },
    
    //call reports services start
    {
        path: '/call-reports',
        permissions: [PERMISSIONS.REPORTS_SERVICES],
        children: [
            {
                path: '/stats/country',
                permissions: ['call-reports-by-statistics-reports']
            },
            {
                path: '/stats/department',
                permissions: ['call-reports-by-statistics-reports']
            },
            {
                path: '/stats/extension',
                permissions: ['call-reports-by-statistics-reports']
            },
            {
                path: '/incoming/country',
                permissions: ['call-reports-by-call-incoming-reports']
            },
            {
                path: '/incoming/department',
                permissions: ['call-reports-by-call-incoming-reports']
            },
            {
                path: '/incoming/extension',
                permissions: ['call-reports-by-call-incoming-reports']
            },
            {
                path: '/trend/country',
                permissions: ['call-reports-by-trend-reports']
            },
            {
                path: '/trend/department',
                permissions: ['call-reports-by-trend-reports']
            },
            {
                path: '/trend/extension',
                permissions: ['call-reports-by-trend-reports']
            },
        ]
    },

    //tickets services start
    {
        path: '/tickets',
        permissions: [PERMISSIONS.TICKETS_SERVICES],
        children: [
            {
                path: '/',
                permissions: ['view-ticket-tickets']
            },
            {
                path: '/dashboard',
                permissions: ['dashboard-tickets']
            },
            {
                path: '/list',
                permissions: ['view-ticket-tickets']
            },
            {
                path: '/statuses',
                permissions: ['ticket-statuses-tickets']
            },
            {
                path: '/modules',
                permissions: ['ticket-modules-tickets']
            },
            {
                path: '/modules/categories',
                permissions: [HEADER_CONSTANTS.PERMISSIONS.VIEW_TICKETS_CATEGORIES]
            },
            {
                path: '/modules/submodules',
                permissions: [HEADER_CONSTANTS.PERMISSIONS.VIEW_TICKETS_SUBCATEGORIES]
            },
            {
                path: '/types',
                permissions: ['view-ticket-types-tickets']
            }
        ]
    },

    //ai-ml services start
    {
        path: '/ai-ml',
        permissions: [PERMISSIONS.AI_ML_SERVICES],
        children: [
            {
                path: '/analysis',
                permissions: ['transcriptions-analysis-aiml'],
                children: [
                    {
                        path: '/',
                        permissions: ['transcriptions-analysis-aiml']
                    }
                ]
            },
            {
                path: '/analyze-recordings',
                permissions: ['transcriptions-analysis-aiml'],
                children: [
                    {
                        path: '/',
                        permissions: ['transcriptions-analysis-aiml']
                    }
                ]
            },
            {
                path: '/translate',
                permissions: ['translate-aiml']
            },
            {
                path: '/transcriptions',
                permissions: ['transcriptions-aiml']
            },
            {
                path: '/outbound-calls',
                permissions: [PERMISSIONS.OUTBOUND_CALLS_AIML]
            }
        ]
    },

    //crm services start
    {
        path: '/crm',
        permissions: [PERMISSIONS.CRM_SERVICES],
        children: [
            { 
                path: '/dashboard',permissions: [PERMISSIONS.VIEW_CRM_DASHBOARD]
            },
            { 
                path: '/campaigns',permissions: [PERMISSIONS.VIEW_CRM_CAMPAIGNS],
                children: [
                    { path: '/',permissions: [PERMISSIONS.VIEW_CRM_CAMPAIGNS]}
                ]
            },
            { 
                path: '/data',permissions: [PERMISSIONS.VIEW_CRM_DATA_MANAGEMENT],
                children: [
                    { path: '/',permissions: [PERMISSIONS.VIEW_CRM_DATA_MANAGEMENT]},
                    { path: '/create',permissions: [PERMISSIONS.CREATE_CRM_DATA_MANAGEMENT]},
                ]
            },
            { 
                path: '/leads',permissions: [PERMISSIONS.VIEW_CRM_LEADS],
                children: [
                    { path: '/',permissions: [PERMISSIONS.VIEW_CRM_LEADS]},
                    { path: '/create',permissions: [PERMISSIONS.CREATE_CRM_LEADS]},
                ]
            },
            { path: '/lost-reasons',permissions: [PERMISSIONS.VIEW_CRM_LOST_REASONS]},
            { path: '/opportunities',permissions: [PERMISSIONS.VIEW_CRM_OPPORTUNITIES]},
            { path: '/opportunities/create',permissions: [PERMISSIONS.CREATE_CRM_OPPORTUNITIES]},
            { path: '/stages',permissions: [PERMISSIONS.VIEW_CRM_STAGES]},
        ]
    },
    
    //accounts services start
    {
        path: '/accounts',
        permissions: [PERMISSIONS.ACCOUNTS_SERVICES],
        children: [
            {
                path: '/',
                permissions: [PERMISSIONS.ACCOUNTS_SERVICES]
            }
        ]
    },

    //accounting services start
    {
        path: '/accounting',
        permissions: [PERMISSIONS.ACCOUNTS_SERVICES],
        children: [
            {
                path: '/customer',
                permissions: [PERMISSIONS.ACCOUNTS_SERVICES],
                children: [
                    { path: '/dashboard',permissions: [PERMISSIONS.VIEW_CUSTOMER_DASHBOARD_BILLING]},
                    { path: '/account-overview',permissions: [PERMISSIONS.VIEW_ACCOUNT_OVERVIEW_BILLING]},
                    { path: '/product-details',permissions: [PERMISSIONS.VIEW_PRODUCT_DETAILS_BILLING]},
                    { path: '/billing-history',permissions: [PERMISSIONS.VIEW_BILLING_HISTORY_BILLING]},
                    { path: '/payment-methods',permissions: [PERMISSIONS.VIEW_PAYMENT_METHODS_BILLING]},
                    { path: '/invoices',permissions: [PERMISSIONS.VIEW_INVOICES_BILLING]}
                ]
            },
            {
                path: '/companies',
                permissions: [PERMISSIONS.VIEW_COMPANIES_BILLING],
                children: [
                    { path: '/product-pricing',permissions: [PERMISSIONS.VIEW_PRODUCT_PRICING_COMPANIES_BILLING]}
                ]
            }
        ]
    },

    //gsm services start
    {
        path: '/gsm',
        permissions: [PERMISSIONS.GSM_SERVICES],
        children: [
            {
                path: '/dashboard',
                permissions: [PERMISSIONS.VIEW_GSM_DASHBOARD]
            },
            {
                path: '/list',
                permissions: [PERMISSIONS.VIEW_GSM_MANAGEMENT]
            },
            {
                path: '/assign',
                permissions: [PERMISSIONS.VIEW_GSM_ASSIGNMENT]
            },
            {
                path: '/ports',
                permissions: [PERMISSIONS.VIEW_GSM_PORTS]
            },
            {
                path: '/inbox',
                permissions: [PERMISSIONS.VIEW_GSM_INBOX]
            },
            {
                path: '/sync',
                permissions: [PERMISSIONS.VIEW_GSM_SYNC]
            },
            {
                path: '/company',
                permissions: [PERMISSIONS.VIEW_GSM_COMPANY_PROFILLING],
                children: [
                    { path: '/po',permissions: [PERMISSIONS.VIEW_GSM_COMPANY_PROFILLING]}
                ]
            }
        ]
    },
    

    //DNCR services start
    {
        path: '/dncr',
        permissions: [PERMISSIONS.DNCR_SERVICES],
        children: [
            { path: '/check-number',permissions: ['check-numbers-dncr']}
        ]
    },

    //tms services start
    {
        path: '/tms',
        permissions: [PERMISSIONS.TMS_SERVICES],
        children: [
            { path: '/audit-logs',permissions: [PERMISSIONS.TMS_SERVICES]},
            { path: '/dashboard',permissions: [PERMISSIONS.TMS_SERVICES]},
            { path: '/settings',permissions: [PERMISSIONS.TMS_SERVICES]},
            { path: '/profile',permissions: [PERMISSIONS.TMS_SERVICES]},
            { path: '/unified-ops',permissions: [PERMISSIONS.TMS_SERVICES]},
            { path: '/verification',permissions: [PERMISSIONS.TMS_SERVICES]},
            { 
                path: '/profiling',permissions: [PERMISSIONS.TMS_SERVICES],
                children: [
                    { path: '/customers',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/customers/create',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/user',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/user/create',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { 
                        path: '/logs',permissions: [PERMISSIONS.TMS_SERVICES],
                        children: [
                            { path: '/',permissions: [PERMISSIONS.TMS_SERVICES]}
                        ]
                    },
                ]
            },
            { 
                path: '/management',permissions: [PERMISSIONS.TMS_SERVICES],
                children: [
                    { path: '/users',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { 
                        path: '/rank-permissions',permissions: [PERMISSIONS.TMS_SERVICES],
                        children: [
                            { path: '/',permissions: [PERMISSIONS.TMS_SERVICES]}
                        ]
                    },
                ]
            },
            {
                path: '/cisco-pbx',permissions: [PERMISSIONS.TMS_SERVICES],
                children: [
                    { path: '/app-users',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/users-directory',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/users',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/custom-users',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/facilities-info',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/line',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/phone',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/sip-trunks',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/translation-patterns',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/device-pool',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/locations',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/route-partitions',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/css',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/regions',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/route-pattern',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/remote-destination',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/remote-destination/profile',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/recording-profile',permissions: [PERMISSIONS.TMS_SERVICES]},
                ]
            }

        ]
    },

    //netops services start
    {
        path: '/netops',
        permissions: [PERMISSIONS.NETOPS_SERVICES],
        children: [
            { path: '/test',permissions: [PERMISSIONS.NETOPS_SERVICES]}
        ]
    },

    //cti services start
    {
        path: '/cti',
        permissions: [PERMISSIONS.CTI_SERVICES],
        children: [
            { path: '/',permissions: ['view-cti']},
            { path: '/monitoring',permissions: ['view-cti']},
            { path: '/dialer',permissions: ['dial-call-cti']},

        ]
    },

    //cti services start
    {
        path: '/live-calls',
        permissions: [PERMISSIONS.CTI_SERVICES],
        children: [
            { path: '/',permissions: ['view-cti']},
            { path: '/dialer',permissions: ['dial-call-cti', 'merge-call-cti', 'transfer-call-cti']},

        ]
    }
];

export function getRequiredPermissions(path: string): string[] {
    // Strip query parameters and normalize path
    const pathWithoutQuery = path.split('?')[0];
    const normalizedPath = pathWithoutQuery.endsWith('/') ? pathWithoutQuery.slice(0, -1) : pathWithoutQuery;
    let requiredPermissions: string[] = [];
    let exactMatch = false;

    function traverseRoutes(routes: RoutePermission[], currentPath: string = '') {
        for (const route of routes) {
            const fullPath = `${currentPath}${route.path}`;
            const isExactMatch = normalizedPath === fullPath;
            const hasChildRoute = route.children?.some(child => {
                const childPath = `${fullPath}${child.path}`;
                return normalizedPath === childPath || normalizedPath.startsWith(`${childPath}/`);
            });

            if (isExactMatch || hasChildRoute) {
                exactMatch = true;
                requiredPermissions = [...requiredPermissions, ...route.permissions];
                if (route.children) {
                    traverseRoutes(route.children, fullPath);
                }
            }
        }
    }

    traverseRoutes(routePermissions);
    
    // If no exact match was found in defined routes, return empty array to trigger access denied
    return exactMatch ? Array.from(new Set(requiredPermissions)) : [];
}

// Helper function to check if a path is under any protected route
export function isProtectedPath(path: string): boolean {
    // Strip query parameters and normalize path
    const pathWithoutQuery = path.split('?')[0];
    const normalizedPath = pathWithoutQuery.endsWith('/') ? pathWithoutQuery.slice(0, -1) : pathWithoutQuery;
    
    function checkRoute(routes: RoutePermission[], currentPath: string = ''): boolean {
        for (const route of routes) {
            const fullPath = `${currentPath}${route.path}`;
            
            // If this is a parent route and the path starts with it, consider it protected
            if (normalizedPath.startsWith(fullPath + '/') || normalizedPath === fullPath) {
                return true;
            }

            // Check children routes
            if (route.children && checkRoute(route.children, fullPath)) {
                return true;
            }
        }
        return false;
    }

    return checkRoute(routePermissions);
}

// Helper function to check if user has required permissions
export function hasRequiredPermissions(userPermissions: string[], path: string): boolean {
    const required = getRequiredPermissions(path);
    return required.every(permission => userPermissions.includes(permission));
}