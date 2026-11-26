import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import StatusBadge from '../components/StatusBadge';

const css = `
.rh, .rh * { box-sizing: border-box; }
.rh { --navy:#0f2557; --blue:#1f3a93; --gold:#f5b301; --red:#d92d20; --ink:#1d2939; --muted:#667085; --line:#e4e7ec;
  display: flex; flex-direction: column; gap: 16px; max-width: 900px; margin: 0 auto; color: var(--ink); font-family: inherit; }
.rh h1, .rh h2, .rh p { margin: 0; }
.rh a { text-decoration: none; color: inherit; }

.rh-banner { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px;
  padding: 24px; border-radius: 20px; color: #fff; border-bottom: 4px solid var(--gold);
  background: radial-gradient(circle at 100% 0%, rgba(245,179,1,.28), transparent 42%), linear-gradient(135deg, var(--blue), var(--navy)); }
.rh-eyebrow { font-size: .75rem; letter-spacing: .14em; text-transform: uppercase; color: var(--gold); font-weight: 700; margin-bottom: 4px !important; }
.rh-banner h1 { font-size: 1.6rem; color: #fff; }
.rh-banner p.sub { color: rgba(255,255,255,.85); margin-top: 2px !important; }
.rh-pill { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 999px; font-weight: 700; font-size: .88rem;
  background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.3); color: #fff; }
.rh-pill i { width: 10px; height: 10px; border-radius: 50%; background: #12b76a; }
.rh-pill.duty i { background: var(--gold); }

.rh-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
.rh-stat { padding: 16px 18px; background: #fff; border: 1px solid var(--line); border-left: 4px solid var(--gold); border-radius: 14px; }
.rh-stat span { display: block; font-size: .8rem; color: var(--muted); }
.rh-stat strong { display: block; margin-top: 2px; font-size: 1.9rem; line-height: 1.1; color: var(--navy); }
.rh-stat.alert { border-left-color: var(--red); }
.rh-stat.alert strong { color: var(--red); }

.rh-card { background: #fff; border: 1px solid var(--line); border-radius: 16px; box-shadow: 0 1px 3px rgba(16,24,40,.06); overflow: hidden; }
.rh-card h2 { padding: 16px 20px; font-size: 1.05rem; color: var(--navy); border-bottom: 1px solid var(--line); }
.rh-item { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 20px; border-bottom: 1px solid #f2f4f7; transition: background .12s; }
.rh-item:last-child { border-bottom: 0; }
.rh-item:hover { background: #fafbff; }
.rh-item strong { display: block; }
.rh-item span.d { display: block; margin-top: 2px; font-size: .85rem; color: var(--muted); }
.rh-empty { padding: 26px 20px; text-align: center; color: var(--muted); }

.rh-cta { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 18px 20px;
  background: #eef2ff; border: 1px solid #c7d2f0; border-radius: 16px; }
.rh-cta p { color: #344054; font-size: .92rem; }
.rh-btn { padding: 11px 20px; border-radius: 10px; color: #fff !important; font-weight: 800;
  background: linear-gradient(135deg, var(--blue), var(--navy)); box-shadow: 0 6px 16px rgba(15,37,87,.25); }
.rh-error { padding: 10px 12px; border-radius: 10px; background: #fef3f2; border: 1px solid #fecdca; color: #b42318; font-size: .88rem; }
`;

export default function ResponderHome() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const load = () =>
      api.get('/responder/dashboard')
        .then((r) => { if (alive) { setData(r.data); setError(''); } })
        .catch((err) => alive && setError(err.response?.data?.error || 'Cannot load dashboard'));
    load();
    const t = setInterval(load, 10000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const first = (user.fullname || 'Responder').split(' ')[0];
  const onDuty = data?.availability === 'On Duty';

  return (
    <div className="rh">
      <style>{css}</style>

      <header className="rh-banner">
        <div>
          <p className="rh-eyebrow">SmartResQ · Responder</p>
          <h1>Hello, {first}</h1>
          <p className="sub">Your assignments and updates in one place.</p>
        </div>
        {data?.availability && (
          <span className={`rh-pill ${onDuty ? 'duty' : ''}`}><i />{data.availability}</span>
        )}
      </header>

      {error && <div className="rh-error" role="alert">{error}</div>}
      {!data && !error && <p style={{ color: '#667085' }}>Loading...</p>}

      {data && (
        <>
          <div className="rh-stats">
            <div className="rh-stat"><span>Assigned incidents</span><strong>{data.assigned}</strong></div>
            <div className="rh-stat"><span>Completed</span><strong>{data.completed}</strong></div>
            <div className={`rh-stat ${data.alerts > 0 ? 'alert' : ''}`}><span>Alerts</span><strong>{data.alerts}</strong></div>
          </div>

          <section className="rh-card">
            <h2>My assigned incidents</h2>
            {data.incidents.length === 0 && (
              <div className="rh-empty">No active assignments. You'll see new ones here once an official dispatches you.</div>
            )}
            {data.incidents.map((i) => (
              <Link key={i.id} to={`/staff/reports/${i.id}`} className="rh-item">
                <div>
                  <strong>{i.typename}</strong>
                  <span className="d">{i.reportid} · {i.barangayname}</span>
                </div>
                <StatusBadge status={i.status} />
              </Link>
            ))}
          </section>

          <div className="rh-cta">
            <p>Share your location, update your status, upload photos or mark an incident resolved.</p>
            <Link to="/staff/functions" className="rh-btn">Responder functions</Link>
          </div>
        </>
      )}
    </div>
  );
}