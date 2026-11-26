import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import MapView from '../components/MapView';

const css = `
.rp, .rp * { box-sizing: border-box; }
.rp {
  --navy: #0f2557; --blue: #1f3a93; --gold: #f5b301; --red: #d92d20;
  --ink: #1d2939; --muted: #667085; --line: #d0d5dd;
  max-width: 720px; margin: 0 auto;
  display: flex; flex-direction: column; gap: 16px;
  color: var(--ink); font-family: inherit;
}
.rp h1, .rp h2, .rp p { margin: 0; }

.rp-banner {
  padding: 22px 24px; border-radius: 20px; color: #fff;
  background:
    radial-gradient(circle at 100% 0%, rgba(245, 179, 1, 0.28), transparent 42%),
    linear-gradient(135deg, var(--blue), var(--navy));
  border-bottom: 4px solid var(--gold);
}
.rp-banner h1 { font-size: 1.6rem; color: #fff; margin-bottom: 4px; }
.rp-banner p { color: rgba(255, 255, 255, 0.85); }

.rp-form { display: flex; flex-direction: column; gap: 16px; }
.rp-section {
  display: flex; flex-direction: column; gap: 8px; padding: 20px;
  background: #fff; border: 1px solid #e4e7ec; border-radius: 16px;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.06);
}
.rp-section h2 { display: flex; align-items: center; gap: 10px; font-size: 1.05rem; margin-bottom: 4px; }
.rp-step {
  width: 26px; height: 26px; display: grid; place-items: center;
  border-radius: 50%; background: var(--navy); color: var(--gold);
  font-size: 0.85rem; font-weight: 800;
}

.rp-label { font-size: 0.85rem; font-weight: 600; color: #344054; margin-top: 6px; }
.rp-label em { font-weight: 400; color: var(--muted); font-style: normal; }
.rp-input {
  width: 100%; padding: 12px 14px; font: inherit; font-size: 1rem; color: var(--ink);
  background: #fff; border: 1px solid var(--line); border-radius: 10px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.rp-input:focus { outline: none; border-color: var(--blue); box-shadow: 0 0 0 4px rgba(31, 58, 147, 0.15); }
.rp-textarea { resize: vertical; min-height: 110px; }
.rp-count { align-self: flex-end; font-size: 0.75rem; color: var(--muted); }

.rp-chips { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; }
.rp-chip {
  position: relative; display: flex; align-items: center; justify-content: center;
  padding: 14px 10px; border: 1.5px solid var(--line); border-radius: 12px;
  background: #fff; color: #344054; font-weight: 700; cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}
.rp-chip:hover { border-color: var(--blue); }
.rp-chip input { position: absolute; opacity: 0; inset: 0; cursor: pointer; }
.rp-chip.is-on { border-color: var(--red); background: #fef3f2; color: #b42318; box-shadow: 0 0 0 3px rgba(217, 45, 32, 0.12); }
.rp-chip:focus-within { outline: 3px solid rgba(31, 58, 147, 0.35); outline-offset: 2px; }

.rp-drop {
  position: relative; display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 22px 16px; border: 2px dashed #b2bfe4; border-radius: 14px;
  background: #f5f7ff; color: var(--blue); cursor: pointer; text-align: center;
  transition: background 0.15s, border-color 0.15s;
}
.rp-drop:hover { background: #eaf0ff; border-color: var(--blue); }
.rp-drop input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.rp-drop small { color: var(--muted); }
.rp-preview { position: relative; border-radius: 14px; overflow: hidden; border: 1px solid #e4e7ec; }
.rp-preview img { display: block; width: 100%; max-height: 280px; object-fit: cover; }
.rp-preview button {
  position: absolute; top: 10px; right: 10px; padding: 6px 12px; border: none; border-radius: 8px;
  background: rgba(15, 37, 87, 0.85); color: #fff; font-weight: 600; cursor: pointer;
}

.rp-gps { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 12px; border: 1px solid; font-size: 0.92rem; }
.rp-gps.is-ok { background: #ecfdf3; border-color: #abefc6; color: #067647; }
.rp-gps.is-wait { background: #fffaeb; border-color: #fedf89; color: #b54708; }
.rp-gps-dot { width: 10px; height: 10px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
.rp-gps.is-wait .rp-gps-dot { animation: rp-blink 1.2s ease-in-out infinite; }
.rp-gps-text { flex: 1; }
.rp-gps button {
  padding: 6px 14px; border-radius: 8px; border: 1px solid currentColor;
  background: transparent; color: inherit; font-weight: 700; cursor: pointer;
}
@keyframes rp-blink { 50% { opacity: 0.25; } }
.rp-maphint { font-size: 0.8rem; color: var(--muted); }

.rp-error { padding: 12px 14px; border-radius: 12px; background: #fef3f2; border: 1px solid #fecdca; color: #b42318; font-size: 0.92rem; }
.rp-submit {
  padding: 16px; border: none; border-radius: 14px;
  background: linear-gradient(135deg, #f04438, var(--red)); color: #fff;
  font-size: 1.05rem; font-weight: 800; letter-spacing: 0.03em; text-transform: uppercase;
  cursor: pointer; box-shadow: 0 6px 16px rgba(217, 45, 32, 0.35);
  transition: transform 0.12s, box-shadow 0.15s, opacity 0.15s;
}
.rp-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 10px 22px rgba(217, 45, 32, 0.42); }
.rp-submit:disabled { opacity: 0.65; cursor: not-allowed; }
.rp-foot { text-align: center; font-size: 0.82rem; color: var(--muted); }

@media (prefers-reduced-motion: reduce) {
  .rp-gps-dot { animation: none; }
  .rp-chip, .rp-submit { transition: none; }
}
`;

export default function ReportIncident() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meta, setMeta] = useState({ types: [], barangays: [] });
  const [form, setForm] = useState({
    incidenttype: '',
    barangay: user.barangay ? String(user.barangay) : '', // starts on the resident's own barangay
    description: '',
  });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [coords, setCoords] = useState(null);
  const [gpsMsg, setGpsMsg] = useState('Detecting your location...');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/incidents/meta').then((r) => setMeta(r.data));
    locate();
  }, []);

  function locate() {
    if (!navigator.geolocation) {
      setGpsMsg('GPS is not supported on this device');
      return;
    }
    setGpsMsg('Detecting your location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setGpsMsg('Current location detected');
      },
      (err) => {
        setCoords(null);
        if (err.code === 1) {
          setGpsMsg('Location permission denied. Allow location in your browser settings, then tap Retry.');
        } else if (err.code === 2) {
          setGpsMsg('Location unavailable. Turn on Location in your device settings, then tap Retry.');
        } else {
          setGpsMsg('Location timed out. Check your connection, then tap Retry.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function pickPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be 5 MB or smaller');
      return;
    }
    setError('');
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  function removePhoto() {
    setPhoto(null);
    setPreview('');
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!coords) {
      setError('We need your GPS location to send the report');
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('incidenttype', form.incidenttype);
      fd.append('barangay', form.barangay);
      fd.append('description', form.description);
      fd.append('latitude', coords.latitude);
      fd.append('longitude', coords.longitude);
      if (photo) fd.append('photo', photo);
      const { data } = await api.post('/incidents', fd);
      navigate(`/resident/incident/${data.id}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Cannot reach the server');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rp">
      <style>{css}</style>

      <header className="rp-banner">
        <h1>Report Emergency</h1>
        <p>Provide details so responders can help quickly.</p>
      </header>

      <form className="rp-form" onSubmit={submit}>
        {/* Step 1 */}
        <section className="rp-section">
          <h2><span className="rp-step">1</span> What happened?</h2>
          <div className="rp-chips" role="radiogroup" aria-label="Incident type">
            {meta.types.map((t) => (
              <label key={t.id} className={`rp-chip ${String(form.incidenttype) === String(t.id) ? 'is-on' : ''}`}>
                <input
                  type="radio"
                  name="incidenttype"
                  value={t.id}
                  checked={String(form.incidenttype) === String(t.id)}
                  onChange={set('incidenttype')}
                  required
                />
                {t.typename}
              </label>
            ))}
          </div>
        </section>

        {/* Step 2 */}
        <section className="rp-section">
          <h2><span className="rp-step">2</span> Where and details</h2>

          <label className="rp-label" htmlFor="rp-barangay">Barangay where the emergency is</label>
          <select id="rp-barangay" className="rp-input" value={form.barangay} onChange={set('barangay')} required>
            <option value="">Select barangay</option>
            {meta.barangays.map((b) => <option key={b.id} value={b.id}>{b.barangayname}</option>)}
          </select>

          <label className="rp-label" htmlFor="rp-desc">Description</label>
          <textarea
            id="rp-desc"
            className="rp-input rp-textarea"
            rows="4"
            maxLength="500"
            value={form.description}
            onChange={set('description')}
            placeholder="Describe what happened..."
            required
          />
          <span className="rp-count">{form.description.length}/500</span>
        </section>

        {/* Step 3 */}
        <section className="rp-section">
          <h2><span className="rp-step">3</span> Photo and location</h2>

          <span className="rp-label">Photo evidence <em>(optional)</em></span>
          {!preview ? (
            <label className="rp-drop">
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pickPhoto} />
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 8h3l2-2h6l2 2h3v11H4z" />
                <circle cx="12" cy="13" r="3.2" />
              </svg>
              <strong>Add a photo</strong>
              <small>JPG, PNG or WebP, up to 5 MB</small>
            </label>
          ) : (
            <div className="rp-preview">
              <img src={preview} alt="Preview" />
              <button type="button" onClick={removePhoto}>Remove</button>
            </div>
          )}

          <span className="rp-label">GPS location</span>
          <div className={`rp-gps ${coords ? 'is-ok' : 'is-wait'}`}>
            <span className="rp-gps-dot" aria-hidden="true" />
            <span className="rp-gps-text">{gpsMsg}</span>
            {!coords && <button type="button" onClick={locate}>Retry</button>}
          </div>

          {coords && (
            <>
              <MapView
                height={240}
                markers={[
                  {
                    id: 'me',
                    lat: coords.latitude,
                    lng: coords.longitude,
                    color: '#d92d20',
                    radius: 10,
                    label: 'Your location',
                  },
                ]}
              />
              <p className="rp-maphint">
                Location: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
              </p>
            </>
          )}
        </section>

        {error && <div className="rp-error" role="alert">{error}</div>}

        <button className="rp-submit" disabled={busy}>
          {busy ? 'Submitting...' : 'Submit Incident Report'}
        </button>
        <p className="rp-foot">For a life-threatening emergency, also call <strong>911</strong>.</p>
      </form>
    </div>
  );
}