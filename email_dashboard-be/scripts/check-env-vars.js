/**
 * Script to check environment variables related to domain management
 * Usage: node scripts/check-env-vars.js
 */

require('dotenv').config();

console.log('Environment Variables Check:\n');
console.log('EMAIL_DATABASE:', process.env.EMAIL_DATABASE || '(not set)');
console.log('ANALYTICS_DATABASE:', process.env.ANALYTICS_DATABASE || '(not set)');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '***set***' : '(not set)');
console.log('CONNECTION_STRING:', process.env.CONNECTION_STRING ? '***set***' : '(not set)');

console.log('\nResolved database name (what the code will use):');
const databaseName = process.env.EMAIL_DATABASE || process.env.ANALYTICS_DATABASE || 'email_analytics';
console.log(`→ ${databaseName}`);

console.log('\nTo fix:');
if (!process.env.EMAIL_DATABASE) {
  console.log('1. Add EMAIL_DATABASE=your_database_name to your .env file');
  console.log('   Example: EMAIL_DATABASE=maildb');
} else {
  console.log(`✅ EMAIL_DATABASE is set to: ${process.env.EMAIL_DATABASE}`);
}

