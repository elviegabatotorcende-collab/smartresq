import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { FILE_URL } from '../api';
import { useAuth } from '../AuthContext';
import StatusBadge from '../components/StatusBadge';
import MapView from '../components/MapView';

const css = `
.rd, .rd * { box-sizing: border-box; }
.rd { --navy:#0f2557; --blue:#1f3a93; --gold:#f5b301; --red:#d92d20; --ink:#1d2939; --muted:#667085; --line:#e4e7ec;
  display: flex; flex-direction: column; gap: 16px; max-width: 1100px; margin: 0 auto; color: var(--ink); font-family: inherit; }
.rd h1, .rd h2, .rd p { margin: 0; }
.rd-back { color: var(--blue); font-weight: 700; font-size: .9rem; text-decoration: none; }
.rd-back:hover { text-decoration: underline; }

.rd-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px;
  padding: 20px 22px; border-radius: 18px; color: #fff; border-bottom: 4px solid var(--gold);
  background: radial-gradient(circle at 100% 0%, rgba(245,179,1,.28), transparent 42%), linear-gradient(135deg, var(--blue), var(--navy)); }
.rd-eyebrow { font-size: .72rem; letter-spacing: .14em; text-transform: uppercase; color: var(--gold); font-weight: 700; }
.rd-head h1 { font-size: 1.6rem; color: #fff; }
.rd-head p { color: rgba(255,255,255,.85); margin-top: 2px; }

.rd-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 16px; align-items: start; }
@media (max-width: 860px) { .rd-grid { grid-template-columns: 1fr; } }
.rd-col { display: flex; flex-direction: column; gap: 16px; min-width: 0; }

.rd-card { padding: 20px; background: #fff; border: 1px solid var(--line); border-radius: 16px; box-shadow: 0 1px 3px rgba(16,24,40,.06); }
.rd-card h2 { font-size: 1rem; color: var(--navy); margin-bottom: 10px; }
.rd-desc { line-height: 1.6; color: #344054; white-space: pre-wrap; word-break: break-word; }
.rd-photo { display: block; width: 100%; max-height: 320px; object-fit: cover; margin-top: 12px; border-radius: 12px; border: 1px solid var(--line); }
.rd-sub { margin-top: 14px; font-size: .78rem; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: var(--muted); }
.rd-meta { display: flex; flex-direction: column; gap: 6px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--line); font-size: .88rem; color: var(--muted); }
.rd-meta strong { color: var(--ink); }
.rd-meta a { color: var(--blue); font-weight: 700; }
.rd-map { margin-top: 12px; border-radius: 12px; overflow: hidden; border: 1px solid var(--line); }
.rd-map > div { z-index: 0; }

.rd-timeline { list-style: none; margin: 0; padding: 0 0 0 16px; border-left: 2px solid var(--line); display: flex; flex-direction: column; gap: 16px; }
.rd-timeline li { position: relative; font-size: .9rem; }
.rd-timeline li::before { content: ''; position: absolute; left: -23px; top: 5px; width: 12px; height: 12px; border-radius: 50%; background: var(--gold); border: 2px solid #fff; box-shadow: 0 0 0 1px var(--line); }
.rd-remarks { display: block; margin-top: 4px; color: #344054; }
.rd-when { display: block; margin-top: 2px; font-size: .78rem; color: var(--muted); }

.rd-label { display: block; font-size: .82rem; font-weight: 600; color: #344054; margin-bottom: 5px; }
.rd-text { width: 100%; padding: 11px 13px; border: 1px solid #d0d5dd; border-radius: 10px; font: inherit; resize: vertical; }
.rd-text:focus { outline: none; border-color: var(--blue); box-shadow: 0 0 0 4px rgba(31,58,147,.15); }
.rd-error { margin-top: 12px; padding: 10px 12px; border-radius: 10px; background: #fef3f2; border: 1px solid #fecdca; color: #b42318; font-size: .88rem; }
.rd-btns { display: flex; gap: 10px; margin-top: 14px; }
.rd-btns button { flex: 1; padding: 12px; border: none; border-radius: 10px; font: inherit; font-weight: 800; cursor: pointer; color: #fff; }
.rd-verify { background: linear-gradient(135deg, var(--blue), var(--navy)); }
.rd-reject { background: linear-gradient(135deg, #f04438, var(--red)); }
.rd-btns button:disabled { opacity: .6; cursor: not-allowed; }
.rd-note { padding: 14px 16px; border-radius: 12px; background: #eef2ff; color: var(--blue); font-size: .9rem; font-weight: 600; }
`;

export default function StaffReportDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    () =>
      api.get(`/reports/${id}`)
        .then((r) => { setData(r.data); setLoadError(''); })
        .catch((err) => setLoadError(err.response?.data?.error || 'Cannot load report')),
    [id]
  );

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  async function decide(status) {
    setActionError('');
    if (status === 'Rejected' && !remarks.trim()) {
      setActionError('Add a reason before rejecting');
      return;
    }
    setBusy(true);
    try {
      await api.patch(`/reports/${id}/status`, { status, remarks });
      setRemarks('');
      await load();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Cannot reach the server');
    } finally {
      setBusy(false);
    }
  }

  if (loadError) return <div className="rd"><style>{css}</style><div className="rd-error">{loadError}</div></div>;
  if (!data) return <div className="rd"><style>{css}</style><p style={{ color: '#667085' }}>Loading...</p></div>;

  const { report, log, photos = [] } = data;
  const canDecide = [2, 3].includes(user.role) && report.status === 'Pending';
  const lat = Number(report.latitude);
  const lng = Number(report.longitude);
  const hasLocation = report.latitude != null && report.longitude != null && !Number.isNaN(lat) && !Number.isNaN(lng);
  const mapLink = `https://www.openstreetmap.org/?mlat=${report.latitude}&mlon=${report.longitude}#map=17/${report.latitude}/${report.longitude}`;

  return (
    <div className="rd">
      <style>{css}</style>

      <Link to="/staff/reports" className="rd-back">← Back to reports</Link>

      <header className="rd-head">
        <div>
          <p className="rd-eyebrow">Incident report</p>
          <h1>{report.reportid}</h1>
          <p>{report.typename} · {report.barangayname}</p>
        </div>
        <StatusBadge status={report.status} />
      </header>

      <div className="rd-grid">
        <div className="rd-col">
          <section className="rd-card">
            <h2>Details</h2>
            <p className="rd-desc">{report.description || 'No description provided.'}</p>

            {report.photo && <img className="rd-photo" src={FILE_URL + report.photo} alt="Incident" />}

            {photos.length > 0 && (
              <>
                <p className="rd-sub">Responder photos</p>
                {photos.map((p, i) => (
                  <div key={i}>
                    <img className="rd-photo" src={FILE_URL + p.photo} alt="Responder evidence" />
                    <span className="rd-when">{p.uploadedbyname} · {new Date(p.dateuploaded).toLocaleString()}</span>
                  </div>
                ))}
              </>
            )}

            <div className="rd-meta">
              <span>Reported <strong>{new Date(report.datereported).toLocaleString()}</strong></span>
              <span>
                Reported by <strong>{report.residentname}</strong>
                {report.residentcontact ? ` · ${report.residentcontact}` : ''}
              </span>
              {hasLocation && <a href={mapLink} target="_blank" rel="noreferrer">Open in OpenStreetMap</a>}
            </div>
          </section>

          {hasLocation && (
            <section className="rd-card">
              <h2>Location</h2>
              <div className="rd-map">
                <MapView
                  markers={[{ id: 'incident', lat, lng, color: '#d92d20', radius: 11, label: report.reportid }]}
                  height={260}
                />
              </div>
            </section>
          )}
        </div>

        <div className="rd-col">
          <section className="rd-card">
            <h2>Progress</h2>
            <ul className="rd-timeline">
              {log.map((l, i) => (
                <li key={i}>
                  <StatusBadge status={l.status} />
                  {l.remarks && <span className="rd-remarks">{l.remarks}</span>}
                  <span className="rd-when">{l.updatedbyname} · {new Date(l.dateupdated).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </section>

          {canDecide && (
            <section className="rd-card">
              <h2>Verify this report</h2>
              <label className="rd-label">Remarks (required when rejecting)</label>
              <textarea className="rd-text" rows="3" maxLength="255" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
              {actionError && <div className="rd-error" role="alert">{actionError}</div>}
              <div className="rd-btns">
                <button className="rd-verify" disabled={busy} onClick={() => decide('Verified')}>Verify</button>
                <button className="rd-reject" disabled={busy} onClick={() => decide('Rejected')}>Reject</button>
              </div>
            </section>
          )}

          {!canDecide && report.status === 'Verified' && [2, 3].includes(user.role) && (
            <div className="rd-note">Verified. Go to <strong>Dispatch</strong> to send a responder.</div>
          )}
        </div>
      </div>
    </div>
  );
}