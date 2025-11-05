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

    {path: '/reports',permissions: [PERMISSIONS.REPORTS_SERVICES]},
    {path: '/billing',permissions: [PERMISSIONS.REPORTS_SERVICES]},
    {path: '/reseller',permissions: [PERMISSIONS.REPORTS_SERVICES]},
    {path: '/vendor',permissions: [PERMISSIONS.REPORTS_SERVICES]},
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
                path: '/modules/submodules',
                permissions: ['ticket-modules-tickets']
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
                path: '/analyse-recordings',
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
            }
        ]
    },

    //crm services start
    {
        path: '/crm',
        permissions: [PERMISSIONS.CRM_SERVICES],
        children: [
            { 
                path: '/dashboard',permissions: [PERMISSIONS.CRM_SERVICES]
            },
            { 
                path: '/campaigns',permissions: [PERMISSIONS.CRM_SERVICES],
                children: [
                    { path: '/',permissions: [PERMISSIONS.CRM_SERVICES]}
                ]
            },
            { 
                path: '/data',permissions: [PERMISSIONS.CRM_SERVICES],
                children: [
                    { path: '/',permissions: [PERMISSIONS.CRM_SERVICES]},
                    { path: '/create',permissions: [PERMISSIONS.CRM_SERVICES]},
                ]
            },
            { 
                path: '/leads',permissions: [PERMISSIONS.CRM_SERVICES],
                children: [
                    { path: '/',permissions: [PERMISSIONS.CRM_SERVICES]},
                    { path: '/create',permissions: [PERMISSIONS.CRM_SERVICES]},
                ]
            },
            { path: '/lost-reasons',permissions: [PERMISSIONS.CRM_SERVICES]},
            { path: '/opportunities',permissions: [PERMISSIONS.CRM_SERVICES]},
            { path: '/opportunities/create',permissions: [PERMISSIONS.CRM_SERVICES]},
            { path: '/stages',permissions: [PERMISSIONS.CRM_SERVICES]},
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
                path: '/companies',
                permissions: [PERMISSIONS.ACCOUNTS_SERVICES],
                children: [
                    { path: '/product-pricing',permissions: [PERMISSIONS.ACCOUNTS_SERVICES]}
                ]
            },
            {
                path: '/expenses',
                permissions: [PERMISSIONS.ACCOUNTS_SERVICES]
            },
            {
                path: '/invoices',
                permissions: [PERMISSIONS.ACCOUNTS_SERVICES]
            },
            {
                path: '/inventory',
                permissions: [PERMISSIONS.ACCOUNTS_SERVICES]
            },
            {
                path: '/locations',
                permissions: [PERMISSIONS.ACCOUNTS_SERVICES]
            },
            {
                path: '/products',
                permissions: [PERMISSIONS.ACCOUNTS_SERVICES]
            },
            {
                path: '/resellers',
                permissions: [PERMISSIONS.ACCOUNTS_SERVICES]
            },
            {
                path: '/suppliers',
                permissions: [PERMISSIONS.ACCOUNTS_SERVICES]
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
                permissions: ['dashboard-gsm-management']
            },
            {
                path: '/list',
                permissions: ['view-gsm-management']
            },
            {
                path: '/assign',
                permissions: ['view-gsm-assignment']
            },
            {
                path: '/ports',
                permissions: ['view-gsm-ports']
            },
            {
                path: '/inbox',
                permissions: ['view-gsm-inbox']
            },
            {
                path: '/sync',
                permissions: ['view-gsm-port-sync']
            },
            {
                path: '/company',
                permissions: ['view-gsm-company-profilling'],
                children: [
                    { path: '/po',permissions: ['view-gsm-company-profilling']}
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
            { path: '/dialer',permissions: ['dial-call-cti']},

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