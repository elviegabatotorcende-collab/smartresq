const express = require('express');
const db = require('../db');
const { ROLES, verifyToken, requireRole } = require('../middleware/auth');
const { notifyUsers, notifyStaff, reportInfo } = require('../notify');

const router = express.Router();
const STATUSES = ['Pending', 'Verified', 'Dispatched', 'Resolved', 'Rejected'];

router.use(verifyToken, requireRole(ROLES.CAPTAIN, ROLES.OFFICIAL, ROLES.RESPONDER, ROLES.MDRRMC));

// Which reports this user is allowed to see
function scopeClause(user) {
  if (user.role === ROLES.MDRRMC) return { sql: '1 = 1', params: [] };
  if (user.role === ROLES.RESPONDER) {
    return {
      sql: 'EXISTS (SELECT 1 FROM tbl_dispatch d WHERE d.reportid = r.id AND d.responderid = ?)',
      params: [user.id],
    };
  }
  return { sql: 'r.barangay = ?', params: [user.barangay] }; // captain / official
}

const REPORT_SELECT = `
  SELECT r.id, r.reportid, r.description, r.photo, r.latitude, r.longitude,
         r.datereported, r.status, r.barangay AS barangayid,
         t.typename, b.barangayname,
         u.fullname AS residentname, u.contactno AS residentcontact
    FROM tbl_incident_reports r
    JOIN tbl_incident_types t ON t.id = r.incidenttype
    JOIN tbl_barangay b ON b.id = r.barangay
    JOIN tbl_users u ON u.id = r.residentid`;

// ---------- List ----------
router.get('/', async (req, res) => {
  try {
    const scope = scopeClause(req.user);
    const params = [...scope.params];
    let where = scope.sql;

    if (req.query.status) {
      if (!STATUSES.includes(req.query.status)) {
        return res.status(400).json({ error: 'Unknown status' });
      }
      where += ' AND r.status = ?';
      params.push(req.query.status);
    }

    const [rows] = await db.query(
      `${REPORT_SELECT} WHERE ${where} ORDER BY r.datereported DESC, r.id DESC`,
      params
    );
    rows.forEach((row) => delete row.residentcontact); // not needed in the list
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- One report + history + responder photos ----------
router.get('/:id', async (req, res) => {
  try {
    const scope = scopeClause(req.user);
    const [rows] = await db.query(
      `${REPORT_SELECT} WHERE r.id = ? AND ${scope.sql}`,
      [req.params.id, ...scope.params]
    );
    const report = rows[0];
    if (!report) return res.status(404).json({ error: 'Report not found' });

    // resident contact number is only for the people who verify reports
    if (![ROLES.CAPTAIN, ROLES.OFFICIAL].includes(req.user.role)) {
      delete report.residentcontact;
    }

    const [log] = await db.query(
      `SELECT l.status, l.remarks, l.dateupdated, u.fullname AS updatedbyname
         FROM tbl_incident_status_log l
         JOIN tbl_users u ON u.id = l.updatedby
        WHERE l.reportid = ?
        ORDER BY l.dateupdated ASC, l.id ASC`,
      [report.id]
    );

    const [photos] = await db.query(
      `SELECT p.photo, p.dateuploaded, u.fullname AS uploadedbyname
         FROM tbl_incident_photos p
         JOIN tbl_users u ON u.id = p.uploadedby
        WHERE p.reportid = ?
        ORDER BY p.id`,
      [report.id]
    );

    res.json({ report, log, photos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Verify or reject a pending report ----------
router.patch('/:id/status', requireRole(ROLES.CAPTAIN, ROLES.OFFICIAL), async (req, res) => {
  const { status, remarks } = req.body;

  if (!['Verified', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be Verified or Rejected' });
  }
  const note = (remarks || '').trim().slice(0, 255);
  if (status === 'Rejected' && !note) {
    return res.status(400).json({ error: 'Add a reason for rejecting this report' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const scope = scopeClause(req.user);
    const [u] = await conn.query(
      `UPDATE tbl_incident_reports r
          SET r.status = ?
        WHERE r.id = ? AND r.status = 'Pending' AND ${scope.sql}`,
      [status, req.params.id, ...scope.params]
    );

    if (!u.affectedRows) {
      await conn.rollback();
      return res.status(409).json({ error: 'Only pending reports in your barangay can be verified or rejected' });
    }

    await conn.query(
      `INSERT INTO tbl_incident_status_log (reportid, status, remarks, updatedby)
       VALUES (?, ?, ?, ?)`,
      [req.params.id, status, note || `Report ${status.toLowerCase()}`, req.user.id]
    );

    await conn.commit();
    res.json({ ok: true, status });

    const info = await reportInfo(req.params.id);
    if (info) {
      const verified = status === 'Verified';
      notifyUsers(
        [info.residentid],
        verified
          ? `Your report ${info.reportid} was verified by barangay officials`
          : `Your report ${info.reportid} was rejected: ${note}`,
        'Status',
        info.id
      );
      notifyStaff(info.barangay, `${info.reportid} was ${verified ? 'verified' : 'rejected'}`, 'Status', info.id, req.user.id);
    }
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;