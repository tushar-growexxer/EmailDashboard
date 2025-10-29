/**
 * Test script for MongoDB sync functionality
 * Run with: node test-mongodb-sync.js
 *
 * This script tests the complete flow:
 * 1. Fetch users from LDAP
 * 2. Add them to MongoDB
 * 3. Check for duplicates
 */

require('dotenv').config();
const ldap = require('ldapjs');
const { MongoClient } = require('mongodb');

console.log('🔍 Testing LDAP to MongoDB Sync\n');

const testMongoDBSync = async () => {
  let ldapClient = null;
  let mongoClient = null;

  try {
    // Step 1: Connect to LDAP and fetch users
    console.log('📡 Step 1: Connecting to LDAP...\n');

    ldapClient = ldap.createClient({
      url: process.env.LDAP_URL || 'ldap://192.168.10.2:389',
      timeout: 10000,
      connectTimeout: 15000,
    });

    // Bind with credentials
    await new Promise((resolve, reject) => {
      // Try multiple bind DN formats
      const bindDNOptions = [
        process.env.LDAP_BIND_DN,
        'sap.support@matangi.com',
        'cn=sap.support,dc=matangi,dc=com',
      ].filter(Boolean);

      const bindPassword = process.env.LDAP_BIND_PASSWORD || 'Matangi@123';

      console.log(`Trying to authenticate with:`);
      console.log(`  URL: ${process.env.LDAP_URL || 'ldap://192.168.10.2:389'}`);
      console.log(`  Bind DN options: ${bindDNOptions.join(', ')}`);
      console.log('');

      let lastError = null;
      let authenticated = false;

      const tryBind = async (index) => {
        if (index >= bindDNOptions.length) {
          console.error('❌ All authentication attempts failed');
          console.error('Last error:', lastError?.message);
          console.log('\n💡 Troubleshooting:');
          console.log('   1. Verify LDAP server is accessible: ping 192.168.10.2');
          console.log('   2. Check LDAP_BIND_DN in .env file');
          console.log('   3. Check LDAP_BIND_PASSWORD in .env file');
          console.log('   4. Try connecting with an LDAP client tool');
          reject(lastError);
          return;
        }

        const bindDN = bindDNOptions[index];
        console.log(`Attempt ${index + 1}: Trying ${bindDN}...`);

        ldapClient.bind(bindDN, bindPassword, (err) => {
          if (err) {
            lastError = err;
            console.log(`  ❌ Failed: ${err.message}`);
            tryBind(index + 1);
          } else {
            authenticated = true;
            console.log(`  ✅ Success with: ${bindDN}\n`);
            resolve();
          }
        });
      };

      tryBind(0);
    });

    // Search for users
    console.log('🔍 Searching for LDAP users...\n');

    const searchOptions = {
      scope: 'sub',
      filter: '(objectClass=user)',
      attributes: [
        'sAMAccountName',
        'displayName',
        'userPrincipalName',
        'mail',
        'cn',
        'distinguishedName',
      ],
    };

    const ldapUsers = [];

    await new Promise((resolve, reject) => {
      const baseDN = process.env.LDAP_BASE_DN || 'dc=matangi,dc=com';

      ldapClient.search(baseDN, searchOptions, (err, res) => {
        if (err) {
          console.error('❌ LDAP search failed:', err.message);
          reject(err);
          return;
        }

        res.on('searchEntry', (entry) => {
          const attributes = {};
          entry.attributes.forEach((attr) => {
            if (attr.values && attr.values.length > 0) {
              attributes[attr.type] = attr.values.length === 1 ? attr.values[0] : attr.values;
            }
          });

          // Only process users with sAMAccountName and skip computer accounts
          if (
            attributes.sAMAccountName &&
            attributes.userPrincipalName &&
            !attributes.userPrincipalName.endsWith('$')
          ) {
            ldapUsers.push({
              sAMAccountName: attributes.sAMAccountName,
              displayName: attributes.displayName || attributes.cn || attributes.sAMAccountName,
              userPrincipalName: attributes.userPrincipalName,
              mail: attributes.mail,
              cn: attributes.cn,
              distinguishedName: entry.dn.toString(),
              role: 'user',
              isActive: false,
              syncedAt: new Date(),
            });
          }
        });

        res.on('error', (err) => {
          console.error('❌ LDAP search error:', err.message);
          reject(err);
        });

        res.on('end', () => {
          console.log(`✅ Found ${ldapUsers.length} valid LDAP users\n`);
          resolve();
        });
      });
    });

    ldapClient.unbind();
    ldapClient = null;

    if (ldapUsers.length === 0) {
      console.log('⚠️  No users found in LDAP. Exiting.\n');
      return;
    }

    // Step 2: Connect to MongoDB
    console.log('📡 Step 2: Connecting to MongoDB...\n');

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    console.log('✅ MongoDB connection successful\n');

    // Get database and collection
    const dbName = process.env.USERS_DATABASE || 'users';
    const collectionName = process.env.LDAP_USERS_COLLECTION || 'ldap-users';

    const db = mongoClient.db(dbName);
    const collection = db.collection(collectionName);

    console.log(`📊 Using database: ${dbName}`);
    console.log(`📊 Using collection: ${collectionName}\n`);

    // Step 3: Create unique index
    console.log('🔧 Step 3: Creating unique index on sAMAccountName...\n');

    try {
      await collection.createIndex({ sAMAccountName: 1 }, { unique: true });
      console.log('✅ Unique index created\n');
    } catch (indexError) {
      console.log('ℹ️  Index already exists (skipped)\n');
    }

    // Step 4: Sync users to MongoDB
    console.log('💾 Step 4: Syncing users to MongoDB...\n');

    let usersAdded = 0;
    let usersUpdated = 0;
    let usersSkipped = 0;

    for (const ldapUser of ldapUsers) {
      try {
        // Use updateOne with upsert to either insert or update
        const result = await collection.updateOne(
          { sAMAccountName: ldapUser.sAMAccountName },
          {
            $set: {
              displayName: ldapUser.displayName,
              userPrincipalName: ldapUser.userPrincipalName,
              distinguishedName: ldapUser.distinguishedName,
              syncedAt: ldapUser.syncedAt,
            },
            $setOnInsert: {
              // These fields are only set when inserting a new document
              role: ldapUser.role,
              isActive: ldapUser.isActive,
              lastLogin: ldapUser.lastLogin,
            },
          },
          { upsert: true }
        );

        // Check if this was an insert or update
        if (result.upsertedCount > 0) {
          usersAdded++;
          console.log(`  ✅ Added: ${ldapUser.displayName} (${ldapUser.sAMAccountName})`);
        } else if (result.modifiedCount > 0) {
          usersUpdated++;
          console.log(`  🔄 Updated: ${ldapUser.displayName} (${ldapUser.sAMAccountName})`);
        } else {
          usersSkipped++;
          console.log(
            `  ⏭️  Skipped (no changes): ${ldapUser.displayName} (${ldapUser.sAMAccountName})`
          );
        }
      } catch (userError) {
        // Handle duplicate key error gracefully
        if (userError.code === 11000) {
          usersSkipped++;
          console.log(
            `  ⚠️  Duplicate skipped: ${ldapUser.displayName} (${ldapUser.sAMAccountName})`
          );
        } else {
          console.error(`  ❌ Error syncing ${ldapUser.sAMAccountName}:`, userError.message);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Sync Summary:');
    console.log('='.repeat(60));
    console.log(`Total LDAP users found: ${ldapUsers.length}`);
    console.log(`Users added to MongoDB: ${usersAdded}`);
    console.log(`Users updated in MongoDB: ${usersUpdated}`);
    console.log(`Users skipped (no changes): ${usersSkipped}`);
    console.log('='.repeat(60));

    // Step 5: Verify data in MongoDB
    console.log('\n🔍 Step 5: Verifying data in MongoDB...\n');

    const totalInMongoDB = await collection.countDocuments();
    console.log(`✅ Total users in MongoDB: ${totalInMongoDB}\n`);

    // Show sample users
    console.log('📋 Sample users from MongoDB (first 5):\n');
    const sampleUsers = await collection.find().limit(5).toArray();

    sampleUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.displayName}`);
      console.log(`   Username: ${user.sAMAccountName}`);
      console.log(`   Email: ${user.userPrincipalName || user.mail || 'N/A'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Synced: ${user.syncedAt}`);
      console.log('');
    });

    console.log('✅ Test completed successfully!\n');
    console.log('💡 Next steps:');
    console.log('   1. Start your backend server: npm run dev');
    console.log('   2. Login as admin');
    console.log('   3. Go to Settings > LDAP Users tab');
    console.log('   4. View and manage synced users\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    // Cleanup
    if (ldapClient) {
      try {
        ldapClient.unbind();
      } catch (e) {
        // Ignore
      }
    }
    if (mongoClient) {
      try {
        await mongoClient.close();
        console.log('🔌 MongoDB connection closed\n');
      } catch (e) {
        // Ignore
      }
    }
  }
};

testMongoDBSync();
