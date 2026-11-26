require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

const PASSWORD = 'Password123!'; // for development only

// [email, fullname, contactno]
const accounts = [
  ['lgu.responder1@smartresq.local', 'MDRRMC Responder 1', '09170000007'],
  ['lgu.responder2@smartresq.local', 'MDRRMC Responder 2', '09170000008'],
];

(async () => {
  const hash = await bcrypt.hash(PASSWORD, 10);
  for (const [email, fullname, contactno] of accounts) {
    await db.query(
      `INSERT IGNORE INTO tbl_users (username, password, fullname, contactno, email, role, barangay)
       VALUES (?, ?, ?, ?, ?, 4, NULL)`,
      [email, hash, fullname, contactno, email]
    );
  }
  console.log(`Seeded ${accounts.length} LGU responders. Password for all: ${PASSWORD}`);
  process.exit(0);
})();