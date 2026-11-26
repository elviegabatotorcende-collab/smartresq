const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { ROLES, verifyToken, requireRole } = require('../middleware/auth');
const { notifyUsers, notifyStaff, reportInfo } = require('../notify');

const router = express.Router();
router.use(verifyToken, requireRole(ROLES.OFFICIAL, ROLES.MDRRMC));

// Straight-line distance between two GPS points, in km
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Who dispatches what:
//  - Barangay official: Normal incidents of their barangay, using barangay responders.
//  - MDRRMC: Critical incidents of any barangay, using LGU responders (responders with no barangay).
function scope(user) {
  if (user.role === ROLES.MDRRMC) {
    return { rep: "r.severity = 'Critical'", repParams: [], resp: 'u.barangay IS NULL', respParams: [] };
  }
  return {
    rep: "r.barangay = ? AND r.severity = 'Normal'", repParams: [user.barangay],
    resp: 'u.barangay = ?', respParams: [user.barangay],
  };
}

// ---------- Verified reports waiting for (more) responders ----------
router.get('/incidents', async (req, res) => {
  try {
    const s = scope(req.user);
    const [rows] = await db.query(
      `SELECT r.id, r.reportid, r.status, r.severity, r.datereported, r.latitude, r.longitude,
              t.typename, b.barangayname,
              (SELECT GROUP_CONCAT(ru.fullname SEPARATOR ', ')
                 FROM tbl_dispatch d JOIN tbl_users ru ON ru.id = d.responderid
                WHERE d.reportid = r.id AND d.status = 'Dispatched') AS assigned
         FROM tbl_incident_reports r
         JOIN tbl_incident_types t ON t.id = r.incidenttype
         JOIN tbl_barangay b ON b.id = r.barangay
        WHERE ${s.rep} AND r.status IN ('Verified', 'Dispatched')
        ORDER BY r.datereported ASC, r.id ASC`,
      s.repParams
    );
    res.json(rows.map((r) => ({ ...r, latitude: Number(r.latitude), longitude: Number(r.longitude) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Available responders for one report, nearest first ----------
router.get('/responders', async (req, res) => {
  try {
    const s = scope(req.user);
    const [inc] = await db.query(
      `SELECT r.latitude, r.longitude FROM tbl_incident_reports r
        WHERE r.id = ? AND ${s.rep} AND r.status IN ('Verified', 'Dispatched')`,
      [req.query.reportId, ...s.repParams]
    );
    if (!inc[0]) return res.status(404).json({ error: 'Report not found' });
    const incLat = Number(inc[0].latitude);
    const incLng = Number(inc[0].longitude);

    const [rows] = await db.query(
      `SELECT u.id, u.fullname, u.contactno, l.latitude, l.longitude, l.timestamp AS locationat
         FROM tbl_users u
         LEFT JOIN tbl_responder_location_log l
                ON l.id = (SELECT MAX(id) FROM tbl_responder_location_log WHERE responderid = u.id)
        WHERE u.role = ? AND u.status = 1 AND u.availability = 'Available' AND ${s.resp}`,
      [ROLES.RESPONDER, ...s.respParams]
    );

    const responders = rows
      .map((r) => {
        const lat = r.latitude == null ? null : Number(r.latitude);
        const lng = r.longitude == null ? null : Number(r.longitude);
        return {
          id: r.id,
          fullname: r.fullname,
          contactno: r.contactno,
          latitude: lat,
          longitude: lng,
          locationat: r.locationat,
          distancekm: lat == null ? null : Math.round(distanceKm(incLat, incLng, lat, lng) * 100) / 100,
        };
      })
      .sort((a, b) => (a.distancekm ?? Infinity) - (b.distancekm ?? Infinity)); // no-location last

    res.json({ incident: { latitude: incLat, longitude: incLng }, responders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Dispatch a responder ----------
router.post('/', async (req, res) => {
  const reportId = parseInt(req.body.reportId, 10);
  const responderId = parseInt(req.body.responderId, 10);
  if (!reportId || !responderId) {
    return res.status(400).json({ error: 'Choose a report and a responder' });
  }

  const s = scope(req.user);
  const isLgu = req.user.role === ROLES.MDRRMC;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [rep] = await conn.query(
      `SELECT r.id FROM tbl_incident_reports r
        WHERE r.id = ? AND ${s.rep} AND r.status IN ('Verified', 'Dispatched') FOR UPDATE`,
      [reportId, ...s.repParams]
    );
    if (!rep.length) {
      await conn.rollback();
      return res.status(409).json({
        error: isLgu
          ? 'Only verified Critical reports can be dispatched by the MDRRMC'
          : 'Only verified Normal reports in your barangay can be dispatched',
      });
    }

    const [resp] = await conn.query(
      `SELECT u.id FROM tbl_users u
        WHERE u.id = ? AND u.role = ? AND u.status = 1 AND ${s.resp} AND u.availability = 'Available'
          FOR UPDATE`,
      [responderId, ROLES.RESPONDER, ...s.respParams]
    );
    if (!resp.length) {
      await conn.rollback();
      return res.status(409).json({ error: 'That responder is no longer available' });
    }

    const temp = 'T' + crypto.randomBytes(5).toString('hex');
    const [d] = await conn.query(
      `INSERT INTO tbl_dispatch (dispatchid, reportid, responderid, dispatchedby)
       VALUES (?, ?, ?, ?)`,
      [temp, reportId, responderId, req.user.id]
    );
    const dispatchid = 'DSP-' + String(d.insertId).padStart(5, '0');
    await conn.query('UPDATE tbl_dispatch SET dispatchid = ? WHERE id = ?', [dispatchid, d.insertId]);

    await conn.query("UPDATE tbl_users SET availability = 'On Duty' WHERE id = ?", [responderId]);
    await conn.query("UPDATE tbl_incident_reports SET status = 'Dispatched' WHERE id = ?", [reportId]);
    await conn.query(
      `INSERT INTO tbl_incident_status_log (reportid, status, remarks, updatedby)
       VALUES (?, 'Dispatched', ?, ?)`,
      [reportId, isLgu ? 'LGU responder dispatched by the MDRRMC' : 'Responder dispatched', req.user.id]
    );

    await conn.commit();
    res.status(201).json({ ok: true, dispatchid });

    const info = await reportInfo(reportId);
    if (info) {
      notifyUsers([responderId], `You have been assigned to ${info.reportid}`, 'Dispatch', info.id);
      notifyUsers([info.residentid], `A responder has been dispatched to your report ${info.reportid}`, 'Dispatch', info.id);
      notifyStaff(info.barangay, `Responder assigned to ${info.reportid}`, 'Dispatch', info.id, req.user.id);
    }
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;