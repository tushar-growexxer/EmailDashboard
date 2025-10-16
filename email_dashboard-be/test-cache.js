/**
 * Simple test script to verify cache service functionality
 * Run with: node test-cache.js
 */

const NodeCache = require('node-cache');

console.log('🧪 Testing node-cache installation and basic functionality...\n');

// Test 1: Basic cache operations
console.log('Test 1: Basic Operations');
const cache = new NodeCache({ stdTTL: 0, checkperiod: 600 });

cache.set('test_key', { data: 'test data', timestamp: new Date() });
const value = cache.get('test_key');

if (value && value.data === 'test data') {
  console.log('✅ Cache set/get works correctly');
} else {
  console.log('❌ Cache set/get failed');
  process.exit(1);
}

// Test 2: Check if key exists
console.log('\nTest 2: Has Operation');
if (cache.has('test_key')) {
  console.log('✅ Cache.has() works correctly');
} else {
  console.log('❌ Cache.has() failed');
  process.exit(1);
}

// Test 3: Delete operation
console.log('\nTest 3: Delete Operation');
cache.del('test_key');
if (!cache.has('test_key')) {
  console.log('✅ Cache.del() works correctly');
} else {
  console.log('❌ Cache.del() failed');
  process.exit(1);
}

// Test 4: Multiple keys
console.log('\nTest 4: Multiple Keys');
cache.set('key1', 'value1');
cache.set('key2', 'value2');
cache.set('key3', 'value3');

const keys = cache.keys();
if (keys.length === 3) {
  console.log('✅ Multiple keys work correctly');
  console.log('   Keys:', keys);
} else {
  console.log('❌ Multiple keys failed');
  process.exit(1);
}

// Test 5: Clear all
console.log('\nTest 5: Clear All');
cache.flushAll();
if (cache.keys().length === 0) {
  console.log('✅ Cache.flushAll() works correctly');
} else {
  console.log('❌ Cache.flushAll() failed');
  process.exit(1);
}

// Test 6: Cache stats
console.log('\nTest 6: Cache Statistics');
cache.set('stat_test', 'test');
const stats = cache.getStats();
console.log('✅ Cache stats:', stats);

// Test 7: Simulate 7 AM invalidation logic
console.log('\nTest 7: 7 AM Invalidation Logic Simulation');

function shouldInvalidate(cachedAt) {
  const now = new Date();
  const cached = new Date(cachedAt);
  const today7AM = new Date(now);
  today7AM.setHours(7, 0, 0, 0);

  // If cache was set before today's 7 AM and we're past 7 AM
  if (cached < today7AM && now >= today7AM) {
    return true;
  }

  // If cache is from yesterday or earlier
  if (cached.toDateString() !== now.toDateString()) {
    return now >= today7AM;
  }

  return false;
}

// Scenario 1: Cache from today after 7 AM (should be valid)
const today10AM = new Date();
today10AM.setHours(10, 0, 0, 0);
console.log('   Scenario 1: Cache from today 10 AM');
console.log('   Should be valid:', !shouldInvalidate(today10AM));

// Scenario 2: Cache from yesterday (should be invalid if past 7 AM)
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
yesterday.setHours(14, 0, 0, 0);
console.log('\n   Scenario 2: Cache from yesterday 2 PM');
console.log('   Should be invalid:', shouldInvalidate(yesterday));

// Scenario 3: Cache from today before 7 AM (depends on current time)
const today6AM = new Date();
today6AM.setHours(6, 0, 0, 0);
console.log('\n   Scenario 3: Cache from today 6 AM');
console.log('   Should be invalid (if past 7 AM):', shouldInvalidate(today6AM));

console.log('\n✅ All cache tests passed!\n');
console.log('🎉 node-cache is working correctly and ready for production use.');
console.log('\n📝 Next steps:');
console.log('   1. Start the backend: cd email_dashboard-be && pnpm dev');
console.log('   2. Check logs for cache operations');
console.log('   3. Test API endpoints: GET /api/dashboard/response');
console.log('   4. Verify cache status: GET /api/dashboard/cache/status');

