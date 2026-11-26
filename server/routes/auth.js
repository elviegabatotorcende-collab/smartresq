const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { ROLES, verifyToken } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, barangay: user.barangay },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

function publicUser(u) {
  return {
    id: u.id,
    fullname: u.fullname,
    email: u.email,
    contactno: u.contactno,
    role: u.role,
    rolename: u.rolename,
    barangay: u.barangay,
    availability: u.availability,
    imagename: u.imagename,
  };
}

// Resident registration (matches the registration screen fields)
router.post('/register', async (req, res) => {
  try {
    const { fullname, contactno, email, password, confirmPassword, barangay } = req.body;

    if (!fullname || !contactno || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
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
    const [result] = await db.query(
      `INSERT INTO tbl_users (username, password, fullname, contactno, email, role, barangay)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [email, hash, fullname, contactno, email, ROLES.RESIDENT, barangay || null]
    );

    res.status(201).json({ message: 'Account created', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login for all roles. identifier = email, username or mobile number.
// portal = 'resident' or 'staff' (optional) keeps the two login screens separate.
router.post('/login', async (req, res) => {
  try {
    const { identifier, password, portal } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Enter your login and password' });
    }

    const [rows] = await db.query(
      `SELECT u.*, r.rolename
         FROM tbl_users u
         JOIN tbl_access_role r ON r.id = u.role
        WHERE (u.username = ? OR u.email = ? OR u.contactno = ?) AND u.status = 1
        LIMIT 1`,
      [identifier, identifier, identifier]
    );

    const user = rows[0];
    const ok = user && (await bcrypt.compare(password, user.password));
    if (!ok) return res.status(401).json({ error: 'Invalid login or password' });

    if (portal === 'resident' && user.role !== ROLES.RESIDENT) {
      return res.status(403).json({ error: 'Please use the staff login' });
    }
    if (portal === 'staff' && user.role === ROLES.RESIDENT) {
      return res.status(403).json({ error: 'Please use the resident login' });
    }

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Who am I? (used by the frontend to restore a session)
router.get('/me', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.*, r.rolename
         FROM tbl_users u
         JOIN tbl_access_role r ON r.id = u.role
        WHERE u.id = ? AND u.status = 1`,
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ user: publicUser(rows[0]) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public list of barangays for the registration form
router.get('/barangays', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, barangayname FROM tbl_barangay WHERE status = 1 ORDER BY barangayname');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;