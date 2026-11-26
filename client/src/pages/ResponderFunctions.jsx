import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../api';

const css = `
.rf, .rf * { box-sizing: border-box; }
.rf { --navy:#0f2557; --blue:#1f3a93; --gold:#f5b301; --red:#d92d20; --ink:#1d2939; --muted:#667085; --line:#e4e7ec;
  display: flex; flex-direction: column; gap: 16px; max-width: 900px; margin: 0 auto; color: var(--ink); font-family: inherit; }
.rf h1, .rf h2, .rf p { margin: 0; }
.rf-head h1 { font-size: 1.5rem; color: var(--navy); }
.rf-head p { color: var(--muted); font-size: .92rem; margin-top: 2px; }

.rf-active { padding: 18px 20px; background: #fff; border: 1px solid var(--line); border-left: 5px solid var(--gold); border-radius: 16px; }
.rf-label { display: block; font-size: .78rem; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
.rf-select, .rf-text { width: 100%; padding: 11px 13px; border: 1px solid #d0d5dd; border-radius: 10px; font: inherit; background: #fff; }
.rf-select:focus, .rf-text:focus { outline: none; border-color: var(--blue); box-shadow: 0 0 0 4px rgba(31,58,147,.15); }
.rf-text { resize: vertical; }
.rf-hint { color: var(--muted); font-size: .9rem; }

.rf-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
.rf-card { display: flex; flex-direction: column; gap: 10px; padding: 20px; background: #fff; border: 1px solid var(--line); border-radius: 16px; box-shadow: 0 1px 3px rgba(16,24,40,.06); }
.rf-card h2 { font-size: 1.05rem; color: var(--navy); }
.rf-card .rf-hint { margin-bottom: 2px; }

.rf-seg { display: flex; padding: 4px; gap: 4px; background: #f2f4f7; border-radius: 12px; }
.rf-seg button { flex: 1; padding: 11px; border: none; border-radius: 9px; background: transparent; color: #475467; font: inherit; font-weight: 700; cursor: pointer; transition: background .12s, color .12s; }
.rf-seg button.on { background: var(--navy); color: #fff; box-shadow: 0 2px 8px rgba(15,37,87,.3); }
.rf-seg button:disabled { opacity: .6; cursor: not-allowed; }

.rf-btn { padding: 12px 18px; border: none; border-radius: 10px; color: #fff; font: inherit; font-weight: 800; cursor: pointer;
  background: linear-gradient(135deg, var(--blue), var(--navy)); }
.rf-btn.green { background: linear-gradient(135deg, #16b364, #067647); }
.rf-btn:disabled { opacity: .5; cursor: not-allowed; }
.rf-check { display: flex; align-items: flex-start; gap: 8px; font-size: .86rem; color: #475467; cursor: pointer; }
.rf-check input { margin-top: 3px; }
.rf-file { width: 100%; padding: 10px; border: 1.5px dashed #c7d2f0; border-radius: 10px; background: #fafbff; font: inherit; font-size: .88rem; }
.rf-coords { font-size: .82rem; color: var(--muted); }

.rf-ok, .rf-err { padding: 10px 12px; border-radius: 10px; font-size: .88rem; }
.rf-ok { background: #ecfdf3; border: 1px solid #abefc6; color: #067647; font-weight: 600; }
.rf-err { background: #fef3f2; border: 1px solid #fecdca; color: #b42318; }
`;

export default function ResponderFunctions() {
  const [dash, setDash] = useState(null);
  const [incidentId, setIncidentId] = useState('');
  const [photo, setPhoto] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [coords, setCoords] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [notice, setNotice] = useState(null); // { card, ok, text }
  const [busy, setBusy] = useState('');
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/responder/dashboard');
      setDash(data);
      // keep the selected incident if it still exists, otherwise pick the first
      setIncidentId((cur) =>
        data.incidents.some((i) => String(i.id) === cur) ? cur : data.incidents[0] ? String(data.incidents[0].id) : ''
      );
    } catch (err) {
      setNotice({ card: 'page', ok: false, text: err.response?.data?.error || 'Cannot load page' });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const note = (card) =>
    notice?.card === card && <div className={notice.ok ? 'rf-ok' : 'rf-err'} role="status">{notice.text}</div>;

  // ----- GPS -----
  const sendLocation = useCallback(
    () =>
      new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve({ ok: false, text: 'GPS is not supported on this device' });
          return;
        }
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            try {
              await api.post('/responder/location', c);
              setCoords(c);
              resolve({ ok: true, text: 'Location shared with dispatch' });
            } catch (err) {
              resolve({ ok: false, text: err.response?.data?.error || 'Cannot reach the server' });
            }
          },
          () => resolve({ ok: false, text: 'Location blocked. Allow location access and try again.' }),
          { enableHighAccuracy: true, timeout: 15000 }
        );
      }),
    []
  );

  useEffect(() => {
    if (!sharing) return;
    const t = setInterval(() => sendLocation(), 30000);
    return () => clearInterval(t);
  }, [sharing, sendLocation]);

  async function shareNow() {
    setBusy('location');
    const r = await sendLocation();
    setNotice({ card: 'location', ...r });
    setBusy('');
  }

  async function toggleSharing(e) {
    const on = e.target.checked;
    if (on) {
      setBusy('location');
      const r = await sendLocation();
      setBusy('');
      setNotice({ card: 'location', ...r });
      if (!r.ok) return;
    }
    setSharing(on);
  }

  // ----- Status -----
  async function setAvailability(value) {
    setBusy('status');
    try {
      await api.patch('/responder/availability', { availability: value });
      setNotice({ card: 'status', ok: true, text: `You are now ${value}` });
      await load();
    } catch (err) {
      setNotice({ card: 'status', ok: false, text: err.response?.data?.error || 'Cannot reach the server' });
    } finally {
      setBusy('');
    }
  }

  // ----- Photo -----
  function pickPhoto(e) {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      setNotice({ card: 'photo', ok: false, text: 'Photo must be 5 MB or smaller' });
      e.target.value = '';
      setPhoto(null);
      return;
    }
    setPhoto(file || null);
  }

  async function uploadPhoto(e) {
    e.preventDefault();
    if (!photo) {
      setNotice({ card: 'photo', ok: false, text: 'Choose a photo first' });
      return;
    }
    setBusy('photo');
    try {
      const fd = new FormData();
      fd.append('photo', photo);
      await api.post(`/responder/incidents/${incidentId}/photo`, fd);
      setPhoto(null);
      if (fileRef.current) fileRef.current.value = '';
      setNotice({ card: 'photo', ok: true, text: 'Photo uploaded' });
    } catch (err) {
      setNotice({ card: 'photo', ok: false, text: err.response?.data?.error || 'Cannot reach the server' });
    } finally {
      setBusy('');
    }
  }

  // ----- Resolve -----
  async function resolve() {
    if (!window.confirm('Mark this incident as resolved?')) return;
    setBusy('resolve');
    try {
      const { data } = await api.post(`/responder/incidents/${incidentId}/resolve`, { remarks });
      setRemarks('');
      setNotice({
        card: 'resolve',
        ok: true,
        text: data.reportResolved
          ? 'Incident marked as resolved'
          : 'Your part is complete. The incident stays open for the other responders.',
      });
      await load();
    } catch (err) {
      setNotice({ card: 'resolve', ok: false, text: err.response?.data?.error || 'Cannot reach the server' });
    } finally {
      setBusy('');
    }
  }

  if (!dash) {
    return (
      <div className="rf">
        <style>{css}</style>
        <p className="rf-hint">{notice ? notice.text : 'Loading...'}</p>
      </div>
    );
  }

  const hasIncident = dash.incidents.length > 0;

  return (
    <div className="rf">
      <style>{css}</style>

      <div className="rf-head">
        <h1>Responder Functions</h1>
        <p>Update your status, share your location and report progress.</p>
      </div>

      <section className="rf-active">
        <label className="rf-label">Active incident (used by Upload Photo and Mark Resolved)</label>
        {hasIncident ? (
          <select className="rf-select" value={incidentId} onChange={(e) => setIncidentId(e.target.value)}>
            {dash.incidents.map((i) => (
              <option key={i.id} value={i.id}>{i.reportid} — {i.typename} · {i.barangayname}</option>
            ))}
          </select>
        ) : (
          <p className="rf-hint">You have no active assignment. These two tools unlock when an official dispatches you.</p>
        )}
      </section>

      <div className="rf-grid">
        <section className="rf-card">
          <h2>Update status</h2>
          <p className="rf-hint">Available responders can be dispatched.</p>
          <div className="rf-seg">
            {['Available', 'On Duty'].map((v) => (
              <button
                key={v}
                className={dash.availability === v ? 'on' : ''}
                disabled={busy === 'status'}
                onClick={() => setAvailability(v)}
              >
                {v}
              </button>
            ))}
          </div>
          {note('status')}
        </section>

        <section className="rf-card">
          <h2>Get location</h2>
          <p className="rf-hint">Share your GPS position with dispatch.</p>
          <button className="rf-btn" disabled={busy === 'location'} onClick={shareNow}>
            {busy === 'location' ? 'Locating...' : 'Share my location now'}
          </button>
          <label className="rf-check">
            <input type="checkbox" checked={sharing} onChange={toggleSharing} />
            Keep sharing every 30 seconds (only while this page is open)
          </label>
          {coords && <p className="rf-coords">Last shared: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}</p>}
          {note('location')}
        </section>

        <form className="rf-card" onSubmit={uploadPhoto}>
          <h2>Upload photo</h2>
          <p className="rf-hint">Attach incident evidence (up to 5 MB).</p>
          <input
            ref={fileRef}
            className="rf-file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            disabled={!hasIncident}
            onChange={pickPhoto}
          />
          <button className="rf-btn" disabled={!hasIncident || busy === 'photo'}>
            {busy === 'photo' ? 'Uploading...' : 'Upload photo'}
          </button>
          {note('photo')}
        </form>

        <section className="rf-card">
          <h2>Mark resolved</h2>
          <p className="rf-hint">Update the incident status when you're done.</p>
          <textarea
            className="rf-text"
            rows="3"
            maxLength="255"
            placeholder="Notes (optional)"
            value={remarks}
            disabled={!hasIncident}
            onChange={(e) => setRemarks(e.target.value)}
          />
          <button className="rf-btn green" disabled={!hasIncident || busy === 'resolve'} onClick={resolve}>
            {busy === 'resolve' ? 'Saving...' : 'Mark resolved'}
          </button>
          {note('resolve')}
        </section>
      </div>

      {note('page')}
    </div>
  );
}