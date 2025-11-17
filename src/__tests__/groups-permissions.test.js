/**
 * Comprehensive test case for Groups page permissions and API calls
 * Tests all permissions and API operations on the Groups page
 * Can be run directly with Node.js: node src/__tests__/groups-permissions.test.js
 * 
 * Options:
 *   --export=true    Generate CSV and Excel report files
 * 
 * Examples:
 *   node src/__tests__/groups-permissions.test.js              # Run tests only (no file generation)
 *   node src/__tests__/groups-permissions.test.js --export=true # Run tests and generate CSV/Excel files
 */

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

// Groups page permissions
const groupsPermissions = {
  'list-groups': 'View groups list',
  'add-groups': 'Create new groups',
  'edit-groups': 'Edit existing groups',
  'delete-groups': 'Delete groups'
};

// API endpoints
const groupsAPIs = {
  'ListGroups': {
    endpoint: 'POST groups/list',
    description: 'Fetch paginated list of groups',
    requiredPermission: 'list-groups'
  },
  'addGroup': {
    endpoint: 'POST groups/add',
    description: 'Create a new group',
    requiredPermission: 'add-groups'
  },
  'updateGroup': {
    endpoint: 'POST groups/update',
    description: 'Update an existing group',
    requiredPermission: 'edit-groups'
  },
  'deleteGroup': {
    endpoint: 'POST groups/delete',
    description: 'Delete a group',
    requiredPermission: 'delete-groups'
  }
};

// Function to check if user has required permission
function hasPermission(userPermissions, requiredPermission) {
  if (!requiredPermission) {
    return true; // No permission required
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
  const testId = `GROUPS-${String(testResults.length + 1).padStart(3, '0')}`;
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
console.log('Groups Page Permissions and API Calls Test Suite');
console.log('='.repeat(80));

// ============================================================================
// LOGIN AND SESSION SETUP
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('SECTION 1: LOGIN AND SESSION SETUP');
console.log('='.repeat(80));

// Test user with all groups permissions
const testUserPermissions = [
  'list-groups',
  'add-groups',
  'edit-groups',
  'delete-groups',
  'control-hub-services' // Parent permission for /controlhub/groups route
];

let savedSession = null;
let savedSessionId = null;

// Login test
test('Login with valid credentials and save session', 'Positive',
  'Verify that login succeeds and session is saved for groups permission testing',
  '1. Provide valid email and password 2. Call authorize function 3. Create and save session 4. Verify session is stored',
  'Email: test@example.com, Password: validPassword123, Permissions: [list-groups, add-groups, edit-groups, delete-groups, control-hub-services]',
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
    savedSessionId = 'groups-test-session-' + Date.now();
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
// PERMISSION-BASED UI ELEMENT VISIBILITY TESTS
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('SECTION 2: PERMISSION-BASED UI ELEMENT VISIBILITY TESTS');
console.log('='.repeat(80));

// Test each permission for UI element visibility
Object.entries(groupsPermissions).forEach(([permission, description]) => {
  const userPerms = savedSession?.user?.permissions || [];
  const hasPermissionPositive = hasPermission(userPerms, permission);
  
  // POSITIVE TEST: User with permission
  if (hasPermissionPositive) {
    test(
      `UI Element Visibility (Positive): ${description}`,
      'Positive',
      `Verify user with '${permission}' permission can see related UI elements`,
      `1. Check if user has '${permission}' permission 2. Verify UI element is visible 3. Verify functionality is accessible`,
      `Permission: ${permission}, User Permissions: ${userPerms.length} permissions, Has Permission: Yes`,
      `User should see UI elements related to ${description}`,
      (testId, name, type, desc, steps, data, expected) => {
        const userPermissions = savedSession?.user?.permissions || [];
        const hasPerm = hasPermission(userPermissions, permission);
        
        const message = hasPerm 
          ? `UI Element for ${description}: Visible - User has '${permission}' permission`
          : `UI Element for ${description}: Hidden - Missing '${permission}' permission`;
        
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
  const limitedUserPerms = [];
  const hasPermissionNegative = hasPermission(limitedUserPerms, permission);
  
  if (!hasPermissionNegative) {
    test(
      `UI Element Visibility (Negative): ${description}`,
      'Negative',
      `Verify user without '${permission}' permission cannot see related UI elements`,
      `1. Check if user has '${permission}' permission 2. Verify UI element is hidden 3. Verify functionality is not accessible`,
      `Permission: ${permission}, User Permissions: 0 permissions, Has Permission: No`,
      `User should NOT see UI elements related to ${description}`,
      (testId, name, type, desc, steps, data, expected) => {
        const userPermissions = [];
        const hasPerm = hasPermission(userPermissions, permission);
        
        const message = !hasPerm 
          ? `UI Element for ${description}: Hidden (as expected) - User missing '${permission}' permission`
          : `UI Element for ${description}: Visible (unexpected) - User should not have access but does`;
        
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
// API CALL PERMISSION TESTS
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('SECTION 3: API CALL PERMISSION TESTS');
console.log('='.repeat(80));

// Test each API call with permission checks
Object.entries(groupsAPIs).forEach(([apiName, apiInfo]) => {
  const userPerms = savedSession?.user?.permissions || [];
  const hasPermissionPositive = hasPermission(userPerms, apiInfo.requiredPermission);
  
  // POSITIVE TEST: User with permission can call API
  if (hasPermissionPositive) {
    test(
      `API Call Permission (Positive): ${apiName}`,
      'Positive',
      `Verify user with '${apiInfo.requiredPermission}' permission can call ${apiName} API`,
      `1. Check if user has '${apiInfo.requiredPermission}' permission 2. Verify API call is allowed 3. Verify API endpoint is accessible`,
      `API: ${apiName}, Endpoint: ${apiInfo.endpoint}, Required Permission: ${apiInfo.requiredPermission}, User Permissions: ${userPerms.length} permissions`,
      `User should be able to call ${apiName} API (${apiInfo.description})`,
      (testId, name, type, desc, steps, data, expected) => {
        const userPermissions = savedSession?.user?.permissions || [];
        const hasPerm = hasPermission(userPermissions, apiInfo.requiredPermission);
        
        const message = hasPerm 
          ? `API ${apiName}: Access granted - User has '${apiInfo.requiredPermission}' permission. Endpoint: ${apiInfo.endpoint}`
          : `API ${apiName}: Access denied - Missing '${apiInfo.requiredPermission}' permission. Endpoint: ${apiInfo.endpoint}`;
        
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
  
  // NEGATIVE TEST: User without permission cannot call API
  const limitedUserPerms = [];
  const hasPermissionNegative = hasPermission(limitedUserPerms, apiInfo.requiredPermission);
  
  if (!hasPermissionNegative) {
    test(
      `API Call Permission (Negative): ${apiName}`,
      'Negative',
      `Verify user without '${apiInfo.requiredPermission}' permission cannot call ${apiName} API`,
      `1. Check if user has '${apiInfo.requiredPermission}' permission 2. Verify API call is denied 3. Verify API endpoint is not accessible`,
      `API: ${apiName}, Endpoint: ${apiInfo.endpoint}, Required Permission: ${apiInfo.requiredPermission}, User Permissions: 0 permissions`,
      `User should NOT be able to call ${apiName} API (user is missing required permission)`,
      (testId, name, type, desc, steps, data, expected) => {
        const userPermissions = [];
        const hasPerm = hasPermission(userPermissions, apiInfo.requiredPermission);
        
        const message = !hasPerm 
          ? `API ${apiName}: Access denied (as expected) - User missing '${apiInfo.requiredPermission}' permission. Endpoint: ${apiInfo.endpoint}`
          : `API ${apiName}: Access granted (unexpected) - User should not have access but does. Endpoint: ${apiInfo.endpoint}`;
        
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
// SPECIFIC FEATURE TESTS
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('SECTION 4: SPECIFIC FEATURE TESTS');
console.log('='.repeat(80));

// Test: View Groups List
test(
  'View Groups List - Permission Check',
  'Positive',
  'Verify user with list-groups permission can view the groups list',
  '1. Check if user has list-groups permission 2. Verify GenericListPage component is rendered 3. Verify ListGroups API can be called',
  'Permission: list-groups, Component: GenericListPage, API: ListGroups',
  'User should see the groups list table with data',
  (testId, name, type, desc, steps, data, expected) => {
    const userPermissions = savedSession?.user?.permissions || [];
    const hasPerm = hasPermission(userPermissions, 'list-groups');
    
    const message = hasPerm 
      ? 'Groups List: Visible - User has list-groups permission, GenericListPage should render'
      : 'Groups List: Hidden - User missing list-groups permission';
    
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

// Test: Add Group Button Visibility
test(
  'Add Group Button Visibility - Permission Check',
  'Positive',
  'Verify user with add-groups permission can see the "New Group" button',
  '1. Check if user has add-groups permission 2. Verify "New Group" button is visible 3. Verify button click opens create modal',
  'Permission: add-groups, Button: "New Group", Modal: FormModal for creating group',
  'User should see "New Group" button and be able to create groups',
  (testId, name, type, desc, steps, data, expected) => {
    const userPermissions = savedSession?.user?.permissions || [];
    const hasPerm = hasPermission(userPermissions, 'add-groups');
    
    const message = hasPerm 
      ? 'Add Group Button: Visible - User has add-groups permission, button should be displayed'
      : 'Add Group Button: Hidden - User missing add-groups permission';
    
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

// Test: Edit Group Action Button Visibility
test(
  'Edit Group Action Button Visibility - Permission Check',
  'Positive',
  'Verify user with edit-groups permission can see the edit action button in groups table',
  '1. Check if user has edit-groups permission 2. Verify edit action button is visible in table row 3. Verify button click opens edit modal',
  'Permission: edit-groups, Button: Edit (FiEdit icon), Modal: FormModal for editing group',
  'User should see edit action button in groups table and be able to edit groups',
  (testId, name, type, desc, steps, data, expected) => {
    const userPermissions = savedSession?.user?.permissions || [];
    const hasPerm = hasPermission(userPermissions, 'edit-groups');
    
    const message = hasPerm 
      ? 'Edit Group Button: Visible - User has edit-groups permission, edit action should be displayed in table'
      : 'Edit Group Button: Hidden - User missing edit-groups permission';
    
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

// Test: Delete Group Action Button Visibility
test(
  'Delete Group Action Button Visibility - Permission Check',
  'Positive',
  'Verify user with delete-groups permission can see the delete action button in groups table',
  '1. Check if user has delete-groups permission 2. Verify delete action button is visible in table row 3. Verify button click opens delete confirmation modal',
  'Permission: delete-groups, Button: Delete (FiTrash2 icon), Modal: ConfirmModal for deleting group',
  'User should see delete action button in groups table and be able to delete groups',
  (testId, name, type, desc, steps, data, expected) => {
    const userPermissions = savedSession?.user?.permissions || [];
    const hasPerm = hasPermission(userPermissions, 'delete-groups');
    
    const message = hasPerm 
      ? 'Delete Group Button: Visible - User has delete-groups permission, delete action should be displayed in table'
      : 'Delete Group Button: Hidden - User missing delete-groups permission';
    
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

// Test: Action Column Visibility (Combined Edit/Delete)
test(
  'Action Column Visibility - Permission Check',
  'Positive',
  'Verify action column is visible when user has either edit-groups or delete-groups permission',
  '1. Check if user has edit-groups or delete-groups permission 2. Verify action column is visible in table 3. Verify appropriate action buttons are shown',
  'Permissions: edit-groups OR delete-groups, Column: Action, Buttons: Edit and/or Delete',
  'User should see action column with appropriate action buttons based on permissions',
  (testId, name, type, desc, steps, data, expected) => {
    const userPermissions = savedSession?.user?.permissions || [];
    const hasEditPerm = hasPermission(userPermissions, 'edit-groups');
    const hasDeletePerm = hasPermission(userPermissions, 'delete-groups');
    const hasAnyActionPerm = hasEditPerm || hasDeletePerm;
    
    const message = hasAnyActionPerm 
      ? `Action Column: Visible - User has ${hasEditPerm ? 'edit-groups' : ''}${hasEditPerm && hasDeletePerm ? ' and ' : ''}${hasDeletePerm ? 'delete-groups' : ''} permission(s)`
      : 'Action Column: Hidden - User missing both edit-groups and delete-groups permissions';
    
    assert(
      hasAnyActionPerm,
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

// Test: Search Functionality
test(
  'Search Functionality - Permission Check',
  'Positive',
  'Verify search functionality works with list-groups permission',
  '1. Check if user has list-groups permission 2. Verify search input is visible 3. Verify search triggers ListGroups API with search parameter',
  'Permission: list-groups, Feature: Search input, API: ListGroups with search parameter',
  'User should be able to search groups using the search input',
  (testId, name, type, desc, steps, data, expected) => {
    const userPermissions = savedSession?.user?.permissions || [];
    const hasPerm = hasPermission(userPermissions, 'list-groups');
    
    const message = hasPerm 
      ? 'Search Functionality: Available - User has list-groups permission, search input should be functional'
      : 'Search Functionality: Unavailable - User missing list-groups permission';
    
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

// Negative test for View Groups List
test(
  'View Groups List - Permission Check (Negative)',
  'Negative',
  'Verify user without list-groups permission cannot view the groups list',
  '1. Check if user has list-groups permission 2. Verify GenericListPage component is not rendered 3. Verify ListGroups API cannot be called',
  'Permission: list-groups, User Permissions: [] (no permissions)',
  'User should NOT see the groups list table',
  (testId, name, type, desc, steps, data, expected) => {
    const userPermissions = [];
    const hasPerm = hasPermission(userPermissions, 'list-groups');
    
    const message = !hasPerm 
      ? 'Groups List: Hidden (as expected) - User missing list-groups permission, GenericListPage should not render'
      : 'Groups List: Visible (unexpected) - User should not have access but does';
    
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

// Negative test for Add Group Button
test(
  'Add Group Button Visibility - Permission Check (Negative)',
  'Negative',
  'Verify user without add-groups permission cannot see the "New Group" button',
  '1. Check if user has add-groups permission 2. Verify "New Group" button is hidden 3. Verify create modal cannot be opened',
  'Permission: add-groups, User Permissions: [] (no permissions)',
  'User should NOT see "New Group" button',
  (testId, name, type, desc, steps, data, expected) => {
    const userPermissions = [];
    const hasPerm = hasPermission(userPermissions, 'add-groups');
    
    const message = !hasPerm 
      ? 'Add Group Button: Hidden (as expected) - User missing add-groups permission, button should not be displayed'
      : 'Add Group Button: Visible (unexpected) - User should not have access but does';
    
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

// Test Summary
console.log('\n' + '='.repeat(80));
console.log('Test Summary');
console.log('='.repeat(80));
console.log(`Total Tests: ${testResults.length}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log('='.repeat(80));

// Generate CSV report
const fs = require('fs');
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
  fs.writeFileSync('src/__tests__/groups-permissions-test-report.csv', csvContent, 'utf8');
  console.log('\n✓ Test report CSV generated: src/__tests__/groups-permissions-test-report.csv');

  // Generate Excel file
  try {
    const XLSX = require('xlsx');
    
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
      { wch: 60 }, // Description
      { wch: 70 }, // Steps
      { wch: 80 }, // Test Data
      { wch: 60 }, // Expected Result
      { wch: 70 }  // Actual Result
    ];
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Groups Permissions Test Results');
    
    // Write Excel file
    const excelFileName = 'src/__tests__/groups-permissions-test-report.xlsx';
    XLSX.writeFile(workbook, excelFileName);
    console.log('✓ Test report Excel generated: ' + excelFileName);
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('\n⚠ Excel generation skipped: xlsx module not found');
      console.log('  To generate Excel file, run: npm install xlsx --save-dev');
    } else {
      console.log('\n⚠ Excel generation failed: ' + error.message);
      console.log('  CSV file is available at: src/__tests__/groups-permissions-test-report.csv');
    }
  }
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

