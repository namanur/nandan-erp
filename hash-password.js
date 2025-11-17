// hash-password.js
const { hashSync } = require('bcryptjs');

// 1. Put your desired password here
const myPassword = 'naman2210'; // Or any password you want

// 2. This will hash it
const hash = hashSync(myPassword, 10);

// 3. This prints the hash for you to copy
console.log('Your new ADMIN_PASSWORD_HASH:');
console.log(hash);