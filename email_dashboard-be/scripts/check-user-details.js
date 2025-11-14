/**
 * Check detailed user information
 * 
 * Run with: node scripts/check-user-details.js <email>
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { MongoClient } = require('mongodb');

async function checkUser(email) {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.USERS_DATABASE || 'users';
  const collectionName = process.env.GOOGLE_USERS_COLLECTION || 'google-users';

  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env file');
    process.exit(1);
  }

  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: node scripts/check-user-details.js <email>');
    process.exit(1);
  }

  const client = new MongoClient(uri, {
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true,
  });

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const user = await collection.findOne({ email });

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log('📊 Complete User Document:\n');
    console.log(JSON.stringify(user, null, 2));

    console.log('\n📋 Field Check:');
    console.log(`   hasCompletedOnboarding exists: ${user.hasOwnProperty('hasCompletedOnboarding')}`);
    console.log(`   hasCompletedOnboarding value: ${user.hasCompletedOnboarding}`);
    console.log(`   hasCompletedOnboarding type: ${typeof user.hasCompletedOnboarding}`);
    
    console.log('\n🔄 Onboarding Logic:');
    console.log(`   hasCompletedOnboarding: ${user.hasCompletedOnboarding}`);
    console.log(`   !hasCompletedOnboarding: ${!user.hasCompletedOnboarding}`);
    console.log(`   Should show onboarding: ${!user.hasCompletedOnboarding ? 'YES' : 'NO'}`);
    console.log(`   URL parameter: onboarding=${!user.hasCompletedOnboarding}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

const email = process.argv[2];

checkUser(email)
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });
