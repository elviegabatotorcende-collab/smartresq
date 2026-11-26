const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('../db');
const { ROLES, verifyToken, requireRole } = require('../middleware/auth');
const { notifyUsers, notifyStaff, reportInfo } = require('../notify');

const router = express.Router();
router.use(verifyToken, requireRole(ROLES.RESPONDER));

// ---------- Photo upload (same rules as resident photos) ----------
const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '..', 'uploads'),
    filename: (req, file, cb) =>
      cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
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

// ---------- Dashboard: counts + active assignments ----------
router.get('/dashboard', async (req, res) => {
  try {
    const [me] = await db.query('SELECT availability FROM tbl_users WHERE id = ?', [req.user.id]);

    const [incidents] = await db.query(
      `SELECT r.id, r.reportid, r.status, r.description, d.dispatchdatetime,
              t.typename, b.barangayname
         FROM tbl_dispatch d
         JOIN tbl_incident_reports r ON r.id = d.reportid
         JOIN tbl_incident_types t ON t.id = r.incidenttype
         JOIN tbl_barangay b ON b.id = r.barangay
        WHERE d.responderid = ? AND d.status = 'Dispatched'
        ORDER BY d.dispatchdatetime DESC`,
      [req.user.id]
    );

    const [done] = await db.query(
      "SELECT COUNT(*) AS n FROM tbl_dispatch WHERE responderid = ? AND status = 'Completed'",
      [req.user.id]
    );

    const [alerts] = await db.query(
      'SELECT COUNT(*) AS n FROM tbl_notifications WHERE userid = ? AND isread = 0',
      [req.user.id]
    );

    res.json({
      alerts: alerts[0].n,
      availability: me[0].availability,
      assigned: incidents.length,
      completed: done[0].n,
      incidents,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Available / On Duty ----------
router.patch('/availability', async (req, res) => {
  const { availability } = req.body;
  if (!['Available', 'On Duty'].includes(availability)) {
    return res.status(400).json({ error: 'Status must be Available or On Duty' });
  }
  try {
    if (availability === 'Available') {
      const [a] = await db.query(
        "SELECT COUNT(*) AS n FROM tbl_dispatch WHERE responderid = ? AND status = 'Dispatched'",
        [req.user.id]
      );
      if (a[0].n > 0) {
        return res.status(409).json({ error: 'Finish your assigned incident before going Available' });
      }
    }
    await db.query('UPDATE tbl_users SET availability = ? WHERE id = ?', [availability, req.user.id]);
    res.json({ ok: true, availability });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Share GPS location ----------
router.post('/location', async (req, res) => {
  const latitude = parseFloat(req.body.latitude);
  const longitude = parseFloat(req.body.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return res.status(400).json({ error: 'Invalid location' });
  }
  try {
    await db.query(
      'INSERT INTO tbl_responder_location_log (responderid, latitude, longitude) VALUES (?, ?, ?)',
      [req.user.id, latitude, longitude]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Upload incident photo (only for incidents assigned to you) ----------
router.post('/incidents/:id/photo', handleUpload, async (req, res) => {
  const discard = () => req.file && fs.unlink(req.file.path, () => {});
  if (!req.file) return res.status(400).json({ error: 'Choose a photo' });

  try {
    const [a] = await db.query(
      "SELECT 1 FROM tbl_dispatch WHERE reportid = ? AND responderid = ? AND status = 'Dispatched'",
      [req.params.id, req.user.id]
    );
    if (!a.length) {
      discard();
      return res.status(409).json({ error: 'This incident is not assigned to you' });
    }
    await db.query(
      'INSERT INTO tbl_incident_photos (reportid, photo, uploadedby) VALUES (?, ?, ?)',
      [req.params.id, req.file.filename, req.user.id]
    );
    res.status(201).json({ ok: true, photo: req.file.filename });
  } catch (err) {
    discard();
    res.status(500).json({ error: err.message });
  }
});

// ---------- Mark your part resolved ----------
// The report becomes Resolved only when every dispatched responder has finished.
router.post('/incidents/:id/resolve', async (req, res) => {
  const note = (req.body.remarks || '').trim().slice(0, 255);
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // lock the report so two responders finishing together can't miss each other
    await conn.query('SELECT id FROM tbl_incident_reports WHERE id = ? FOR UPDATE', [req.params.id]);

    const [u] = await conn.query(
      "UPDATE tbl_dispatch SET status = 'Completed' WHERE reportid = ? AND responderid = ? AND status = 'Dispatched'",
      [req.params.id, req.user.id]
    );
    if (!u.affectedRows) {
      await conn.rollback();
      return res.status(409).json({ error: 'No active assignment for this incident' });
    }

    const [open] = await conn.query(
      "SELECT COUNT(*) AS n FROM tbl_dispatch WHERE reportid = ? AND status = 'Dispatched'",
      [req.params.id]
    );
    const reportResolved = open[0].n === 0;

    if (reportResolved) {
      await conn.query("UPDATE tbl_incident_reports SET status = 'Resolved' WHERE id = ?", [req.params.id]);
    }
    await conn.query(
      `INSERT INTO tbl_incident_status_log (reportid, status, remarks, updatedby) VALUES (?, ?, ?, ?)`,
      [
        req.params.id,
        reportResolved ? 'Resolved' : 'Dispatched',
        note || (reportResolved ? 'Incident resolved' : 'Responder completed their assignment'),
        req.user.id,
      ]
    );

    // free the responder if nothing else is assigned to them
    const [mine] = await conn.query(
      "SELECT COUNT(*) AS n FROM tbl_dispatch WHERE responderid = ? AND status = 'Dispatched'",
      [req.user.id]
    );
    if (mine[0].n === 0) {
      await conn.query("UPDATE tbl_users SET availability = 'Available' WHERE id = ?", [req.user.id]);
    }

    await conn.commit();
    res.json({ ok: true, reportResolved });

    const info = await reportInfo(req.params.id);
    if (info) {
      if (reportResolved) {
        notifyUsers([info.residentid], `Your incident ${info.reportid} has been resolved`, 'Resolved', info.id);
        notifyStaff(info.barangay, `${info.reportid} was resolved`, 'Resolved', info.id);
      } else {
        notifyStaff(info.barangay, `A responder completed their part of ${info.reportid}`, 'Status', info.id);
      }
    }
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;