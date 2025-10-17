/**
 * Simple API test script for Email Dashboard API
 * Run this script to test basic API functionality
 * 
 * Prerequisites:
 * 1. Start the API server: pnpm dev
 * 2. Update the base URL if needed
 * 3. Ensure you have a valid admin user in the database
 */

const baseURL = 'http://192.168.10.6:3000/api/v1';
let authToken = '';

// Test credentials (update these with your actual admin credentials)
const testCredentials = {
  email: 'admin@example.com',
  password: 'admin123'
};

/**
 * Make HTTP request
 */
async function makeRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  const data = await response.json();
  return { status: response.status, data };
}

/**
 * Test login endpoint
 */
async function testLogin() {
  console.log('🔐 Testing login...');

  const { status, data } = await makeRequest(`${baseURL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify(testCredentials)
  });

  if (status === 200 && data.success) {
    authToken = data.token;
    console.log('✅ Login successful');
    console.log('   Token received:', authToken.substring(0, 20) + '...');
    return true;
  } else {
    console.log('❌ Login failed:', data.message);
    return false;
  }
}

/**
 * Test token validation
 */
async function testValidateToken() {
  console.log('🔍 Testing token validation...');

  const { status, data } = await makeRequest(`${baseURL}/auth/validate`, {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  if (status === 200 && data.success) {
    console.log('✅ Token validation successful');
    return true;
  } else {
    console.log('❌ Token validation failed:', data.message);
    return false;
  }
}

/**
 * Test get profile
 */
async function testGetProfile() {
  console.log('👤 Testing get profile...');

  const { status, data } = await makeRequest(`${baseURL}/auth/profile`, {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  if (status === 200 && data.success) {
    console.log('✅ Get profile successful');
    console.log('   User:', data.user.email, 'Role:', data.user.role);
    return true;
  } else {
    console.log('❌ Get profile failed:', data.message);
    return false;
  }
}

/**
 * Test get all users
 */
async function testGetAllUsers() {
  console.log('👥 Testing get all users...');

  const { status, data } = await makeRequest(`${baseURL}/users`, {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  if (status === 200 && data.success) {
    console.log('✅ Get all users successful');
    console.log('   Users count:', data.users.length);
    return true;
  } else {
    console.log('❌ Get all users failed:', data.message);
    return false;
  }
}

/**
 * Test create user
 */
async function testCreateUser() {
  console.log('➕ Testing create user...');

  const newUser = {
    fullName: 'Test User',
    email: `testuser${Date.now()}@example.com`,
    password: 'testpassword123',
    role: 'user'
  };

  const { status, data } = await makeRequest(`${baseURL}/users`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(newUser)
  });

  if (status === 201 && data.success) {
    console.log('✅ Create user successful');
    console.log('   Created user:', data.user.email);
    return data.user.id;
  } else {
    console.log('❌ Create user failed:', data.message);
    return null;
  }
}

/**
 * Test get user by ID
 */
async function testGetUserById(userId) {
  console.log('🔍 Testing get user by ID...');

  const { status, data } = await makeRequest(`${baseURL}/users/${userId}`, {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  if (status === 200 && data.success) {
    console.log('✅ Get user by ID successful');
    console.log('   User:', data.user.email);
    return true;
  } else {
    console.log('❌ Get user by ID failed:', data.message);
    return false;
  }
}

/**
 * Test update user
 */
async function testUpdateUser(userId) {
  console.log('✏️ Testing update user...');

  const updateData = {
    fullName: 'Updated Test User',
    role: 'admin'
  };

  const { status, data } = await makeRequest(`${baseURL}/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(updateData)
  });

  if (status === 200 && data.success) {
    console.log('✅ Update user successful');
    console.log('   Updated user:', data.user.fullName);
    return true;
  } else {
    console.log('❌ Update user failed:', data.message);
    return false;
  }
}

/**
 * Test delete user
 */
async function testDeleteUser(userId) {
  console.log('🗑️ Testing delete user...');

  const { status, data } = await makeRequest(`${baseURL}/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  if (status === 200 && data.success) {
    console.log('✅ Delete user successful');
    return true;
  } else {
    console.log('❌ Delete user failed:', data.message);
    return false;
  }
}

/**
 * Test logout
 */
async function testLogout() {
  console.log('🚪 Testing logout...');

  const { status, data } = await makeRequest(`${baseURL}/auth/logout`, {
    method: 'POST'
  });

  if (status === 200 && data.success) {
    console.log('✅ Logout successful');
    return true;
  } else {
    console.log('❌ Logout failed:', data.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting API tests...\n');

  try {
    // Test authentication
    const loginSuccess = await testLogin();
    if (!loginSuccess) {
      console.log('❌ Cannot proceed without authentication');
      return;
    }
    console.log('');

    // Test token validation
    await testValidateToken();
    console.log('');

    // Test profile
    await testGetProfile();
    console.log('');

    // Test user management
    await testGetAllUsers();
    console.log('');

    const userId = await testCreateUser();
    console.log('');

    if (userId) {
      await testGetUserById(userId);
      console.log('');

      await testUpdateUser(userId);
      console.log('');

      await testDeleteUser(userId);
      console.log('');
    }

    // Test logout
    await testLogout();
    console.log('');

    console.log('🎉 All tests completed!');
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ or a fetch polyfill');
  console.log('   Install node-fetch: npm install node-fetch');
  console.log('   Then add: import fetch from "node-fetch";');
} else {
  runTests();
}
