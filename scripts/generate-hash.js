const bcrypt = require('bcryptjs');

async function hashPassword() {
  const password = 'Gig@50chinedu';
  const hash = await bcrypt.hash(password, 10);
  console.log('Password Hash:', hash);
}

hashPassword();
