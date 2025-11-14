/**
 * List all Google OAuth users
 * 
 * Run with: node scripts/list-users.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { MongoClient } = require('mongodb');

async function listUsers() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.USERS_DATABASE || 'users';
  const collectionName = process.env.GOOGLE_USERS_COLLECTION || 'google-users';

  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env file');
    process.exit(1);
  }

  console.log('🔄 Listing Google OAuth users...');
  console.log(`📦 Database: ${dbName}`);
  console.log(`📁 Collection: ${collectionName}`);

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

    const users = await collection.find({}).toArray();

    if (users.length === 0) {
      console.log('📭 No users found in database');
      console.log('\nThis means:');
      console.log('   - No one has logged in with Google yet');
      console.log('   - Or MongoDB connection is failing during login');
      console.log('\nTry:');
      console.log('   1. Log in with Google');
      console.log('   2. Check backend logs for MongoDB errors');
      console.log('   3. Run: node scripts/test-mongodb-connection.js');
    } else {
      console.log(`👥 Found ${users.length} user(s):\n`);
      
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   Name: ${user.displayName}`);
        console.log(`   Active: ${user.isActive ? '✅' : '❌'}`);
        console.log(`   Manager: ${user.isManager ? '✅' : '❌'}`);
        console.log(`   Onboarding: ${user.hasCompletedOnboarding ? 'Completed' : 'Pending'}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log(`   Last Login: ${user.lastLogin}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('SSL') || error.message.includes('TLS')) {
      console.log('\n💡 SSL/TLS Error - Run: node scripts/test-mongodb-connection.js');
    }
    
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

listUsers()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
