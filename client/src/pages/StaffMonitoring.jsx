import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import MapView from '../components/MapView';

const STATUS_COLORS = {
  Pending: '#f79009', Verified: '#2e90fa', Dispatched: '#7a5af8', Resolved: '#12b76a', Rejected: '#98a2b3',
};
const STATUSES = Object.keys(STATUS_COLORS);
const RANGES = [['1', 'Today'], ['7', '7 days'], ['30', '30 days'], ['0', 'All time']];

const css = `
.sm, .sm * { box-sizing: border-box; }
.sm { --navy:#0f2557; --blue:#1f3a93; --gold:#f5b301; --ink:#1d2939; --muted:#667085; --line:#e4e7ec;
  display: flex; flex-direction: column; gap: 16px; max-width: 1100px; margin: 0 auto; color: var(--ink); font-family: inherit; }
.sm h1, .sm p { margin: 0; }
.sm-head h1 { font-size: 1.5rem; color: var(--navy); }
.sm-head p { color: var(--muted); font-size: .92rem; margin-top: 2px; }

.sm-bar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.sm-chip { display: inline-flex; align-items: center; gap: 7px; padding: 7px 13px; border-radius: 999px; border: 1px solid var(--line);
  background: #fff; color: #475467; font: inherit; font-size: .83rem; font-weight: 700; cursor: pointer; }
.sm-chip i { width: 10px; height: 10px; border-radius: 50%; background: var(--c); }
.sm-chip.off { opacity: .45; }
.sm-chip b { font-weight: 800; color: var(--navy); }
.sm-sel { padding: 8px 12px; border: 1px solid #d0d5dd; border-radius: 10px; font: inherit; background: #fff; }
.sm-grow { flex: 1; }
.sm-check { display: inline-flex; align-items: center; gap: 6px; font-size: .85rem; font-weight: 600; color: #475467; cursor: pointer; }

.sm-map { background: #fff; border: 1px solid var(--line); border-radius: 16px; padding: 8px; box-shadow: 0 1px 3px rgba(16,24,40,.06); }
.sm-map > div { z-index: 0; }
.sm-legend { display: flex; flex-wrap: wrap; gap: 14px; padding: 8px 10px 4px; font-size: .78rem; color: var(--muted); }
.sm-legend span { display: inline-flex; align-items: center; gap: 6px; }
.sm-legend i { width: 10px; height: 10px; border-radius: 50%; background: var(--c); border: 2px solid #fff; box-shadow: 0 0 0 1px #d0d5dd; }

.sm-list { background: #fff; border: 1px solid var(--line); border-radius: 16px; overflow: hidden; }
.sm-list h2 { margin: 0; padding: 14px 16px; font-size: 1rem; color: var(--navy); border-bottom: 1px solid var(--line); }
.sm-row { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 16px; border: 0; border-bottom: 1px solid #f2f4f7;
  background: #fff; font: inherit; text-align: left; cursor: pointer; }
.sm-row:last-child { border-bottom: 0; }
.sm-row:hover { background: #f9fafb; }
.sm-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; background: var(--c); }
.sm-row strong { display: block; }
.sm-row span { display: block; font-size: .8rem; color: var(--muted); }
.sm-tag { margin-left: auto; padding: 3px 11px; border-radius: 999px; font-size: .75rem; font-weight: 700; color: #fff; background: var(--c); }
.sm-empty { padding: 26px; text-align: center; color: var(--muted); }
.sm-error { padding: 10px 12px; border-radius: 10px; background: #fef3f2; border: 1px solid #fecdca; color: #b42318; font-size: .88rem; }
`;

function when(d) {
  return new Date(d).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function StaffMonitoring() {
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [days, setDays] = useState('7');
  const [active, setActive] = useState(new Set(STATUSES));
  const [showResp, setShowResp] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = () =>
      api.get('/monitoring', { params: { days } })
        .then((r) => { if (alive) { setData(r.data); setError(''); } })
        .catch((e) => alive && setError(e.response?.data?.error || `Cannot load monitoring (${e.message})`));
    load();
    const t = setInterval(load, 15000);
    return () => { alive = false; clearInterval(t); };
  }, [days]);

  const incidents = useMemo(
    () => (data?.incidents || []).filter((i) => active.has(i.status)),
    [data, active]
  );

  const counts = useMemo(() => {
    const c = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    (data?.incidents || []).forEach((i) => { c[i.status] = (c[i.status] || 0) + 1; });
    return c;
  }, [data]);

  const markers = useMemo(() => {
    const m = incidents.map((i) => ({
      id: `r-${i.id}`, lat: i.latitude, lng: i.longitude, color: STATUS_COLORS[i.status] || '#2b2b2b',
      label: `${i.reportid || '#' + i.id} · ${i.typename} · ${i.status}`,
    }));
    if (showResp) {
      (data?.responders || []).forEach((r) => m.push({
        id: `u-${r.id}`, lat: r.latitude, lng: r.longitude, radius: 6,
        color: r.availability === 'On Duty' ? '#f5b301' : '#0f2557',
        label: `Responder: ${r.fullname} (${r.availability})`,
      }));
    }
    return m;
  }, [incidents, data, showResp]);

  const toggle = (s) => {
    const next = new Set(active);
    next.has(s) ? next.delete(s) : next.add(s);
    setActive(next);
  };

  return (
    <div className="sm">
      <style>{css}</style>

      <div className="sm-head">
        <h1>Incident Monitoring</h1>
        <p>{data ? `${data.scope} · ${incidents.length} incident${incidents.length === 1 ? '' : 's'} on the map` : 'Loading...'}</p>
      </div>

      <div className="sm-bar">
        {STATUSES.map((s) => (
          <button key={s} className={`sm-chip ${active.has(s) ? '' : 'off'}`} style={{ '--c': STATUS_COLORS[s] }} onClick={() => toggle(s)}>
            <i /> {s} <b>{counts[s]}</b>
          </button>
        ))}
        <span className="sm-grow" />
        <label className="sm-check">
          <input type="checkbox" checked={showResp} onChange={(e) => setShowResp(e.target.checked)} /> Responders
        </label>
        <select className="sm-sel" value={days} onChange={(e) => setDays(e.target.value)}>
          {RANGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {error && <div className="sm-error" role="alert">{error}</div>}

      <div className="sm-map">
        <MapView markers={markers} height={460} onMarkerClick={(id) => String(id).startsWith('r-') && nav(`/staff/reports/${String(id).slice(2)}`)} />
        <div className="sm-legend">
          {STATUSES.map((s) => <span key={s} style={{ '--c': STATUS_COLORS[s] }}><i /> {s}</span>)}
          <span style={{ '--c': '#0f2557' }}><i /> Responder (available)</span>
          <span style={{ '--c': '#f5b301' }}><i /> Responder (on duty)</span>
        </div>
      </div>

      <div className="sm-list">
        <h2>Incidents</h2>
        {data && incidents.length === 0 && <div className="sm-empty">No incidents for this filter.</div>}
        {incidents.map((i) => (
          <button key={i.id} className="sm-row" style={{ '--c': STATUS_COLORS[i.status] }} onClick={() => nav(`/staff/reports/${i.id}`)}>
            <i className="sm-dot" />
            <div>
              <strong>{i.typename} · {i.reportid || `#${i.id}`}</strong>
              <span>{i.barangayname} · {when(i.datereported)}</span>
            </div>
            <em className="sm-tag" style={{ fontStyle: 'normal' }}>{i.status}</em>
          </button>
        ))}
      </div>
    </div>
  );
}