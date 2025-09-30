export interface RoutePermission {
    path: string;
    permissions: string[];
    children?: RoutePermission[];
}

// Define all route permissions in a hierarchical structure
export const routePermissions: RoutePermission[] = [
    {
        path: '/controlhub',
        permissions: ['control-hub-services'],
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
            // {
            //     path: '/groups',
            //     permissions: ['view-groups']
            // },
            // Add other controlhub routes here
        ]
    }
];

export function getRequiredPermissions(path: string): string[] {
    const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;
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
    
    // If no exact match was found, return empty array to trigger access denied
    return exactMatch ? Array.from(new Set(requiredPermissions)) : [];
}

// Helper function to check if user has required permissions
export function hasRequiredPermissions(userPermissions: string[], path: string): boolean {
    const required = getRequiredPermissions(path);
    return required.every(permission => userPermissions.includes(permission));
}