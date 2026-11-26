const express = require('express');
const db = require('../db');
const { ROLES, verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken, requireRole(ROLES.CAPTAIN, ROLES.OFFICIAL, ROLES.MDRRMC));

router.get('/', async (req, res) => {
  try {
    const all = req.user.role === ROLES.MDRRMC;
    const days = Number(req.query.days);
    const range = days > 0 ? `AND r.datereported >= NOW() - INTERVAL ${Math.floor(days)} DAY` : '';
    const rWhere = all ? '1 = 1' : 'r.barangay = ?';
    const bParams = all ? [] : [req.user.barangay];

    const [incidents] = await db.query(
      `SELECT r.id, r.reportid, r.status, r.latitude, r.longitude, r.datereported,
              t.typename, b.barangayname
         FROM tbl_incident_reports r
         JOIN tbl_incident_types t ON t.id = r.incidenttype
         JOIN tbl_barangay b ON b.id = r.barangay
        WHERE ${rWhere} AND r.latitude IS NOT NULL AND r.longitude IS NOT NULL ${range}
        ORDER BY r.datereported DESC, r.id DESC
        LIMIT 500`,
      bParams
    );

    const [responders] = await db.query(
      `SELECT u.id, u.fullname, u.availability, l.latitude, l.longitude, l.timestamp
         FROM tbl_users u
         JOIN tbl_responder_location_log l
           ON l.id = (SELECT MAX(id) FROM tbl_responder_location_log WHERE responderid = u.id)
        WHERE u.role = ? AND u.status = 1 ${all ? '' : 'AND u.barangay = ?'}`,
      all ? [ROLES.RESPONDER] : [ROLES.RESPONDER, req.user.barangay]
    );

    let scope = 'All barangays';
    if (!all) {
      const [b] = await db.query('SELECT barangayname FROM tbl_barangay WHERE id = ?', [req.user.barangay]);
      scope = b[0]?.barangayname || 'Your barangay';
    }

    res.json({
      scope,
      incidents: incidents.map((i) => ({ ...i, latitude: Number(i.latitude), longitude: Number(i.longitude) })),
      responders: responders.map((r) => ({ ...r, latitude: Number(r.latitude), longitude: Number(r.longitude) })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
