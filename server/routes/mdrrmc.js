const express = require('express');
const db = require('../db');
const { ROLES, verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken, requireRole(ROLES.MDRRMC));

const z = (n) => String(n).padStart(2, '0');
const fmt = (d) => (d ? `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}` : '');
const mins = (a, b) => {
  if (!a || !b) return null;
  const m = Math.round((new Date(b) - new Date(a)) / 60000);
  return m >= 0 ? m : null;
};
const avg = (list) => {
  const v = list.filter((x) => x !== null);
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
};
const show = (m) => (m === null ? '—' : `${m} min`);

const RESOLVED_AT = `(SELECT MAX(l.dateupdated) FROM tbl_incident_status_log l WHERE l.reportid = r.id AND l.status = 'Resolved')`;

router.get('/', async (req, res) => {
  try {
    const { type, from, to } = req.query;
    const barangay = Number(req.query.barangay) || 0;
    const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
    if (!isDate(from) || !isDate(to)) return res.status(400).json({ error: 'Choose a valid date range' });

    const where = ['r.datereported >= ?', 'r.datereported < DATE_ADD(?, INTERVAL 1 DAY)'];
    const params = [from, to];
    if (barangay) { where.push('r.barangay = ?'); params.push(barangay); }
    const W = where.join(' AND ');

    // ---------- Incident report ----------
    if (type === 'incident') {
      const [rows] = await db.query(
        `SELECT r.reportid, r.id, t.typename, b.barangayname, r.status, r.datereported
           FROM tbl_incident_reports r
           JOIN tbl_incident_types t ON t.id = r.incidenttype
           JOIN tbl_barangay b ON b.id = r.barangay
          WHERE ${W}
          ORDER BY r.datereported DESC, r.id DESC
          LIMIT 5000`,
        params
      );
      const by = (s) => rows.filter((r) => r.status === s).length;
      return res.json({
        title: 'Incident Report',
        columns: ['Report ID', 'Type', 'Barangay', 'Status', 'Date reported'],
        rows: rows.map((r) => [r.reportid || `#${r.id}`, r.typename, r.barangayname, r.status, fmt(r.datereported)]),
        summary: [
          ['Total incidents', rows.length], ['Pending', by('Pending')], ['Verified', by('Verified')],
          ['Dispatched', by('Dispatched')], ['Resolved', by('Resolved')], ['Rejected', by('Rejected')],
        ],
      });
    }

    // ---------- Response time ----------
    if (type === 'response') {
      const [rows] = await db.query(
        `SELECT r.reportid, r.id, t.typename, b.barangayname, r.status, r.datereported,
                (SELECT MIN(d.dispatchdatetime) FROM tbl_dispatch d WHERE d.reportid = r.id) AS dispatched_at,
                ${RESOLVED_AT} AS resolved_at
           FROM tbl_incident_reports r
           JOIN tbl_incident_types t ON t.id = r.incidenttype
           JOIN tbl_barangay b ON b.id = r.barangay
          WHERE ${W}
          ORDER BY r.datereported DESC, r.id DESC
          LIMIT 5000`,
        params
      );
      const data = rows.map((r) => ({
        ...r,
        toDispatch: mins(r.datereported, r.dispatched_at),
        toResolve: mins(r.datereported, r.resolved_at),
      }));
      return res.json({
        title: 'Response Time Report',
        columns: ['Report ID', 'Type', 'Barangay', 'Status', 'Reported', 'Dispatched', 'Resolved', 'To dispatch', 'To resolve'],
        rows: data.map((r) => [
          r.reportid || `#${r.id}`, r.typename, r.barangayname, r.status, fmt(r.datereported),
          fmt(r.dispatched_at) || '—', fmt(r.resolved_at) || '—', show(r.toDispatch), show(r.toResolve),
        ]),
        summary: [
          ['Incidents', data.length],
          ['Avg. time to dispatch', show(avg(data.map((r) => r.toDispatch)))],
          ['Avg. time to resolve', show(avg(data.map((r) => r.toResolve)))],
          ['Resolved', data.filter((r) => r.status === 'Resolved').length],
        ],
      });
    }

    // ---------- Responder performance ----------
    if (type === 'responders') {
      const [responders] = await db.query(
        `SELECT u.id, u.fullname, b.barangayname
           FROM tbl_users u LEFT JOIN tbl_barangay b ON b.id = u.barangay
          WHERE u.role = ? ${barangay ? 'AND u.barangay = ?' : ''}
          ORDER BY b.barangayname, u.fullname`,
        barangay ? [ROLES.RESPONDER, barangay] : [ROLES.RESPONDER]
      );
      const [dispatches] = await db.query(
        `SELECT d.responderid, d.dispatchdatetime, r.status, ${RESOLVED_AT} AS resolved_at
           FROM tbl_dispatch d
           JOIN tbl_incident_reports r ON r.id = d.reportid
          WHERE ${W}`,
        params
      );
      const data = responders.map((u) => {
        const mine = dispatches.filter((d) => d.responderid === u.id);
        const done = mine.filter((d) => d.status === 'Resolved');
        return {
          name: u.fullname, barangay: u.barangayname || '—',
          total: mine.length, resolved: done.length,
          avgTime: avg(done.map((d) => mins(d.dispatchdatetime, d.resolved_at))),
        };
      });
      const total = data.reduce((a, r) => a + r.total, 0);
      const resolved = data.reduce((a, r) => a + r.resolved, 0);
      return res.json({
        title: 'Responder Performance Report',
        columns: ['Responder', 'Barangay', 'Dispatches', 'Resolved', 'Avg. time to resolve'],
        rows: data.map((r) => [r.name, r.barangay, r.total, r.resolved, show(r.avgTime)]),
        summary: [
          ['Responders', data.length], ['Dispatches', total], ['Resolved', resolved],
          ['Resolution rate', total ? `${Math.round((resolved / total) * 100)}%` : '—'],
        ],
      });
    }

    res.status(400).json({ error: 'Unknown report type' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;