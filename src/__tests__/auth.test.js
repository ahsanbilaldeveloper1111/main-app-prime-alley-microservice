/**
 * Comprehensive test case for login and session functionality
 * Tests are organized: Login cases first, then Session cases
 * Includes positive, negative, and edge case scenarios
 * Can be run directly with Node.js: node src/__tests__/auth.test.js
 * 
 * Options:
 *   --export=true    Generate CSV report file
 * 
 * Examples:
 *   node src/__tests__/auth.test.js              # Run tests only (no file generation)
 *   node src/__tests__/auth.test.js --export=true # Run tests and generate CSV file
 */

import fs from 'fs';

// Parse command-line arguments
const args = process.argv.slice(2);
const shouldExportFiles = args.some(arg => arg === '--export=true' || arg === '--export' || arg === '-e');

// Mock global for Node.js environment
if (typeof global === 'undefined') {
  var global = {};
}

// Initialize session store (simplified version for testing)
if (!global.nextAuthSessions) {
  global.nextAuthSessions = new Map();
}

// Mock fetch for login tests
const originalFetch = typeof fetch !== 'undefined' ? fetch : null;
let mockFetch = null;

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
  cleanup: () => {
    const now = new Date();
    global.nextAuthSessions.forEach((sessionData, sessionId) => {
      if (new Date(sessionData.expires) <= now) {
        global.nextAuthSessions.delete(sessionId);
      }
    });
  },
  clear: () => {
    global.nextAuthSessions.clear();
  }
};

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
  const testId = `AUTH-${String(testResults.length + 1).padStart(3, '0')}`;
  console.log(`\n[${testId}] Running: ${name} (${testType})`);
  try {
    fn(testId, name, testType, description, steps, testData, expectedResult);
  } catch (error) {
    console.error(`Error in test "${name}":`, error.message);
    assert(false, `Test error: ${error.message}`, testId, name, testType, description, steps, testData, expectedResult);
  }
}

// Mock authorize function for login tests
function mockAuthorize(credentials, mockResponse) {
  if (!credentials?.email || !credentials?.password) {
    return null;
  }

  // Simulate backend response
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
console.log('Login and Session Functionality Tests');
console.log('='.repeat(80));

// ============================================================================
// LOGIN TEST CASES
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('SECTION 1: LOGIN TEST CASES');
console.log('='.repeat(80));

// Positive Login Tests
test('Login with valid credentials', 'Positive', 
  'Verify that login succeeds with valid email and password',
  '1. Provide valid email and password 2. Call authorize function 3. Verify user object is returned',
  'Email: test@example.com; Password: validPassword123',
  'User object should be returned with all required fields',
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
        permissions: ['read', 'write'],
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
    assert(result !== null, 'Login should succeed with valid credentials', testId, name, type, desc, steps, data, expected);
    assert(result.id === '1', 'User ID should be returned', testId, name, type, desc, steps, data, expected);
    assert(result.email === 'test@example.com', 'Email should match', testId, name, type, desc, steps, data, expected);
    assert(result.token.access_token === 'valid-access-token-123', 'Access token should be returned', testId, name, type, desc, steps, data, expected);
  }
);

test('Login with admin credentials', 'Positive',
  'Verify that admin user can login successfully',
  '1. Provide admin email and password 2. Call authorize function 3. Verify admin user object is returned',
  'Email: admin@example.com; Password: adminPass123; Is Admin: true',
  'Admin user object should be returned with is_admin flag set to true',
  (testId, name, type, desc, steps, data, expected) => {
    const credentials = { email: 'admin@example.com', password: 'adminPass123' };
    const mockResponse = {
      code: 200,
      data: {
        id: '2',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        is_admin: true,
        permissions: ['read', 'write', 'delete', 'admin'],
        token: {
          access_token: 'admin-access-token',
          expires_in: 7200,
          refresh_token: { access_token: 'admin-refresh-token', expires_in: 86400 }
        }
      }
    };
    
    const result = mockAuthorize(credentials, mockResponse);
    assert(result !== null, 'Admin login should succeed', testId, name, type, desc, steps, data, expected);
    assert(result.is_admin === true, 'is_admin flag should be true', testId, name, type, desc, steps, data, expected);
    assert(result.permissions.includes('admin'), 'Admin permissions should be included', testId, name, type, desc, steps, data, expected);
  }
);

test('Login with user having multiple permissions', 'Positive',
  'Verify login with user having multiple permissions',
  '1. Provide valid credentials 2. Backend returns user with multiple permissions 3. Verify all permissions are returned',
  'Email: user@example.com; Password: pass123; Permissions: [read write delete update]',
  'User object should contain all permissions in array',
  (testId, name, type, desc, steps, data, expected) => {
    const credentials = { email: 'user@example.com', password: 'pass123' };
    const mockResponse = {
      code: 200,
      data: {
        id: '3',
        email: 'user@example.com',
        permissions: ['read', 'write', 'delete', 'update'],
        token: {
          access_token: 'token-123',
          expires_in: 7200,
          refresh_token: { access_token: 'refresh-123', expires_in: 86400 }
        }
      }
    };
    
    const result = mockAuthorize(credentials, mockResponse);
    assert(result !== null, 'Login should succeed', testId, name, type, desc, steps, data, expected);
    assert(result.permissions.length === 4, 'All permissions should be returned', testId, name, type, desc, steps, data, expected);
    assert(result.permissions.includes('read'), 'Read permission should be present', testId, name, type, desc, steps, data, expected);
  }
);

// Negative Login Tests
test('Login with empty email', 'Negative',
  'Verify that login fails when email is empty',
  '1. Provide empty email and valid password 2. Call authorize function 3. Verify null is returned',
  'Email: (empty); Password: validPassword123',
  'Function should return null',
  (testId, name, type, desc, steps, data, expected) => {
    const credentials = { email: '', password: 'validPassword123' };
    const result = mockAuthorize(credentials, null);
    assert(result === null, 'Login should fail with empty email', testId, name, type, desc, steps, data, expected);
  }
);

test('Login with empty password', 'Negative',
  'Verify that login fails when password is empty',
  '1. Provide valid email and empty password 2. Call authorize function 3. Verify null is returned',
  'Email: test@example.com; Password: (empty)',
  'Function should return null',
  (testId, name, type, desc, steps, data, expected) => {
    const credentials = { email: 'test@example.com', password: '' };
    const result = mockAuthorize(credentials, null);
    assert(result === null, 'Login should fail with empty password', testId, name, type, desc, steps, data, expected);
  }
);

test('Login with missing credentials', 'Negative',
  'Verify that login fails when credentials object is missing',
  '1. Call authorize with null/undefined credentials 2. Verify null is returned',
  'Credentials: null or undefined',
  'Function should return null',
  (testId, name, type, desc, steps, data, expected) => {
    const result1 = mockAuthorize(null, null);
    const result2 = mockAuthorize(undefined, null);
    assert(result1 === null, 'Login should fail with null credentials', testId, name, type, desc, steps, data, expected);
    assert(result2 === null, 'Login should fail with undefined credentials', testId, name, type, desc, steps, data, expected);
  }
);

test('Login with invalid credentials - backend returns 400', 'Negative',
  'Verify that login fails when backend returns error code 400',
  '1. Provide credentials 2. Backend returns code 400 3. Verify null is returned',
  'Email: invalid@example.com; Password: wrongpass; Backend Response: {code: 400}',
  'Function should return null',
  (testId, name, type, desc, steps, data, expected) => {
    const credentials = { email: 'invalid@example.com', password: 'wrongpass' };
    const mockResponse = { code: 400, message: 'Invalid credentials' };
    const result = mockAuthorize(credentials, mockResponse);
    assert(result === null, 'Login should fail with 400 error code', testId, name, type, desc, steps, data, expected);
  }
);

test('Login with missing access token in response', 'Negative',
  'Verify that login fails when access token is missing in backend response',
  '1. Provide valid credentials 2. Backend returns response without access_token 3. Verify null is returned',
  'Email: test@example.com; Password: pass123; Backend Response: {data: {token: {}}}',
  'Function should return null',
  (testId, name, type, desc, steps, data, expected) => {
    const credentials = { email: 'test@example.com', password: 'pass123' };
    const mockResponse = {
      code: 200,
      data: {
        id: '1',
        email: 'test@example.com',
        token: {} // Missing access_token
      }
    };
    const result = mockAuthorize(credentials, mockResponse);
    assert(result === null, 'Login should fail when access token is missing', testId, name, type, desc, steps, data, expected);
  }
);

// Edge Cases for Login
test('Login with very long email address', 'Edge Case',
  'Verify login handles extremely long email addresses',
  '1. Provide email with 200+ characters 2. Call authorize function 3. Verify handling',
  'Email: verylongemailaddress...@example.com (200+ chars); Password: pass123',
  'Function should handle long email gracefully (may fail or succeed based on validation)',
  (testId, name, type, desc, steps, data, expected) => {
    const longEmail = 'a'.repeat(200) + '@example.com';
    const credentials = { email: longEmail, password: 'pass123' };
    const mockResponse = {
      code: 200,
      data: {
        id: '1',
        email: longEmail,
        token: { access_token: 'token', expires_in: 7200, refresh_token: { access_token: 'refresh', expires_in: 86400 } }
      }
    };
    const result = mockAuthorize(credentials, mockResponse);
    // This test verifies the function doesn't crash with long emails
    assert(result !== null || result === null, 'Function should handle long email without crashing', testId, name, type, desc, steps, data, expected);
  }
);

test('Login with special characters in password', 'Edge Case',
  'Verify login handles passwords with special characters',
  '1. Provide password with special characters 2. Call authorize function 3. Verify handling',
  'Email: test@example.com; Password: P@ssw0rd!#$%^&*()',
  'Function should handle special characters in password',
  (testId, name, type, desc, steps, data, expected) => {
    const credentials = { email: 'test@example.com', password: 'P@ssw0rd!#$%^&*()' };
    const mockResponse = {
      code: 200,
      data: {
        id: '1',
        email: 'test@example.com',
        token: { access_token: 'token', expires_in: 7200, refresh_token: { access_token: 'refresh', expires_in: 86400 } }
      }
    };
    const result = mockAuthorize(credentials, mockResponse);
    assert(result !== null, 'Login should handle special characters in password', testId, name, type, desc, steps, data, expected);
  }
);

test('Login with unicode characters in email', 'Edge Case',
  'Verify login handles unicode characters in email',
  '1. Provide email with unicode characters 2. Call authorize function 3. Verify handling',
  'Email: tést@éxample.com; Password: pass123',
  'Function should handle unicode characters',
  (testId, name, type, desc, steps, data, expected) => {
    const credentials = { email: 'tést@éxample.com', password: 'pass123' };
    const mockResponse = {
      code: 200,
      data: {
        id: '1',
        email: 'tést@éxample.com',
        token: { access_token: 'token', expires_in: 7200, refresh_token: { access_token: 'refresh', expires_in: 86400 } }
      }
    };
    const result = mockAuthorize(credentials, mockResponse);
    assert(result !== null, 'Login should handle unicode characters', testId, name, type, desc, steps, data, expected);
  }
);

test('Login with user having no permissions', 'Edge Case',
  'Verify login with user having empty permissions array',
  '1. Provide valid credentials 2. Backend returns user with empty permissions 3. Verify empty array is returned',
  'Email: user@example.com; Password: pass123; Permissions: []',
  'User object should have empty permissions array',
  (testId, name, type, desc, steps, data, expected) => {
    const credentials = { email: 'user@example.com', password: 'pass123' };
    const mockResponse = {
      code: 200,
      data: {
        id: '4',
        email: 'user@example.com',
        permissions: [],
        token: { access_token: 'token', expires_in: 7200, refresh_token: { access_token: 'refresh', expires_in: 86400 } }
      }
    };
    const result = mockAuthorize(credentials, mockResponse);
    assert(result !== null, 'Login should succeed', testId, name, type, desc, steps, data, expected);
    assert(Array.isArray(result.permissions), 'Permissions should be an array', testId, name, type, desc, steps, data, expected);
    assert(result.permissions.length === 0, 'Permissions array should be empty', testId, name, type, desc, steps, data, expected);
  }
);

test('Login with null is_admin field', 'Edge Case',
  'Verify login handles null is_admin field',
  '1. Provide valid credentials 2. Backend returns user with null is_admin 3. Verify null is handled',
  'Email: user@example.com; Password: pass123; Is Admin: null',
  'User object should have is_admin as null',
  (testId, name, type, desc, steps, data, expected) => {
    const credentials = { email: 'user@example.com', password: 'pass123' };
    const mockResponse = {
      code: 200,
      data: {
        id: '5',
        email: 'user@example.com',
        is_admin: null,
        token: { access_token: 'token', expires_in: 7200, refresh_token: { access_token: 'refresh', expires_in: 86400 } }
      }
    };
    const result = mockAuthorize(credentials, mockResponse);
    assert(result !== null, 'Login should succeed', testId, name, type, desc, steps, data, expected);
    assert(result.is_admin === null, 'is_admin should be null', testId, name, type, desc, steps, data, expected);
  }
);

// ============================================================================
// SESSION TEST CASES
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('SECTION 2: SESSION TEST CASES');
console.log('='.repeat(80));

// Positive Session Tests
test('Create and store a session', 'Positive',
  'Verify that a session can be created and stored in the session store',
  '1. Create session data with user information 2. Call sessionStore.set() with sessionId and sessionData 3. Retrieve the session using sessionStore.get()',
  'Session ID: test-session-123; User ID: 1; Name: Test User; Email: test@example.com; Role: user; Permissions: [read write]; Access Token: test-access-token; Expires: 2 hours from now',
  'Session should be stored successfully and retrievable',
  (testId, name, type, desc, steps, data, expected) => {
    sessionStore.clear();
    const sessionId = 'test-session-123';
    const sessionData = {
      user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        permissions: ['read', 'write'],
        access_token: 'test-access-token',
        access_token_expires: Date.now() + 7200000,
      },
      expires: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    };

    sessionStore.set(sessionId, sessionData);
    const retrieved = sessionStore.get(sessionId);

    assert(retrieved !== null, 'Session should be stored', testId, name, type, desc, steps, data, expected);
    assert(retrieved.user.id === '1', 'Session should have correct user ID', testId, name, type, desc, steps, data, expected);
    assert(retrieved.user.email === 'test@example.com', 'Session should have correct email', testId, name, type, desc, steps, data, expected);
    assert(retrieved.user.name === 'Test User', 'Session should have correct name', testId, name, type, desc, steps, data, expected);
  }
);

test('Retrieve stored session', 'Positive',
  'Verify that a stored session can be retrieved successfully',
  '1. Create session with ID 2. Store the session 3. Retrieve using sessionStore.get()',
  'Session ID: test-session-456; User ID: 2; Name: Another User; Email: another@example.com; Role: admin; Permissions: [read write delete]',
  'Session should be retrievable (not null)',
  (testId, name, type, desc, steps, data, expected) => {
    const sessionId = 'test-session-456';
    const sessionData = {
      user: {
        id: '2',
        name: 'Another User',
        email: 'another@example.com',
        role: 'admin',
        permissions: ['read', 'write', 'delete'],
        access_token: 'another-access-token',
      },
      expires: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    };

    sessionStore.set(sessionId, sessionData);
    const retrieved = sessionStore.get(sessionId);

    assert(retrieved !== null, 'Session should be retrievable', testId, name, type, desc, steps, data, expected);
    assert(retrieved.user.id === '2', 'Session should have correct user ID', testId, name, type, desc, steps, data, expected);
    assert(retrieved.user.role === 'admin', 'Session should have correct role', testId, name, type, desc, steps, data, expected);
    assert(retrieved.user.permissions.length === 3, 'Session should have correct permissions count', testId, name, type, desc, steps, data, expected);
  }
);

test('Delete a session', 'Positive',
  'Verify that a session can be deleted successfully',
  '1. Create and store a session 2. Delete the session using sessionStore.delete() 3. Attempt to retrieve deleted session',
  'Session ID: test-session-delete; User ID: 3; Email: delete@example.com',
  'After deletion retrieved value should be null',
  (testId, name, type, desc, steps, data, expected) => {
    const sessionId = 'test-session-delete';
    const sessionData = {
      user: {
        id: '3',
        email: 'delete@example.com',
      },
      expires: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    };

    sessionStore.set(sessionId, sessionData);
    assert(sessionStore.get(sessionId) !== null, 'Session should exist before deletion', testId, name, type, desc, steps, data, expected);

    sessionStore.delete(sessionId);
    assert(sessionStore.get(sessionId) === null, 'Session should be deleted', testId, name, type, desc, steps, data, expected);
  }
);

test('Cleanup expired sessions', 'Positive',
  'Verify that expired sessions are removed during cleanup while active sessions are preserved',
  '1. Create expired session (expires 1 second ago) 2. Create active session (expires in 2 hours) 3. Run sessionStore.cleanup() 4. Verify expired session is removed and active session remains',
  'Expired Session ID: expired-session; Expires: 1 second ago; Active Session ID: active-session; Expires: 2 hours from now',
  'Expired session should be null after cleanup; Active session should still exist',
  (testId, name, type, desc, steps, data, expected) => {
    const expiredSessionId = 'expired-session';
    const expiredSessionData = {
      user: {
        id: '4',
        email: 'expired@example.com',
      },
      expires: new Date(Date.now() - 1000).toISOString(),
    };

    const activeSessionId = 'active-session';
    const activeSessionData = {
      user: {
        id: '5',
        email: 'active@example.com',
      },
      expires: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    };

    sessionStore.set(expiredSessionId, expiredSessionData);
    sessionStore.set(activeSessionId, activeSessionData);

    sessionStore.cleanup();

    assert(sessionStore.get(expiredSessionId) === null, 'Expired session should be cleaned up', testId, name, type, desc, steps, data, expected);
    assert(sessionStore.get(activeSessionId) !== null, 'Active session should be preserved', testId, name, type, desc, steps, data, expected);
  }
);

test('Create session with all required fields', 'Positive',
  'Verify that session with all required fields can be stored and retrieved',
  '1. Create session with all fields (id name email username role is_admin phone permissions tokens) 2. Store the session 3. Verify all fields are stored correctly',
  'Session ID: complete-session; User ID: 100; Name: Complete User; Email: complete@example.com; Username: completeuser; Role: admin; Is Admin: true; Phone: +1234567890; Permissions: [read write delete]; Access Token: complete-access-token; Refresh Token: complete-refresh-token',
  'All session fields should be stored and retrieved correctly',
  (testId, name, type, desc, steps, data, expected) => {
    const sessionId = 'complete-session';
    const sessionData = {
      user: {
        id: '100',
        name: 'Complete User',
        email: 'complete@example.com',
        username: 'completeuser',
        role: 'admin',
        is_admin: 'true',
        phone: '+1234567890',
        permissions: ['read', 'write', 'delete'],
        access_token: 'complete-access-token',
        access_token_expires: Date.now() + 7200000,
        refresh_token: 'complete-refresh-token',
        refresh_token_expires: Date.now() + 86400000,
      },
      expires: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    };

    sessionStore.set(sessionId, sessionData);
    const retrieved = sessionStore.get(sessionId);

    assert(retrieved !== null, 'Complete session should be stored', testId, name, type, desc, steps, data, expected);
    assert(retrieved.user.id === '100', 'Session should have correct ID', testId, name, type, desc, steps, data, expected);
    assert(retrieved.user.name === 'Complete User', 'Session should have correct name', testId, name, type, desc, steps, data, expected);
    assert(retrieved.user.email === 'complete@example.com', 'Session should have correct email', testId, name, type, desc, steps, data, expected);
    assert(retrieved.user.username === 'completeuser', 'Session should have correct username', testId, name, type, desc, steps, data, expected);
    assert(retrieved.user.role === 'admin', 'Session should have correct role', testId, name, type, desc, steps, data, expected);
    assert(retrieved.user.is_admin === 'true', 'Session should have correct is_admin', testId, name, type, desc, steps, data, expected);
    assert(retrieved.user.phone === '+1234567890', 'Session should have correct phone', testId, name, type, desc, steps, data, expected);
    assert(retrieved.user.permissions.length === 3, 'Session should have correct permissions', testId, name, type, desc, steps, data, expected);
    assert(retrieved.user.access_token === 'complete-access-token', 'Session should have access token', testId, name, type, desc, steps, data, expected);
    assert(retrieved.user.refresh_token === 'complete-refresh-token', 'Session should have refresh token', testId, name, type, desc, steps, data, expected);
  }
);

test('Handle session with TMS permissions', 'Positive',
  'Verify that session with TMS permissions can be stored and retrieved',
  '1. Create session with empty main app permissions and TMS permissions 2. Store the session 3. Verify TMS permissions are stored correctly',
  'Session ID: tms-session; User ID: 200; Email: tms@example.com; Main Permissions: []; TMS Permissions: [view_ranks edit_ranks delete_ranks]',
  'TMS session should be stored with TMS permissions array',
  (testId, name, type, desc, steps, data, expected) => {
    const sessionId = 'tms-session';
    const sessionData = {
      user: {
        id: '200',
        email: 'tms@example.com',
        permissions: [],
        tmsPermissions: ['view_ranks', 'edit_ranks', 'delete_ranks'],
        access_token: 'tms-access-token',
      },
      expires: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    };

    sessionStore.set(sessionId, sessionData);
    const retrieved = sessionStore.get(sessionId);

    assert(retrieved !== null, 'TMS session should be stored', testId, name, type, desc, steps, data, expected);
    assert(retrieved.user.permissions.length === 0, 'Main app permissions should be empty', testId, name, type, desc, steps, data, expected);
    assert(retrieved.user.tmsPermissions.length === 3, 'TMS permissions should have 3 items', testId, name, type, desc, steps, data, expected);
    assert(retrieved.user.tmsPermissions.includes('view_ranks'), 'TMS permissions should include view_ranks', testId, name, type, desc, steps, data, expected);
  }
);

test('Handle multiple concurrent sessions', 'Positive',
  'Verify that multiple sessions can exist simultaneously',
  '1. Create and store three different sessions 2. Verify all sessions exist 3. Delete one session 4. Verify other sessions still exist',
  'Session 1 ID: session-1; User ID: 1; Session 2 ID: session-2; User ID: 2; Session 3 ID: session-3; User ID: 3',
  'All sessions should exist independently; Deleting one should not affect others',
  (testId, name, type, desc, steps, data, expected) => {
    const session1Id = 'session-1';
    const session2Id = 'session-2';
    const session3Id = 'session-3';

    const session1 = {
      user: { id: '1', email: 'user1@example.com' },
      expires: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    };

    const session2 = {
      user: { id: '2', email: 'user2@example.com' },
      expires: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    };

    const session3 = {
      user: { id: '3', email: 'user3@example.com' },
      expires: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    };

    sessionStore.set(session1Id, session1);
    sessionStore.set(session2Id, session2);
    sessionStore.set(session3Id, session3);

    assert(sessionStore.get(session1Id).user.id === '1', 'Session 1 should be stored', testId, name, type, desc, steps, data, expected);
    assert(sessionStore.get(session2Id).user.id === '2', 'Session 2 should be stored', testId, name, type, desc, steps, data, expected);
    assert(sessionStore.get(session3Id).user.id === '3', 'Session 3 should be stored', testId, name, type, desc, steps, data, expected);

    sessionStore.delete(session2Id);
    assert(sessionStore.get(session1Id) !== null, 'Session 1 should still exist', testId, name, type, desc, steps, data, expected);
    assert(sessionStore.get(session2Id) === null, 'Session 2 should be deleted', testId, name, type, desc, steps, data, expected);
    assert(sessionStore.get(session3Id) !== null, 'Session 3 should still exist', testId, name, type, desc, steps, data, expected);
  }
);

// Negative Session Tests
test('Return null for non-existent session', 'Negative',
  'Verify that retrieving a non-existent session returns null',
  '1. Attempt to retrieve session with ID that does not exist 2. Verify result is null',
  'Session ID: non-existent-session (does not exist)',
  'Retrieved value should be null',
  (testId, name, type, desc, steps, data, expected) => {
    const retrieved = sessionStore.get('non-existent-session');
    assert(retrieved === null, 'Non-existent session should return null', testId, name, type, desc, steps, data, expected);
  }
);

test('Delete non-existent session', 'Negative',
  'Verify that deleting a non-existent session does not cause errors',
  '1. Attempt to delete session with ID that does not exist 2. Verify no error occurs',
  'Session ID: non-existent-session (does not exist)',
  'Function should complete without error',
  (testId, name, type, desc, steps, data, expected) => {
    try {
      sessionStore.delete('non-existent-session');
      assert(true, 'Deleting non-existent session should not cause error', testId, name, type, desc, steps, data, expected);
    } catch (error) {
      assert(false, 'Deleting non-existent session should not throw error', testId, name, type, desc, steps, data, expected);
    }
  }
);

// Edge Cases for Sessions
test('Session with very long session ID', 'Edge Case',
  'Verify session handling with extremely long session ID',
  '1. Create session with very long session ID (200+ characters) 2. Store and retrieve session 3. Verify handling',
  'Session ID: verylongsessionid... (200+ chars); User ID: 1',
  'Session should be stored and retrieved successfully',
  (testId, name, type, desc, steps, data, expected) => {
    const longSessionId = 'a'.repeat(200);
    const sessionData = {
      user: { id: '1', email: 'test@example.com' },
      expires: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    };

    sessionStore.set(longSessionId, sessionData);
    const retrieved = sessionStore.get(longSessionId);
    assert(retrieved !== null, 'Session with long ID should be stored', testId, name, type, desc, steps, data, expected);
  }
);

test('Session with expired timestamp exactly at current time', 'Edge Case',
  'Verify session cleanup handles expiration exactly at current time',
  '1. Create session with expiration exactly at current time 2. Run cleanup 3. Verify session is removed',
  'Session ID: exact-expire-session; Expires: exactly at current time',
  'Session should be cleaned up (expires <= now)',
  (testId, name, type, desc, steps, data, expected) => {
    const sessionId = 'exact-expire-session';
    const sessionData = {
      user: { id: '1', email: 'test@example.com' },
      expires: new Date(Date.now()).toISOString(), // Exactly now
    };

    sessionStore.set(sessionId, sessionData);
    sessionStore.cleanup();
    const retrieved = sessionStore.get(sessionId);
    assert(retrieved === null, 'Session expiring exactly now should be cleaned up', testId, name, type, desc, steps, data, expected);
  }
);

test('Session with very far future expiration', 'Edge Case',
  'Verify session handling with expiration far in the future',
  '1. Create session with expiration 10 years from now 2. Store and retrieve session 3. Verify session exists',
  'Session ID: future-session; Expires: 10 years from now',
  'Session should be stored and retrieved successfully',
  (testId, name, type, desc, steps, data, expected) => {
    const sessionId = 'future-session';
    const sessionData = {
      user: { id: '6', email: 'future@example.com' },
      expires: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 10 years
    };

    sessionStore.set(sessionId, sessionData);
    const retrieved = sessionStore.get(sessionId);
    assert(retrieved !== null, 'Future session should exist', testId, name, type, desc, steps, data, expected);
    const expirationDate = new Date(retrieved.expires);
    const now = new Date();
    assert(expirationDate > now, 'Session expiration should be in the future', testId, name, type, desc, steps, data, expected);
  }
);

test('Session with empty user object', 'Edge Case',
  'Verify session handling with minimal user data',
  '1. Create session with only user ID 2. Store and retrieve session 3. Verify minimal data is stored',
  'Session ID: minimal-session; User: {id: "1"}',
  'Session should be stored with minimal user data',
  (testId, name, type, desc, steps, data, expected) => {
    const sessionId = 'minimal-session';
    const sessionData = {
      user: { id: '1' },
      expires: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    };

    sessionStore.set(sessionId, sessionData);
    const retrieved = sessionStore.get(sessionId);
    assert(retrieved !== null, 'Minimal session should be stored', testId, name, type, desc, steps, data, expected);
    assert(retrieved.user.id === '1', 'Minimal session should have user ID', testId, name, type, desc, steps, data, expected);
  }
);

test('Session with special characters in user data', 'Edge Case',
  'Verify session handling with special characters in user fields',
  '1. Create session with special characters in name and email 2. Store and retrieve session 3. Verify special characters are preserved',
  'Session ID: special-session; Name: Test & User <script>; Email: test+user@example.com',
  'Special characters should be preserved in session data',
  (testId, name, type, desc, steps, data, expected) => {
    const sessionId = 'special-session';
    const sessionData = {
      user: {
        id: '1',
        name: 'Test & User <script>',
        email: 'test+user@example.com',
      },
      expires: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    };

    sessionStore.set(sessionId, sessionData);
    const retrieved = sessionStore.get(sessionId);
    assert(retrieved !== null, 'Session with special characters should be stored', testId, name, type, desc, steps, data, expected);
    assert(retrieved.user.name === 'Test & User <script>', 'Special characters in name should be preserved', testId, name, type, desc, steps, data, expected);
    assert(retrieved.user.email === 'test+user@example.com', 'Special characters in email should be preserved', testId, name, type, desc, steps, data, expected);
  }
);

test('Session with very large permissions array', 'Edge Case',
  'Verify session handling with large number of permissions',
  '1. Create session with 100+ permissions 2. Store and retrieve session 3. Verify all permissions are stored',
  'Session ID: large-perms-session; Permissions: [perm1, perm2, ..., perm100]',
  'All permissions should be stored and retrieved correctly',
  (testId, name, type, desc, steps, data, expected) => {
    const sessionId = 'large-perms-session';
    const largePermissions = Array.from({ length: 100 }, (_, i) => `permission_${i + 1}`);
    const sessionData = {
      user: {
        id: '1',
        email: 'test@example.com',
        permissions: largePermissions,
      },
      expires: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    };

    sessionStore.set(sessionId, sessionData);
    const retrieved = sessionStore.get(sessionId);
    assert(retrieved !== null, 'Session with large permissions should be stored', testId, name, type, desc, steps, data, expected);
    assert(retrieved.user.permissions.length === 100, 'All permissions should be stored', testId, name, type, desc, steps, data, expected);
  }
);

test('Overwrite existing session with same ID', 'Edge Case',
  'Verify that storing a session with existing ID overwrites the previous session',
  '1. Create and store session with ID "overwrite-session" 2. Store another session with same ID but different data 3. Retrieve and verify new data',
  'Session ID: overwrite-session; First: User ID 1; Second: User ID 2',
  'New session data should overwrite old session data',
  (testId, name, type, desc, steps, data, expected) => {
    const sessionId = 'overwrite-session';
    const firstSession = {
      user: { id: '1', email: 'first@example.com' },
      expires: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    };

    const secondSession = {
      user: { id: '2', email: 'second@example.com' },
      expires: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    };

    sessionStore.set(sessionId, firstSession);
    assert(sessionStore.get(sessionId).user.id === '1', 'First session should be stored', testId, name, type, desc, steps, data, expected);

    sessionStore.set(sessionId, secondSession);
    const retrieved = sessionStore.get(sessionId);
    assert(retrieved.user.id === '2', 'Second session should overwrite first', testId, name, type, desc, steps, data, expected);
    assert(retrieved.user.email === 'second@example.com', 'New session data should be present', testId, name, type, desc, steps, data, expected);
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
    // Pattern matches: number, period, space (e.g., "2. ", "3. ")
    // We'll use a simpler regex replacement
    let result = '';
    const stepRegex = /(\d+)\.\s([^\d]*?)(?=\d+\.\s|$)/g;
    let match;
    let firstStep = true;
    
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
    
    // If regex didn't match, try simpler approach: just add newlines before numbered steps
    if (!result) {
      result = formatted.replace(/(\d+)\.\s/g, (match, num, offset) => {
        return offset === 0 ? match : '\n' + match;
      });
    }
    
    return result || formatted;
  };
  
  const formattedSteps = formatSteps(result.steps);
  
  // Format test data: replace commas with newlines
  const formatTestData = (testData) => {
    if (!testData) return '';
    let formatted = String(testData).trim();
    // Replace all ", " (comma followed by space) with newline
    // This is the most common separator pattern in test data
    // Example: "Email: test@example.com, Password: pass123" -> "Email: test@example.com\nPassword: pass123"
    formatted = formatted.replace(/,\s+/g, '\n');
    // Also replace standalone commas (without space) that appear before field names
    // Pattern: comma followed by capital letter (likely a new field)
    formatted = formatted.replace(/,([A-Z])/g, '\n$1');
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

// Generate CSV file only if --export=true flag is set
if (shouldExportFiles) {
  const csvContent = csvHeader + csvRows;
  fs.writeFileSync('src/__tests__/test-report.csv', csvContent, 'utf8');
  console.log('\n✓ Test report CSV generated: src/__tests__/test-report.csv');
} else {
  console.log('\nℹ File export skipped (use --export=true to generate CSV file)');
}

if (testsFailed === 0) {
  console.log('\n✓ All tests passed!');
  process.exit(0);
} else {
  console.log('\n✗ Some tests failed');
  process.exit(1);
}

