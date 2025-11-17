const { hashSync } = require('bcryptjs');

// Change this to your desired admin password
const password = 'admin123';

if (!password) {
  console.error('❌ Please set the password variable in this script');
  process.exit(1);
}

const hash = hashSync(password, 12);

console.log('\n🔐 Password Hash Generator');
console.log('=======================\n');
console.log(`Password: ${password}`);
console.log(`Hash: ${hash}\n`);
console.log('💡 Copy the hash above and add it to your .env file as:');
console.log(`ADMIN_PASSWORD_HASH="${hash}"\n`);
