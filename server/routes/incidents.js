const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('../db');
const { ROLES, verifyToken, requireRole } = require('../middleware/auth');
const { notifyStaff } = require('../notify');

const router = express.Router();

// ---------- Photo upload ----------
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${path.extname(file.originalname).toLowerCase()}`),
});

const upload = multer({
  storage,
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

// ---------- Dropdown data for the report form ----------
router.get('/meta', verifyToken, async (req, res) => {
  try {
    const [types] = await db.query('SELECT id, typename FROM tbl_incident_types WHERE status = 1 ORDER BY id');
    const [barangays] = await db.query('SELECT id, barangayname FROM tbl_barangay WHERE status = 1 ORDER BY barangayname');
    res.json({ types, barangays });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Submit a report (residents only) ----------
router.post('/', verifyToken, requireRole(ROLES.RESIDENT), handleUpload, async (req, res) => {
  const photo = req.file ? req.file.filename : null;
  const discardPhoto = () => photo && fs.unlink(req.file.path, () => {});

  const { incidenttype, barangay, description } = req.body;
  const latitude = parseFloat(req.body.latitude);
  const longitude = parseFloat(req.body.longitude);

  if (!incidenttype || !barangay) {
    discardPhoto();
    return res.status(400).json({ error: 'Choose the incident type and barangay' });
  }
  if (!description || !description.trim()) {
    discardPhoto();
    return res.status(400).json({ error: 'Describe what happened' });
  }
  if (description.length > 500) {
    discardPhoto();
    return res.status(400).json({ error: 'Description must be 500 characters or less' });
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    discardPhoto();
    return res.status(400).json({ error: 'GPS location is required' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // temporary report number, replaced right after we know the row id
    const temp = 'T' + crypto.randomBytes(5).toString('hex');
    const [r] = await conn.query(
      `INSERT INTO tbl_incident_reports
         (reportid, residentid, incidenttype, barangay, description, photo, latitude, longitude)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [temp, req.user.id, incidenttype, barangay, description.trim(), photo, latitude, longitude]
    );

    const reportid = 'SRQ-' + String(r.insertId).padStart(5, '0');
    await conn.query('UPDATE tbl_incident_reports SET reportid = ? WHERE id = ?', [reportid, r.insertId]);

    await conn.query(
      `INSERT INTO tbl_incident_status_log (reportid, status, remarks, updatedby)
       VALUES (?, 'Pending', 'Report submitted', ?)`,
      [r.insertId, req.user.id]
    );

    await conn.commit();
    res.status(201).json({ id: r.insertId, reportid });

    notifyStaff(barangay, `New incident report received (${reportid})`, 'Incident', r.insertId);
  } catch (err) {
    await conn.rollback();
    discardPhoto();
    const bad = err.code === 'ER_NO_REFERENCED_ROW_2';
    res.status(bad ? 400 : 500).json({ error: bad ? 'Invalid incident type or barangay' : err.message });
  } finally {
    conn.release();
  }
});

const REPORT_SELECT = `
  SELECT r.id, r.reportid, r.description, r.photo, r.latitude, r.longitude,
         r.datereported, r.status, r.residentid,
         t.typename, b.barangayname
    FROM tbl_incident_reports r
    JOIN tbl_incident_types t ON t.id = r.incidenttype
    JOIN tbl_barangay b ON b.id = r.barangay`;

// ---------- My reports (resident) ----------
router.get('/mine', verifyToken, requireRole(ROLES.RESIDENT), async (req, res) => {
  try {
    const [rows] = await db.query(
      `${REPORT_SELECT} WHERE r.residentid = ? ORDER BY r.datereported DESC, r.id DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- One of my reports + its status history ----------
router.get('/:id', verifyToken, requireRole(ROLES.RESIDENT), async (req, res) => {
  try {
    const [rows] = await db.query(`${REPORT_SELECT} WHERE r.id = ?`, [req.params.id]);
    const report = rows[0];
    if (!report) return res.status(404).json({ error: 'Report not found' });

    // residents can only see their own reports
    if (report.residentid !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [log] = await db.query(
      `SELECT l.status, l.remarks, l.dateupdated, u.fullname AS updatedbyname
         FROM tbl_incident_status_log l
         JOIN tbl_users u ON u.id = l.updatedby
        WHERE l.reportid = ?
        ORDER BY l.dateupdated ASC, l.id ASC`,
      [report.id]
    );

    res.json({ report, log });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;