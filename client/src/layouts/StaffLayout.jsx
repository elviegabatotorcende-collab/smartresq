import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { NAV } from '../nav';
import NotificationBell from '../components/NotificationBell';
import Avatar from '../components/Avatar';
import logo from '../assets/logo.webp';

const ICONS = {
  dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  reports: <><path d="M7 3h8l4 4v14H7z" /><path d="M15 3v4h4M10 12h6M10 16h6" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 3-6 6.5-6s6.5 2.4 6.5 6" /><path d="M16 4.5a3.5 3.5 0 010 7M18 14.5c2 .6 3.5 2.4 3.5 5.5" /></>,
  monitoring: <><path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  dispatch: <path d="M3 11l18-8-8 18-2.5-7.5z" />,
  functions: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" /></>,
  notifications: <><path d="M6 9a6 6 0 0112 0c0 6 2 7 2 7H4s2-1 2-7" /><path d="M10 20a2 2 0 004 0" /></>,
  profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></>,
};

const css = `
.sl, .sl * { box-sizing: border-box; }
.sl { --navy:#0f2557; --blue:#1f3a93; --gold:#f5b301; --ink:#1d2939; --muted:#667085; --line:#e4e7ec;
  display: flex; min-height: 100vh; background: #f4f6fb; font-family: inherit; color: var(--ink); }
.sl a { text-decoration: none; }

/* sidebar */
.sl-side { position: sticky; top: 0; align-self: flex-start; width: 264px; height: 100vh; flex-shrink: 0; display: flex; flex-direction: column;
  padding: 18px 14px; color: #fff; background: linear-gradient(180deg, #14307a, var(--navy) 55%, #0a1a40); border-right: 3px solid var(--gold); z-index: 60; }
.sl-brand { display: flex; align-items: center; gap: 11px; padding: 4px 6px 18px; border-bottom: 1px solid rgba(255,255,255,.12); }
.sl-brand img { width: 46px; height: 46px; object-fit: contain; background: #fff; border-radius: 50%; padding: 3px; box-shadow: 0 0 0 2px var(--gold); }
.sl-brand strong { display: block; font-size: 1.1rem; letter-spacing: .01em; }
.sl-brand span { display: block; font-size: .72rem; letter-spacing: .06em; text-transform: uppercase; color: var(--gold); }
.sl-nav { display: flex; flex-direction: column; gap: 4px; margin-top: 16px; overflow-y: auto; flex: 1; }
.sl-link { position: relative; display: flex; align-items: center; gap: 12px; padding: 11px 12px; border-radius: 12px; color: rgba(255,255,255,.82); font-size: .92rem; font-weight: 600; transition: background .12s, color .12s; }
.sl-link:hover { background: rgba(255,255,255,.08); color: #fff; }
.sl-link.on { background: rgba(255,255,255,.14); color: #fff; }
.sl-link.on::before { content: ''; position: absolute; left: -14px; top: 9px; bottom: 9px; width: 4px; border-radius: 0 4px 4px 0; background: var(--gold); }
.sl-link svg { flex-shrink: 0; }
.sl-foot { display: flex; flex-direction: column; gap: 10px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,.12); }
.sl-me { display: flex; align-items: center; gap: 11px; padding: 8px; border-radius: 12px; color: #fff; background: rgba(255,255,255,.08); }
.sl-me:hover { background: rgba(255,255,255,.14); }
.sl-me strong { display: block; font-size: .9rem; line-height: 1.2; }
.sl-me span { display: block; font-size: .74rem; color: rgba(255,255,255,.7); }
.sl-me div { min-width: 0; }
.sl-me strong, .sl-me span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sl-out { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; border: 1px solid rgba(255,255,255,.25); border-radius: 10px;
  background: transparent; color: #fff; font: inherit; font-weight: 700; cursor: pointer; }
.sl-out:hover { background: rgba(240,68,56,.85); border-color: transparent; }

/* main + header */
.sl-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.sl-top { position: sticky; top: 0; z-index: 40; display: flex; align-items: center; gap: 14px; height: 68px; padding: 0 24px;
  background: rgba(255,255,255,.92); backdrop-filter: blur(8px); border-bottom: 1px solid var(--line); box-shadow: 0 1px 0 var(--gold); }
.sl-burger { display: none; width: 40px; height: 40px; place-items: center; border: 1px solid var(--line); border-radius: 10px; background: #fff; color: var(--navy); cursor: pointer; }
.sl-title { min-width: 0; flex: 1; }
.sl-eyebrow { display: block; font-size: .72rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--blue); }
.sl-title strong { display: block; font-size: 1.02rem; color: var(--navy); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sl-right { display: flex; align-items: center; gap: 12px; }
.sl-date { padding: 7px 13px; border-radius: 999px; background: #f2f4f7; font-size: .8rem; font-weight: 600; color: #475467; white-space: nowrap; }
.sl-live { display: inline-flex; align-items: center; gap: 7px; padding: 7px 12px; border-radius: 999px; background: #ecfdf3; border: 1px solid #abefc6; color: #067647; font-size: .8rem; font-weight: 700; }
.sl-live i { width: 8px; height: 8px; border-radius: 50%; background: #12b76a; animation: slp 1.8s ease-in-out infinite; }
@keyframes slp { 50% { opacity: .35; } }
@media (prefers-reduced-motion: reduce) { .sl-live i { animation: none; } }
.sl-chip { display: flex; align-items: center; gap: 10px; padding: 4px 12px 4px 4px; border: 1px solid var(--line); border-radius: 999px; background: #fff; color: var(--ink); transition: box-shadow .15s; }
.sl-chip:hover { box-shadow: 0 4px 14px rgba(15,37,87,.12); }
.sl-chip strong { display: block; font-size: .85rem; line-height: 1.15; }
.sl-chip span { display: block; font-size: .72rem; color: var(--muted); }
.sl-content { padding: 24px; flex: 1; min-width: 0; }

/* drawer on small screens */
.sl-scrim { position: fixed; inset: 0; z-index: 55; background: rgba(15,37,87,.55); }
@media (max-width: 900px) {
  .sl-side { position: fixed; left: 0; top: 0; transform: translateX(-100%); transition: transform .2s; }
  .sl-side.open { transform: none; }
  .sl-burger { display: grid; }
  .sl-top { padding: 0 14px; }
  .sl-content { padding: 16px 14px; }
  .sl-date, .sl-chip div { display: none; }
  .sl-chip { padding: 3px; }
}
@media (max-width: 520px) { .sl-live { display: none; } }

/* logout confirmation */
.sl-modal { position: fixed; inset: 0; z-index: 200; display: grid; place-items: center; padding: 16px; background: rgba(15,37,87,.55); }
.sl-dialog { width: 100%; max-width: 380px; padding: 26px; text-align: center; background: #fff; border-radius: 18px; border-top: 5px solid var(--gold); box-shadow: 0 20px 50px rgba(0,0,0,.35); }
.sl-dialog h2 { margin: 0 0 6px; font-size: 1.2rem; color: var(--navy); }
.sl-dialog p { margin: 0 0 20px; color: var(--muted); }
.sl-btns { display: flex; gap: 10px; }
.sl-btns button { flex: 1; padding: 12px; border-radius: 10px; font: inherit; font-weight: 700; cursor: pointer; }
.sl-cancel { background: #fff; border: 1.5px solid #d0d5dd; color: #344054; }
.sl-yes { border: none; color: #fff; background: linear-gradient(135deg, #f04438, #d92d20); }
`;

export default function StaffLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const items = NAV[user.role] || [];
  const slug = pathname.split('/')[2];
  const page = items.find(([, s]) => s === slug)?.[0] || '';
  const first = (user.fullname || '').split(' ')[0];
  const date = new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!confirm) return;
    const onKey = (e) => e.key === 'Escape' && setConfirm(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirm]);

  function doLogout() {
    logout();
    navigate('/staff/login');
  }

  return (
    <div className="sl">
      <style>{css}</style>

      {open && <div className="sl-scrim" onClick={() => setOpen(false)} />}

      <aside className={`sl-side ${open ? 'open' : ''}`}>
        <div className="sl-brand">
          <img src={logo} alt="Seal of the Municipality of President Carlos P. Garcia" />
          <div>
            <strong>SmartResQ</strong>
            <span>Staff Portal</span>
          </div>
        </div>

        <nav className="sl-nav">
          {items.map(([label, s]) => (
            <NavLink key={s} to={`/staff/${s}`} className={({ isActive }) => `sl-link ${isActive ? 'on' : ''}`}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {ICONS[s]}
              </svg>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sl-foot">
          <NavLink to="/staff/profile" className="sl-me">
            <Avatar user={user} size={40} />
            <div>
              <strong>{user.fullname}</strong>
              <span>{user.rolename}</span>
            </div>
          </NavLink>
          <button className="sl-out" onClick={() => setConfirm(true)}>Logout</button>
        </div>
      </aside>

      <div className="sl-main">
        <header className="sl-top">
          <button className="sl-burger" onClick={() => setOpen(true)} aria-label="Open menu">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>

          <div className="sl-title">
            <span className="sl-eyebrow">{user.rolename}{page ? ` · ${page}` : ''}</span>
            <strong>Emergency Dispatch &amp; Incident Management</strong>
          </div>

          <div className="sl-right">
            <span className="sl-date">{date}</span>
            <span className="sl-live"><i />Live</span>
            <NotificationBell to="/staff/notifications" />
            <NavLink to="/staff/profile" className="sl-chip" title="My profile">
              <Avatar user={user} size={34} />
              <div>
                <strong>{first}</strong>
                <span>{user.rolename}</span>
              </div>
            </NavLink>
          </div>
        </header>

        <main className="sl-content">
          <Outlet />
        </main>
      </div>

      {confirm && (
        <div className="sl-modal" onClick={() => setConfirm(false)}>
          <div className="sl-dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>Log out?</h2>
            <p>You will need to sign in again to continue.</p>
            <div className="sl-btns">
              <button className="sl-cancel" onClick={() => setConfirm(false)}>Cancel</button>
              <button className="sl-yes" onClick={doLogout}>Log out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}