import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import StatusBadge from '../components/StatusBadge';

const STATUS_COLORS = {
  Pending: '#f79009', Verified: '#2e90fa', Dispatched: '#7a5af8', Resolved: '#12b76a', Rejected: '#98a2b3',
};
const STATUSES = Object.keys(STATUS_COLORS);

const ICONS = {
  total: <><path d="M7 3h8l4 4v14H7z" /><path d="M15 3v4h4M10 12h6M10 16h6" /></>,
  pending: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  progress: <path d="M3 12h4l2.5-6 4 12 2.5-6H21" />,
  done: <><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.7 2.7L16 9.5" /></>,
  critical: <path d="M12 3l9 16H3L12 3zM12 10v4M12 17h.01" />,
};

const css = `
.sd, .sd * { box-sizing: border-box; }
.sd { --navy:#0f2557; --blue:#1f3a93; --gold:#f5b301; --red:#d92d20; --ink:#1d2939; --ink2:#475467; --muted:#667085; --line:#e4e7ec; --grid:#eceef2;
  display: flex; flex-direction: column; gap: 20px; max-width: 1150px; margin: 0 auto; color: var(--ink); font-family: inherit; }
.sd h1, .sd h2, .sd p { margin: 0; }
.sd a { text-decoration: none; color: inherit; }

/* header */
.sd-top { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px; padding-bottom: 14px; border-bottom: 2px solid var(--gold); }
.sd-top h1 { font-size: 1.75rem; color: var(--navy); letter-spacing: -.01em; }
.sd-top p { margin-top: 3px; color: var(--muted); font-size: .92rem; }
.sd-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.sd-chip { padding: 7px 14px; border-radius: 999px; background: #fff; border: 1px solid var(--line); font-size: .82rem; font-weight: 700; color: var(--ink2); white-space: nowrap; }
.sd-chip.live { display: inline-flex; align-items: center; gap: 7px; color: #067647; background: #ecfdf3; border-color: #abefc6; }
.sd-chip.live i { width: 8px; height: 8px; border-radius: 50%; background: #12b76a; animation: sdp 1.8s ease-in-out infinite; }
@keyframes sdp { 50% { opacity: .35; } }
@media (prefers-reduced-motion: reduce) { .sd-chip.live i { animation: none; } }

/* alert */
.sd-alert { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 18px;
  border-radius: 14px; border: 1px solid #fedf89; border-left: 5px solid #f79009; background: #fffaeb; color: #93370d; }
.sd-alert.crit { border-color: #fecdca; border-left-color: var(--red); background: #fef3f2; color: #912018; }
.sd-alert.info { border-color: #c7d2f0; border-left-color: var(--blue); background: #eef2ff; color: var(--blue); }
.sd-alert strong { font-size: .98rem; }
.sd-alert p { font-size: .85rem; margin-top: 2px; }
.sd-alert-btn { padding: 8px 16px; border-radius: 9px; color: #fff !important; font-size: .85rem; font-weight: 800; background: var(--navy); white-space: nowrap; }
.sd-alert.crit .sd-alert-btn { background: var(--red); }

/* KPI tiles */
.sd-tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px; }
.sd-tile { display: flex; align-items: center; gap: 14px; padding: 16px 18px; background: #fff; border: 1px solid var(--line); border-radius: 16px; box-shadow: 0 1px 2px rgba(16,24,40,.05); }
.sd-ico { width: 46px; height: 46px; flex-shrink: 0; display: grid; place-items: center; border-radius: 14px; color: var(--c); background: color-mix(in srgb, var(--c) 14%, #fff); }
.sd-tile .l { display: block; font-size: .8rem; color: var(--muted); }
.sd-tile strong { display: block; font-size: 1.85rem; line-height: 1.1; color: var(--ink); font-variant-numeric: tabular-nums; }
.sd-tile .n { display: block; font-size: .75rem; color: var(--muted); margin-top: 1px; }
.sd-tile.dim strong { color: #98a2b3; }

/* panels */
.sd-grid { display: grid; grid-template-columns: 1.7fr 1fr; gap: 18px; align-items: start; }
@media (max-width: 920px) { .sd-grid { grid-template-columns: 1fr; } }
.sd-col { display: flex; flex-direction: column; gap: 18px; min-width: 0; }
.sd-card { padding: 20px 22px; background: #fff; border: 1px solid var(--line); border-radius: 18px; box-shadow: 0 1px 3px rgba(16,24,40,.06); }
.sd-card-h { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
.sd-card h2 { font-size: 1.02rem; color: var(--navy); }
.sd-card .hint { font-size: .8rem; color: var(--muted); }
.sd-toggle { padding: 4px 11px; border-radius: 8px; border: 1px solid var(--line); background: #fff; color: var(--ink2); font: inherit; font-size: .78rem; font-weight: 700; cursor: pointer; }
.sd-toggle:hover { background: #f9fafb; }

/* line chart */
.sd-lc { position: relative; }
.sd-lc svg { display: block; width: 100%; height: auto; overflow: visible; }
.sd-lc .gl { stroke: var(--grid); stroke-width: 1; }
.sd-lc .yt { fill: var(--muted); font-size: 11px; text-anchor: end; }
.sd-lc .xt { fill: var(--muted); font-size: 11px; text-anchor: middle; }
.sd-lc .xt.now { fill: var(--navy); font-weight: 700; }
.sd-lc .area { fill: var(--navy); opacity: .1; }
.sd-lc .ln { fill: none; stroke: var(--navy); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
.sd-lc .cross { stroke: #c7cdd9; stroke-width: 1; }
.sd-lc .vt { fill: var(--ink); font-size: 12px; font-weight: 700; text-anchor: middle; }
.sd-lc .hit { fill: transparent; cursor: default; }
.sd-tip { position: absolute; z-index: 5; transform: translate(-50%, -100%); margin-top: -12px; padding: 6px 10px; border-radius: 8px; background: var(--navy); color: #fff; font-size: .78rem; white-space: nowrap; pointer-events: none; box-shadow: 0 6px 18px rgba(0,0,0,.25); }
.sd-table { width: 100%; border-collapse: collapse; font-size: .9rem; }
.sd-table th { text-align: left; padding: 8px 10px; font-size: .74rem; letter-spacing: .05em; text-transform: uppercase; color: var(--muted); border-bottom: 1px solid var(--line); }
.sd-table td { padding: 9px 10px; border-bottom: 1px solid #f2f4f7; }
.sd-table td:last-child, .sd-table th:last-child { text-align: right; }

/* feed */
.sd-feed { display: flex; flex-direction: column; gap: 10px; }
.sd-item { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; border: 1px solid var(--line);
  border-left: 4px solid var(--c, #98a2b3); border-radius: 12px; background: #fff; transition: transform .12s, box-shadow .15s; }
.sd-item:hover { transform: translateX(2px); box-shadow: 0 4px 14px rgba(15,37,87,.1); }
.sd-item strong { display: block; font-size: .95rem; }
.sd-item .d { display: block; margin-top: 2px; font-size: .8rem; color: var(--muted); }
.sd-crit { display: inline-block; margin-left: 8px; padding: 1px 8px; border-radius: 999px; background: var(--red); color: #fff; font-size: .66rem; font-weight: 800; letter-spacing: .06em; vertical-align: middle; }

/* rows */
.sd-rows { display: flex; flex-direction: column; gap: 12px; }
.sd-row { display: grid; grid-template-columns: 92px 1fr 34px; align-items: center; gap: 10px; font-size: .88rem; }
.sd-row .nm { color: var(--ink2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sd-track { height: 12px; border-radius: 6px; background: #f2f4f7; overflow: hidden; }
.sd-fill { height: 100%; border-radius: 0 4px 4px 0; background: var(--navy); }
.sd-row .v { text-align: right; font-weight: 700; color: var(--ink); font-variant-numeric: tabular-nums; }
.sd-dot { display: inline-block; width: 9px; height: 9px; margin-right: 7px; border-radius: 50%; background: var(--c); }
.sd-empty { padding: 18px 0; text-align: center; color: var(--muted); font-size: .9rem; }

/* responders */
.sd-resp { display: flex; align-items: center; gap: 16px; }
.sd-ring { width: 74px; height: 74px; flex-shrink: 0; }
.sd-resp .big { font-size: 1.6rem; font-weight: 800; color: var(--navy); font-variant-numeric: tabular-nums; line-height: 1.1; }
.sd-resp .big small { font-size: .85rem; font-weight: 600; color: var(--muted); }
.sd-resp p { margin-top: 4px; font-size: .84rem; color: var(--ink2); }
.sd-error { padding: 10px 12px; border-radius: 10px; background: #fef3f2; border: 1px solid #fecdca; color: #b42318; font-size: .88rem; }
`;

function Tile({ icon, label, value, note, color, dim }) {
  return (
    <div className={`sd-tile ${dim ? 'dim' : ''}`}>
      <span className="sd-ico" style={{ '--c': color }}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[icon]}</svg>
      </span>
      <div>
        <span className="l">{label}</span>
        <strong>{value}</strong>
        {note && <span className="n">{note}</span>}
      </div>
    </div>
  );
}

const dayInfo = (d) => {
  const dt = new Date(`${d}T00:00:00`);
  return {
    wk: dt.toLocaleDateString([], { weekday: 'short' }),
    full: dt.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }),
  };
};

// 7-day line chart (single series, one hue)
function LineChart({ days }) {
  const [hover, setHover] = useState(null);
  const [table, setTable] = useState(false);

  const W = 640, H = 230, L = 34, R = 18, T = 26, B = 28;
  const maxN = Math.max(0, ...days.map((d) => d.n));
  const top = Math.max(4, Math.ceil(maxN / 4) * 4);
  const xs = days.map((_, i) => L + (i * (W - L - R)) / (days.length - 1));
  const y = (n) => T + (1 - n / top) * (H - T - B);
  const pts = days.map((d, i) => [xs[i], y(d.n)]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${xs[xs.length - 1]},${y(0)} L${xs[0]},${y(0)} Z`;
  const total = days.reduce((a, d) => a + d.n, 0);
  const last = days.length - 1;
  const step = (W - L - R) / (days.length - 1);

  return (
    <section className="sd-card">
      <div className="sd-card-h">
        <div>
          <h2>Reports, last 7 days</h2>
          <span className="hint">{total} report{total === 1 ? '' : 's'} in total</span>
        </div>
        <button className="sd-toggle" onClick={() => setTable(!table)}>{table ? 'Chart' : 'Table'}</button>
      </div>

      {table ? (
        <table className="sd-table">
          <thead><tr><th>Day</th><th>Reports</th></tr></thead>
          <tbody>{days.map((d) => <tr key={d.d}><td>{dayInfo(d.d).full}</td><td>{d.n}</td></tr>)}</tbody>
        </table>
      ) : (
        <div className="sd-lc">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Reports per day for the last 7 days, ${total} in total`}>
            {[top, top / 2, 0].map((t) => (
              <g key={t}>
                <line className="gl" x1={L} x2={W - R} y1={y(t)} y2={y(t)} />
                <text className="yt" x={L - 8} y={y(t) + 4}>{t}</text>
              </g>
            ))}
            <path className="area" d={area} />
            <path className="ln" d={line} />

            {hover !== null && <line className="cross" x1={xs[hover]} x2={xs[hover]} y1={T - 6} y2={y(0)} />}

            {/* end dot + selective label */}
            <circle cx={pts[last][0]} cy={pts[last][1]} r="5" fill="#0f2557" stroke="#fff" strokeWidth="2" />
            {hover === null && <text className="vt" x={pts[last][0]} y={pts[last][1] - 12}>{days[last].n}</text>}
            {hover !== null && hover !== last && <circle cx={pts[hover][0]} cy={pts[hover][1]} r="5" fill="#0f2557" stroke="#fff" strokeWidth="2" />}

            {days.map((d, i) => (
              <text key={d.d} className={`xt ${i === last ? 'now' : ''}`} x={xs[i]} y={H - 8}>{i === last ? 'Today' : dayInfo(d.d).wk}</text>
            ))}

            {days.map((d, i) => (
              <rect key={d.d} className="hit" x={xs[i] - step / 2} y={0} width={step} height={H}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
            ))}
          </svg>
          {hover !== null && (
            <div className="sd-tip" style={{ left: `${(xs[hover] / W) * 100}%`, top: `${(pts[hover][1] / H) * 100}%` }}>
              {dayInfo(days[hover].d).full}: <b>{days[hover].n}</b>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Rows({ items, getColor }) {
  const max = Math.max(1, ...items.map((i) => i.n));
  return (
    <div className="sd-rows">
      {items.map((i) => (
        <div key={i.name} className="sd-row" title={`${i.name}: ${i.n}`}>
          <span className="nm">{getColor && <i className="sd-dot" style={{ '--c': getColor(i.name) }} />}{i.name}</span>
          <div className="sd-track"><div className="sd-fill" style={{ width: `${(i.n / max) * 100}%`, background: getColor ? getColor(i.name) : undefined }} /></div>
          <span className="v">{i.n}</span>
        </div>
      ))}
    </div>
  );
}

function Ring({ value, total }) {
  const r = 30, c = 2 * Math.PI * r;
  const pct = total ? value / total : 0;
  return (
    <svg className="sd-ring" viewBox="0 0 74 74" role="img" aria-label={`${value} of ${total} responders available`}>
      <circle cx="37" cy="37" r={r} fill="none" stroke="#dbe3f7" strokeWidth="8" />
      <circle cx="37" cy="37" r={r} fill="none" stroke="#1f3a93" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={`${pct * c} ${c}`} transform="rotate(-90 37 37)" />
    </svg>
  );
}

export default function StaffDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const load = () =>
      api.get('/dashboard/summary')
        .then((r) => { if (alive) { setData(r.data); setError(''); } })
        .catch((e) => alive && setError(e.response?.data?.error || `Cannot load the dashboard (${e.message})`));
    load();
    const t = setInterval(load, 15000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const active = useMemo(() => (data ? data.counts.Verified + data.counts.Dispatched : 0), [data]);
  const statusItems = useMemo(() => (data ? STATUSES.map((s) => ({ name: s, n: data.counts[s] })) : []), [data]);

  const isMdrrmc = user.role === 5;
  const today = new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  let banner = null;
  if (data) {
    const p = data.counts.Pending;
    const c = data.critical || 0;
    if (isMdrrmc && c > 0) {
      banner = { kind: 'crit', text: `${c} critical incident${c === 1 ? '' : 's'} active`, sub: 'Escalated to the MDRRMC for LGU response.', to: '/staff/dispatch', cta: 'Open dispatch' };
    } else if (!isMdrrmc && p > 0) {
      banner = { kind: '', text: `${p} report${p === 1 ? '' : 's'} waiting for verification`, sub: 'Review them so help can be sent sooner.', to: '/staff/reports', cta: 'Review now' };
    } else if (!isMdrrmc && c > 0) {
      banner = { kind: 'info', text: `${c} critical incident${c === 1 ? '' : 's'} escalated to the MDRRMC`, sub: 'The LGU is handling these.', to: '/staff/reports', cta: 'View reports' };
    }
  }

  return (
    <div className="sd">
      <style>{css}</style>

      <header className="sd-top">
        <div>
          <h1>Dashboard</h1>
          <p>{data ? data.scope : 'Loading...'} · {user.rolename}</p>
        </div>
        <div className="sd-chips">
          <span className="sd-chip">{today}</span>
          <span className="sd-chip live"><i />Live</span>
        </div>
      </header>

      {error && <div className="sd-error" role="alert">{error}</div>}

      {data && (
        <>
          {banner && (
            <div className={`sd-alert ${banner.kind}`} role="status">
              <div><strong>{banner.text}</strong><p>{banner.sub}</p></div>
              <Link to={banner.to} className="sd-alert-btn">{banner.cta}</Link>
            </div>
          )}

          <div className="sd-tiles">
            <Tile icon="total" label="Total reports" value={data.total} note={`${data.today} today`} color="#0f2557" />
            <Tile icon="pending" label="Pending" value={data.counts.Pending} note="Awaiting verification" color={STATUS_COLORS.Pending} />
            <Tile icon="progress" label="In progress" value={active} note="Verified or dispatched" color={STATUS_COLORS.Dispatched} />
            <Tile icon="done" label="Resolved" value={data.counts.Resolved} note={`${data.counts.Rejected} rejected`} color={STATUS_COLORS.Resolved} />
            <Tile icon="critical" label="Critical active" value={data.critical || 0} note="Escalated to the MDRRMC" color="#d92d20" dim={!data.critical} />
          </div>

          <div className="sd-grid">
            <div className="sd-col">
              <LineChart days={data.days} />

              <section className="sd-card">
                <div className="sd-card-h"><h2>Latest reports</h2><Link to="/staff/reports" className="hint">View all</Link></div>
                {data.recent.length === 0 && <div className="sd-empty">No reports yet.</div>}
                <div className="sd-feed">
                  {data.recent.map((r) => (
                    <Link key={r.id} to={`/staff/reports/${r.id}`} className="sd-item" style={{ '--c': STATUS_COLORS[r.status] }}>
                      <div>
                        <strong>{r.typename}{r.severity === 'Critical' && <span className="sd-crit">CRITICAL</span>}</strong>
                        <span className="d">{r.reportid} · {r.barangayname} · {new Date(r.datereported).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                      </div>
                      <StatusBadge status={r.status} />
                    </Link>
                  ))}
                </div>
              </section>
            </div>

            <div className="sd-col">
              <section className="sd-card">
                <div className="sd-card-h"><h2>Responders</h2><span className="hint">{isMdrrmc ? 'All barangays' : 'Your barangay'}</span></div>
                <div className="sd-resp">
                  <Ring value={data.responders.available} total={data.responders.total} />
                  <div>
                    <div className="big">{data.responders.available}<small> of {data.responders.total} available</small></div>
                    <p>{data.responders.onDuty} on duty</p>
                  </div>
                </div>
              </section>

              <section className="sd-card">
                <div className="sd-card-h"><h2>By status</h2></div>
                <Rows items={statusItems} getColor={(n) => STATUS_COLORS[n]} />
              </section>

              <section className="sd-card">
                <div className="sd-card-h"><h2>By incident type</h2></div>
                {data.types.length === 0 ? (
                  <div className="sd-empty">No data yet.</div>
                ) : (
                  <Rows items={data.types.map((t) => ({ name: t.typename, n: t.n }))} />
                )}
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}