const db = require('./db');
const { ROLES } = require('./middleware/auth');
const realtime = require('./realtime');

// captain + officials of one barangay, and all MDRRMC users
async function staffFor(barangayId) {
  const [rows] = await db.query(
    `SELECT id FROM tbl_users
      WHERE status = 1 AND (role = ? OR (role IN (?, ?) AND barangay = ?))`,
    [ROLES.MDRRMC, ROLES.CAPTAIN, ROLES.OFFICIAL, barangayId]
  );
  return rows.map((r) => r.id);
}

async function notifyUsers(userIds, message, type, reportId = null) {
  const text = String(message).slice(0, 255);
  for (const id of [...new Set(userIds)]) {
    try {
      const [r] = await db.query(
        'INSERT INTO tbl_notifications (userid, message, type, reportid) VALUES (?, ?, ?, ?)',
        [id, text, type, reportId]
      );
      realtime.toUser(id, 'notification', {
        id: r.insertId, message: text, type, reportid: reportId, isread: 0,
        datecreated: new Date().toISOString(),
      });
    } catch (err) {
      console.error('notify failed:', err.message);
    }
  }
}

async function notifyStaff(barangayId, message, type, reportId = null, excludeUserId = null) {
  try {
    const ids = (await staffFor(barangayId)).filter((id) => id !== excludeUserId);
    await notifyUsers(ids, message, type, reportId);
  } catch (err) {
    console.error('notifyStaff failed:', err.message);
  }
}

// basic facts about a report, never throws
async function reportInfo(id) {
  try {
    const [rows] = await db.query(
      'SELECT id, reportid, residentid, barangay FROM tbl_incident_reports WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  } catch {
    return null;
  }
}

module.exports = { notifyUsers, notifyStaff, reportInfo };