const express = require('express');
const db = require('../db');
const { ROLES, verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken, requireRole(ROLES.CAPTAIN, ROLES.OFFICIAL, ROLES.MDRRMC));

const STATUSES = ['Pending', 'Verified', 'Dispatched', 'Resolved', 'Rejected'];

function ymd(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

router.get('/summary', async (req, res) => {
  try {
    const all = req.user.role === ROLES.MDRRMC; // MDRRMC sees every barangay
    const rWhere = all ? '1 = 1' : 'r.barangay = ?';
    const rParams = all ? [] : [req.user.barangay];

    // counts per status
    const [statusRows] = await db.query(
      `SELECT r.status, COUNT(*) AS n FROM tbl_incident_reports r WHERE ${rWhere} GROUP BY r.status`,
      rParams
    );
    const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    statusRows.forEach((row) => { counts[row.status] = Number(row.n); });

    // reports received today
    const [[today]] = await db.query(
      `SELECT COUNT(*) AS n FROM tbl_incident_reports r
        WHERE ${rWhere} AND DATE(r.datereported) = CURDATE()`,
      rParams
    );

    // active critical incidents (escalated to the MDRRMC)
    const [[crit]] = await db.query(
      `SELECT COUNT(*) AS n FROM tbl_incident_reports r
        WHERE ${rWhere} AND r.severity = 'Critical' AND r.status IN ('Verified', 'Dispatched')`,
      rParams
    );

    // last 7 days
    const [dayRows] = await db.query(
      `SELECT DATE_FORMAT(r.datereported, '%Y-%m-%d') AS d, COUNT(*) AS n
         FROM tbl_incident_reports r
        WHERE ${rWhere} AND r.datereported >= CURDATE() - INTERVAL 6 DAY
        GROUP BY d`,
      rParams
    );
    const byDay = Object.fromEntries(dayRows.map((r) => [r.d, Number(r.n)]));
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date();
      dt.setDate(dt.getDate() - i);
      const key = ymd(dt);
      days.push({ d: key, n: byDay[key] || 0 });
    }

    // by incident type
    const [types] = await db.query(
      `SELECT t.typename, COUNT(*) AS n
         FROM tbl_incident_reports r
         JOIN tbl_incident_types t ON t.id = r.incidenttype
        WHERE ${rWhere}
        GROUP BY t.id, t.typename
        ORDER BY n DESC`,
      rParams
    );

    // responders
    const uWhere = all ? 'u.role = ? AND u.status = 1' : 'u.role = ? AND u.status = 1 AND u.barangay = ?';
    const uParams = all ? [ROLES.RESPONDER] : [ROLES.RESPONDER, req.user.barangay];
    const [respRows] = await db.query(
      `SELECT u.availability, COUNT(*) AS n FROM tbl_users u WHERE ${uWhere} GROUP BY u.availability`,
      uParams
    );
    const responders = { available: 0, onDuty: 0, total: 0 };
    respRows.forEach((row) => {
      const n = Number(row.n);
      responders.total += n;
      if (row.availability === 'Available') responders.available += n;
      if (row.availability === 'On Duty') responders.onDuty += n;
    });

    // latest reports
    const [recent] = await db.query(
      `SELECT r.id, r.reportid, r.status, r.severity, r.datereported, t.typename, b.barangayname
         FROM tbl_incident_reports r
         JOIN tbl_incident_types t ON t.id = r.incidenttype
         JOIN tbl_barangay b ON b.id = r.barangay
        WHERE ${rWhere}
        ORDER BY r.datereported DESC, r.id DESC
        LIMIT 6`,
      rParams
    );

    let scope = 'All barangays';
    if (!all) {
      const [b] = await db.query('SELECT barangayname FROM tbl_barangay WHERE id = ?', [req.user.barangay]);
      scope = b[0]?.barangayname || 'Your barangay';
    }

    res.json({
      scope,
      counts,
      total: Object.values(counts).reduce((a, b) => a + b, 0),
      today: Number(today.n),
      critical: Number(crit.n),
      days,
      types: types.map((t) => ({ typename: t.typename, n: Number(t.n) })),
      responders,
      recent,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;