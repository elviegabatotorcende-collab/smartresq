require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const realtime = require('./realtime');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/incidents', require('./routes/incidents'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/users', require('./routes/users'));
app.use('/api/monitoring', require('./routes/monitoring'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/mdrrmc', require('./routes/mdrrmc'));
app.use('/api/dispatch', require('./routes/dispatch'));
app.use('/api/responder', require('./routes/responder'));
app.use('/api/notifications', require('./routes/notifications'));

app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT COUNT(*) AS roles FROM tbl_access_role');
    res.json({ ok: true, roles: rows[0].roles });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
realtime.init(server);

server.on('error', (err) => {
  console.error('Cannot start server:', err.message);
  process.exit(1);
});

server.listen(PORT, () => console.log(`SmartResQ server running on port ${PORT}`));