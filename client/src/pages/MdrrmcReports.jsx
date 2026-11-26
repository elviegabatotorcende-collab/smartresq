import { useEffect, useState } from 'react';
import api from '../api';

const TYPES = [['incident', 'Incident report'], ['response', 'Response time'], ['responders', 'Responder performance']];

const css = `
.mr, .mr * { box-sizing: border-box; }
.mr { --navy:#0f2557; --blue:#1f3a93; --gold:#f5b301; --ink:#1d2939; --muted:#667085; --line:#e4e7ec;
  display: flex; flex-direction: column; gap: 16px; max-width: 1100px; margin: 0 auto; color: var(--ink); font-family: inherit; }
.mr h1, .mr p { margin: 0; }
.mr-head h1 { font-size: 1.5rem; color: var(--navy); }
.mr-head p { color: var(--muted); font-size: .92rem; margin-top: 2px; }

.mr-tabs { display: flex; flex-wrap: wrap; gap: 6px; }
.mr-tab { padding: 9px 16px; border-radius: 999px; border: 1px solid var(--line); background: #fff; color: #475467; font: inherit; font-size: .88rem; font-weight: 700; cursor: pointer; }
.mr-tab.on { background: var(--navy); border-color: var(--navy); color: #fff; }

.mr-filters { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px; padding: 16px; background: #fff; border: 1px solid var(--line); border-radius: 16px; }
.mr-field label { display: block; font-size: .78rem; font-weight: 600; color: #344054; margin-bottom: 4px; }
.mr-input { padding: 9px 12px; border: 1px solid #d0d5dd; border-radius: 10px; font: inherit; background: #fff; }
.mr-input:focus { outline: none; border-color: var(--blue); box-shadow: 0 0 0 4px rgba(31,58,147,.15); }
.mr-grow { flex: 1; }
.mr-btn { padding: 10px 18px; border-radius: 10px; font: inherit; font-weight: 700; cursor: pointer; border: 1.5px solid #d0d5dd; background: #fff; color: #344054; }
.mr-btn.primary { border: none; color: #fff; background: linear-gradient(135deg, var(--blue), var(--navy)); }
.mr-btn:disabled { opacity: .55; cursor: not-allowed; }

.mr-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
.mr-stat { padding: 14px 16px; background: #fff; border: 1px solid var(--line); border-left: 4px solid var(--gold); border-radius: 14px; }
.mr-stat span { display: block; font-size: .78rem; color: var(--muted); }
.mr-stat strong { display: block; margin-top: 2px; font-size: 1.3rem; color: var(--navy); }

.mr-card { background: #fff; border: 1px solid var(--line); border-radius: 16px; overflow-x: auto; }
.mr-table { width: 100%; border-collapse: collapse; font-size: .9rem; }
.mr-table th { text-align: left; white-space: nowrap; padding: 11px 14px; font-size: .74rem; letter-spacing: .05em; text-transform: uppercase; color: var(--muted); background: #f9fafb; border-bottom: 1px solid var(--line); }
.mr-table td { padding: 11px 14px; border-bottom: 1px solid #f2f4f7; white-space: nowrap; }
.mr-table tr:last-child td { border-bottom: 0; }
.mr-empty { padding: 28px; text-align: center; color: var(--muted); }
.mr-error { padding: 10px 12px; border-radius: 10px; background: #fef3f2; border: 1px solid #fecdca; color: #b42318; font-size: .88rem; }
`;

const z = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export default function MdrrmcReports() {
  const today = new Date();
  const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);

  const [type, setType] = useState('incident');
  const [from, setFrom] = useState(ymd(monthAgo));
  const [to, setTo] = useState(ymd(today));
  const [barangay, setBarangay] = useState('');
  const [barangays, setBarangays] = useState([]);
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/incidents/meta').then((r) => setBarangays(r.data.barangays || [])).catch(() => {});
  }, []);

  async function generate(t = type) {
    setBusy(true); setError('');
    try {
      const r = await api.get('/mdrrmc', { params: { type: t, from, to, barangay } });
      setReport(r.data);
    } catch (e) {
      setReport(null);
      setError(e.response?.data?.error || `Cannot generate the report (${e.message})`);
    } finally { setBusy(false); }
  }

  useEffect(() => { generate(type); }, [type]); // eslint-disable-line

  const scopeText = () => {
    const b = barangays.find((x) => String(x.id) === String(barangay))?.barangayname || 'All barangays';
    return `${from} to ${to} · ${b}`;
  };

  function exportCsv() {
    const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [report.columns, ...report.rows].map((row) => row.map(q).join(','));
    const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `smartresq-${type}-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function printReport() {
    const w = window.open('', '_blank');
    if (!w) return setError('Allow pop-ups to print the report');
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(report.title)}</title>
<style>
body{font-family:Arial,sans-serif;color:#1d2939;margin:24px}
h1{margin:0;color:#0f2557;font-size:20px}.sub{color:#667085;margin:2px 0 14px;font-size:13px}
.sum{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}.sum div{border:1px solid #e4e7ec;border-left:4px solid #f5b301;padding:6px 12px;font-size:12px}
.sum b{display:block;font-size:16px;color:#0f2557}
table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #d0d5dd;padding:5px 8px;text-align:left}
th{background:#f2f4f7}</style></head><body>
<h1>SmartResQ · ${esc(report.title)}</h1>
<p class="sub">Municipality of President Carlos P. Garcia, Bohol · MDRRMC<br>${esc(scopeText())} · Generated ${esc(new Date().toLocaleString())}</p>
<div class="sum">${report.summary.map(([l, v]) => `<div>${esc(l)}<b>${esc(v)}</b></div>`).join('')}</div>
<table><thead><tr>${report.columns.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead>
<tbody>${report.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>
</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  }

  return (
    <div className="mr">
      <style>{css}</style>

      <div className="mr-head">
        <h1>Reports</h1>
        <p>Generate and export incident, response time and responder performance reports.</p>
      </div>

      <div className="mr-tabs">
        {TYPES.map(([k, l]) => (
          <button key={k} className={`mr-tab ${type === k ? 'on' : ''}`} onClick={() => setType(k)}>{l}</button>
        ))}
      </div>

      <div className="mr-filters">
        <div className="mr-field"><label>From</label><input className="mr-input" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></div>
        <div className="mr-field"><label>To</label><input className="mr-input" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></div>
        <div className="mr-field">
          <label>Barangay</label>
          <select className="mr-input" value={barangay} onChange={(e) => setBarangay(e.target.value)}>
            <option value="">All barangays</option>
            {barangays.map((b) => <option key={b.id} value={b.id}>{b.barangayname}</option>)}
          </select>
        </div>
        <button className="mr-btn primary" onClick={() => generate()} disabled={busy}>{busy ? 'Generating...' : 'Generate'}</button>
        <span className="mr-grow" />
        <button className="mr-btn" onClick={exportCsv} disabled={!report}>Export CSV</button>
        <button className="mr-btn" onClick={printReport} disabled={!report}>Print / PDF</button>
      </div>

      {error && <div className="mr-error" role="alert">{error}</div>}

      {report && (
        <>
          <div className="mr-stats">
            {report.summary.map(([l, v]) => (
              <div key={l} className="mr-stat"><span>{l}</span><strong>{v}</strong></div>
            ))}
          </div>

          <div className="mr-card">
            <table className="mr-table">
              <thead><tr>{report.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
              <tbody>
                {report.rows.length === 0 && <tr><td colSpan={report.columns.length} className="mr-empty">No data for this filter.</td></tr>}
                {report.rows.map((r, i) => (
                  <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}