const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken); // every role has notifications

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, message, type, isread, datecreated, reportid
         FROM tbl_notifications WHERE userid = ? ORDER BY id DESC LIMIT 50`,
      [req.user.id]
    );
    const [c] = await db.query(
      'SELECT COUNT(*) AS n FROM tbl_notifications WHERE userid = ? AND isread = 0',
      [req.user.id]
    );
    res.json({ notifications: rows, unread: c[0].n });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/unread-count', async (req, res) => {
  try {
    const [c] = await db.query(
      'SELECT COUNT(*) AS n FROM tbl_notifications WHERE userid = ? AND isread = 0',
      [req.user.id]
    );
    res.json({ unread: c[0].n });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/read-all', async (req, res) => {
  try {
    await db.query('UPDATE tbl_notifications SET isread = 1 WHERE userid = ?', [req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/read', async (req, res) => {
  try {
    await db.query('UPDATE tbl_notifications SET isread = 1 WHERE id = ? AND userid = ?', [
      req.params.id,
      req.user.id,
    ]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;