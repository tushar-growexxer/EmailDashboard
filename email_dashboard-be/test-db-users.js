// Test script to check users in SAP HANA database
require('dotenv').config({ path: __dirname + '/.env' });
const hdb = require('hdb');
const path = require('path');

// Load environment variables
const envPath = path.resolve(__dirname, '.env');
console.log(`Loading environment from: ${envPath}`);

const config = {
  host: process.env.SAP_HANA_VPN_HOST || process.env.SAP_HANA_HOST,
  port: parseInt(process.env.SAP_HANA_PORT || '30015'),
  user: process.env.SAP_HANA_USER,
  password: process.env.SAP_HANA_PASSWORD,
};

// Validate required environment variables
const requiredVars = ['SAP_HANA_HOST', 'SAP_HANA_PORT', 'SAP_HANA_USER', 'SAP_HANA_PASSWORD', 'SAP_HANA_SCHEMA', 'SAP_HANA_USERS_TABLE'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`  - ${varName}`));
  console.error('\nPlease check your .env file');
  process.exit(1);
}

console.log('Connecting to SAP HANA...');
console.log(`Host: ${config.host}:${config.port}`);
console.log(`User: ${config.user}`);
console.log(`Schema: ${process.env.SAP_HANA_SCHEMA}`);
console.log(`Table: ${process.env.SAP_HANA_USERS_TABLE}`);

const client = hdb.createClient(config);

client.connect((err) => {
  if (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }
  
  console.log('✅ Connected to SAP HANA');
  
  const schema = process.env.SAP_HANA_SCHEMA;
  const table = process.env.SAP_HANA_USERS_TABLE;
  const tableName = `"${schema}"."@${table}"`;
  
  // Query to get all users
  const sql = `SELECT "Code" as "id", "U_Email" as "email", "Name" as "fullName", "U_Role" as "role", "U_Department" as "department" FROM ${tableName}`;
  
  console.log('\n📊 Querying users table...');
  console.log('SQL:', sql);
  
  client.exec(sql, (err, rows) => {
    if (err) {
      console.error('❌ Query failed:', err.message);
      client.close();
      process.exit(1);
    }
    
    console.log(`\n✅ Found ${rows.length} user(s):\n`);
    rows.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.fullName}`);
      console.log(`Role: ${user.role}`);
      console.log(`Department: ${user.department}`);
      console.log('---');
    });
    
    client.close();
    process.exit(0);
  });
});

