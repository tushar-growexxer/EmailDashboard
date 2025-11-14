/**
 * Migration Script: Add hasCompletedOnboarding field to existing Google users
 * 
 * This script updates all existing Google users in MongoDB to have the
 * hasCompletedOnboarding field set to true (since they've already logged in before)
 * 
 * Run with: node scripts/migrate-add-onboarding-field.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { MongoClient } = require('mongodb');

async function migrate() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.USERS_DATABASE || 'users';
  const collectionName = process.env.GOOGLE_USERS_COLLECTION || 'google-users';

  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env file');
    process.exit(1);
  }

  console.log('🔄 Starting migration...');
  console.log(`📦 Database: ${dbName}`);
  console.log(`📁 Collection: ${collectionName}`);

  const client = new MongoClient(uri);

  try {
    // Connect to MongoDB
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Find users without hasCompletedOnboarding field
    const usersWithoutField = await collection.countDocuments({
      hasCompletedOnboarding: { $exists: false }
    });

    console.log(`\n📊 Found ${usersWithoutField} users without hasCompletedOnboarding field`);

    if (usersWithoutField === 0) {
      console.log('✅ All users already have the field. No migration needed.');
      return;
    }

    // Update all users without the field
    // Set to true for existing users (they've already logged in before)
    const result = await collection.updateMany(
      { hasCompletedOnboarding: { $exists: false } },
      { $set: { hasCompletedOnboarding: true } }
    );

    console.log(`\n✅ Migration completed!`);
    console.log(`   Updated ${result.modifiedCount} users`);
    console.log(`   Set hasCompletedOnboarding: true for existing users`);

    // Verify the migration
    const totalUsers = await collection.countDocuments({});
    const usersWithField = await collection.countDocuments({
      hasCompletedOnboarding: { $exists: true }
    });

    console.log(`\n📊 Verification:`);
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Users with field: ${usersWithField}`);
    console.log(`   Users without field: ${totalUsers - usersWithField}`);

    if (totalUsers === usersWithField) {
      console.log('\n✅ All users now have the hasCompletedOnboarding field!');
    } else {
      console.log('\n⚠️  Some users still missing the field. Please check manually.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the migration
migrate()
  .then(() => {
    console.log('\n✅ Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });
