/**
 * Test MongoDB Connection
 * 
 * Run with: node scripts/test-mongodb-connection.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { MongoClient } = require('mongodb');

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.USERS_DATABASE || 'users';

  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env file');
    process.exit(1);
  }

  console.log('🔄 Testing MongoDB connection...');
  console.log(`📦 Database: ${dbName}`);
  console.log(`🔗 URI: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`); // Hide password

  const client = new MongoClient(uri, {
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true,
    serverSelectionTimeoutMS: 10000,
  });

  try {
    console.log('\n⏳ Connecting...');
    await client.connect();
    console.log('✅ Connected to MongoDB successfully!');

    const db = client.db(dbName);
    
    // Test ping
    await db.admin().ping();
    console.log('✅ Ping successful!');

    // List collections
    const collections = await db.listCollections().toArray();
    console.log(`\n📁 Collections in database "${dbName}":`);
    if (collections.length === 0) {
      console.log('   (no collections yet)');
    } else {
      collections.forEach(col => {
        console.log(`   - ${col.name}`);
      });
    }

    // Check google-users collection
    const googleUsersCollection = process.env.GOOGLE_USERS_COLLECTION || 'google-users';
    const userCount = await db.collection(googleUsersCollection).countDocuments();
    console.log(`\n👥 Users in "${googleUsersCollection}": ${userCount}`);

    console.log('\n✅ MongoDB connection test passed!');
    console.log('✅ Your MongoDB is working correctly');

  } catch (error) {
    console.error('\n❌ MongoDB connection failed!');
    console.error('Error:', error.message);
    
    if (error.message.includes('SSL') || error.message.includes('TLS')) {
      console.log('\n💡 SSL/TLS Error Detected');
      console.log('Try adding these parameters to your MONGODB_URI:');
      console.log('   ?tls=true&tlsAllowInvalidCertificates=true');
      console.log('\nOr use local MongoDB:');
      console.log('   MONGODB_URI=mongodb://localhost:27017');
    }
    
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 Authentication Error');
      console.log('Check your MongoDB username and password in MONGODB_URI');
    }
    
    if (error.message.includes('timeout')) {
      console.log('\n💡 Connection Timeout');
      console.log('Check:');
      console.log('   - Internet connection');
      console.log('   - MongoDB Atlas IP whitelist');
      console.log('   - Firewall settings');
    }

    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testConnection()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
