#!/usr/bin/env node

/**
 * Test script to verify backend API endpoints are working
 * Run this script to test the authentication endpoints before testing the frontend
 */

const API_BASE_URL = 'http://192.168.10.6:3000/api/v1';

async function testAPI() {
  console.log('🧪 Testing Email Dashboard Backend API...\n');

  try {
    // Test 1: Check if server is running
    console.log('1️⃣  Testing server connectivity...');
    const response = await fetch(`${API_BASE_URL.replace('/api/v1', '')}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log('✅ Server is running and accessible');
    } else {
      console.log('❌ Server is not accessible. Make sure to start the backend server:');
      console.log('   cd email_dashboard-be && npm run dev');
      return;
    }
  } catch (error) {
    console.log('❌ Cannot connect to server. Please start the backend server first:');
    console.log('   cd email_dashboard-be && npm run dev');
    return;
  }

  // Test 2: Test login endpoint (will fail without valid credentials but should return proper error)
  console.log('\n2️⃣  Testing login endpoint...');
  try {
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword',
      }),
    });

    const loginData = await loginResponse.json();

    if (loginResponse.status === 401) {
      console.log('✅ Login endpoint working (returns 401 for invalid credentials)');
    } else if (loginResponse.status === 400) {
      console.log('✅ Login endpoint working (returns 400 for missing/invalid data)');
    } else {
      console.log('⚠️  Login endpoint returned unexpected status:', loginResponse.status);
    }
  } catch (error) {
    console.log('❌ Login endpoint error:', error.message);
  }

  // Test 3: Test logout endpoint
  console.log('\n3️⃣  Testing logout endpoint...');
  try {
    const logoutResponse = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const logoutData = await logoutResponse.json();

    if (logoutResponse.ok && logoutData.success) {
      console.log('✅ Logout endpoint working');
    } else {
      console.log('⚠️  Logout endpoint returned unexpected response');
    }
  } catch (error) {
    console.log('❌ Logout endpoint error:', error.message);
  }

  // Test 4: Test profile endpoint (should return 401 without token)
  console.log('\n4️⃣  Testing profile endpoint (without token)...');
  try {
    const profileResponse = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (profileResponse.status === 401) {
      console.log('✅ Profile endpoint working (returns 401 without authentication)');
    } else {
      console.log('⚠️  Profile endpoint returned unexpected status:', profileResponse.status);
    }
  } catch (error) {
    console.log('❌ Profile endpoint error:', error.message);
  }

  // Test 5: Test token validation endpoint (should return 401 without token)
  console.log('\n5️⃣  Testing token validation endpoint (without token)...');
  try {
    const validateResponse = await fetch(`${API_BASE_URL}/auth/validate`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (validateResponse.status === 401) {
      console.log('✅ Token validation endpoint working (returns 401 without token)');
    } else {
      console.log('⚠️  Token validation endpoint returned unexpected status:', validateResponse.status);
    }
  } catch (error) {
    console.log('❌ Token validation endpoint error:', error.message);
  }

  console.log('\n🎉 API testing complete!');
  console.log('\n📋 Next steps:');
  console.log('   1. Start the backend server: cd email_dashboard-be && npm run dev');
  console.log('   2. Start the frontend server: cd email_dashboard-fe && npm run dev');
  console.log('   3. Open http://192.168.10.6:5173 in your browser');
  console.log('   4. Try logging in with test credentials');
  console.log('\n💡 If you need test user data, check the backend database setup in scripts/init-database.sql');
}

// Run the tests
testAPI().catch(console.error);
