import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import StatusBadge from '../components/StatusBadge';

const STEPS = [
  ['Pending', 'Received', 'Your report was received and is waiting for review by your barangay.'],
  ['Verified', 'Verified', 'Your barangay confirmed the report. A responder will be assigned.'],
  ['Dispatched', 'Dispatched', 'A responder is on the way to your location.'],
  ['Resolved', 'Resolved', 'The incident has been handled.'],
];

const css = `
.hm, .hm * { box-sizing: border-box; }
.hm { --navy:#0f2557; --blue:#1f3a93; --gold:#f5b301; --red:#d92d20; --ink:#1d2939; --muted:#667085; --line:#dfe3ea;
  color: var(--ink); font-family: inherit; display: flex; flex-direction: column; gap: 22px; }
.hm h1, .hm h2, .hm p { margin: 0; }
.hm a { color: inherit; text-decoration: none; }

.hm-top { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 6px 16px; padding-bottom: 14px; border-bottom: 2px solid var(--gold); }
.hm-top h1 { font-size: 1.6rem; font-weight: 650; letter-spacing: -.01em; color: var(--navy); }
.hm-top p { margin-top: 2px; color: var(--muted); font-size: .94rem; }
.hm-top time { color: var(--muted); font-size: .88rem; }

.hm-grid { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 22px; align-items: start; }
@media (max-width: 860px) { .hm-grid { grid-template-columns: 1fr; } }
.hm-col { display: flex; flex-direction: column; gap: 18px; min-width: 0; }

.hm-card { background: #fff; border: 1px solid var(--line); border-radius: 10px; padding: 20px 22px; }
.hm-card h2 { font-size: 1rem; font-weight: 650; color: var(--navy); margin-bottom: 14px; }

/* the one bold element */
.hm-act { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px 24px;
  background: #fff; border: 1px solid var(--line); border-left: 5px solid var(--red); border-radius: 10px; padding: 22px 24px; }
.hm-act h2 { font-size: 1.2rem; font-weight: 650; color: var(--navy); }
.hm-act p { margin-top: 4px; max-width: 460px; color: var(--muted); font-size: .92rem; line-height: 1.5; }
.hm-report { display: inline-block; padding: 14px 28px; border-radius: 8px; background: var(--red); color: #fff !important; font-size: 1rem; font-weight: 700; }
.hm-report:hover { background: #b42318; }
.hm a:focus-visible { outline: 3px solid var(--gold); outline-offset: 2px; }
@media (max-width: 520px) { .hm-report { width: 100%; text-align: center; } }

/* active report */
.hm-trk-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 20px; }
.hm-trk-head strong { display: block; font-size: 1.05rem; }
.hm-trk-head > div > span { font-size: .86rem; color: var(--muted); }
.hm-steps { display: grid; grid-template-columns: repeat(4, 1fr); list-style: none; margin: 0; padding: 0; }
.hm-step { position: relative; padding: 22px 6px 0 0; font-size: .84rem; color: var(--muted); }
.hm-step::before { content: ''; position: absolute; top: 6px; left: 0; right: 0; height: 2px; background: var(--line); }
.hm-step::after { content: ''; position: absolute; top: 0; left: 0; width: 14px; height: 14px; border-radius: 50%; background: #fff; border: 2px solid #c3cad6; }
.hm-step.done::before { background: var(--navy); }
.hm-step.done::after { background: var(--navy); border-color: var(--navy); }
.hm-step.now { color: var(--ink); font-weight: 700; }
.hm-step.now::before { background: linear-gradient(90deg, var(--navy) 14px, var(--line) 14px); }
.hm-step.now::after { border-color: var(--navy); box-shadow: inset 0 0 0 3px #fff, inset 0 0 0 10px var(--navy); }
.hm-desc { margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--line); color: #344054; font-size: .92rem; line-height: 1.5; }
.hm-desc a { margin-left: 6px; color: var(--blue); font-weight: 650; }
.hm-desc a:hover { text-decoration: underline; }
.hm-none strong { display: block; font-size: 1rem; }
.hm-none span { display: block; margin-top: 2px; color: var(--muted); font-size: .9rem; }

/* list of reports */
.hm-list { margin: 0 -22px -20px; }
.hm-item { display: flex; align-items: center; gap: 14px; padding: 14px 22px; border-top: 1px solid #edf0f4; transition: background .12s; }
.hm-item:hover { background: #f8f9fc; }
.hm-item-main { flex: 1; min-width: 0; }
.hm-item-main strong { display: block; font-weight: 650; }
.hm-item-main span { display: block; margin-top: 2px; font-size: .84rem; color: var(--muted); }
.hm-empty { margin: 0; padding: 4px 0 8px; color: var(--muted); font-size: .92rem; line-height: 1.5; }
.hm-skel { height: 50px; margin-bottom: 8px; border-radius: 8px; background: #eef0f4; }

/* side column */
.hm-rows { margin: 0; padding: 0; list-style: none; }
.hm-rows li { display: flex; align-items: baseline; justify-content: space-between; padding: 10px 0; border-top: 1px solid #edf0f4; font-size: .94rem; }
.hm-rows li:first-child { border-top: 0; padding-top: 0; }
.hm-rows b { font-size: 1.2rem; font-weight: 700; color: var(--navy); font-variant-numeric: tabular-nums; }
.hm-help p { color: #344054; font-size: .92rem; line-height: 1.5; }
.hm-call { display: inline-block; margin-top: 12px; padding: 10px 18px; border: 1.5px solid var(--navy); border-radius: 8px; color: var(--navy) !important; font-weight: 700; }
.hm-call:hover { background: var(--navy); color: #fff !important; }
`;

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function ResidentHome() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState(null);
  const [barangay, setBarangay] = useState('');

  useEffect(() => {
    let alive = true;
    const load = () =>
      api.get('/incidents/mine').then((r) => alive && setIncidents(r.data)).catch(() => {});
    load();
    const t = setInterval(load, 10000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  useEffect(() => {
    api.get('/incidents/meta')
      .then((r) => setBarangay((r.data.barangays || []).find((b) => String(b.id) === String(user.barangay))?.barangayname || ''))
      .catch(() => {});
  }, [user.barangay]);

  const first = (user.fullname || 'there').split(' ')[0];
  const date = new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const total = incidents?.length ?? 0;
  const active = incidents?.filter((i) => !['Resolved', 'Rejected'].includes(i.status)) || [];
  const resolved = incidents?.filter((i) => i.status === 'Resolved').length ?? 0;
  const current = active[0];
  const stepIdx = current ? STEPS.findIndex(([s]) => s === current.status) : -1;
  const n = (v) => (incidents === null ? '–' : v);

  return (
    <div className="hm">
      <style>{css}</style>

      <header className="hm-top">
        <div>
          <h1>{greeting()}, {first}</h1>
          <p>{barangay ? `Barangay ${barangay}, President Carlos P. Garcia` : 'President Carlos P. Garcia, Bohol'}</p>
        </div>
        <time>{date}</time>
      </header>

      <div className="hm-grid">
        <div className="hm-col">
          <section className="hm-act">
            <div>
              <h2>Report an emergency</h2>
              <p>Your location is shared with your barangay so the nearest responder can be sent.</p>
            </div>
            <Link to="/resident/report" className="hm-report">Report an emergency</Link>
          </section>

          {incidents && (
            <section className="hm-card" aria-live="polite">
              <h2>Active report</h2>
              {current ? (
                <>
                  <div className="hm-trk-head">
                    <div>
                      <strong>{current.typename}</strong>
                      <span>{current.reportid}, {current.barangayname}</span>
                    </div>
                    <StatusBadge status={current.status} />
                  </div>
                  <ol className="hm-steps" aria-label="Report progress">
                    {STEPS.map(([s, label], i) => (
                      <li key={s} className={`hm-step ${i < stepIdx ? 'done' : i === stepIdx ? 'now' : ''}`}>{label}</li>
                    ))}
                  </ol>
                  <p className="hm-desc">
                    {STEPS[stepIdx]?.[2]}
                    <Link to={`/resident/incident/${current.id}`}>View details</Link>
                  </p>
                </>
              ) : (
                <div className="hm-none">
                  <strong>No active report</strong>
                  <span>Anything you report will be tracked here until it is resolved.</span>
                </div>
              )}
            </section>
          )}

          <section className="hm-card">
            <h2>My reports</h2>
            {incidents === null && <div aria-busy="true"><div className="hm-skel" /><div className="hm-skel" /></div>}
            {incidents?.length === 0 && (
              <p className="hm-empty">No reports yet. When you report an emergency, you can follow its progress here.</p>
            )}
            {incidents?.length > 0 && (
              <div className="hm-list">
                {incidents.map((i) => (
                  <Link key={i.id} to={`/resident/incident/${i.id}`} className="hm-item">
                    <div className="hm-item-main">
                      <strong>{i.typename}</strong>
                      <span>{i.reportid}, {i.barangayname}</span>
                      {i.datereported && (
                        <span>{new Date(i.datereported).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      )}
                    </div>
                    <StatusBadge status={i.status} />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="hm-col">
          <section className="hm-card">
            <h2>Your reports</h2>
            <ul className="hm-rows">
              <li>Total <b>{n(total)}</b></li>
              <li>In progress <b>{n(active.length)}</b></li>
              <li>Resolved <b>{n(resolved)}</b></li>
            </ul>
          </section>

          <section className="hm-card hm-help">
            <h2>Life-threatening emergency</h2>
            <p>Call the national emergency hotline first, then submit a report so your barangay can respond.</p>
            <a className="hm-call" href="tel:911">Call 911</a>
          </section>
        </aside>
      </div>
    </div>
  );
}