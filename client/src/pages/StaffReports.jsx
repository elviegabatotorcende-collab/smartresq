import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import StatusBadge from '../components/StatusBadge';

const STATUSES = ['Pending', 'Verified', 'Dispatched', 'Resolved', 'Rejected'];

const css = `
.sr, .sr * { box-sizing: border-box; }
.sr { --navy:#0f2557; --blue:#1f3a93; --gold:#f5b301; --ink:#1d2939; --muted:#667085; --line:#e4e7ec;
  display: flex; flex-direction: column; gap: 16px; max-width: 1100px; margin: 0 auto; color: var(--ink); font-family: inherit; }
.sr h1, .sr p { margin: 0; }
.sr-head h1 { font-size: 1.5rem; color: var(--navy); }
.sr-head p { color: var(--muted); font-size: .92rem; margin-top: 2px; }

.sr-bar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.sr-tabs { display: flex; flex-wrap: wrap; gap: 6px; }
.sr-tab { padding: 8px 14px; border-radius: 999px; border: 1px solid var(--line); background: #fff; color: #475467; font: inherit; font-size: .85rem; font-weight: 700; cursor: pointer; }
.sr-tab.on { background: var(--navy); border-color: var(--navy); color: #fff; }
.sr-search { flex: 1 1 200px; min-width: 160px; padding: 10px 14px; border: 1px solid #d0d5dd; border-radius: 10px; font: inherit; background: #fff; }
.sr-search:focus { outline: none; border-color: var(--blue); box-shadow: 0 0 0 4px rgba(31,58,147,.15); }

.sr-card { background: #fff; border: 1px solid var(--line); border-radius: 16px; box-shadow: 0 1px 3px rgba(16,24,40,.06); overflow-x: auto; }
.sr-table { width: 100%; border-collapse: collapse; font-size: .92rem; }
.sr-table th { text-align: left; white-space: nowrap; padding: 12px 16px; font-size: .75rem; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); background: #f9fafb; border-bottom: 1px solid var(--line); }
.sr-table td { padding: 14px 16px; border-bottom: 1px solid #f2f4f7; vertical-align: middle; }
.sr-table tr:last-child td { border-bottom: 0; }
.sr-table tbody tr:hover { background: #fafbff; }
.sr-id { font-weight: 800; color: var(--navy); white-space: nowrap; }
.sr-date { color: var(--muted); font-size: .85rem; white-space: nowrap; }
.sr-view { display: inline-block; padding: 6px 14px; border-radius: 8px; border: 1px solid #c7d2f0; background: #eef2ff; color: var(--blue); font-size: .82rem; font-weight: 700; text-decoration: none; }
.sr-view:hover { background: #e0e7ff; }
.sr-empty { padding: 30px; text-align: center; color: var(--muted); }
.sr-error { padding: 10px 12px; border-radius: 10px; background: #fef3f2; border: 1px solid #fecdca; color: #b42318; font-size: .88rem; }
`;

export default function StaffReports() {
  const [rows, setRows] = useState(null);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const load = () =>
      api.get('/reports', { params: status ? { status } : {} })
        .then((r) => {
          if (!alive) return;
          setRows(r.data);
          setError('');
        })
        .catch((err) => alive && setError(err.response?.data?.error || 'Cannot load reports'));
    load();
    const t = setInterval(load, 10000);
    return () => { alive = false; clearInterval(t); };
  }, [status]);

  const shown = useMemo(() => {
    if (!rows) return null;
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) =>
      [r.reportid, r.typename, r.barangayname].some((v) => (v || '').toLowerCase().includes(term))
    );
  }, [rows, q]);

  return (
    <div className="sr">
      <style>{css}</style>

      <div className="sr-head">
        <h1>Report Management</h1>
        <p>Review, verify and follow up the emergency reports of your barangay.</p>
      </div>

      <div className="sr-bar">
        <div className="sr-tabs">
          {['', ...STATUSES].map((s) => (
            <button key={s || 'all'} className={`sr-tab ${status === s ? 'on' : ''}`} onClick={() => { setRows(null); setStatus(s); }}>
              {s || 'All'}
            </button>
          ))}
        </div>
        <input className="sr-search" placeholder="Search report ID, type or barangay" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {error && <div className="sr-error" role="alert">{error}</div>}

      <div className="sr-card">
        <table className="sr-table">
          <thead>
            <tr><th>Report ID</th><th>Type</th><th>Barangay</th><th>Status</th><th>Date</th><th>Action</th></tr>
          </thead>
          <tbody>
            {shown === null && !error && <tr><td colSpan="6" className="sr-empty">Loading...</td></tr>}
            {shown?.length === 0 && <tr><td colSpan="6" className="sr-empty">No reports found.</td></tr>}
            {shown?.map((r) => (
              <tr key={r.id}>
                <td className="sr-id">{r.reportid}</td>
                <td>{r.typename}</td>
                <td>{r.barangayname}</td>
                <td><StatusBadge status={r.status} /></td>
                <td className="sr-date">{new Date(r.datereported).toLocaleString()}</td>
                <td><Link className="sr-view" to={`/staff/reports/${r.id}`}>View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}