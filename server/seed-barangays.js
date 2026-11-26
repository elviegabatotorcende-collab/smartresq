require('dotenv').config();
const fs = require('fs');
const bcrypt = require('bcryptjs');
const db = require('./db');

const PASSWORD = 'Password123!'; // for development only; each user should change it in Profile

// [role id, email prefix, label]
const ROLES = [
  [2, 'captain', 'Captain'],
  [3, 'official', 'Official'],
  [4, 'responder', 'Responder'],
];

// "Pitogo (Poblacion)" -> "pitogo"
const slugOf = (name) => name.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, '');

(async () => {
  const hash = await bcrypt.hash(PASSWORD, 10);
  const [barangays] = await db.query('SELECT id, barangayname FROM tbl_barangay WHERE status = 1 ORDER BY id');

  const used = new Set();
  const lines = ['Barangay,Role,Email,Password'];
  let created = 0;

  for (const b of barangays) {
    let slug = slugOf(b.barangayname) || `b${b.id}`;
    if (used.has(slug)) slug += b.id;
    used.add(slug);

    for (const [role, key, label] of ROLES) {
      // skip a role that this barangay already has
      const [have] = await db.query(
        'SELECT id FROM tbl_users WHERE role = ? AND barangay = ? AND status = 1 LIMIT 1',
        [role, b.id]
      );
      if (have.length) continue;

      const email = `${key}.${slug}@smartresq.local`;
      const contact = '0918' + String(b.id * 10 + role).padStart(7, '0');
      const fullname = `${label} ${b.barangayname.replace(/\s*\(.*?\)/, '')}`;

      const [r] = await db.query(
        `INSERT IGNORE INTO tbl_users (username, password, fullname, contactno, email, role, barangay)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [email, hash, fullname, contact, email, role, b.id]
      );
      if (r.affectedRows) {
        created++;
        lines.push(`${b.barangayname},${label},${email},${PASSWORD}`);
      }
    }
  }

  fs.writeFileSync('barangay-accounts.csv', lines.join('\r\n'));
  console.log(`Created ${created} accounts for ${barangays.length} barangays.`);
  console.log('The list of logins was saved to server\\barangay-accounts.csv');
  process.exit(0);
})();