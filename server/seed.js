require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

const PASSWORD = 'Password123!'; // for development only

// [email, fullname, contactno, role, barangay]
const accounts = [
  ['admin@smartresq.local',      'Barangay Captain',   '09170000002', 2, 1],
  ['official@smartresq.local',   'Barangay Official',  '09170000003', 3, 1],
  ['responder1@smartresq.local', 'Mark Robles',        '09170000004', 4, 1],
  ['responder2@smartresq.local', 'Anna Lee',           '09170000005', 4, 1],
  ['mdrrmc@smartresq.local',     'MDRRMC - LGU',       '09170000006', 5, null],
  ['resident@smartresq.local',   'Juan Dela Cruz',     '09170000001', 1, 1],
];

(async () => {
  const hash = await bcrypt.hash(PASSWORD, 10);
  for (const [email, fullname, contactno, role, barangay] of accounts) {
    await db.query(
      `INSERT IGNORE INTO tbl_users
         (username, password, fullname, contactno, email, role, barangay)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [email, hash, fullname, contactno, email, role, barangay]
    );
  }
  console.log(`Seeded ${accounts.length} accounts. Password for all: ${PASSWORD}`);
  process.exit(0);
})();