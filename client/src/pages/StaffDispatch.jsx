import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api';
import MapView from '../components/MapView';

const css = `
.dp, .dp * { box-sizing: border-box; }
.dp { --navy:#0f2557; --blue:#1f3a93; --gold:#f5b301; --red:#d92d20; --ink:#1d2939; --muted:#667085; --line:#e4e7ec;
  display: flex; flex-direction: column; gap: 16px; max-width: 1100px; margin: 0 auto; color: var(--ink); font-family: inherit; }
.dp h1, .dp h2, .dp p { margin: 0; }
.dp-head h1 { font-size: 1.5rem; color: var(--navy); }
.dp-head p { color: var(--muted); font-size: .92rem; margin-top: 2px; }

.dp-grid { display: grid; grid-template-columns: 380px 1fr; gap: 16px; align-items: start; }
@media (max-width: 900px) { .dp-grid { grid-template-columns: 1fr; } }
.dp-card { padding: 20px; background: #fff; border: 1px solid var(--line); border-radius: 16px; box-shadow: 0 1px 3px rgba(16,24,40,.06); }
.dp-card h2 { font-size: 1rem; color: var(--navy); margin-bottom: 12px; }
.dp-label { display: block; font-size: .8rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--muted); margin: 0 0 6px; }
.dp-label + .dp-select { margin-bottom: 14px; }
.dp-select { width: 100%; padding: 11px 13px; border: 1px solid #d0d5dd; border-radius: 10px; font: inherit; background: #fff; }
.dp-select:focus { outline: none; border-color: var(--blue); box-shadow: 0 0 0 4px rgba(31,58,147,.15); }

.dp-assigned { margin-bottom: 18px; padding: 10px 12px; border-radius: 10px; background: #f4f3ff; border: 1px solid #d9d6fe; color: #5925dc; font-size: .88rem; font-weight: 600; }

.dp-list { display: flex; flex-direction: column; gap: 8px; }
.dp-resp { display: flex; align-items: center; gap: 12px; width: 100%; padding: 11px 13px; text-align: left; font: inherit;
  background: #fff; border: 1.5px solid var(--line); border-radius: 12px; cursor: pointer; transition: border-color .12s, background .12s; }
.dp-resp:hover { border-color: #c7d2f0; background: #fafbff; }
.dp-resp.on { border-color: var(--navy); background: #eef2ff; box-shadow: 0 0 0 3px rgba(15,37,87,.12); }
.dp-av { width: 38px; height: 38px; flex-shrink: 0; display: grid; place-items: center; border-radius: 50%; background: var(--navy); color: var(--gold); font-weight: 800; font-size: .85rem; }
.dp-resp strong { display: block; font-size: .95rem; }
.dp-resp span.d { display: block; font-size: .8rem; color: var(--muted); }
.dp-km { margin-left: auto; padding: 3px 10px; border-radius: 999px; background: #ecfdf3; color: #067647; font-size: .78rem; font-weight: 700; white-space: nowrap; }
.dp-km.none { background: #f2f4f7; color: #667085; }
.dp-empty { padding: 14px; border-radius: 12px; background: #f9fafb; color: var(--muted); font-size: .9rem; text-align: center; }

.dp-error { margin-top: 12px; padding: 10px 12px; border-radius: 10px; background: #fef3f2; border: 1px solid #fecdca; color: #b42318; font-size: .88rem; }
.dp-ok { margin-top: 12px; padding: 10px 12px; border-radius: 10px; background: #ecfdf3; border: 1px solid #abefc6; color: #067647; font-size: .88rem; font-weight: 600; }
.dp-btn { width: 100%; margin-top: 16px; padding: 13px; border: none; border-radius: 12px; color: #fff; font: inherit; font-weight: 800; letter-spacing: .03em; cursor: pointer;
  background: linear-gradient(135deg, var(--blue), var(--navy)); box-shadow: 0 6px 16px rgba(15,37,87,.3); }
.dp-btn:disabled { opacity: .5; cursor: not-allowed; box-shadow: none; }

.dp-map { border-radius: 12px; overflow: hidden; border: 1px solid var(--line); }
.dp-map > div { z-index: 0; }
.dp-legend { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 10px; font-size: .8rem; color: var(--muted); }
.dp-legend span { display: inline-flex; align-items: center; gap: 6px; }
.dp-dot { width: 11px; height: 11px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 1px #d0d5dd; }

.dp-none { padding: 28px; text-align: center; background: #fff; border: 1px solid var(--line); border-radius: 16px; color: var(--muted); }
`;

const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

export default function StaffDispatch() {
  const [incidents, setIncidents] = useState(null);
  const [reportId, setReportId] = useState('');
  const [responders, setResponders] = useState([]);
  const [responderId, setResponderId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const loadIncidents = useCallback(async () => {
    try {
      const { data } = await api.get('/dispatch/incidents');
      setIncidents(data);
      // keep the current selection if it still exists, otherwise pick the first one
      setReportId((cur) =>
        data.some((i) => String(i.id) === cur) ? cur : data[0] ? String(data[0].id) : ''
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Cannot load incidents');
    }
  }, []);

  const loadResponders = useCallback(async () => {
    if (!reportId) {
      setResponders([]);
      return;
    }
    try {
      const { data } = await api.get('/dispatch/responders', { params: { reportId } });
      setResponders(data.responders);
    } catch (err) {
      setError(err.response?.data?.error || 'Cannot load responders');
    }
  }, [reportId]);

  useEffect(() => {
    loadIncidents();
    const t = setInterval(loadIncidents, 10000);
    return () => clearInterval(t);
  }, [loadIncidents]);

  useEffect(() => {
    loadResponders();
    const t = setInterval(loadResponders, 10000);
    return () => clearInterval(t);
  }, [loadResponders]);

  const incident = incidents?.find((i) => String(i.id) === reportId);
  const selected = responders.find((r) => r.id === responderId);

  const markers = useMemo(() => {
    const m = [];
    if (incident) {
      m.push({
        id: 'incident', lat: incident.latitude, lng: incident.longitude,
        color: '#d92d20', radius: 11, label: `${incident.reportid} · ${incident.typename}`,
      });
    }
    responders.forEach((r) => {
      if (r.latitude == null) return;
      m.push({
        id: r.id, lat: r.latitude, lng: r.longitude,
        color: r.id === responderId ? '#f5b301' : '#0f2557',
        label: `${r.fullname} · ${r.distancekm} km`,
      });
    });
    return m;
  }, [incident, responders, responderId]);

  function pickFromMap(id) {
    if (id !== 'incident') setResponderId(id);
  }

  async function dispatch() {
    setError('');
    setMessage('');
    setBusy(true);
    try {
      await api.post('/dispatch', { reportId, responderId });
      setMessage(`${selected.fullname} has been dispatched.`);
      setResponderId(null);
      await Promise.all([loadIncidents(), loadResponders()]);
    } catch (err) {
      setError(err.response?.data?.error || 'Cannot reach the server');
      loadResponders();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dp">
      <style>{css}</style>

      <div className="dp-head">
        <h1>Responder Dispatch</h1>
        <p>Pick a verified incident, then send the nearest available responder.</p>
      </div>

      {incidents?.length === 0 ? (
        <div className="dp-none">No verified incidents waiting for dispatch. Verify a pending report first.</div>
      ) : (
        <div className="dp-grid">
          <div className="dp-card">
            <h2>Select incident</h2>
            <label className="dp-label">Incident</label>
            <select
              className="dp-select"
              value={reportId}
              onChange={(e) => { setReportId(e.target.value); setResponderId(null); setMessage(''); }}
            >
              {incidents?.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.reportid} — {i.typename} · {i.barangayname} ({i.status})
                </option>
              ))}
            </select>

            {incident?.assigned && (
              <div className="dp-assigned">Already assigned: {incident.assigned}</div>
            )}

            <label className="dp-label">Available responders</label>
            <div className="dp-list">
              {responders.length === 0 && (
                <div className="dp-empty">No responders available right now. They may already be on duty.</div>
              )}
              {responders.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`dp-resp ${r.id === responderId ? 'on' : ''}`}
                  onClick={() => setResponderId(r.id)}
                >
                  <span className="dp-av">{initials(r.fullname)}</span>
                  <span>
                    <strong>{r.fullname}</strong>
                    <span className="d">{r.distancekm == null ? 'Location not shared yet' : 'Nearest first'}</span>
                  </span>
                  <span className={`dp-km ${r.distancekm == null ? 'none' : ''}`}>
                    {r.distancekm == null ? 'No location' : `${r.distancekm} km`}
                  </span>
                </button>
              ))}
            </div>

            {error && <div className="dp-error" role="alert">{error}</div>}
            {message && <div className="dp-ok" role="status">{message}</div>}
            <button className="dp-btn" disabled={!selected || busy} onClick={dispatch}>
              {busy ? 'Dispatching...' : selected ? `Dispatch ${selected.fullname}` : 'Select a responder'}
            </button>
          </div>

          <div className="dp-card">
            <h2>Incident map</h2>
            <div className="dp-map">
              <MapView markers={markers} height={440} onMarkerClick={pickFromMap} />
            </div>
            <div className="dp-legend">
              <span><i className="dp-dot" style={{ background: '#d92d20' }} />Incident</span>
              <span><i className="dp-dot" style={{ background: '#0f2557' }} />Responder</span>
              <span><i className="dp-dot" style={{ background: '#f5b301' }} />Selected</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}