const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken); // any logged-in user, but only their own account

// ---------- Profile photo upload ----------
const UPLOADS = path.join(__dirname, '..', 'uploads');
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS,
    filename: (req, file, cb) =>
      cb(null, `avatar-${req.user.id}-${crypto.randomBytes(4).toString('hex')}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG or WEBP images are allowed'));
  },
});

function handleUpload(req, res, next) {
  upload.single('photo')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}

const removeFile = (name) => name && fs.unlink(path.join(UPLOADS, name), () => {});

router.post('/photo', handleUpload, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Choose a photo first' });
    const [[me]] = await db.query('SELECT imagename FROM tbl_users WHERE id = ?', [req.user.id]);
    await db.query('UPDATE tbl_users SET imagename = ? WHERE id = ?', [req.file.filename, req.user.id]);
    removeFile(me?.imagename);
    res.json({ ok: true, imagename: req.file.filename });
  } catch (err) {
    removeFile(req.file?.filename);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/photo', async (req, res) => {
  try {
    const [[me]] = await db.query('SELECT imagename FROM tbl_users WHERE id = ?', [req.user.id]);
    await db.query('UPDATE tbl_users SET imagename = NULL WHERE id = ?', [req.user.id]);
    removeFile(me?.imagename);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Edit my details ----------
router.patch('/', async (req, res) => {
  try {
    const fullname = String(req.body.fullname || '').trim();
    const email = String(req.body.email || '').trim();
    const contactno = String(req.body.contactno || '').trim();
    if (!fullname || !email || !contactno) {
      return res.status(400).json({ error: 'Name, email and mobile number are required' });
    }

    const [dup] = await db.query(
      'SELECT id FROM tbl_users WHERE id <> ? AND (email = ? OR username = ? OR contactno = ?)',
      [req.user.id, email, email, contactno]
    );
    if (dup.length) return res.status(409).json({ error: 'Email or mobile number already used by another account' });

    const [[me]] = await db.query('SELECT username, email FROM tbl_users WHERE id = ?', [req.user.id]);
    if (!me) return res.status(404).json({ error: 'Account not found' });

    // keep username in step with email when they were the same
    const username = me.username === me.email ? email : me.username;
    await db.query(
      'UPDATE tbl_users SET fullname = ?, email = ?, contactno = ?, username = ? WHERE id = ?',
      [fullname, email, contactno, username, req.user.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Change my password ----------
router.post('/password', async (req, res) => {
  try {
    const { current, password } = req.body;
    if (!current || !password) return res.status(400).json({ error: 'Both passwords are required' });
    if (password.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });

    const [[me]] = await db.query('SELECT password FROM tbl_users WHERE id = ?', [req.user.id]);
    if (!me || !(await bcrypt.compare(current, me.password))) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    await db.query('UPDATE tbl_users SET password = ? WHERE id = ?', [await bcrypt.hash(password, 10), req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;