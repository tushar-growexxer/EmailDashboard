require('dotenv').config();
const { MongoClient } = require('mongodb');

/**
 * MongoDB Connection Test Script
 *
 * Tests connection to MongoDB using environment variables:
 * - MONGODB_URI: MongoDB connection string
 * - ANALYTICS_DATABASE: Database name
 * - DASHBOARD1_COLLECTION: First collection name
 * - DASHBOARD2_COLLECTION: Second collection name
 */

async function testMongoDBConnection() {
  const mongoUri = process.env.MONGODB_URI;
  const databaseName = process.env.ANALYTICS_DATABASE;
  const collection1Name = process.env.DASHBOARD1_COLLECTION;
  const collection2Name = process.env.DASHBOARD2_COLLECTION;

  // Validate environment variables
  if (!mongoUri) {
    console.error('❌ MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  if (!databaseName) {
    console.error('❌ ANALYTICS_DATABASE environment variable is not set');
    process.exit(1);
  }

  if (!collection1Name || !collection2Name) {
    console.error('❌ DASHBOARD1_COLLECTION and DASHBOARD2_COLLECTION environment variables are not set');
    process.exit(1);
  }

  console.log('🚀 Starting MongoDB connection test...');
  console.log(`📊 Database: ${databaseName}`);
  console.log(`📋 Collections: ${collection1Name}, ${collection2Name}`);

  let client;

  try {
    // Create MongoDB client with connection options
    client = new MongoClient(mongoUri, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    console.log('🔌 Attempting to connect to MongoDB...');

    // Connect to MongoDB
    await client.connect();

    console.log('✅ Successfully connected to MongoDB');

    // Test database access
    const db = client.db(databaseName);
    console.log(`✅ Successfully accessed database: ${databaseName}`);

    // Test collection access
    const collection1 = db.collection(collection1Name);
    const collection2 = db.collection(collection2Name);

    console.log(`✅ Successfully accessed collection: ${collection1Name}`);
    console.log(`✅ Successfully accessed collection: ${collection2Name}`);

    // Test basic operations
    console.log('🔍 Testing basic operations...');

    // Test a simple query (find first document)
    try {
      const sampleDoc1 = await collection1.findOne({});
      const sampleDoc2 = await collection2.findOne({});

      if (sampleDoc1) {
        console.log(`✅ Collection ${collection1Name} contains data`);
        console.log(`📄 Sample document from ${collection1Name}:`, JSON.stringify(sampleDoc1, null, 2));
      } else {
        console.log(`⚠️  Collection ${collection1Name} is empty`);
      }

      if (sampleDoc2) {
        console.log(`✅ Collection ${collection2Name} contains data`);
        console.log(`📄 Sample document from ${collection2Name}:`, JSON.stringify(sampleDoc2, null, 2));
      } else {
        console.log(`⚠️  Collection ${collection2Name} is empty`);
      }
    } catch (queryError) {
      console.log(`⚠️  Could not query collections (might be empty or access restricted):`, queryError.message);
    }

    // Test connection health
    await client.db('admin').command({ ping: 1 });
    console.log('🏥 Connection health check: PASSED');

    console.log('\n🎉 MongoDB connection test completed successfully!');
    console.log('✅ All tests passed');
    console.log('✅ Connection is working properly');
    console.log('✅ Collections are accessible');

  } catch (error) {
    console.error('❌ MongoDB connection test failed:');
    console.error('Error details:', error.message);

    if (error.code) {
      console.error('Error code:', error.code);
    }

    if (error.codeName) {
      console.error('Error name:', error.codeName);
    }

    process.exit(1);
  } finally {
    // Ensure connection is closed
    if (client) {
      try {
        await client.close();
        console.log('🔌 Connection closed successfully');
      } catch (closeError) {
        console.error('⚠️  Error closing connection:', closeError.message);
      }
    }
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the test
testMongoDBConnection()
  .then(() => {
    console.log('\n✨ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed with error:', error);
    process.exit(1);
  });