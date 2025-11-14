/**
 * Script to check allowed domains in MongoDB
 * Usage: node scripts/check-allowed-domains.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function checkAllowedDomains() {
  const uri = process.env.MONGODB_URI || process.env.CONNECTION_STRING || 'mongodb://192.168.10.6:27017';
  const databaseName = process.env.EMAIL_DATABASE || process.env.ANALYTICS_DATABASE || 'email_analytics';
  const collectionName = 'ALLOWED_DOMAINS';

  console.log('Connecting to MongoDB...');
  console.log(`URI: ${uri}`);
  console.log(`Database: ${databaseName}`);
  console.log(`Collection: ${collectionName}`);

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB\n');

    const db = client.db(databaseName);
    const collection = db.collection(collectionName);

    // Get all domains
    const domains = await collection.find({}).toArray();
    console.log(`Found ${domains.length} domain(s) in database:\n`);

    domains.forEach((domain, index) => {
      console.log(`${index + 1}. Domain: "${domain.domain}"`);
      console.log(`   ID: ${domain._id}`);
      console.log(`   Created: ${domain.createdAt}`);
      console.log(`   Updated: ${domain.updatedAt}`);
      console.log(`   Created By: ${domain.createdBy || 'N/A'}`);
      console.log('');
    });

    // Test domain check
    const testEmail = 'test@matangiindustries.com';
    const emailDomain = testEmail.split('@')[1];
    const normalizedDomain = emailDomain.toLowerCase().trim().replace(/^www\./, '');

    console.log(`\nTesting domain check for: ${testEmail}`);
    console.log(`Extracted domain: ${emailDomain}`);
    console.log(`Normalized domain: ${normalizedDomain}`);

    const result = await collection.findOne({ domain: normalizedDomain });
    if (result) {
      console.log(`✅ Domain "${normalizedDomain}" is ALLOWED`);
    } else {
      console.log(`❌ Domain "${normalizedDomain}" is NOT ALLOWED`);
      console.log('\nAvailable domains:');
      domains.forEach(d => {
        console.log(`  - "${d.domain}" (matches: ${d.domain === normalizedDomain})`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nConnection closed');
  }
}

checkAllowedDomains();

