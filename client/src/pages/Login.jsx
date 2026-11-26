import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth, homePath } from '../AuthContext';
import logo from '../assets/logo.webp';
import './Login.css';

const LOCATION = 'President Carlos P. Garcia, Bohol';

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
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <img
            src={logo}
            alt="Seal of the Municipality of President Carlos P. Garcia"
            className="login-logo-img"
          />
          <div>
            <span className="login-brand-name">SmartResQ</span>
            <span className="login-place">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              {LOCATION}
            </span>
          </div>
        </div>

        <h2 className="login-title">{isResident ? 'Welcome back!' : 'Welcome to SmartResQ'}</h2>
        <p className="login-subtitle">
          {isResident ? 'Sign in to report and track emergencies.' : 'Authorized User Login'}
        </p>

        <form onSubmit={submit} className="login-form">
          <label htmlFor="identifier">{isResident ? 'Mobile / Email' : 'Email / Username'}</label>
          <input
            id="identifier"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
            placeholder={isResident ? 'e.g. 09123456789' : 'Enter your username'}
            required
          />

          <label htmlFor="password">Password</label>
          <div className="login-pw">
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              className="login-pw-toggle"
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>

          {error && <div className="login-error" role="alert">{error}</div>}

          <button className="login-submit" disabled={busy}>
            {busy ? 'Signing in...' : isResident ? 'Sign In' : 'Login'}
          </button>
        </form>

        <div className="login-links">
          {isResident ? (
            <>
              <p>
                New resident? <Link to="/resident/register">Create an account</Link>
              </p>
              <div className="login-divider"><span>or</span></div>
              <Link to="/staff/login" className="login-secondary">Staff login</Link>
            </>
          ) : (
            <Link to="/resident/login" className="login-secondary">Resident login</Link>
          )}
        </div>
      </div>
    </div>
  );
}