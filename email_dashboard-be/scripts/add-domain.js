/**
 * Script to add a domain to the allowed domains collection
 * Usage: node scripts/add-domain.js <domain>
 * Example: node scripts/add-domain.js matangiindustries.com
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function addDomain(domain) {
  if (!domain) {
    console.error('Error: Domain is required');
    console.log('Usage: node scripts/add-domain.js <domain>');
    console.log('Example: node scripts/add-domain.js matangiindustries.com');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI || process.env.CONNECTION_STRING || 'mongodb://192.168.10.6:27017';
  const databaseName = process.env.EMAIL_DATABASE || process.env.ANALYTICS_DATABASE || 'email_analytics';
  const collectionName = 'ALLOWED_DOMAINS';

  // Normalize domain
  const normalizedDomain = domain.toLowerCase().trim().replace(/^www\./, '');

  console.log('Connecting to MongoDB...');
  console.log(`URI: ${uri}`);
  console.log(`Database: ${databaseName}`);
  console.log(`Collection: ${collectionName}`);
  console.log(`Domain to add: ${domain} -> normalized: ${normalizedDomain}\n`);

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB\n');

    const db = client.db(databaseName);
    const collection = db.collection(collectionName);

    // Check if domain already exists
    const existing = await collection.findOne({ domain: normalizedDomain });
    if (existing) {
      console.log(`⚠️  Domain "${normalizedDomain}" already exists in the database`);
      console.log(`   ID: ${existing._id}`);
      console.log(`   Created: ${existing.createdAt}`);
      return;
    }

    // Add domain
    const domainDoc = {
      domain: normalizedDomain,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'script',
    };

    const result = await collection.insertOne(domainDoc);
    console.log(`✅ Domain "${normalizedDomain}" added successfully!`);
    console.log(`   ID: ${result.insertedId}`);
    console.log(`   Created: ${domainDoc.createdAt}`);

    // Verify
    const verify = await collection.findOne({ domain: normalizedDomain });
    if (verify) {
      console.log('\n✅ Verification: Domain found in database');
    } else {
      console.log('\n❌ Verification failed: Domain not found');
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nConnection closed');
  }
}

// Get domain from command line arguments
const domain = process.argv[2];
addDomain(domain);

