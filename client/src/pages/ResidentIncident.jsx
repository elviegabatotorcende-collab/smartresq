import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { FILE_URL } from '../api';
import StatusBadge from '../components/StatusBadge';
import MapView from '../components/MapView';

const css = `
.ri, .ri * { box-sizing: border-box; }
.ri { --navy:#0f2557; --blue:#1f3a93; --gold:#f5b301; --red:#d92d20; --ink:#1d2939; --muted:#667085; --line:#e4e7ec;
  display: flex; flex-direction: column; gap: 16px; max-width: 760px; margin: 0 auto; color: var(--ink); font-family: inherit; }
.ri h1, .ri h2, .ri p { margin: 0; }
.ri-back { color: var(--blue); font-weight: 700; font-size: .9rem; text-decoration: none; }
.ri-back:hover { text-decoration: underline; }

.ri-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; padding: 20px 22px; border-radius: 18px; color: #fff;
  border-bottom: 4px solid var(--gold);
  background: radial-gradient(circle at 100% 0%, rgba(245,179,1,.28), transparent 42%), linear-gradient(135deg, var(--blue), var(--navy)); }
.ri-eyebrow { font-size: .72rem; letter-spacing: .14em; text-transform: uppercase; color: var(--gold); font-weight: 700; }
.ri-head h1 { font-size: 1.6rem; color: #fff; }
.ri-head p { color: rgba(255,255,255,.85); margin-top: 2px; }

.ri-card { padding: 20px; background: #fff; border: 1px solid var(--line); border-radius: 16px; box-shadow: 0 1px 3px rgba(16,24,40,.06); }
.ri-card h2 { font-size: 1rem; color: var(--navy); margin-bottom: 10px; }
.ri-desc { line-height: 1.6; color: #344054; white-space: pre-wrap; word-break: break-word; }
.ri-photo { display: block; width: 100%; max-height: 340px; object-fit: cover; margin-top: 12px; border-radius: 12px; border: 1px solid var(--line); }
.ri-meta { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--line); font-size: .88rem; color: var(--muted); }
.ri-meta strong { color: var(--ink); }
.ri-map { border-radius: 12px; overflow: hidden; border: 1px solid var(--line); }
.ri-map > div { z-index: 0; }
.ri-link { display: inline-block; margin-top: 10px; color: var(--blue); font-weight: 700; font-size: .86rem; }

.ri-timeline { list-style: none; margin: 0; padding: 0 0 0 16px; border-left: 2px solid var(--line); display: flex; flex-direction: column; gap: 18px; }
.ri-timeline li { position: relative; font-size: .9rem; }
.ri-timeline li::before { content: ''; position: absolute; left: -23px; top: 5px; width: 12px; height: 12px; border-radius: 50%; background: var(--gold); border: 2px solid #fff; box-shadow: 0 0 0 1px var(--line); }
.ri-timeline li:last-child::before { background: var(--blue); box-shadow: 0 0 0 3px rgba(31,58,147,.2); }
.ri-remarks { display: block; margin-top: 4px; color: #344054; }
.ri-when { display: block; margin-top: 2px; font-size: .78rem; color: var(--muted); }

.ri-error { padding: 10px 12px; border-radius: 10px; background: #fef3f2; border: 1px solid #fecdca; color: #b42318; font-size: .88rem; }
`;

export default function ResidentIncident() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const load = () =>
      api.get(`/incidents/${id}`)
        .then((r) => alive && setData(r.data))
        .catch((err) => alive && setError(err.response?.data?.error || 'Cannot load report'));
    load();
    const t = setInterval(load, 10000);
    return () => { alive = false; clearInterval(t); };
  }, [id]);

  if (error) return <div className="ri"><style>{css}</style><div className="ri-error">{error}</div></div>;
  if (!data) return <div className="ri"><style>{css}</style><p style={{ color: '#667085' }}>Loading...</p></div>;

  const { report, log } = data;
  const lat = Number(report.latitude);
  const lng = Number(report.longitude);
  const hasLocation = report.latitude != null && report.longitude != null && !Number.isNaN(lat) && !Number.isNaN(lng);
  const mapLink = `https://www.openstreetmap.org/?mlat=${report.latitude}&mlon=${report.longitude}#map=17/${report.latitude}/${report.longitude}`;

  return (
    <div className="ri">
      <style>{css}</style>

      <Link to="/resident/home" className="ri-back">← Back</Link>

      <header className="ri-head">
        <div>
          <p className="ri-eyebrow">Your report</p>
          <h1>{report.reportid}</h1>
          <p>{report.typename} · {report.barangayname}</p>
        </div>
        <StatusBadge status={report.status} />
      </header>

      <section className="ri-card">
        <h2>Details</h2>
        <p className="ri-desc">{report.description || 'No description provided.'}</p>
        {report.photo && <img className="ri-photo" src={FILE_URL + report.photo} alt="Incident" />}
        <p className="ri-meta">Reported <strong>{new Date(report.datereported).toLocaleString()}</strong></p>
      </section>

      {hasLocation && (
        <section className="ri-card">
          <h2>Location</h2>
          <div className="ri-map">
            <MapView markers={[{ id: 'incident', lat, lng, color: '#d92d20', radius: 11, label: report.reportid }]} height={240} />
          </div>
          <a className="ri-link" href={mapLink} target="_blank" rel="noreferrer">Open in OpenStreetMap</a>
        </section>
      )}

      <section className="ri-card">
        <h2>Progress</h2>
        <ul className="ri-timeline">
          {log.map((l, i) => (
            <li key={i}>
              <StatusBadge status={l.status} />
              {l.remarks && <span className="ri-remarks">{l.remarks}</span>}
              <span className="ri-when">{new Date(l.dateupdated).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}