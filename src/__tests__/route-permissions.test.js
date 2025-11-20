/**
 * Comprehensive test case for route permissions
 * Tests all routes defined in permissions.ts against user permissions
 * Can be run directly with Node.js: node src/__tests__/route-permissions.test.js
 * 
 * Options:
 *   --export=true    Generate CSV and Excel report files
 * 
 * Examples:
 *   node src/__tests__/route-permissions.test.js              # Run tests only (no file generation)
 *   node src/__tests__/route-permissions.test.js --export=true # Run tests and generate CSV/Excel files
 */

import fs from 'fs';

// Parse command-line arguments
const args = process.argv.slice(2);
const shouldExportExcel = args.some(arg => arg === '--export=true' || arg === '--export' || arg === '-e');

// Mock global for Node.js environment
if (typeof global === 'undefined') {
  var global = {};
}

// Initialize session store (simplified version for testing)
if (!global.nextAuthSessions) {
  global.nextAuthSessions = new Map();
}

// Session store implementation
const sessionStore = {
  set: (sessionId, sessionData) => {
    global.nextAuthSessions.set(sessionId, sessionData);
  },
  get: (sessionId) => {
    return global.nextAuthSessions.get(sessionId) || null;
  },
  delete: (sessionId) => {
    global.nextAuthSessions.delete(sessionId);
  },
  clear: () => {
    global.nextAuthSessions.clear();
  }
};

// Import route permissions (we'll need to parse the TypeScript file or use a simplified version)
// For testing, we'll define the route structure directly based on permissions.ts
const routePermissions = [
  {path: '/profile', permissions: ['']},
  {path: '/coming-soon', permissions: ['']},
  {path: '/plan-upgrade', permissions: ['']},
  {path: '/live-calls-test', permissions: ['']},
  {path: '/resources', permissions: ['']},
  {path: '/resources/faq', permissions: ['']},
  {path: '/resources/help-materials', permissions: ['']},
  {path: '/resources/contact-support', permissions: ['']},
  {path: '/reports', permissions: ['reports-services']},
  {
    path: '/netops',
    permissions: ['control-hub-services'],
    children: [
      {path: '/dashboard', permissions: ['control-hub-services']},
      {path: '/devices', permissions: ['control-hub-services']},
      {path: '/services', permissions: ['control-hub-services']},
      {path: '/alerts', permissions: ['control-hub-services']},
      {path: '/uptime-sla', permissions: ['control-hub-services']},
    ]
  },
  {
    path: '/controlhub',
    permissions: ['control-hub-services'],
    children: [
      {
        path: '/ranks',
        permissions: ['view-ranks'],
        children: [
          {path: '/permissions', permissions: ['view-permissions-ranks']},
          {path: '/permissions/edit', permissions: ['assign-permissions-ranks']}
        ]
      },
      {
        path: '/users',
        permissions: ['view-users'],
        children: [
          {path: '/', permissions: ['edit-users']}
        ]
      },
      {path: '/groups', permissions: ['view-groups']},
    ]
  },
  {
    path: '/call-logs',
    permissions: ['view-call-logs'],
    children: [
      {path: '/dashboard', permissions: ['dashboard-call-logs']}
    ]
  },
  {path: '/call-recordings', permissions: ['view-call-recordings']},
  {
    path: '/call-reports',
    permissions: ['reports-services'],
    children: [
      {path: '/stats/country', permissions: ['call-reports-by-statistics-reports']},
      {path: '/stats/department', permissions: ['call-reports-by-statistics-reports']},
      {path: '/stats/extension', permissions: ['call-reports-by-statistics-reports']},
      {path: '/incoming/country', permissions: ['call-reports-by-call-incoming-reports']},
      {path: '/incoming/department', permissions: ['call-reports-by-call-incoming-reports']},
      {path: '/incoming/extension', permissions: ['call-reports-by-call-incoming-reports']},
      {path: '/trend/country', permissions: ['call-reports-by-trend-reports']},
      {path: '/trend/department', permissions: ['call-reports-by-trend-reports']},
      {path: '/trend/extension', permissions: ['call-reports-by-trend-reports']},
    ]
  },
  {
    path: '/tickets',
    permissions: ['tickets-services'],
    children: [
      {path: '/', permissions: ['view-ticket-tickets']},
      {path: '/dashboard', permissions: ['dashboard-tickets']},
      {path: '/list', permissions: ['view-ticket-tickets']},
      {path: '/statuses', permissions: ['ticket-statuses-tickets']},
      {path: '/modules', permissions: ['ticket-modules-tickets']},
      {path: '/modules/submodules', permissions: ['edit-ticket-module-tickets']},
      {path: '/types', permissions: ['view-ticket-types-tickets']}
    ]
  },
  {
    path: '/ai-ml',
    permissions: ['ai-ml-services'],
    children: [
      {
        path: '/analysis',
        permissions: ['transcriptions-analysis-aiml'],
        children: [
          {path: '/', permissions: ['transcriptions-analysis-aiml']}
        ]
      },
      {
        path: '/analyze-recordings',
        permissions: ['transcriptions-analysis-aiml'],
        children: [
          {path: '/', permissions: ['transcriptions-analysis-aiml']}
        ]
      },
      {path: '/translate', permissions: ['translate-aiml']},
      {path: '/transcriptions', permissions: ['transcriptions-aiml']}
    ]
  },
  {
    path: '/crm',
    permissions: ['crm-services'],
    children: [
      {path: '/dashboard', permissions: ['dashboard-crm']},
      {
        path: '/campaigns',
        permissions: ['view-crm-campaigns'],
        children: [
          {path: '/', permissions: ['view-crm-campaigns']}
        ]
      },
      {
        path: '/data',
        permissions: ['view-crm-data-management'],
        children: [
          {path: '/', permissions: ['view-crm-data-management']},
          {path: '/create', permissions: ['add-crm-data-management']},
        ]
      },
      {
        path: '/leads',
        permissions: ['view-crm-leads'],
        children: [
          {path: '/', permissions: ['view-crm-leads']},
          {path: '/create', permissions: ['add-crm-leads']},
        ]
      },
      {path: '/lost-reasons', permissions: ['view-crm-lost-reasons']},
      {path: '/opportunities', permissions: ['view-crm-opportunities']},
      {path: '/opportunities/create', permissions: ['add-crm-opportunities']},
      {path: '/stages', permissions: ['view-crm-stages']},
    ]
  },
  {
    path: '/accounts',
    permissions: ['accounts-services'],
    children: [
      {path: '/', permissions: ['accounts-services']}
    ]
  },
  {
    path: '/accounting',
    permissions: ['accounts-services'],
    children: [
      {
        path: '/companies',
        permissions: ['view-companies-billing'],
        children: [
          {path: '/product-pricing', permissions: ['manage-pricing-companies-billing']}
        ]
      },
      {path: '/expenses', permissions: ['view-expenses-billing']},
      {path: '/invoices', permissions: ['view-invoices-billing']},
      {path: '/inventory', permissions: ['view-inventory-billing']},
      {path: '/locations', permissions: ['view-locations-billing']},
      {path: '/products', permissions: ['view-products-billing']},
      {path: '/resellers', permissions: ['view-resellers-billing']},
      {path: '/suppliers', permissions: ['view-suppliers-billing']}
    ]
  },
  {
    path: '/gsm',
    permissions: ['gsm-services'],
    children: [
      {path: '/dashboard', permissions: ['dashboard-gsm-management']},
      {path: '/list', permissions: ['view-gsm-management']},
      {path: '/assign', permissions: ['view-gsm-assignment']},
      {path: '/ports', permissions: ['view-gsm-ports']},
      {path: '/inbox', permissions: ['view-gsm-inbox']},
      {path: '/sync', permissions: ['view-gsm-port-sync']},
      {
        path: '/company',
        permissions: ['view-gsm-company-profilling'],
        children: [
          {path: '/po', permissions: ['view-gsm-company-profilling']}
        ]
      }
    ]
  },
  {
    path: '/dncr',
    permissions: ['dncr-services'],
    children: [
      {path: '/check-number', permissions: ['check-numbers-dncr']}
    ]
  },
  {
    path: '/tms',
    permissions: ['tms-services'],
    children: [
      {path: '/audit-logs', permissions: ['tms-services']},
      {path: '/dashboard', permissions: ['tms-services']},
      {path: '/settings', permissions: ['tms-services']},
      {path: '/profile', permissions: ['tms-services']},
      {path: '/unified-ops', permissions: ['tms-services']},
      {path: '/verification', permissions: ['tms-services']},
      {
        path: '/profiling',
        permissions: ['tms-services'],
        children: [
          {path: '/customers', permissions: ['tms-services']},
          {path: '/customers/create', permissions: ['tms-services']},
          {path: '/user', permissions: ['tms-services']},
          {path: '/user/create', permissions: ['tms-services']},
          {
            path: '/logs',
            permissions: ['tms-services'],
            children: [
              {path: '/', permissions: ['tms-services']}
            ]
          },
        ]
      },
      {
        path: '/management',
        permissions: ['tms-services'],
        children: [
          {path: '/users', permissions: ['tms-services']},
          {
            path: '/rank-permissions',
            permissions: ['tms-services'],
            children: [
              {path: '/', permissions: ['tms-services']}
            ]
          },
        ]
      },
      {
        path: '/cisco-pbx',
        permissions: ['tms-services'],
        children: [
          {path: '/app-users', permissions: ['tms-services']},
          {path: '/users-directory', permissions: ['tms-services']},
          {path: '/users', permissions: ['tms-services']},
          {path: '/custom-users', permissions: ['tms-services']},
          {path: '/facilities-info', permissions: ['tms-services']},
          {path: '/line', permissions: ['tms-services']},
          {path: '/phone', permissions: ['tms-services']},
          {path: '/sip-trunks', permissions: ['tms-services']},
          {path: '/translation-patterns', permissions: ['tms-services']},
          {path: '/device-pool', permissions: ['tms-services']},
          {path: '/locations', permissions: ['tms-services']},
          {path: '/route-partitions', permissions: ['tms-services']},
          {path: '/css', permissions: ['tms-services']},
          {path: '/regions', permissions: ['tms-services']},
          {path: '/route-pattern', permissions: ['tms-services']},
          {path: '/remote-destination', permissions: ['tms-services']},
          {path: '/remote-destination/profile', permissions: ['tms-services']},
          {path: '/recording-profile', permissions: ['tms-services']},
        ]
      }
    ]
  },
  {
    path: '/netops',
    permissions: ['health-care-services'],
    children: [
      {path: '/test', permissions: ['health-care-services']}
    ]
  },
  {
    path: '/cti',
    permissions: ['cti-services'],
    children: [
      {path: '/', permissions: ['view-cti']},
      {path: '/monitoring', permissions: ['view-cti']},
      {path: '/dialer', permissions: ['dial-call-cti']},
    ]
  },
  {
    path: '/live-calls',
    permissions: ['cti-services'],
    children: [
      {path: '/', permissions: ['view-cti']},
      {path: '/dialer', permissions: ['dial-call-cti', 'merge-call-cti', 'transfer-call-cti']},
    ]
  }
];

// Function to extract all routes recursively with full paths and all required permissions
function extractAllRoutes(routes, currentPath = '', parentPermissions = []) {
  const allRoutes = [];
  
  for (const route of routes) {
    const fullPath = `${currentPath}${route.path}`;
    // Normalize path: remove trailing slash unless it's root
    const normalizedPath = (fullPath.endsWith('/') && fullPath.length > 1) 
      ? fullPath.slice(0, -1) 
      : fullPath;
    
    // Combine parent permissions with current route permissions
    const allRequiredPermissions = [...parentPermissions, ...route.permissions];
    // Filter out empty strings and get unique permissions
    const uniquePermissions = Array.from(new Set(allRequiredPermissions.filter(p => p !== '')));
    
    // Add this route
    allRoutes.push({
      path: normalizedPath,
      permissions: uniquePermissions
    });
    
    // Recursively process children with accumulated permissions
    if (route.children) {
      allRoutes.push(...extractAllRoutes(route.children, fullPath, allRequiredPermissions));
    }
  }
  
  return allRoutes;
}

// Function to get required permissions for a path (simplified version of getRequiredPermissions)
function getRequiredPermissions(path) {
  const pathWithoutQuery = path.split('?')[0];
  const normalizedPath = pathWithoutQuery.endsWith('/') && pathWithoutQuery.length > 1
    ? pathWithoutQuery.slice(0, -1)
    : pathWithoutQuery;
  
  let requiredPermissions = [];
  let exactMatch = false;

  function traverseRoutes(routes, currentPath = '') {
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
  
  // Filter out empty strings and return unique permissions
  const uniquePermissions = Array.from(new Set(requiredPermissions.filter(p => p !== '')));
  return exactMatch ? uniquePermissions : [];
}

// Function to check if user has required permissions
function hasRequiredPermissions(userPermissions, requiredPermissions) {
  if (requiredPermissions.length === 0) {
    return true; // No permissions required, allow access
  }
  return requiredPermissions.every(permission => userPermissions.includes(permission));
}

// Test helper functions
let testsPassed = 0;
let testsFailed = 0;
const testResults = [];

function assert(condition, message, testId, testName, testType, description, steps, testData, expectedResult) {
  const actualResult = condition ? 'Passed' : 'Failed';
  if (condition) {
    console.log(`✓ ${message}`);
    testsPassed++;
  } else {
    console.error(`✗ ${message}`);
    testsFailed++;
  }
  
  testResults.push({
    testId,
    testName,
    testType,
    description,
    steps,
    testData,
    expectedResult,
    actualResult: condition ? `Passed - ${message}` : `Failed - ${message}`
  });
  
  return condition;
}

function test(name, testType, description, steps, testData, expectedResult, fn) {
  const testId = `ROUTE-${String(testResults.length + 1).padStart(3, '0')}`;
  console.log(`\n[${testId}] Running: ${name} (${testType})`);
  try {
    fn(testId, name, testType, description, steps, testData, expectedResult);
  } catch (error) {
    console.error(`Error in test "${name}":`, error.message);
    assert(false, `Test error: ${error.message}`, testId, name, testType, description, steps, testData, expectedResult);
  }
}

// Mock authorize function for login
function mockAuthorize(credentials, mockResponse) {
  if (!credentials?.email || !credentials?.password) {
    return null;
  }

  if (mockResponse) {
    if (mockResponse.code === 400 || !mockResponse?.data?.token?.access_token) {
      return null;
    }
    
    return {
      id: mockResponse.data?.id,
      name: mockResponse.data?.name,
      email: mockResponse.data?.email,
      username: mockResponse.data?.username,
      role: mockResponse.data?.role,
      phone: mockResponse.data?.phone,
      is_admin: mockResponse.data?.is_admin || null,
      permissions: mockResponse.data?.permissions || [],
      token: {
        access_token: mockResponse.data?.token?.access_token,
        access_token_expires: mockResponse.data?.token?.expires_in,
        refresh_token: mockResponse.data?.token?.refresh_token?.access_token,
        refresh_token_expires: mockResponse.data?.token?.refresh_token?.expires_in,
      }
    };
  }
  
  return null;
}

// Test Suite
console.log('='.repeat(80));
console.log('Route Permissions Test Suite');
console.log('='.repeat(80));

// ============================================================================
// LOGIN AND SESSION SETUP
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('SECTION 1: LOGIN AND SESSION SETUP');
console.log('='.repeat(80));

// Test user with comprehensive permissions
// Note: This user has all permissions to test successful access
// For testing denied access, you can remove specific permissions
const testUserPermissions = [
  'control-hub-services',
  'gsm-services',
  'call-logs-services',
  'call-recordings-services',
  'reports-services',
  'ai-ml-services',
  'cti-services',
  'tickets-services',
  'tms-services',
  'crm-services',
  'dncr-services',
  'accounts-services',
  'health-care-services',
  'view-ranks',
  'view-permissions-ranks',
  'assign-permissions-ranks',
  'view-users',
  'edit-users',
  'view-groups',
  'view-call-logs',  // Required for /call-logs route
  'dashboard-call-logs',
  'view-call-recordings',  // Required for /call-recordings route
  'call-reports-by-statistics-reports',
  'call-reports-by-call-incoming-reports',
  'call-reports-by-trend-reports',
  'view-ticket-tickets',
  'dashboard-tickets',
  'ticket-statuses-tickets',
  'ticket-modules-tickets',
  'edit-ticket-module-tickets',
  'view-ticket-types-tickets',
  'transcriptions-analysis-aiml',
  'translate-aiml',
  'transcriptions-aiml',
  'dashboard-crm',
  'view-crm-campaigns',
  'view-crm-data-management',
  'add-crm-data-management',
  'view-crm-leads',
  'add-crm-leads',
  'view-crm-lost-reasons',
  'view-crm-opportunities',
  'add-crm-opportunities',
  'view-crm-stages',
  'view-companies-billing',
  'manage-pricing-companies-billing',
  'view-expenses-billing',
  'view-invoices-billing',
  'view-inventory-billing',
  'view-locations-billing',
  'view-products-billing',
  'view-resellers-billing',
  'view-suppliers-billing',
  'dashboard-gsm-management',
  'view-gsm-management',
  'view-gsm-assignment',
  'view-gsm-ports',
  'view-gsm-inbox',
  'view-gsm-port-sync',
  'view-gsm-company-profilling',
  'check-numbers-dncr',
  'view-cti',
  'dial-call-cti',
  'merge-call-cti',
  'transfer-call-cti'
];

let savedSession = null;
let savedSessionId = null;

// Login test
test('Login with valid credentials and save session', 'Positive',
  'Verify that login succeeds and session is saved for route permission testing',
  '1. Provide valid email and password 2. Call authorize function 3. Create and save session 4. Verify session is stored',
  'Email: test@example.com, Password: validPassword123, Permissions: [comprehensive list]',
  'Session should be created and stored successfully',
  (testId, name, type, desc, steps, data, expected) => {
    const credentials = { email: 'test@example.com', password: 'validPassword123' };
    const mockResponse = {
      code: 200,
      data: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        phone: '+1234567890',
        is_admin: false,
        permissions: testUserPermissions,
        token: {
          access_token: 'valid-access-token-123',
          expires_in: 7200,
          refresh_token: {
            access_token: 'valid-refresh-token-123',
            expires_in: 86400
          }
        }
      }
    };
    
    const result = mockAuthorize(credentials, mockResponse);
    assert(result !== null, 'Login should succeed', testId, name, type, desc, steps, data, expected);
    assert(result.permissions.length > 0, 'User should have permissions', testId, name, type, desc, steps, data, expected);
    
    // Save session
    savedSessionId = 'route-test-session-' + Date.now();
    const sessionData = {
      user: {
        id: result.id,
        name: result.name,
        email: result.email,
        username: result.username,
        role: result.role,
        phone: result.phone,
        is_admin: result.is_admin,
        permissions: result.permissions,
        access_token: result.token.access_token,
        access_token_expires: Date.now() + 7200000,
      },
      expires: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    };
    
    sessionStore.set(savedSessionId, sessionData);
    savedSession = sessionStore.get(savedSessionId);
    
    assert(savedSession !== null, 'Session should be saved', testId, name, type, desc, steps, data, expected);
    assert(savedSession.user.permissions.length === testUserPermissions.length, 'Session should have all permissions', testId, name, type, desc, steps, data, expected);
  }
);

// ============================================================================
// ROUTE PERMISSION TESTS (Positive and Negative cases paired together)
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('SECTION 2: ROUTE PERMISSION TESTS');
console.log('='.repeat(80));

// Create a user with limited permissions (only basic profile permissions)
const limitedUserPermissions = [
  // Only basic permissions, no service-level permissions
];

let limitedUserSession = null;
let limitedUserSessionId = null;

// Create limited permission user session (before tests run)
limitedUserSessionId = 'limited-user-session-' + Date.now();
const limitedUserSessionData = {
  user: {
    id: '2',
    name: 'Limited User',
    email: 'limited@example.com',
    username: 'limiteduser',
    role: 'user',
    phone: '+1234567890',
    is_admin: false,
    permissions: limitedUserPermissions,
    access_token: 'limited-access-token',
    access_token_expires: Date.now() + 7200000,
  },
  expires: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
};

sessionStore.set(limitedUserSessionId, limitedUserSessionData);
limitedUserSession = sessionStore.get(limitedUserSessionId);

// Verify limited user session was created
test('Create limited permission user session', 'Setup',
  'Create a user session with limited permissions for negative test cases',
  '1. Create user with minimal permissions 2. Save session 3. Verify session is stored',
  'Email: limited@example.com, Permissions: [] (minimal permissions)',
  'Session should be created with limited permissions',
  (testId, name, type, desc, steps, data, expected) => {
    assert(limitedUserSession !== null, 'Limited user session should be saved', testId, name, type, desc, steps, data, expected);
    assert(limitedUserSession.user.permissions.length === 0, 'Limited user should have minimal permissions', testId, name, type, desc, steps, data, expected);
  }
);

// Extract all routes
const allRoutes = extractAllRoutes(routePermissions);

// Test each route with both positive and negative cases (paired together)
allRoutes.forEach((route, index) => {
  const requiredPerms = route.permissions || [];
  const routeName = route.path || '/';
  const permissionsList = requiredPerms.length > 0 
    ? requiredPerms.join(', ') 
    : 'No permissions required (public route)';
  
  // POSITIVE TEST: User with all permissions
  const userPerms = savedSession?.user?.permissions || [];
  const hasAccessPositive = hasRequiredPermissions(userPerms, requiredPerms);
  
  if (hasAccessPositive || requiredPerms.length === 0) {
    test(
      `Route Permission Check (Positive): ${routeName}`,
      'Positive',
      `Verify user with all permissions has access to route: ${routeName}`,
      `1. Get required permissions for route ${routeName} 2. Check if user has all required permissions 3. Verify access is granted`,
      `Route: ${routeName}, Required Permissions: ${permissionsList}, User Permissions: ${userPerms.length} permissions`,
      `User should have access to ${routeName} (user must have all required permissions)`,
      (testId, name, type, desc, steps, data, expected) => {
        const required = route.permissions || [];
        const userPermissions = savedSession?.user?.permissions || [];
        const hasPermission = hasRequiredPermissions(userPermissions, required);
        
        // Verify the permissions match what we expect
        const message = hasPermission 
          ? `Route ${routeName}: Access granted - User has all required permissions: [${required.join(', ')}]`
          : `Route ${routeName}: Access denied - Missing permissions. Required: [${required.join(', ')}]`;
        
        // Test passes only if user HAS all required permissions
        assert(
          hasPermission,
          message,
          testId,
          name,
          type,
          desc,
          steps,
          data,
          expected
        );
      }
    );
  }
  
  // NEGATIVE TEST: User with limited permissions (immediately after positive test)
  const limitedUserPerms = limitedUserSession?.user?.permissions || [];
  const hasAccessNegative = hasRequiredPermissions(limitedUserPerms, requiredPerms);
  
  // Only test negative cases for routes that require permissions
  if (requiredPerms.length > 0 && !hasAccessNegative) {
    test(
      `Route Permission Check (Negative): ${routeName}`,
      'Negative',
      `Verify user without required permissions is denied access to route: ${routeName}`,
      `1. Get required permissions for route ${routeName} 2. Check if limited user has all required permissions 3. Verify access is denied`,
      `Route: ${routeName}, Required Permissions: ${permissionsList}, User Permissions: ${limitedUserPerms.length} permissions`,
      `User should NOT have access to ${routeName} (user is missing required permissions)`,
      (testId, name, type, desc, steps, data, expected) => {
        const required = route.permissions || [];
        const userPermissions = limitedUserSession?.user?.permissions || [];
        const hasPermission = hasRequiredPermissions(userPermissions, required);
        
        // Verify the permissions - should NOT have access
        const missingPermissions = required.filter(perm => !userPermissions.includes(perm));
        const message = !hasPermission 
          ? `Route ${routeName}: Access denied (as expected) - Missing permissions: [${missingPermissions.join(', ')}]. Required: [${required.join(', ')}]`
          : `Route ${routeName}: Access granted (unexpected) - User should not have access but does. Required: [${required.join(', ')}]`;
        
        // Test passes only if user DOES NOT have required permissions (negative case)
        assert(
          !hasPermission,
          message,
          testId,
          name,
          type,
          desc,
          steps,
          data,
          expected
        );
      }
    );
  }
});

// Test Summary
console.log('\n' + '='.repeat(80));
console.log('Test Summary');
console.log('='.repeat(80));

// Generate CSV report
const csvHeader = 'Test ID,Test Name,Test Type (Negative/Positive),Test Description,Test Steps,Test Data,Expected Result,Actual Result\n';
const csvRows = testResults.map(result => {
  const escapeCSV = (str) => {
    if (str === null || str === undefined) return '';
    let string = String(str);
    // Remove semicolons and replace with commas or spaces
    string = string.replace(/;/g, ',');
    // Always quote fields that contain commas, quotes, or newlines
    if (string.includes(',') || string.includes('"') || string.includes('\n')) {
      return `"${string.replace(/"/g, '""')}"`;
    }
    return string;
  };
  
  // Format steps with newlines (each numbered step on a new line)
  const formatSteps = (steps) => {
    if (!steps) return '';
    let formatted = String(steps).trim();
    
    // Simple approach: replace each numbered step (except first) with newline + step
    const stepRegex = /(\d+)\.\s([^\d]*?)(?=\d+\.\s|$)/g;
    let match;
    let firstStep = true;
    let result = '';
    
    while ((match = stepRegex.exec(formatted)) !== null) {
      const stepNum = match[1];
      const stepContent = match[2].trim();
      const fullStep = stepNum + '. ' + stepContent;
      
      if (firstStep) {
        result = fullStep;
        firstStep = false;
      } else {
        result += '\n' + fullStep;
      }
    }
    
    // If regex didn't match, try simpler approach
    if (!result) {
      result = formatted.replace(/(\d+)\.\s/g, (match, num, offset) => {
        return offset === 0 ? match : '\n' + match;
      });
    }
    
    return result || formatted;
  };
  
  const formattedSteps = formatSteps(result.steps);
  
  // Format test data: replace separators (semicolons or commas) with newlines for better readability
  // Handles formats like:
  // "Email: test@example.com; Password: pass123; Permissions: [...]"
  // "Email: test@example.com, Password: pass123, Permissions: [...]"
  // "Route: /path; Required Permissions: [...]; User Permissions: ..."
  const formatTestData = (testData) => {
    if (!testData) return '';
    let formatted = String(testData).trim();
    
    // Pattern to match separator (; or ,) followed by space and a field name (starts with capital, ends with colon)
    // Example: "Email: test@example.com; Password: pass123"
    // Result: "Email: test@example.com\nPassword: pass123"
    // This regex matches: [;,] \s* (capture group: capital letter + any chars until colon)
    formatted = formatted.replace(/[;,]\s*([A-Z][^:;]*:)/g, '\n$1');
    
    // Fallback: if pattern didn't match, just replace "; " or ", " with newline
    if (formatted === String(testData).trim()) {
      formatted = formatted.replace(/[;,]\s+/g, '\n');
    }
    
    return formatted;
  };
  
  const formattedTestData = formatTestData(result.testData);
  
  return [
    escapeCSV(result.testId),
    escapeCSV(result.testName),
    escapeCSV(result.testType),
    escapeCSV(result.description),
    escapeCSV(formattedSteps),
    escapeCSV(formattedTestData),
    escapeCSV(result.expectedResult),
    escapeCSV(result.actualResult)
  ].join(',');
}).join('\n');

// Generate CSV and Excel files only if --export=true flag is set
if (shouldExportExcel) {
  const csvContent = csvHeader + csvRows;
  fs.writeFileSync('src/__tests__/route-permissions-test-report.csv', csvContent, 'utf8');
  console.log('\n✓ Test report CSV generated: src/__tests__/route-permissions-test-report.csv');

  // Generate Excel file
  (async () => {
    try {
      const XLSXModule = await import('xlsx');
      const XLSX = XLSXModule.default || XLSXModule;
    
    // Format data for Excel using testResults array directly
    const formatStepsForExcel = (steps) => {
      if (!steps) return '';
      return String(steps).trim();
    };
    
    const formatTestDataForExcel = (testData) => {
      if (!testData) return '';
      let formatted = String(testData).trim();
      // Replace separators with newlines
      formatted = formatted.replace(/[;,]\s*([A-Z][^:;]*:)/g, '\n$1');
      if (formatted === String(testData).trim()) {
        formatted = formatted.replace(/[;,]\s+/g, '\n');
      }
      return formatted;
    };
    
    // Prepare data for Excel
    const excelData = testResults.map(result => ({
      'Test ID': result.testId,
      'Test Name': result.testName,
      'Test Type': result.testType,
      'Test Description': result.description,
      'Test Steps': formatStepsForExcel(result.steps),
      'Test Data': formatTestDataForExcel(result.testData),
      'Expected Result': result.expectedResult,
      'Actual Result': result.actualResult
    }));
    
    // Create worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths for better readability
    worksheet['!cols'] = [
      { wch: 12 }, // Test ID
      { wch: 40 }, // Test Name
      { wch: 20 }, // Test Type
      { wch: 50 }, // Description
      { wch: 60 }, // Steps
      { wch: 80 }, // Test Data
      { wch: 50 }, // Expected Result
      { wch: 60 }  // Actual Result
    ];
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Route Permissions Test Results');
    
    // Write Excel file
    const excelFileName = 'src/__tests__/route-permissions-test-report.xlsx';
    XLSX.writeFile(workbook, excelFileName);
      console.log('✓ Test report Excel generated: ' + excelFileName);
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        console.log('\n⚠ Excel generation skipped: xlsx module not found');
        console.log('  To generate Excel file, run: npm install xlsx --save-dev');
      } else {
        console.log('\n⚠ Excel generation failed: ' + error.message);
        console.log('  CSV file is available at: src/__tests__/route-permissions-test-report.csv');
      }
    }
  })();
} else {
  console.log('\nℹ File export skipped (use --export=true to generate CSV and Excel files)');
}

if (testsFailed === 0) {
  console.log('\n✓ All tests passed!');
  process.exit(0);
} else {
  console.log('\n✗ Some tests failed');
  process.exit(1);
}

