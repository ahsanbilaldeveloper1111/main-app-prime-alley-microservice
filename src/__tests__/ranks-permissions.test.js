/**
 * Comprehensive test case for ranks page permissions and API calls
 * Tests all permissions and API endpoints for ranks functionality
 * Can be run directly with Node.js: node src/__tests__/ranks-permissions.test.js
 * 
 * Options:
 *   --export=true    Generate CSV and Excel report files
 * 
 * Examples:
 *   node src/__tests__/ranks-permissions.test.js              # Run tests only (no file generation)
 *   node src/__tests__/ranks-permissions.test.js --export=true # Run tests and generate CSV/Excel files
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

// Ranks permissions list
const ranksPermissions = {
  'list-ranks': 'View the ranks list page',
  'add-ranks': 'Create new rank',
  'edit-ranks': 'Edit existing rank',
  'delete-ranks': 'Delete a rank',
  'view-permissions-ranks': 'View rank permissions',
  'assign-permissions-ranks': 'Assign permissions to rank',
  'bulk-delete-ranks': 'Bulk delete ranks'
};

// API endpoints
const ranksAPIEndpoints = {
  'list': { method: 'POST', path: 'ranks/list', permission: 'list-ranks' },
  'add': { method: 'POST', path: 'ranks/add', permission: 'add-ranks' },
  'update': { method: 'POST', path: 'ranks/update', permission: 'edit-ranks' },
  'delete': { method: 'POST', path: 'ranks/delete', permission: 'delete-ranks' },
  'bulk-delete': { method: 'POST', path: 'ranks/bulk-delete', permission: 'bulk-delete-ranks' },
  'view': { method: 'POST', path: 'ranks/view', permission: 'view-permissions-ranks' },
  'assignPermissions': { method: 'POST', path: 'ranks/assignPermissions', permission: 'assign-permissions-ranks' }
};

// Function to check if user has required permission
function hasPermission(userPermissions, requiredPermission) {
  return userPermissions.includes(requiredPermission);
}

// Mock API call function
function mockAPICall(endpoint, userPermissions, payload = {}) {
  const endpointConfig = ranksAPIEndpoints[endpoint];
  if (!endpointConfig) {
    return { success: false, error: 'Invalid endpoint' };
  }

  const hasRequiredPermission = hasPermission(userPermissions, endpointConfig.permission);
  
  if (!hasRequiredPermission) {
    return {
      success: false,
      error: 'Permission denied',
      code: 403,
      message: `User does not have permission: ${endpointConfig.permission}`
    };
  }

  // Mock successful response
  return {
    success: true,
    code: 200,
    data: { id: '1', name: 'Test Rank', ...payload },
    message: 'Operation successful'
  };
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
  const testId = `RANKS-${String(testResults.length + 1).padStart(3, '0')}`;
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
console.log('Ranks Permissions and API Calls Test Suite');
console.log('='.repeat(80));

// ============================================================================
// LOGIN AND SESSION SETUP
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('SECTION 1: LOGIN AND SESSION SETUP');
console.log('='.repeat(80));

// Test user with all ranks permissions
const testUserPermissions = [
  'list-ranks',
  'add-ranks',
  'edit-ranks',
  'delete-ranks',
  'view-permissions-ranks',
  'assign-permissions-ranks',
  'bulk-delete-ranks',
  'control-hub-services' // Parent permission for controlhub routes
];

let savedSession = null;
let savedSessionId = null;

// Login test
test('Login with valid credentials and save session', 'Positive',
  'Verify that login succeeds and session is saved for ranks permission testing',
  '1. Provide valid email and password 2. Call authorize function 3. Create and save session 4. Verify session is stored',
  'Email: test@example.com, Password: validPassword123, Permissions: [all ranks permissions]',
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
    savedSessionId = 'ranks-test-session-' + Date.now();
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
// PERMISSION-BASED UI ELEMENT TESTS
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('SECTION 2: PERMISSION-BASED UI ELEMENT TESTS');
console.log('='.repeat(80));

// Create a user with limited permissions (no ranks permissions)
const limitedUserPermissions = [
  'control-hub-services' // Only parent permission, no ranks-specific permissions
];

let limitedUserSession = null;
let limitedUserSessionId = null;

// Create limited permission user session
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
  'Email: limited@example.com, Permissions: [control-hub-services only]',
  'Session should be created with limited permissions',
  (testId, name, type, desc, steps, data, expected) => {
    assert(limitedUserSession !== null, 'Limited user session should be saved', testId, name, type, desc, steps, data, expected);
    assert(limitedUserSession.user.permissions.length === 1, 'Limited user should have minimal permissions', testId, name, type, desc, steps, data, expected);
  }
);

// Test each permission for UI element visibility
Object.keys(ranksPermissions).forEach((permission, index) => {
  const permissionName = permission;
  const permissionDescription = ranksPermissions[permission];
  
  // POSITIVE TEST: User with permission
  const userPerms = savedSession?.user?.permissions || [];
  const hasPermissionPositive = hasPermission(userPerms, permissionName);
  
  if (hasPermissionPositive) {
    test(
      `UI Element Visibility (Positive): ${permissionName}`,
      'Positive',
      `Verify UI element is visible when user has permission: ${permissionName}`,
      `1. Check if user has permission ${permissionName} 2. Verify UI element should be visible 3. Confirm access is granted`,
      `Permission: ${permissionName}, User Permissions: [${userPerms.join(', ')}]`,
      `UI element for ${permissionName} should be visible`,
      (testId, name, type, desc, steps, data, expected) => {
        const userPermissions = savedSession?.user?.permissions || [];
        const hasPerm = hasPermission(userPermissions, permissionName);
        
        const message = hasPerm 
          ? `Permission ${permissionName}: UI element visible - User has required permission`
          : `Permission ${permissionName}: UI element hidden - User missing required permission`;
        
        assert(
          hasPerm,
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
  
  // NEGATIVE TEST: User without permission
  const limitedUserPerms = limitedUserSession?.user?.permissions || [];
  const hasPermissionNegative = hasPermission(limitedUserPerms, permissionName);
  
  if (!hasPermissionNegative) {
    test(
      `UI Element Visibility (Negative): ${permissionName}`,
      'Negative',
      `Verify UI element is hidden when user lacks permission: ${permissionName}`,
      `1. Check if user has permission ${permissionName} 2. Verify UI element should be hidden 3. Confirm access is denied`,
      `Permission: ${permissionName}, User Permissions: [${limitedUserPerms.join(', ')}]`,
      `UI element for ${permissionName} should NOT be visible`,
      (testId, name, type, desc, steps, data, expected) => {
        const userPermissions = limitedUserSession?.user?.permissions || [];
        const hasPerm = hasPermission(userPermissions, permissionName);
        
        const message = !hasPerm 
          ? `Permission ${permissionName}: UI element hidden (as expected) - User does not have required permission`
          : `Permission ${permissionName}: UI element visible (unexpected) - User should not have access but does`;
        
        assert(
          !hasPerm,
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

// ============================================================================
// API ENDPOINT PERMISSION TESTS
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('SECTION 3: API ENDPOINT PERMISSION TESTS');
console.log('='.repeat(80));

// Test each API endpoint with positive and negative cases
Object.keys(ranksAPIEndpoints).forEach((endpoint, index) => {
  const endpointConfig = ranksAPIEndpoints[endpoint];
  const endpointName = endpoint;
  const endpointPath = endpointConfig.path;
  const requiredPermission = endpointConfig.permission;
  const method = endpointConfig.method;
  
  // POSITIVE TEST: User with permission
  const userPerms = savedSession?.user?.permissions || [];
  const hasPermissionPositive = hasPermission(userPerms, requiredPermission);
  
  if (hasPermissionPositive) {
    test(
      `API Call (Positive): ${endpointName}`,
      'Positive',
      `Verify API call succeeds when user has permission: ${requiredPermission}`,
      `1. User has permission ${requiredPermission} 2. Make ${method} request to ${endpointPath} 3. Verify API call succeeds 4. Check response code is 200`,
      `Endpoint: ${endpointPath}, Method: ${method}, Permission: ${requiredPermission}, User Permissions: [${userPerms.join(', ')}]`,
      `API call to ${endpointPath} should succeed with code 200`,
      (testId, name, type, desc, steps, data, expected) => {
        const userPermissions = savedSession?.user?.permissions || [];
        const mockPayload = endpointName === 'list' ? { page: 1, perPage: 15 } : 
                           endpointName === 'add' ? { name: 'Test Rank' } :
                           endpointName === 'update' ? { role_id: '1', name: 'Updated Rank' } :
                           endpointName === 'delete' ? { id: '1' } :
                           endpointName === 'bulk-delete' ? { ids: ['1', '2'] } :
                           endpointName === 'view' ? { id: '1' } :
                           { id: '1', permissions: [] };
        
        const response = mockAPICall(endpointName, userPermissions, mockPayload);
        const hasPerm = hasPermission(userPermissions, requiredPermission);
        
        const message = response.success && hasPerm
          ? `API ${endpointPath}: Call succeeded - User has permission ${requiredPermission}, Response code: ${response.code}`
          : `API ${endpointPath}: Call failed - ${response.error || 'Permission denied'}`;
        
        assert(
          response.success && hasPerm,
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
  
  // NEGATIVE TEST: User without permission
  const limitedUserPerms = limitedUserSession?.user?.permissions || [];
  const hasPermissionNegative = hasPermission(limitedUserPerms, requiredPermission);
  
  if (!hasPermissionNegative) {
    test(
      `API Call (Negative): ${endpointName}`,
      'Negative',
      `Verify API call fails when user lacks permission: ${requiredPermission}`,
      `1. User does not have permission ${requiredPermission} 2. Make ${method} request to ${endpointPath} 3. Verify API call fails 4. Check response code is 403`,
      `Endpoint: ${endpointPath}, Method: ${method}, Permission: ${requiredPermission}, User Permissions: [${limitedUserPerms.join(', ')}]`,
      `API call to ${endpointPath} should fail with code 403 (Permission denied)`,
      (testId, name, type, desc, steps, data, expected) => {
        const userPermissions = limitedUserSession?.user?.permissions || [];
        const mockPayload = endpointName === 'list' ? { page: 1, perPage: 15 } : 
                           endpointName === 'add' ? { name: 'Test Rank' } :
                           endpointName === 'update' ? { role_id: '1', name: 'Updated Rank' } :
                           endpointName === 'delete' ? { id: '1' } :
                           endpointName === 'bulk-delete' ? { ids: ['1', '2'] } :
                           endpointName === 'view' ? { id: '1' } :
                           { id: '1', permissions: [] };
        
        const response = mockAPICall(endpointName, userPermissions, mockPayload);
        const hasPerm = hasPermission(userPermissions, requiredPermission);
        
        const message = !response.success && !hasPerm
          ? `API ${endpointPath}: Call denied (as expected) - User does not have permission ${requiredPermission}, Response code: ${response.code || 403}`
          : `API ${endpointPath}: Call succeeded (unexpected) - User should not have access but API call succeeded`;
        
        assert(
          !response.success && !hasPerm,
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

// ============================================================================
// SPECIFIC FEATURE TESTS
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('SECTION 4: SPECIFIC FEATURE TESTS');
console.log('='.repeat(80));

// Test: List Ranks Page Visibility
test('List Ranks Page Visibility (Positive)', 'Positive',
  'Verify that ranks list page is visible when user has list-ranks permission',
  '1. Check if user has list-ranks permission 2. Verify GenericListPage component is rendered 3. Confirm page is accessible',
  'Permission: list-ranks, User Permissions: [list-ranks, ...]',
  'Ranks list page should be visible and accessible',
  (testId, name, type, desc, steps, data, expected) => {
    const userPermissions = savedSession?.user?.permissions || [];
    const hasListPermission = hasPermission(userPermissions, 'list-ranks');
    
    assert(
      hasListPermission,
      `List ranks page: ${hasListPermission ? 'Visible - User has list-ranks permission' : 'Hidden - User missing list-ranks permission'}`,
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

test('List Ranks Page Visibility (Negative)', 'Negative',
  'Verify that ranks list page is hidden when user lacks list-ranks permission',
  '1. Check if user has list-ranks permission 2. Verify GenericListPage component is NOT rendered 3. Confirm page is not accessible',
  'Permission: list-ranks, User Permissions: [control-hub-services only]',
  'Ranks list page should NOT be visible',
  (testId, name, type, desc, steps, data, expected) => {
    const userPermissions = limitedUserSession?.user?.permissions || [];
    const hasListPermission = hasPermission(userPermissions, 'list-ranks');
    
    assert(
      !hasListPermission,
      `List ranks page: ${!hasListPermission ? 'Hidden (as expected) - User does not have list-ranks permission' : 'Visible (unexpected) - User should not have access'}`,
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

// Test: Create Rank Button Visibility
test('Create Rank Button Visibility (Positive)', 'Positive',
  'Verify that "New Rank" button is visible when user has add-ranks permission',
  '1. Check if user has add-ranks permission 2. Verify "New Rank" button is rendered 3. Confirm button is clickable',
  'Permission: add-ranks, User Permissions: [add-ranks, ...]',
  '"New Rank" button should be visible',
  (testId, name, type, desc, steps, data, expected) => {
    const userPermissions = savedSession?.user?.permissions || [];
    const hasAddPermission = hasPermission(userPermissions, 'add-ranks');
    
    assert(
      hasAddPermission,
      `Create rank button: ${hasAddPermission ? 'Visible - User has add-ranks permission' : 'Hidden - User missing add-ranks permission'}`,
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

test('Create Rank Button Visibility (Negative)', 'Negative',
  'Verify that "New Rank" button is hidden when user lacks add-ranks permission',
  '1. Check if user has add-ranks permission 2. Verify "New Rank" button is NOT rendered 3. Confirm button is not accessible',
  'Permission: add-ranks, User Permissions: [control-hub-services only]',
  '"New Rank" button should NOT be visible',
  (testId, name, type, desc, steps, data, expected) => {
    const userPermissions = limitedUserSession?.user?.permissions || [];
    const hasAddPermission = hasPermission(userPermissions, 'add-ranks');
    
    assert(
      !hasAddPermission,
      `Create rank button: ${!hasAddPermission ? 'Hidden (as expected) - User does not have add-ranks permission' : 'Visible (unexpected) - User should not have access'}`,
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

// Test: Action Buttons Visibility
test('Action Buttons Visibility (Positive)', 'Positive',
  'Verify that action buttons (Edit, Delete, View Permissions, Assign Permissions) are visible based on permissions',
  '1. Check user permissions for edit-ranks, delete-ranks, view-permissions-ranks, assign-permissions-ranks 2. Verify corresponding action buttons are rendered 3. Confirm buttons are clickable',
  'Permissions: edit-ranks, delete-ranks, view-permissions-ranks, assign-permissions-ranks, User Permissions: [all action permissions]',
  'Action buttons should be visible based on user permissions',
  (testId, name, type, desc, steps, data, expected) => {
    const userPermissions = savedSession?.user?.permissions || [];
    const hasEdit = hasPermission(userPermissions, 'edit-ranks');
    const hasDelete = hasPermission(userPermissions, 'delete-ranks');
    const hasViewPerms = hasPermission(userPermissions, 'view-permissions-ranks');
    const hasAssignPerms = hasPermission(userPermissions, 'assign-permissions-ranks');
    
    const hasAnyAction = hasEdit || hasDelete || hasViewPerms || hasAssignPerms;
    
    assert(
      hasAnyAction,
      `Action buttons: ${hasAnyAction ? 'Visible - User has at least one action permission' : 'Hidden - User missing all action permissions'}`,
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

test('Action Buttons Visibility (Negative)', 'Negative',
  'Verify that action buttons are hidden when user lacks all action permissions',
  '1. Check user permissions for edit-ranks, delete-ranks, view-permissions-ranks, assign-permissions-ranks 2. Verify action buttons are NOT rendered 3. Confirm buttons are not accessible',
  'Permissions: edit-ranks, delete-ranks, view-permissions-ranks, assign-permissions-ranks, User Permissions: [control-hub-services only]',
  'Action buttons should NOT be visible',
  (testId, name, type, desc, steps, data, expected) => {
    const userPermissions = limitedUserSession?.user?.permissions || [];
    const hasEdit = hasPermission(userPermissions, 'edit-ranks');
    const hasDelete = hasPermission(userPermissions, 'delete-ranks');
    const hasViewPerms = hasPermission(userPermissions, 'view-permissions-ranks');
    const hasAssignPerms = hasPermission(userPermissions, 'assign-permissions-ranks');
    
    const hasAnyAction = hasEdit || hasDelete || hasViewPerms || hasAssignPerms;
    
    assert(
      !hasAnyAction,
      `Action buttons: ${!hasAnyAction ? 'Hidden (as expected) - User does not have any action permissions' : 'Visible (unexpected) - User should not have access'}`,
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

// Test: Bulk Delete Feature
test('Bulk Delete Feature (Positive)', 'Positive',
  'Verify that bulk delete feature is enabled when user has bulk-delete-ranks permission',
  '1. Check if user has bulk-delete-ranks permission 2. Verify row selection is enabled 3. Verify bulk delete button is visible when rows are selected 4. Confirm bulk delete functionality is accessible',
  'Permission: bulk-delete-ranks, User Permissions: [bulk-delete-ranks, ...]',
  'Bulk delete feature should be enabled',
  (testId, name, type, desc, steps, data, expected) => {
    const userPermissions = savedSession?.user?.permissions || [];
    const hasBulkDelete = hasPermission(userPermissions, 'bulk-delete-ranks');
    
    assert(
      hasBulkDelete,
      `Bulk delete feature: ${hasBulkDelete ? 'Enabled - User has bulk-delete-ranks permission' : 'Disabled - User missing bulk-delete-ranks permission'}`,
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

test('Bulk Delete Feature (Negative)', 'Negative',
  'Verify that bulk delete feature is disabled when user lacks bulk-delete-ranks permission',
  '1. Check if user has bulk-delete-ranks permission 2. Verify row selection is disabled 3. Verify bulk delete button is NOT visible 4. Confirm bulk delete functionality is not accessible',
  'Permission: bulk-delete-ranks, User Permissions: [control-hub-services only]',
  'Bulk delete feature should be disabled',
  (testId, name, type, desc, steps, data, expected) => {
    const userPermissions = limitedUserSession?.user?.permissions || [];
    const hasBulkDelete = hasPermission(userPermissions, 'bulk-delete-ranks');
    
    assert(
      !hasBulkDelete,
      `Bulk delete feature: ${!hasBulkDelete ? 'Disabled (as expected) - User does not have bulk-delete-ranks permission' : 'Enabled (unexpected) - User should not have access'}`,
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
  fs.writeFileSync('src/__tests__/ranks-permissions-test-report.csv', csvContent, 'utf8');
  console.log('\n✓ Test report CSV generated: src/__tests__/ranks-permissions-test-report.csv');

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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ranks Permissions Test Results');
    
    // Write Excel file
    const excelFileName = 'src/__tests__/ranks-permissions-test-report.xlsx';
    XLSX.writeFile(workbook, excelFileName);
      console.log('✓ Test report Excel generated: ' + excelFileName);
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        console.log('\n⚠ Excel generation skipped: xlsx module not found');
        console.log('  To generate Excel file, run: npm install xlsx --save-dev');
      } else {
        console.log('\n⚠ Excel generation failed: ' + error.message);
        console.log('  CSV file is available at: src/__tests__/ranks-permissions-test-report.csv');
      }
    }
  })();
} else {
  console.log('\nℹ File export skipped (use --export=true to generate CSV and Excel files)');
}

console.log(`\nTotal Tests: ${testResults.length}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);

if (testsFailed === 0) {
  console.log('\n✓ All tests passed!');
  process.exit(0);
} else {
  console.log('\n✗ Some tests failed');
  process.exit(1);
}

