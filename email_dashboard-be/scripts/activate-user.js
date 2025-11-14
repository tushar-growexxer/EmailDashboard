/**
 * Script to activate a Google user
 * 
 * Run with: node scripts/activate-user.js <email>
 * Example: node scripts/activate-user.js sap2@matangiindustries.com
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { MongoClient } = require('mongodb');

async function activateUser(email) {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.USERS_DATABASE || 'users';
  const collectionName = process.env.GOOGLE_USERS_COLLECTION || 'google-users';

  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env file');
    process.exit(1);
  }

  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: node scripts/activate-user.js <email>');
    console.log('Example: node scripts/activate-user.js sap2@matangiindustries.com');
    process.exit(1);
  }

  console.log(`🔄 Activating user: ${email}`);
  console.log(`📦 Database: ${dbName}`);
  console.log(`📁 Collection: ${collectionName}`);

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Find the user
    const user = await collection.findOne({ email });

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      console.log('Available users:');
      const allUsers = await collection.find({}).toArray();
      allUsers.forEach(u => console.log(`   - ${u.email} (active: ${u.isActive})`));
      process.exit(1);
    }

    console.log(`\n📊 Current user status:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Active: ${user.isActive}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Manager: ${user.isManager || false}`);
    console.log(`   Onboarding: ${user.hasCompletedOnboarding || false}`);

    if (user.isActive) {
      console.log('\n✅ User is already active!');
      return;
    }

    // Activate the user and add missing fields
    const result = await collection.updateOne(
      { email },
      { 
        $set: { 
          isActive: true,
          isManager: user.isManager || false,
          hasCompletedOnboarding: user.hasCompletedOnboarding || false,
          lastLogin: user.lastLogin || new Date()
        } 
      }
    );

    if (result.modifiedCount > 0) {
      console.log('\n✅ User activated successfully!');
      
      // Show updated status
      const updatedUser = await collection.findOne({ email });
      console.log(`\n📊 Updated user status:`);
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   Active: ${updatedUser.isActive}`);
      console.log(`   Role: ${updatedUser.role}`);
      console.log(`   Manager: ${updatedUser.isManager}`);
      console.log(`   Onboarding: ${updatedUser.hasCompletedOnboarding}`);
    } else {
      console.log('\n⚠️  No changes made');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Get email from command line arguments
const email = process.argv[2];

activateUser(email)
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
