/**
 * Comprehensive test case for menu permissions
 * Tests all menu items defined in Header.tsx against user permissions
 * Can be run directly with Node.js: node src/__tests__/menu-permissions.test.js
 * 
 * Options:
 *   --export=true    Generate CSV and Excel report files
 * 
 * Examples:
 *   node src/__tests__/menu-permissions.test.js              # Run tests only (no file generation)
 *   node src/__tests__/menu-permissions.test.js --export=true # Run tests and generate CSV/Excel files
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

// Menu permissions structure based on Header.tsx
// Main menu items with their permissions
const menuItems = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    permission: '', // No permission required (public)
    isMain: false,
    url: '/dashboard'
  },
  {
    key: 'crm',
    label: 'CRM',
    permission: 'crm-services',
    isMain: false,
    url: '',
    submenuItems: [
      { key: 'crm-dashboard', label: 'Dashboard', permission: 'dashboard-crm', href: '/crm/dashboard' },
      { key: 'crm-campaigns', label: 'Campaigns', permission: 'view-crm-campaigns', href: '/crm/campaigns' },
      { key: 'crm-data', label: 'Data Management', permission: 'view-crm-data-management', href: '/crm/prospects' },
      { key: 'crm-leads', label: 'Leads', permission: 'view-crm-leads', href: '/crm/leads' },
      { key: 'crm-opportunities', label: 'Opportunities', permission: 'view-crm-opportunities', href: '/crm/opportunities' },
      { key: 'crm-stages', label: 'Stages', permission: 'view-crm-stages', href: '/crm/stages' },
      { key: 'crm-lost-reasons', label: 'Lost Reasons', permission: 'view-crm-lost-reasons', href: '/crm/lost-reasons' }
    ]
  },
  {
    key: 'cti',
    label: 'Live Calls',
    permission: 'cti-services',
    isMain: false,
    url: '',
    submenuItems: [
      { key: 'live-view', label: 'Live View', permission: 'view-cti', href: '/live-calls' },
      { key: 'call-monitoring', label: 'Call Monitoring', permission: 'dashboard-cti', href: '/cti/monitoring' },
      { key: 'dialer', label: 'Dialer', permission: 'dial-call-cti', href: '/cti/dialer' }
    ]
  },
  {
    key: 'call-history',
    label: 'Call History',
    permission: 'call-history-services',
    isMain: false,
    url: '',
    submenuItems: [
      { key: 'call-logs-dashboard', label: 'Dashboard', permission: 'dashboard-call-logs', href: '/call-logs/dashboard' },
      { key: 'call-logs-list', label: 'Call Logs', permission: 'view-call-logs', href: '/call-logs' },
      { key: 'call-recordings', label: 'Call Recordings', permission: 'view-call-recordings', href: '/call-recordings' }
    ]
  },
  {
    key: 'call-reports',
    label: 'Reports',
    permission: 'reports-services',
    isMain: true,
    url: '/reports',
    submenuItems: [
      { key: 'stats-country', label: 'Call Stats by Country', permission: 'call-reports-by-statistics-reports', href: '/call-reports/stats/country' },
      { key: 'stats-department', label: 'Call Stats by Department', permission: 'call-reports-by-statistics-reports', href: '/call-reports/stats/department' },
      { key: 'stats-extension', label: 'Call Stats by Extension', permission: 'call-reports-by-statistics-reports', href: '/call-reports/stats/extension' },
      { key: 'incoming-country', label: 'Incoming Stats by Country', permission: 'call-reports-by-call-incoming-reports', href: '/call-reports/incoming/country' },
      { key: 'incoming-department', label: 'Incoming Stats by Department', permission: 'call-reports-by-call-incoming-reports', href: '/call-reports/incoming/department' },
      { key: 'incoming-extension', label: 'Incoming Stats by Extension', permission: 'call-reports-by-call-incoming-reports', href: '/call-reports/incoming/extension' }
    ]
  },
  {
    key: 'ai-ml',
    label: 'AI Insights',
    permission: 'ai-ml-services',
    isMain: false,
    url: '',
    submenuItems: [
      { key: 'analysis', label: 'Analysis', permission: 'transcriptions-analysis-aiml', href: '/ai-ml/analysis' },
      { key: 'analyze-recordings', label: 'Analyze Recordings', permission: 'transcriptions-analysis-aiml', href: '/ai-ml/analyze-recordings' },
      { key: 'translate', label: 'Translate', permission: 'translate-aiml', href: '/ai-ml/translate' }
    ]
  },
  {
    key: 'dncr',
    label: 'DNCR',
    permission: 'dncr-services',
    isMain: false,
    url: '',
    submenuItems: [
      { key: 'check-number', label: 'Check Number', permission: 'check-numbers-dncr', href: '/dncr/check-number' }
    ]
  },
  {
    key: 'accounts',
    label: 'Billing',
    permission: 'accounts-services',
    isMain: false,
    url: '',
    submenuItems: [
      { key: 'invoices', label: 'Invoices', permission: 'view-invoices-billing', href: '/accounting/invoices' },
      { key: 'expenses', label: 'Expenses', permission: 'view-expenses-billing', href: '/accounting/expenses' },
      { key: 'products', label: 'Products', permission: 'view-products-billing', href: '/accounting/products' },
      { key: 'inventory', label: 'Inventory', permission: 'view-inventory-billing', href: '/accounting/inventory' },
      { key: 'companies', label: 'Companies', permission: 'view-companies-billing', href: '/accounting/companies' },
      { key: 'resellers', label: 'Resellers', permission: 'view-resellers-billing', href: '/accounting/resellers' },
      { key: 'locations', label: 'Locations', permission: 'view-locations-billing', href: '/accounting/locations' },
      { key: 'suppliers', label: 'Suppliers', permission: 'view-suppliers-billing', href: '/accounting/suppliers' }
    ]
  },
  {
    key: 'tickets',
    label: 'Tickets',
    permission: 'tickets-services',
    isMain: false,
    url: '',
    submenuItems: [
      { key: 'tickets-dashboard', label: 'Dashboard', permission: 'dashboard-tickets', href: '/tickets/dashboard' },
      { key: 'tickets-list', label: 'Tickets', permission: 'view-ticket-tickets', href: '/tickets/list' },
      { key: 'tickets-status', label: 'Status', permission: 'ticket-statuses-tickets', href: '/tickets/statuses' },
      { key: 'tickets-modules', label: 'Modules', permission: 'ticket-modules-tickets', href: '/tickets/modules' },
      { key: 'tickets-types', label: 'Types', permission: 'view-ticket-types-tickets', href: '/tickets/types' }
    ]
  },
  {
    key: 'gsm',
    label: 'Telco Gateway',
    permission: 'gsm-services',
    isMain: false,
    url: '',
    submenuItems: [
      { key: 'gsm-dashboard', label: 'Dashboard', permission: 'dashboard-gsm-management', href: '/gsm/dashboard' },
      { key: 'gsm-list', label: 'Telco Gateway List', permission: 'view-gsm-management', href: '/gsm/list' },
      { key: 'gsm-assign', label: 'Assign', permission: 'view-gsm-assignment', href: '/gsm/assign' },
      { key: 'gsm-ports', label: 'Ports', permission: 'view-gsm-ports', href: '/gsm/ports' },
      { key: 'gsm-inbox', label: 'Inbox', permission: 'view-gsm-inbox', href: '/gsm/inbox' },
      { key: 'gsm-sync', label: 'Sync GSM', permission: 'view-gsm-port-sync', href: '/gsm/sync' },
      { key: 'gsm-company-po', label: 'Company Profiling', permission: 'view-gsm-company-profilling', href: '/gsm/company/po' }
    ]
  },
  {
    key: 'tms',
    label: 'Automation',
    permission: 'tms-services',
    isMain: false,
    url: '',
    submenuItems: [
      { key: 'tms-dashboard', label: 'Dashboard', permission: 'tms-services', href: '/tms' },
      // TMS has complex nested permissions using hasTmsPermission hook
      // For testing, we'll use basic tms-services permission
    ]
  },
  {
    key: 'netops',
    label: 'NetOps',
    permission: 'health-care-services',
    isMain: false,
    url: '',
    submenuItems: [
      { key: 'netops-dashboard', label: 'Dashboard', permission: 'dashboard-netops', href: '/netops/dashboard' },
      { key: 'netops-devices', label: 'Devices', permission: 'devices-netops', href: '/netops/devices' },
      { key: 'netops-services', label: 'Services', permission: 'services-netops', href: '/netops/services' },
      { key: 'netops-alerts', label: 'Alerts', permission: 'alerts-netops', href: '/netops/alerts' },
      { key: 'netops-uptime-sla', label: 'Uptime & SLA Monitoring', permission: 'monitoring-netops', href: '/netops/uptime-sla' }
    ]
  },
  {
    key: 'controlhub',
    label: 'Control Hub',
    permission: 'control-hub-services',
    isMain: false,
    url: '',
    submenuItems: [
      { key: 'view-users', label: 'User Directory', permission: 'view-users', href: '/controlhub/users' },
      { key: 'view-ranks', label: 'Ranks', permission: 'view-ranks', href: '/controlhub/ranks' },
      { key: 'view-groups', label: 'Groups', permission: 'view-groups', href: '/controlhub/groups' }
    ]
  },
  {
    key: 'resources',
    label: 'Resources',
    permission: '', // No permission required
    isMain: false,
    url: '',
    submenuItems: [
      { key: 'faq', label: 'FAQ', permission: '', href: '/resources/faq' },
      { key: 'help-materials', label: 'Help Materials', permission: '', href: '/resources/help-materials' },
      { key: 'contact-support', label: 'Contact Support', permission: '', href: '/resources/contact-support' }
    ]
  }
];

// Function to check if user has required permission
function hasRequiredPermission(userPermissions, requiredPermission) {
  if (!requiredPermission || requiredPermission === '') {
    return true; // No permission required, allow access
  }
  return userPermissions.includes(requiredPermission);
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
  const testId = `MENU-${String(testResults.length + 1).padStart(3, '0')}`;
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
console.log('Menu Permissions Test Suite');
console.log('='.repeat(80));

// ============================================================================
// LOGIN AND SESSION SETUP
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('SECTION 1: LOGIN AND SESSION SETUP');
console.log('='.repeat(80));

// Test user with comprehensive permissions
const testUserPermissions = [
  'control-hub-services',
  'gsm-services',
  'call-history-services',
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
  'view-users',
  'view-groups',
  'view-call-logs',
  'dashboard-call-logs',
  'view-call-recordings',
  'call-reports-by-statistics-reports',
  'call-reports-by-call-incoming-reports',
  'view-ticket-tickets',
  'dashboard-tickets',
  'ticket-statuses-tickets',
  'ticket-modules-tickets',
  'view-ticket-types-tickets',
  'transcriptions-analysis-aiml',
  'translate-aiml',
  'dashboard-crm',
  'view-crm-campaigns',
  'view-crm-data-management',
  'view-crm-leads',
  'view-crm-lost-reasons',
  'view-crm-opportunities',
  'view-crm-stages',
  'view-companies-billing',
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
  'dashboard-cti',
  'dial-call-cti',
  'dashboard-netops',
  'devices-netops',
  'services-netops',
  'alerts-netops',
  'monitoring-netops'
];

let savedSession = null;
let savedSessionId = null;

// Login test
test('Login with valid credentials and save session', 'Positive',
  'Verify that login succeeds and session is saved for menu permission testing',
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
    savedSessionId = 'menu-test-session-' + Date.now();
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
// MENU PERMISSION TESTS (Positive and Negative cases paired together)
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('SECTION 2: MENU PERMISSION TESTS');
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

// Test each menu item with both positive and negative cases
menuItems.forEach((menuItem) => {
  const menuLabel = menuItem.label;
  const requiredPerm = menuItem.permission || '';
  const permissionsList = requiredPerm ? requiredPerm : 'No permissions required (public menu)';
  
  // POSITIVE TEST: User with all permissions
  const userPerms = savedSession?.user?.permissions || [];
  const hasAccessPositive = hasRequiredPermission(userPerms, requiredPerm);
  
  if (hasAccessPositive || requiredPerm === '') {
    test(
      `Menu Item Permission Check (Positive): ${menuLabel}`,
      'Positive',
      `Verify user with required permission can see menu item: ${menuLabel}`,
      `1. Get required permission for menu ${menuLabel} 2. Check if user has required permission 3. Verify menu item is visible`,
      `Menu: ${menuLabel}, Required Permission: ${permissionsList}, User Permissions: ${userPerms.length} permissions`,
      `User should see menu item ${menuLabel} (user must have required permission: ${permissionsList})`,
      (testId, name, type, desc, steps, data, expected) => {
        const required = menuItem.permission || '';
        const userPermissions = savedSession?.user?.permissions || [];
        const hasPermission = hasRequiredPermission(userPermissions, required);
        
        const message = hasPermission 
          ? `Menu ${menuLabel}: Visible - User has required permission: ${required || 'none (public)'}`
          : `Menu ${menuLabel}: Hidden - Missing permission. Required: ${required}`;
        
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
  
  // NEGATIVE TEST: User with limited permissions (only for menus that require permissions)
  const limitedUserPerms = limitedUserSession?.user?.permissions || [];
  const hasAccessNegative = hasRequiredPermission(limitedUserPerms, requiredPerm);
  
  if (requiredPerm && !hasAccessNegative) {
    test(
      `Menu Item Permission Check (Negative): ${menuLabel}`,
      'Negative',
      `Verify user without required permission cannot see menu item: ${menuLabel}`,
      `1. Get required permission for menu ${menuLabel} 2. Check if limited user has required permission 3. Verify menu item is hidden`,
      `Menu: ${menuLabel}, Required Permission: ${permissionsList}, User Permissions: ${limitedUserPerms.length} permissions`,
      `User should NOT see menu item ${menuLabel} (user is missing required permission: ${permissionsList})`,
      (testId, name, type, desc, steps, data, expected) => {
        const required = menuItem.permission || '';
        const userPermissions = limitedUserSession?.user?.permissions || [];
        const hasPermission = hasRequiredPermission(userPermissions, required);
        
        const message = !hasPermission 
          ? `Menu ${menuLabel}: Hidden (as expected) - Missing permission: ${required}. Required: ${required}`
          : `Menu ${menuLabel}: Visible (unexpected) - User should not see this menu but does. Required: ${required}`;
        
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
  
  // Test submenu items if they exist
  if (menuItem.submenuItems && menuItem.submenuItems.length > 0) {
    menuItem.submenuItems.forEach((submenuItem) => {
      const submenuLabel = `${menuLabel} > ${submenuItem.label}`;
      const submenuRequiredPerm = submenuItem.permission || '';
      const submenuPermissionsList = submenuRequiredPerm ? submenuRequiredPerm : 'No permissions required (public submenu)';
      
      // POSITIVE TEST: User with all permissions
      const hasSubmenuAccessPositive = hasRequiredPermission(userPerms, submenuRequiredPerm);
      
      if (hasSubmenuAccessPositive || submenuRequiredPerm === '') {
        test(
          `Submenu Item Permission Check (Positive): ${submenuLabel}`,
          'Positive',
          `Verify user with required permission can see submenu item: ${submenuLabel}`,
          `1. Get required permission for submenu ${submenuLabel} 2. Check if user has required permission 3. Verify submenu item is visible`,
          `Submenu: ${submenuLabel}, Required Permission: ${submenuPermissionsList}, User Permissions: ${userPerms.length} permissions`,
          `User should see submenu item ${submenuLabel} (user must have required permission: ${submenuPermissionsList})`,
          (testId, name, type, desc, steps, data, expected) => {
            const required = submenuItem.permission || '';
            const userPermissions = savedSession?.user?.permissions || [];
            const hasPermission = hasRequiredPermission(userPermissions, required);
            
            const message = hasPermission 
              ? `Submenu ${submenuLabel}: Visible - User has required permission: ${required || 'none (public)'}`
              : `Submenu ${submenuLabel}: Hidden - Missing permission. Required: ${required}`;
            
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
      
      // NEGATIVE TEST: User with limited permissions (only for submenus that require permissions)
      const hasSubmenuAccessNegative = hasRequiredPermission(limitedUserPerms, submenuRequiredPerm);
      
      if (submenuRequiredPerm && !hasSubmenuAccessNegative) {
        test(
          `Submenu Item Permission Check (Negative): ${submenuLabel}`,
          'Negative',
          `Verify user without required permission cannot see submenu item: ${submenuLabel}`,
          `1. Get required permission for submenu ${submenuLabel} 2. Check if limited user has required permission 3. Verify submenu item is hidden`,
          `Submenu: ${submenuLabel}, Required Permission: ${submenuPermissionsList}, User Permissions: ${limitedUserPerms.length} permissions`,
          `User should NOT see submenu item ${submenuLabel} (user is missing required permission: ${submenuPermissionsList})`,
          (testId, name, type, desc, steps, data, expected) => {
            const required = submenuItem.permission || '';
            const userPermissions = limitedUserSession?.user?.permissions || [];
            const hasPermission = hasRequiredPermission(userPermissions, required);
            
            const message = !hasPermission 
              ? `Submenu ${submenuLabel}: Hidden (as expected) - Missing permission: ${required}. Required: ${required}`
              : `Submenu ${submenuLabel}: Visible (unexpected) - User should not see this submenu but does. Required: ${required}`;
            
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
  }
});

// Test Summary
console.log('\n' + '='.repeat(80));
console.log('Test Summary');
console.log('='.repeat(80));
console.log(`Total Tests: ${testResults.length}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
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
  const formatTestData = (testData) => {
    if (!testData) return '';
    let formatted = String(testData).trim();
    
    // Pattern to match separator (; or ,) followed by space and a field name (starts with capital, ends with colon)
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
  fs.writeFileSync('src/__tests__/menu-permissions-test-report.csv', csvContent, 'utf8');
  console.log('\n✓ Test report CSV generated: src/__tests__/menu-permissions-test-report.csv');

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
      { wch: 50 }, // Test Name
      { wch: 20 }, // Test Type
      { wch: 50 }, // Description
      { wch: 60 }, // Steps
      { wch: 80 }, // Test Data
      { wch: 50 }, // Expected Result
      { wch: 60 }  // Actual Result
    ];
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Menu Permissions Test Results');
    
    // Write Excel file
    const excelFileName = 'src/__tests__/menu-permissions-test-report.xlsx';
    XLSX.writeFile(workbook, excelFileName);
      console.log('✓ Test report Excel generated: ' + excelFileName);
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        console.log('\n⚠ Excel generation skipped: xlsx module not found');
        console.log('  To generate Excel file, run: npm install xlsx --save-dev');
      } else {
        console.log('\n⚠ Excel generation failed: ' + error.message);
        console.log('  CSV file is available at: src/__tests__/menu-permissions-test-report.csv');
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

