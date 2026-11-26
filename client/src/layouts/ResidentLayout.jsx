import { useEffect, useState } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import NotificationBell from '../components/NotificationBell';
import Avatar from '../components/Avatar';
import logo from '../assets/logo.webp';

const TABS = [
  ['Home', '/resident/home', false, <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>],
  ['Report', '/resident/report', false, <><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18v.5" /></>],
  ['Notifications', '/resident/notifications', false, <><path d="M6 9a6 6 0 0112 0c0 6 2 7 2 7H4s2-1 2-7" /><path d="M10 20a2 2 0 004 0" /></>],
  ['Services', '/resident/services', false, <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></>],
  ['Profile', '/resident/profile', false, <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></>],
];

const css = `
.rl, .rl * { box-sizing: border-box; }
.rl { --navy:#0f2557; --gold:#f5b301; --ink:#1d2939; --muted:#667085; --line:#e4e7ec;
  min-height: 100vh; background: #f4f6fb; color: var(--ink); font-family: inherit; }
.rl a { text-decoration: none; }
.rl-top { position: sticky; top: 0; z-index: 40; background: #fff; border-bottom: 1px solid var(--line); box-shadow: 0 1px 0 var(--gold); }
.rl-bar { max-width: 1100px; margin: 0 auto; height: 64px; padding: 0 20px; display: flex; align-items: center; gap: 22px; }
.rl-brand { display: flex; align-items: center; gap: 10px; color: var(--navy); }
.rl-brand img { width: 40px; height: 40px; object-fit: contain; border-radius: 50%; }
.rl-brand strong { display: block; font-size: 1.05rem; line-height: 1.1; }
.rl-brand span { display: block; font-size: .7rem; color: var(--muted); }
.rl-nav { display: flex; align-items: stretch; gap: 4px; height: 100%; margin-left: 8px; }
.rl-nav a { position: relative; display: flex; align-items: center; padding: 0 14px; font-size: .92rem; font-weight: 600; color: var(--muted); }
.rl-nav a:hover { color: var(--navy); }
.rl-nav a.on { color: var(--navy); }
.rl-nav a.on::after { content: ''; position: absolute; left: 10px; right: 10px; bottom: -1px; height: 3px; background: var(--gold); border-radius: 3px 3px 0 0; }
.rl-nav svg { display: none; }
.rl-right { margin-left: auto; display: flex; align-items: center; gap: 12px; }
.rl-me { display: flex; align-items: center; gap: 8px; color: var(--ink); font-weight: 600; font-size: .9rem; }
.rl-out { padding: 8px 14px; border: 1px solid #d0d5dd; border-radius: 8px; background: #fff; color: #344054; font: inherit; font-size: .88rem; font-weight: 600; cursor: pointer; }
.rl-out:hover { background: #fef3f2; border-color: #fecdca; color: #b42318; }
.rl a:focus-visible, .rl button:focus-visible { outline: 3px solid var(--gold); outline-offset: 2px; }
.rl-content { max-width: 1100px; margin: 0 auto; padding: 24px 20px 40px; }

@media (max-width: 900px) {
  .rl-nav a { padding: 0 10px; font-size: .88rem; }
}
@media (max-width: 760px) {
  .rl-bar { height: 56px; padding: 0 14px; gap: 10px; }
  .rl-brand span, .rl-me b { display: none; }
  .rl-out { padding: 6px 10px; font-size: .8rem; }
  .rl-content { padding: 16px 14px 90px; }
  .rl-nav { position: fixed; left: 0; right: 0; bottom: 0; z-index: 50; height: 62px; margin: 0; gap: 0;
    background: #fff; border-top: 1px solid var(--line); box-shadow: 0 -2px 10px rgba(15,37,87,.08); }
  .rl-nav a { flex: 1; flex-direction: column; justify-content: center; gap: 3px; padding: 0; font-size: .68rem; }
  .rl-nav svg { display: block; }
  .rl-nav a.on::after { left: 25%; right: 25%; top: -1px; bottom: auto; border-radius: 0 0 3px 3px; }
}

.rl-modal { position: fixed; inset: 0; z-index: 200; display: grid; place-items: center; padding: 16px; background: rgba(15,37,87,.55); }
.rl-dialog { width: 100%; max-width: 380px; padding: 26px; text-align: center; background: #fff; border-radius: 14px; border-top: 5px solid var(--gold); }
.rl-dialog h2 { margin: 0 0 6px; font-size: 1.2rem; color: var(--navy); }
.rl-dialog p { margin: 0 0 20px; color: var(--muted); }
.rl-btns { display: flex; gap: 10px; }
.rl-btns button { flex: 1; padding: 12px; border-radius: 10px; font: inherit; font-weight: 700; cursor: pointer; }
.rl-cancel { background: #fff; border: 1.5px solid #d0d5dd; color: #344054; }
.rl-yes { border: none; color: #fff; background: #d92d20; }
`;

export default function ResidentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const first = (user.fullname || '').split(' ')[0];

  useEffect(() => {
    if (!confirm) return;
    const onKey = (e) => e.key === 'Escape' && setConfirm(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirm]);

  function doLogout() {
    logout();
    navigate('/resident/login');
  }

  return (
    <div className="rl">
      <style>{css}</style>

      <header className="rl-top">
        <div className="rl-bar">
          <Link to="/resident/home" className="rl-brand">
            <img src={logo} alt="Seal of the Municipality of President Carlos P. Garcia" />
            <div>
              <strong>SmartResQ</strong>
              <span>Resident Portal</span>
            </div>
          </Link>

          <nav className="rl-nav" aria-label="Main">
            {TABS.map(([label, to, end, icon]) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'on' : '')}>
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icon}</svg>
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="rl-right">
            <NotificationBell to="/resident/notifications" />
            <Link to="/resident/profile" className="rl-me">
              <Avatar user={user} size={34} />
              <b>{first}</b>
            </Link>
            <button className="rl-out" onClick={() => setConfirm(true)}>Logout</button>
          </div>
        </div>
      </header>

      <main className="rl-content">
        <Outlet />
      </main>

      {confirm && (
        <div className="rl-modal" onClick={() => setConfirm(false)}>
          <div className="rl-dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>Log out?</h2>
            <p>You will need to sign in again to continue.</p>
            <div className="rl-btns">
              <button className="rl-cancel" onClick={() => setConfirm(false)}>Cancel</button>
              <button className="rl-yes" onClick={doLogout}>Log out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}