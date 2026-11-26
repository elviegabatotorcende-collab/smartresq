const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { ROLES, verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken, requireRole(ROLES.CAPTAIN)); // only the barangay captain

const MANAGED = [ROLES.RESIDENT, ROLES.OFFICIAL, ROLES.RESPONDER];
const STAFF = [ROLES.OFFICIAL, ROLES.RESPONDER];

const COLS = `u.id, u.fullname, u.username, u.email, u.contactno, u.role, r.rolename,
              u.status, u.availability, u.barangay`;

// a user the captain is allowed to manage: same barangay, not a captain/MDRRMC
async function findTarget(id, barangay) {
  const [rows] = await db.query(
    `SELECT u.* FROM tbl_users u WHERE u.id = ? AND u.barangay = ? AND u.role IN (?, ?, ?)`,
    [id, barangay, ...MANAGED]
  );
  return rows[0] || null;
}

// ---------- List ----------
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ${COLS}
         FROM tbl_users u
         JOIN tbl_access_role r ON r.id = u.role
        WHERE u.barangay = ? AND u.role IN (?, ?, ?)
        ORDER BY u.role, u.fullname`,
      [req.user.barangay, ...MANAGED]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Add a barangay official or responder ----------
router.post('/', async (req, res) => {
  try {
    const { fullname, contactno, email, password } = req.body;
    const role = Number(req.body.role);

    if (!fullname || !contactno || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!STAFF.includes(role)) {
      return res.status(400).json({ error: 'Role must be Barangay Official or Responder' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const [dup] = await db.query(
      'SELECT id FROM tbl_users WHERE username = ? OR email = ? OR contactno = ?',
      [email, email, contactno]
    );
    if (dup.length) {
      return res.status(409).json({ error: 'Email or contact number already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [r] = await db.query(
      `INSERT INTO tbl_users (username, password, fullname, contactno, email, role, barangay)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [email.trim(), hash, fullname.trim(), contactno.trim(), email.trim(), role, req.user.barangay]
    );
    res.status(201).json({ id: r.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Edit details, change role, enable/disable ----------
router.patch('/:id', async (req, res) => {
  try {
    const target = await findTarget(req.params.id, req.user.barangay);
    if (!target) return res.status(404).json({ error: 'User not found in your barangay' });

    const sets = [];
    const params = [];
    const { fullname, contactno, email } = req.body;

    if (fullname !== undefined) {
      if (!String(fullname).trim()) return res.status(400).json({ error: 'Name is required' });
      sets.push('fullname = ?'); params.push(String(fullname).trim());
    }
    if (contactno !== undefined) {
      if (!String(contactno).trim()) return res.status(400).json({ error: 'Contact number is required' });
      sets.push('contactno = ?'); params.push(String(contactno).trim());
    }
    if (email !== undefined) {
      if (!String(email).trim()) return res.status(400).json({ error: 'Email is required' });
      sets.push('email = ?'); params.push(String(email).trim());
      if (target.username === target.email) { sets.push('username = ?'); params.push(String(email).trim()); }
    }
    if (req.body.role !== undefined) {
      const role = Number(req.body.role);
      if (!STAFF.includes(target.role)) return res.status(400).json({ error: 'Only staff roles can be changed' });
      if (!STAFF.includes(role)) return res.status(400).json({ error: 'Role must be Barangay Official or Responder' });
      sets.push('role = ?'); params.push(role);
    }
    if (req.body.status !== undefined) {
      const status = Number(req.body.status);
      if (![0, 1].includes(status)) return res.status(400).json({ error: 'Invalid status' });
      sets.push('status = ?'); params.push(status);
    }
    if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });

    // do not let two accounts share an email or contact number
    if (email !== undefined || contactno !== undefined) {
      const [dup] = await db.query(
        'SELECT id FROM tbl_users WHERE id <> ? AND (email = ? OR username = ? OR contactno = ?)',
        [target.id, email ?? target.email, email ?? target.email, contactno ?? target.contactno]
      );
      if (dup.length) return res.status(409).json({ error: 'Email or contact number already used by another account' });
    }

    await db.query(`UPDATE tbl_users SET ${sets.join(', ')} WHERE id = ?`, [...params, target.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Reset a password ----------
router.post('/:id/password', async (req, res) => {
  try {
    const target = await findTarget(req.params.id, req.user.barangay);
    if (!target) return res.status(404).json({ error: 'User not found in your barangay' });

    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const hash = await bcrypt.hash(password, 10);
    await db.query('UPDATE tbl_users SET password = ? WHERE id = ?', [hash, target.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;