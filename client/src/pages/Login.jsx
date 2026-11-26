import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth, homePath } from '../AuthContext';
import logo from '../assets/logo.webp';

const LOCATION = 'President Carlos P. Garcia, Bohol';

const css = `
.lg, .lg * { box-sizing: border-box; }
.lg { --navy:#0f2557; --blue:#1f3a93; --gold:#f5b301; --red:#d92d20; --ink:#1d2939; --muted:#667085; --line:#d0d5dd;
  min-height: 100vh; display: grid; grid-template-columns: minmax(340px, 5fr) 6fr; color: var(--ink); font-family: inherit; background: #fff; }
.lg h1, .lg h2, .lg p { margin: 0; }
.lg a { text-decoration: none; }

/* left: the emergency side */
.lg-side { position: relative; display: flex; flex-direction: column; gap: 32px; padding: 0 44px 44px; color: #fff;
  background: linear-gradient(170deg, #14307a, var(--navy) 60%, #0a1a40); }
.lg-strip { height: 28px; margin: 0 -44px 8px;
  background: conic-gradient(var(--red) 25%, #fff 0 50%, var(--red) 0 75%, #fff 0) 0 0 / 28px 28px; }
.lg-brand { display: flex; align-items: center; gap: 14px; margin-top: 20px; }
.lg-brand img { width: 64px; height: 64px; flex-shrink: 0; object-fit: contain; background: #fff; border-radius: 50%; padding: 4px; box-shadow: 0 0 0 3px var(--gold); }
.lg-brand strong { display: block; font-size: 1.5rem; letter-spacing: -.01em; }
.lg-brand span { display: block; margin-top: 2px; font-size: .86rem; color: rgba(255,255,255,.8); }

.lg-pitch { margin-top: auto; }
.lg-pitch h1 { max-width: 14ch; font-size: clamp(2rem, 3.4vw, 2.9rem); line-height: 1.08; font-weight: 750; letter-spacing: -.02em; }
.lg-pitch p { max-width: 38ch; margin-top: 14px; color: rgba(255,255,255,.82); font-size: 1rem; line-height: 1.55; }

.lg-sos { display: flex; align-items: center; gap: 16px; padding: 16px 18px; background: #fff; color: var(--ink); border-radius: 12px; border-left: 6px solid var(--red); }
.lg-sos div { flex: 1; min-width: 0; }
.lg-sos strong { display: block; font-size: 1rem; }
.lg-sos span { display: block; margin-top: 2px; font-size: .86rem; color: var(--muted); }
.lg-call { padding: 12px 22px; border-radius: 10px; background: var(--red); color: #fff !important; font-weight: 800; font-size: 1.05rem; white-space: nowrap; }
.lg-call:hover { background: #b42318; }

.lg-roles { margin: 0; padding: 0; list-style: none; display: grid; gap: 10px; }
.lg-roles li { padding-left: 16px; position: relative; color: rgba(255,255,255,.88); font-size: .94rem; line-height: 1.45; }
.lg-roles li::before { content: ''; position: absolute; left: 0; top: .5em; width: 7px; height: 7px; border-radius: 50%; background: var(--gold); }

/* right: the form */
.lg-main { display: grid; place-items: center; padding: 40px 24px; background: #f6f7fb; }
.lg-wrap { width: 100%; max-width: 400px; }
.lg-wrap h2 { font-size: 1.7rem; font-weight: 750; color: var(--navy); letter-spacing: -.01em; }
.lg-sub { margin-top: 6px; color: var(--muted); font-size: .98rem; }
.lg-form { display: flex; flex-direction: column; margin-top: 26px; }
.lg-form label { margin: 0 0 6px; font-size: .9rem; font-weight: 650; color: #344054; }
.lg-form input { width: 100%; height: 50px; padding: 0 14px; border: 1.5px solid var(--line); border-radius: 10px; background: #fff;
  font: inherit; font-size: 1rem; color: var(--ink); }
.lg-form input::placeholder { color: #98a2b3; }
.lg-form input:focus { outline: none; border-color: var(--blue); box-shadow: 0 0 0 4px rgba(31,58,147,.16); }
.lg-form label + input, .lg-form label + .lg-pw { margin-bottom: 16px; }
.lg-pw { position: relative; }
.lg-pw input { padding-right: 72px; }
.lg-pw button { position: absolute; right: 6px; top: 6px; height: 38px; padding: 0 12px; border: 0; border-radius: 8px; background: transparent;
  color: var(--blue); font: inherit; font-weight: 700; cursor: pointer; }
.lg-pw button:hover { background: #eef2ff; }
.lg-error { margin: -2px 0 14px; padding: 11px 13px; border-radius: 10px; background: #fef3f2; border: 1px solid #fecdca; color: #b42318; font-size: .92rem; }
.lg-submit { height: 52px; border: 0; border-radius: 10px; background: var(--navy); color: #fff; font: inherit; font-size: 1.02rem; font-weight: 700; cursor: pointer;
  transition: background .12s; }
.lg-submit:hover:not(:disabled) { background: var(--blue); }
.lg-submit:disabled { opacity: .6; cursor: wait; }

.lg-links { margin-top: 24px; text-align: center; color: var(--muted); font-size: .94rem; }
.lg-links a { color: var(--blue); font-weight: 650; }
.lg-links a:hover { text-decoration: underline; }
.lg-or { display: flex; align-items: center; gap: 12px; margin: 16px 0; font-size: .85rem; }
.lg-or::before, .lg-or::after { content: ''; flex: 1; height: 1px; background: var(--line); }
.lg-switch { display: block; padding: 12px; border: 1.5px solid var(--line); border-radius: 10px; background: #fff; color: var(--navy) !important; font-weight: 650; }
.lg-switch:hover { border-color: var(--navy); text-decoration: none !important; }

.lg a:focus-visible, .lg button:focus-visible { outline: 3px solid var(--gold); outline-offset: 2px; }

@media (max-width: 860px) {
  .lg { grid-template-columns: 1fr; }
  .lg-side { gap: 18px; padding: 0 20px 22px; }
  .lg-strip { margin: 0 -20px 0; }
  .lg-brand { margin-top: 16px; }
  .lg-brand img { width: 52px; height: 52px; }
  .lg-pitch, .lg-roles { display: none; }
  .lg-main { padding: 28px 20px 40px; align-items: start; }
}
@media (max-width: 420px) {
  .lg-sos { flex-wrap: wrap; }
  .lg-call { width: 100%; text-align: center; }
}
`;

export default function Login({ portal }) {
  const isResident = portal === 'resident';
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homePath(user)} replace />;

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = await login(identifier, password, portal);
      navigate(homePath(u), { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Cannot reach the server');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="lg">
      <style>{css}</style>

      <aside className="lg-side">
        <div className="lg-strip" aria-hidden="true" />

        <div className="lg-brand">
          <img src={logo} alt="Seal of the Municipality of President Carlos P. Garcia" />
          <div>
            <strong>SmartResQ</strong>
            <span>{LOCATION}</span>
          </div>
        </div>

        <div className="lg-pitch">
          {isResident ? (
            <>
              <h1>Report an emergency. Your barangay responds.</h1>
              <p>Send the type, your location and a photo. Follow your report until help arrives.</p>
            </>
          ) : (
            <>
              <h1>Dispatch console for barangays and MDRRMC.</h1>
              <p>Verify reports, send the nearest responder and monitor every incident in one place.</p>
            </>
          )}
        </div>

        {isResident ? (
          <div className="lg-sos">
            <div>
              <strong>In danger right now?</strong>
              <span>Call the national hotline first.</span>
            </div>
            <a className="lg-call" href="tel:911">Call 911</a>
          </div>
        ) : (
          <ul className="lg-roles">
            <li>Barangay captain and officials verify and dispatch</li>
            <li>Responders update status and share live location</li>
            <li>MDRRMC handles Critical incidents and reports</li>
          </ul>
        )}
      </aside>

      <main className="lg-main">
        <div className="lg-wrap">
          <h2>{isResident ? 'Welcome back' : 'Staff sign in'}</h2>
          <p className="lg-sub">
            {isResident ? 'Sign in to report and track emergencies.' : 'For barangay officials, responders and MDRRMC.'}
          </p>

          <form onSubmit={submit} className="lg-form">
            <label htmlFor="identifier">{isResident ? 'Mobile or email' : 'Email or username'}</label>
            <input
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              placeholder={isResident ? 'e.g. 09123456789' : 'Enter your username'}
              required
            />

            <label htmlFor="password">Password</label>
            <div className="lg-pw">
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Enter your password"
                required
              />
              <button type="button" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>

            {error && <div className="lg-error" role="alert">{error}</div>}

            <button className="lg-submit" disabled={busy}>
              {busy ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="lg-links">
            {isResident ? (
              <>
                <p>New resident? <Link to="/resident/register">Create an account</Link></p>
                <div className="lg-or">or</div>
                <Link to="/staff/login" className="lg-switch">Staff sign in</Link>
              </>
            ) : (
              <Link to="/resident/login" className="lg-switch">Resident sign in</Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}