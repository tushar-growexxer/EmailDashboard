/**
 * Test script for LDAP sync functionality
 * Run with: node test-ldap-sync.js
 * 
 * NOTE: This script only TESTS the LDAP connection.
 * It does NOT add users to MongoDB.
 * To sync users to MongoDB, use the API endpoint or frontend UI.
 */

const ldap = require('ldapjs');

console.log('🔍 Testing LDAP Connection and User Fetch\n');
console.log('⚠️  NOTE: This script only tests LDAP connection.');
console.log('   It does NOT add users to MongoDB.\n');

const testLdapSync = async () => {
  const client = ldap.createClient({
    url: 'ldap://192.168.10.2:389',
    timeout: 10000,
    connectTimeout: 15000,
  });

  try {
    // Bind with credentials
    await new Promise((resolve, reject) => {
      client.bind('sap.support@matangi.com', 'Matangi@123', (err) => {
        if (err) {
          console.error('❌ Authentication failed:', err.message);
          reject(err);
          return;
        }
        console.log('✅ Authentication successful\n');
        resolve();
      });
    });

    // Search for users
    console.log('🔍 Searching for users...\n');
    
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

    const users = [];

    await new Promise((resolve, reject) => {
      client.search('dc=matangi,dc=com', searchOptions, (err, res) => {
        if (err) {
          console.error('❌ Search failed:', err.message);
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
            users.push({
              sAMAccountName: attributes.sAMAccountName,
              displayName: attributes.displayName || attributes.cn || attributes.sAMAccountName,
              userPrincipalName: attributes.userPrincipalName,
              mail: attributes.mail,
              cn: attributes.cn,
              distinguishedName: entry.dn.toString(),
            });
          }
        });

        res.on('error', (err) => {
          console.error('❌ Search error:', err.message);
          reject(err);
        });

        res.on('end', () => {
          console.log(`✅ Search completed. Found ${users.length} valid users\n`);
          resolve();
        });
      });
    });

    // Display first 5 users as sample
    console.log('📋 Sample Users (first 5):\n');
    users.slice(0, 5).forEach((user, index) => {
      console.log(`${index + 1}. ${user.displayName}`);
      console.log(`   Username: ${user.sAMAccountName}`);
      console.log(`   Email: ${user.userPrincipalName || user.mail || 'N/A'}`);
      console.log(`   DN: ${user.distinguishedName}`);
      console.log('');
    });

    console.log(`\n✅ Test completed successfully!`);
    console.log(`📊 Total users found: ${users.length}`);
    console.log('\n💡 Next steps:');
    console.log('   1. Start your backend server');
    console.log('   2. Login as admin');
    console.log('   3. Go to Settings > LDAP Users tab');
    console.log('   4. Click "Refresh from LDAP" button');

    client.unbind();
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    client.unbind();
    process.exit(1);
  }
};

testLdapSync();
