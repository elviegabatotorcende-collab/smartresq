require('dotenv').config();
const db = require('./db');

// [dLat, dLng] offsets from the latest report: roughly 0.5 km and 1.4 km away
const OFFSETS = {
  'responder1@smartresq.local': [0.004, 0.002],
  'responder2@smartresq.local': [-0.006, 0.011],
};

(async () => {
  const [rows] = await db.query(
    'SELECT latitude, longitude FROM tbl_incident_reports ORDER BY id DESC LIMIT 1'
  );
  if (!rows[0]) {
    console.log('Submit a report first.');
    process.exit(1);
  }
  const lat = Number(rows[0].latitude);
  const lng = Number(rows[0].longitude);

  for (const [email, [dLat, dLng]] of Object.entries(OFFSETS)) {
    const [u] = await db.query('SELECT id FROM tbl_users WHERE username = ?', [email]);
    if (!u[0]) continue;
    await db.query(
      'INSERT INTO tbl_responder_location_log (responderid, latitude, longitude) VALUES (?, ?, ?)',
      [u[0].id, lat + dLat, lng + dLng]
    );
    await db.query("UPDATE tbl_users SET availability = 'Available' WHERE id = ?", [u[0].id]);
  }
  console.log('Responders placed near the latest report and set to Available.');
  process.exit(0);
})();